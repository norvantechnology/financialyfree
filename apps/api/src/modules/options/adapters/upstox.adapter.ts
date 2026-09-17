import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import {
  calculateGreeks,
  impliedVolatility,
  calculateMaxPain,
  calculatePcr,
  classifyOiBuildup,
} from '@ff/calc';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

/** Map platform symbols → Upstox instrument_key for option chain */
const UPSTOX_UNDERLYING: Record<string, string> = {
  NIFTY: 'NSE_INDEX|Nifty 50',
  NIFTY50: 'NSE_INDEX|Nifty 50',
  BANKNIFTY: 'NSE_INDEX|Nifty Bank',
  FINNIFTY: 'NSE_INDEX|Nifty Fin Service',
  MIDCPNIFTY: 'NSE_INDEX|NIFTY MID SELECT',
  SENSEX: 'BSE_INDEX|SENSEX',
};

@Injectable()
export class UpstoxAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'upstox';
  private readonly logger = new Logger(UpstoxAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('UPSTOX_CLIENT_ID') || '';
    if (!clientId) {
      throw new Error('UPSTOX_CLIENT_ID not configured');
    }
    const redirectUri = this.getRedirectUri();
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    const clientId = this.configService.get<string>('UPSTOX_CLIENT_ID') || '';
    const clientSecret = this.configService.get<string>('UPSTOX_CLIENT_SECRET') || '';

    if (!clientId || !clientSecret) {
      throw new Error('Upstox credentials not configured. Set UPSTOX_CLIENT_ID and UPSTOX_CLIENT_SECRET in .env');
    }

    const res = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.getRedirectUri(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upstox token exchange failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    return {
      accessToken: data?.access_token || '',
      clientId: data?.user_id || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { user_name: data?.user_name, broker: 'upstox' },
    };
  }

  async getQuotes(tokens: string[], accessToken?: string): Promise<Map<string, LiveTickDto>> {
    const quotes = new Map<string, LiveTickDto>();
    if (!accessToken) return quotes;

    try {
      const query = tokens.join(',');
      const res = await fetch(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        for (const [key, q] of Object.entries<any>(json?.data || {})) {
          quotes.set(key, {
            instrumentToken: q.instrument_token || key,
            symbol: q.symbol || key,
            ltp: q.last_price || 0,
            change: q.net_change || 0,
            changePct: q.percentage_change || 0,
            open: q.ohlc?.open || 0,
            high: q.ohlc?.high || 0,
            low: q.ohlc?.low || 0,
            close: q.ohlc?.close || 0,
            volume: q.volume || 0,
            oi: q.oi || 0,
            oiChange: 0,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (e: any) {
      this.logger.error(`Error fetching Upstox quotes: ${e.message}`);
    }

    return quotes;
  }

  async getOptionChain(
    symbol: string,
    expiry?: string,
    accessToken?: string,
  ): Promise<OptionChainDto | null> {
    if (!accessToken || /_mock_|mock_/i.test(accessToken)) {
      return null;
    }

    const clean = (symbol || 'NIFTY').toUpperCase();
    const instrumentKey =
      UPSTOX_UNDERLYING[clean] ||
      (clean.includes('.') ? clean : `NSE_EQ|${clean}`);

    const expiryDate = expiry || 'current_week';

    try {
      const url = new URL('https://api.upstox.com/v2/option/chain');
      url.searchParams.set('instrument_key', instrumentKey);
      url.searchParams.set('expiry_date', expiryDate);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        this.logger.warn(`Upstox option chain HTTP ${res.status} for ${instrumentKey}`);
        return null;
      }

      const json = (await res.json()) as any;
      const rows: any[] = Array.isArray(json?.data) ? json.data : [];
      if (!rows.length) return null;

      const spotPrice = Number(rows[0]?.underlying_spot_price || rows[0]?.spot_price || 0);
      if (!spotPrice) return null;

      const selectedExpiry = String(rows[0]?.expiry || expiryDate);
      const expiryDates = Array.from(new Set(rows.map((r) => String(r.expiry || selectedExpiry))));

      const step = clean === 'BANKNIFTY' || clean === 'SENSEX' ? 100 : 50;
      const atmStrike = Math.round(spotPrice / step) * step;

      const strikesOi: Array<{ strike: number; callOi: number; putOi: number }> = [];
      const pcrRows: Array<{ callOi: number; putOi: number; callVolume: number; putVolume: number }> = [];

      const tteYears = (() => {
        const exp = new Date(selectedExpiry);
        if (Number.isNaN(exp.getTime())) return Math.max(0.001, 7 / 365);
        const ms = Math.max(exp.getTime() - Date.now(), 60 * 60 * 1000);
        return ms / (365.25 * 24 * 60 * 60 * 1000);
      })();
      const r = 0.065;

      const contracts = rows
        .map((row) => {
          const strike = Number(row.strike_price || 0);
          if (!strike) return null;
          const call = row.call_options || row.CE || {};
          const put = row.put_options || row.PE || {};
          const callMd = call.market_data || call;
          const putMd = put.market_data || put;
          const callGk = call.option_greeks || {};
          const putGk = put.option_greeks || {};

          const ceLtp = Number(callMd.ltp || callMd.last_price || 0);
          const peLtp = Number(putMd.ltp || putMd.last_price || 0);
          const ceOi = Number(callMd.oi || callMd.open_interest || 0);
          const peOi = Number(putMd.oi || putMd.open_interest || 0);
          const ceVol = Number(callMd.volume || 0);
          const peVol = Number(putMd.volume || 0);
          const ceOiChg = Number(callMd.oi_change || callMd.change_oi || 0);
          const peOiChg = Number(putMd.oi_change || putMd.change_oi || 0);
          const ceChg = Number(callMd.net_change || callMd.change || 0);
          const peChg = Number(putMd.net_change || putMd.change || 0);

          let ceIvDec =
            callGk.iv != null
              ? Number(callGk.iv) > 1
                ? Number(callGk.iv) / 100
                : Number(callGk.iv)
              : null;
          let peIvDec =
            putGk.iv != null
              ? Number(putGk.iv) > 1
                ? Number(putGk.iv) / 100
                : Number(putGk.iv)
              : null;

          if (ceIvDec == null && ceLtp > 0) {
            ceIvDec = impliedVolatility({
              targetPrice: ceLtp,
              spot: spotPrice,
              strike,
              timeToExpiryYears: tteYears,
              riskFreeRate: r,
              optionType: 'CE',
            });
          }
          if (peIvDec == null && peLtp > 0) {
            peIvDec = impliedVolatility({
              targetPrice: peLtp,
              spot: spotPrice,
              strike,
              timeToExpiryYears: tteYears,
              riskFreeRate: r,
              optionType: 'PE',
            });
          }

          const ceG =
            ceIvDec != null
              ? calculateGreeks({
                  spot: spotPrice,
                  strike,
                  timeToExpiryYears: tteYears,
                  riskFreeRate: r,
                  volatility: ceIvDec,
                  optionType: 'CE',
                })
              : null;
          const peG =
            peIvDec != null
              ? calculateGreeks({
                  spot: spotPrice,
                  strike,
                  timeToExpiryYears: tteYears,
                  riskFreeRate: r,
                  volatility: peIvDec,
                  optionType: 'PE',
                })
              : null;

          strikesOi.push({ strike, callOi: ceOi, putOi: peOi });
          pcrRows.push({ callOi: ceOi, putOi: peOi, callVolume: ceVol, putVolume: peVol });

          return {
            strike,
            ce: {
              instrumentToken: String(call.instrument_key || `UPX_${clean}_${selectedExpiry}_${strike}_CE`),
              strike,
              optionType: 'CE' as const,
              ltp: ceLtp,
              change: ceChg,
              changePct: Number(callMd.percent_change || 0),
              iv: ceIvDec != null ? parseFloat((ceIvDec * 100).toFixed(2)) : null,
              delta: callGk.delta != null ? Number(callGk.delta) : ceG ? parseFloat(ceG.delta.toFixed(3)) : null,
              gamma: callGk.gamma != null ? Number(callGk.gamma) : ceG ? parseFloat(ceG.gamma.toFixed(5)) : null,
              theta: callGk.theta != null ? Number(callGk.theta) : ceG ? parseFloat(ceG.theta.toFixed(1)) : null,
              vega: callGk.vega != null ? Number(callGk.vega) : ceG ? parseFloat(ceG.vega.toFixed(1)) : null,
              rho: ceG ? parseFloat(ceG.rho.toFixed(1)) : null,
              oi: ceOi,
              oiChange: ceOiChg,
              volume: ceVol,
              buildup: classifyOiBuildup(ceChg, ceOiChg),
            },
            pe: {
              instrumentToken: String(put.instrument_key || `UPX_${clean}_${selectedExpiry}_${strike}_PE`),
              strike,
              optionType: 'PE' as const,
              ltp: peLtp,
              change: peChg,
              changePct: Number(putMd.percent_change || 0),
              iv: peIvDec != null ? parseFloat((peIvDec * 100).toFixed(2)) : null,
              delta: putGk.delta != null ? Number(putGk.delta) : peG ? parseFloat(peG.delta.toFixed(3)) : null,
              gamma: putGk.gamma != null ? Number(putGk.gamma) : peG ? parseFloat(peG.gamma.toFixed(5)) : null,
              theta: putGk.theta != null ? Number(putGk.theta) : peG ? parseFloat(peG.theta.toFixed(1)) : null,
              vega: putGk.vega != null ? Number(putGk.vega) : peG ? parseFloat(peG.vega.toFixed(1)) : null,
              rho: peG ? parseFloat(peG.rho.toFixed(1)) : null,
              oi: peOi,
              oiChange: peOiChg,
              volume: peVol,
              buildup: classifyOiBuildup(peChg, peOiChg),
            },
          };
        })
        .filter(Boolean) as OptionChainDto['contracts'];

      // Keep ±15 strikes around ATM for UI performance
      const filtered = contracts
        .filter((c) => Math.abs(c.strike - atmStrike) <= 15 * step)
        .sort((a, b) => a.strike - b.strike);

      const { oiPcr, volumePcr } = calculatePcr(pcrRows);
      const maxPain = calculateMaxPain(strikesOi);
      const atmRow = filtered.find((c) => c.strike === atmStrike);
      const pcrFromApi = rows.find((r) => r.pcr != null)?.pcr;

      return {
        underlying: clean,
        spotPrice,
        spotChange: 0,
        spotChangePct: 0,
        timestamp: new Date().toISOString(),
        expiryDates,
        selectedExpiry,
        pcr: typeof pcrFromApi === 'number' ? pcrFromApi : oiPcr,
        volumePcr,
        maxPain,
        atmStrike,
        atmIv: atmRow?.ce?.iv ?? atmRow?.pe?.iv ?? null,
        contracts: filtered,
        source: 'BROKER_LIVE',
        dataNote: 'Upstox Put/Call Option Chain (user OAuth)',
      };
    } catch (e: any) {
      this.logger.error(`Upstox getOptionChain failed: ${e.message}`);
      return null;
    }
  }

  getRateLimit() {
    return { requestsPerSecond: 25 };
  }

  private getRedirectUri(): string {
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    return `${apiUrl}/api/v1/options/brokers/upstox/callback`;
  }
}
