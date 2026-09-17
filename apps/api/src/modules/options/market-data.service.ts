import { Injectable, Logger } from '@nestjs/common';
import { OptionChainDto, BrokerType } from '@ff/types';
import {
  calculateGreeks,
  impliedVolatility,
  calculateMaxPain,
  calculatePcr,
  classifyOiBuildup,
} from '@ff/calc';
import { BrokerAuthService } from './broker-auth.service';
import { POPULAR_FO_SYMBOLS } from './instruments.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private nseSessionCache: { cookies: string; expiresAt: number } | null = null;
  private nseSessionInFlight: Promise<string> | null = null;

  constructor(
    private readonly brokerAuthService: BrokerAuthService,
  ) {}

  /**
   * Primary method for fetching full option chain:
   * 1. If user has an active connected broker, attempts to fetch from broker adapter.
   * 2. If broker is sandbox or fails, falls back to direct live NSE options API.
   * 3. Computes live Greeks, Max Pain, and PCR.
   */
  async getOptionChain(
    symbol: string,
    expiry?: string,
    userId?: string,
    brokerOverride?: BrokerType,
  ): Promise<OptionChainDto> {
    const cleanSymbol = (symbol || 'NIFTY').toUpperCase();

    // Check if user has an active broker connection
    if (userId && brokerOverride) {
      try {
        const token = await this.brokerAuthService.getDecryptedToken(userId, brokerOverride);
        if (token) {
          const adapter = this.brokerAuthService.getAdapter(brokerOverride);
          const brokerChain = await adapter.getOptionChain(cleanSymbol, expiry, token);
          if (brokerChain) {
            return brokerChain;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Broker chain fetch for ${brokerOverride} failed: ${err.message}. Falling back to public NSE feed.`);
      }
    }

    // Try direct live NSE option-chain scraping
    try {
      const nseLive = await this.fetchNseOptionChain(cleanSymbol, expiry);
      if (nseLive) {
        return nseLive;
      }
    } catch (err: any) {
      this.logger.warn(`Direct NSE chain fetch failed: ${err.message}. Generating synthesized sandbox chain.`);
    }

    // Default to Sandbox Adapter synthesized chain
    const sandboxAdapter = this.brokerAuthService.getAdapter('sandbox');
    const sandboxChain = await sandboxAdapter.getOptionChain(cleanSymbol, expiry);
    return sandboxChain!;
  }

  /**
   * Fetches official live Option Chain from NSE India with 2-step warm cookies.
   */
  private async fetchNseOptionChain(symbol: string, selectedExpiry?: string): Promise<OptionChainDto | null> {
    const cookies = await this.ensureNseSession();
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol);
    const endpoint = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(symbol)}`;

    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0';

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: cookies,
        Referer: 'https://www.nseindia.com/option-chain',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      this.logger.warn(`NSE option chain returned status ${res.status}`);
      return null;
    }

    const json = (await res.json()) as any;
    const records = json?.records;
    if (!records || !records.data) {
      return null;
    }

    const spotPrice = records.underlyingValue || 0;
    const expiryDates: string[] = records.expiryDates || [];
    const targetExpiry = selectedExpiry || expiryDates[0] || '';

    const underlyingInfo = POPULAR_FO_SYMBOLS.find((s) => s.symbol === symbol);
    const step = underlyingInfo?.step || 50;
    const atmStrike = Math.round(spotPrice / step) * step;

    // Filter and aggregate contracts for the chosen expiry
    const strikeMap = new Map<number, { ce?: any; pe?: any }>();
    const strikesOiData: Array<{ strike: number; callOi: number; putOi: number }> = [];
    const pcrData: Array<{ callOi: number; putOi: number; callVolume: number; putVolume: number }> = [];

    for (const item of records.data) {
      if (item.expiryDate !== targetExpiry) continue;
      const strike = item.strikePrice;
      strikeMap.set(strike, { ce: item.CE, pe: item.PE });

      const cOi = item.CE?.openInterest || 0;
      const pOi = item.PE?.openInterest || 0;
      const cVol = item.CE?.totalTradedVolume || 0;
      const pVol = item.PE?.totalTradedVolume || 0;

      strikesOiData.push({ strike, callOi: cOi, putOi: pOi });
      pcrData.push({ callOi: cOi, putOi: pOi, callVolume: cVol, putVolume: pVol });
    }

    const { oiPcr, volumePcr } = calculatePcr(pcrData);
    const maxPain = calculateMaxPain(strikesOiData);

    // Build rows and compute live Greeks
    const allStrikes = Array.from(strikeMap.keys()).sort((a, b) => a - b);
    // Limit to ±12 strikes around ATM
    const filteredStrikes = allStrikes.filter((s) => Math.abs(s - atmStrike) <= 12 * step);

    const contracts = filteredStrikes.map((strike) => {
      const data = strikeMap.get(strike) || {};
      const ceRaw = data.ce || {};
      const peRaw = data.pe || {};

      const ceLtp = ceRaw.lastPrice || 0;
      const peLtp = peRaw.lastPrice || 0;

      const r = 0.065; // 6.5% RBI Repo rate benchmark
      const tte = Math.max(0.001, 7 / 365); // Time to expiry in years

      // Compute IV or use exchange IV
      const ceIv =
        (ceRaw.impliedVolatility ? ceRaw.impliedVolatility / 100 : null) ||
        impliedVolatility({
          targetPrice: ceLtp,
          spot: spotPrice,
          strike,
          timeToExpiryYears: tte,
          riskFreeRate: r,
          optionType: 'CE',
        });

      const peIv =
        (peRaw.impliedVolatility ? peRaw.impliedVolatility / 100 : null) ||
        impliedVolatility({
          targetPrice: peLtp,
          spot: spotPrice,
          strike,
          timeToExpiryYears: tte,
          riskFreeRate: r,
          optionType: 'PE',
        });

      const ceGreeks = calculateGreeks({
        spot: spotPrice,
        strike,
        timeToExpiryYears: tte,
        riskFreeRate: r,
        volatility: ceIv ?? 0.15,
        optionType: 'CE',
      });

      const peGreeks = calculateGreeks({
        spot: spotPrice,
        strike,
        timeToExpiryYears: tte,
        riskFreeRate: r,
        volatility: peIv ?? 0.15,
        optionType: 'PE',
      });

      return {
        strike,
        ce: {
          instrumentToken: `NFO_${symbol}_${targetExpiry}_${strike}_CE`,
          strike,
          optionType: 'CE' as const,
          ltp: ceLtp,
          change: ceRaw.change || 0,
          changePct: ceRaw.pChange || 0,
          iv: ceIv ? parseFloat((ceIv * 100).toFixed(2)) : null,
          delta: parseFloat(ceGreeks.delta.toFixed(3)),
          gamma: parseFloat(ceGreeks.gamma.toFixed(5)),
          theta: parseFloat(ceGreeks.theta.toFixed(1)),
          vega: parseFloat(ceGreeks.vega.toFixed(1)),
          rho: parseFloat(ceGreeks.rho.toFixed(1)),
          oi: ceRaw.openInterest || 0,
          oiChange: ceRaw.changeinOpenInterest || 0,
          volume: ceRaw.totalTradedVolume || 0,
          buildup: classifyOiBuildup(ceRaw.change || 0, ceRaw.changeinOpenInterest || 0),
          bidPrice: ceRaw.buyPrice1 || undefined,
          askPrice: ceRaw.sellPrice1 || undefined,
        },
        pe: {
          instrumentToken: `NFO_${symbol}_${targetExpiry}_${strike}_PE`,
          strike,
          optionType: 'PE' as const,
          ltp: peLtp,
          change: peRaw.change || 0,
          changePct: peRaw.pChange || 0,
          iv: peIv ? parseFloat((peIv * 100).toFixed(2)) : null,
          delta: parseFloat(peGreeks.delta.toFixed(3)),
          gamma: parseFloat(peGreeks.gamma.toFixed(5)),
          theta: parseFloat(peGreeks.theta.toFixed(1)),
          vega: parseFloat(peGreeks.vega.toFixed(1)),
          rho: parseFloat(peGreeks.rho.toFixed(1)),
          oi: peRaw.openInterest || 0,
          oiChange: peRaw.changeinOpenInterest || 0,
          volume: peRaw.totalTradedVolume || 0,
          buildup: classifyOiBuildup(peRaw.change || 0, peRaw.changeinOpenInterest || 0),
          bidPrice: peRaw.buyPrice1 || undefined,
          askPrice: peRaw.sellPrice1 || undefined,
        },
      };
    });

    const atmRow = contracts.find((c) => c.strike === atmStrike);
    const atmIv = atmRow?.ce?.iv ?? 0.14;

    return {
      underlying: symbol,
      spotPrice,
      spotChange: 0,
      spotChangePct: 0,
      timestamp: new Date().toISOString(),
      expiryDates,
      selectedExpiry: targetExpiry,
      pcr: oiPcr,
      volumePcr,
      maxPain,
      atmStrike,
      atmIv,
      contracts,
      source: 'NSE_FALLBACK',
    };
  }

  private async ensureNseSession(): Promise<string> {
    if (this.nseSessionCache && this.nseSessionCache.expiresAt > Date.now()) {
      return this.nseSessionCache.cookies;
    }
    if (this.nseSessionInFlight) {
      return this.nseSessionInFlight;
    }
    this.nseSessionInFlight = this.warmNseSession().finally(() => {
      this.nseSessionInFlight = null;
    });
    return this.nseSessionInFlight;
  }

  private async warmNseSession(): Promise<string> {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0';
    let cookies = '';
    for (const url of ['https://www.nseindia.com', 'https://www.nseindia.com/option-chain']) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            Cookie: cookies,
          },
          signal: AbortSignal.timeout(6000),
          redirect: 'follow',
        });
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
          cookies = cookies ? `${cookies}; ${setCookie}` : setCookie;
        }
      } catch {}
    }
    this.nseSessionCache = { cookies, expiresAt: Date.now() + 15 * 60 * 1000 };
    return cookies;
  }
}
