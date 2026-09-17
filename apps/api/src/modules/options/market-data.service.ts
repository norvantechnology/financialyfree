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
import { InstrumentsService, POPULAR_FO_SYMBOLS } from './instruments.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private nseSessionCache: { cookies: string; expiresAt: number } | null = null;
  private nseSessionInFlight: Promise<string> | null = null;
  private liveVixCache: { vix: number; expiresAt: number } | null = null;

  constructor(
    private readonly brokerAuthService: BrokerAuthService,
    private readonly instrumentsService: InstrumentsService,
  ) {}

  /**
   * Fetches real-time India VIX from Yahoo Finance (^INDIAVIX).
   * Cached in memory for 15 seconds to avoid rate limiting.
   */
  async fetchLiveVix(): Promise<number | undefined> {
    if (this.liveVixCache && this.liveVixCache.expiresAt > Date.now()) {
      return this.liveVixCache.vix;
    }
    try {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=1d';
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) {
          const vix = parseFloat(Number(price).toFixed(2));
          this.liveVixCache = { vix, expiresAt: Date.now() + 15000 };
          return vix;
        }
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  /**
   * Standard Indian F&O contract lot sizes (NSE/BSE).
   */
  getLotSize(symbol: string): number {
    const clean = (symbol || 'NIFTY').toUpperCase();
    if (clean === 'BANKNIFTY') return 15;
    if (clean === 'FINNIFTY') return 40;
    if (clean === 'SENSEX') return 10;
    if (clean === 'MIDCPNIFTY') return 75;
    if (clean === 'RELIANCE') return 250;
    return 50; // Standard NIFTY 50 lot size
  }

  /**
   * Fetches real-time market spot quote from third-party feeds (Yahoo Finance).
   * Maps Indian indices (^NSEI, ^NSEBANK, ^BSESN, NIFTY_FIN_SERVICE.NS, etc.) and equities.
   * No hardcoded spot / VIX / futures defaults — unavailable fields stay empty.
   */
  async fetchLiveSpotQuote(symbol: string): Promise<{
    spotPrice: number;
    spotChange: number;
    spotChangePct: number;
    previousClose: number;
    dayHigh: number;
    dayLow: number;
    timestamp: string;
    source: string;
    vix?: number;
    lotSize: number;
    futures: Array<{ expiry: string; ltp: number; lots: string }>;
    available: boolean;
  }> {
    const clean = (symbol || 'NIFTY').toUpperCase();
    const lotSize = this.getLotSize(clean);
    const vix = await this.fetchLiveVix();

    let ticker = `${clean}.NS`;
    if (clean === 'NIFTY' || clean === 'NIFTY50' || clean === 'NIFTY 50') {
      ticker = '^NSEI';
    } else if (clean === 'BANKNIFTY' || clean === 'NIFTYBANK' || clean === 'NIFTY BANK') {
      ticker = '^NSEBANK';
    } else if (clean === 'FINNIFTY') {
      ticker = 'NIFTY_FIN_SERVICE.NS';
    } else if (clean === 'MIDCPNIFTY') {
      ticker = 'NIFTY_MID_SELECT.NS';
    } else if (clean === 'SENSEX') {
      ticker = '^BSESN';
    } else if (clean === 'BANKEX') {
      ticker = 'BSE-BANK.BO';
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const spotPrice = Number(meta.regularMarketPrice);
          const previousClose = Number(meta.chartPreviousClose || meta.previousClose || spotPrice);
          const spotChange = parseFloat((spotPrice - previousClose).toFixed(2));
          const spotChangePct = parseFloat(((spotChange / previousClose) * 100).toFixed(2));
          const dayHigh = Number(meta.regularMarketDayHigh || spotPrice);
          const dayLow = Number(meta.regularMarketDayLow || spotPrice);

          return {
            spotPrice,
            spotChange,
            spotChangePct,
            previousClose,
            dayHigh,
            dayLow,
            timestamp: new Date().toISOString(),
            source: 'Yahoo Finance Live Feed',
            vix,
            lotSize,
            futures: [],
            available: true,
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live quote for ${symbol} (${ticker}): ${err.message}`);
    }

    return {
      spotPrice: 0,
      spotChange: 0,
      spotChangePct: 0,
      previousClose: 0,
      dayHigh: 0,
      dayLow: 0,
      timestamp: new Date().toISOString(),
      source: 'UNAVAILABLE',
      vix,
      lotSize,
      futures: [],
      available: false,
    };
  }

  /**
   * Primary option-chain fetch (user-scoped when broker-connected):
   * 1) Connected broker (BROKER_LIVE) — never share across users
   * 2) NSE official option-chain scrape (NSE_LIVE)
   * 3) Delayed spot-only shell (DELAYED_SPOT_ONLY) — never invent OI/LTP/IV
   */
  async getOptionChain(
    symbol: string,
    expiry?: string,
    userId?: string,
    brokerOverride?: BrokerType,
  ): Promise<OptionChainDto> {
    const cleanSymbol = (symbol || 'NIFTY').toUpperCase();
    const liveSpot = await this.fetchLiveSpotQuote(cleanSymbol);

    // 1) User's own broker credentials (cache key / identity always user-scoped upstream)
    const brokersToTry: BrokerType[] = [];
    if (userId) {
      if (brokerOverride) {
        brokersToTry.push(brokerOverride);
      } else {
        try {
          brokersToTry.push(...(await this.brokerAuthService.getConnectedBrokers(userId)));
        } catch {
          /* no connections */
        }
      }
    }

    for (const broker of brokersToTry) {
      // Paper/sandbox adapter invents OI/LTP/IV — never treat it as market data.
      // Paper Mode only affects portfolio; chain must come from NSE or a real broker.
      if (broker === 'sandbox') continue;
      try {
        const token = await this.brokerAuthService.getDecryptedToken(userId!, broker);
        if (!token) continue;
        // Skip obvious mock tokens from unconfigured OAuth (do not treat as live)
        if (/_mock_|mock_/i.test(token)) {
          this.logger.warn(`Skipping ${broker} chain: mock/unconfigured token`);
          continue;
        }
        const adapter = this.brokerAuthService.getAdapter(broker);
        const brokerChain = await adapter.getOptionChain(cleanSymbol, expiry, token);
        if (brokerChain && Array.isArray(brokerChain.contracts) && brokerChain.contracts.length > 0) {
          const enriched = {
            ...brokerChain,
            source: 'BROKER_LIVE' as const,
            dataNote: `Live option chain via your ${broker} connection`,
            vix: brokerChain.vix ?? liveSpot.vix,
            lotSize: brokerChain.lotSize ?? liveSpot.lotSize,
            futures: brokerChain.futures ?? liveSpot.futures,
          };
          void this.persistLiveInstruments(enriched);
          return enriched;
        }
      } catch (err: any) {
        this.logger.warn(`Broker chain fetch for ${broker} failed: ${err.message}`);
      }
    }

    // 2) Official NSE option-chain (index/equity) when reachable
    try {
      const nseLive = await this.fetchNseOptionChain(cleanSymbol, expiry, liveSpot);
      if (nseLive && nseLive.contracts.length > 0) {
        const enriched = {
          ...nseLive,
          vix: liveSpot.vix,
          lotSize: liveSpot.lotSize,
          futures: liveSpot.futures,
          dataNote: 'Official NSE option-chain API (live during market hours)',
        };
        void this.persistLiveInstruments(enriched);
        return enriched;
      }
    } catch (err: any) {
      this.logger.warn(`Direct NSE chain fetch failed: ${err.message}`);
    }

    // 3) Honest delayed-spot shell — ZERO fabricated OI / LTP / IV
    return this.buildDelayedSpotOnlyChain(cleanSymbol, liveSpot, expiry);
  }

  /** Persist live strikes/expiries into instruments — never static seed rows. */
  private async persistLiveInstruments(chain: OptionChainDto): Promise<void> {
    if (!chain.selectedExpiry || !chain.contracts?.length) return;
    if (chain.source === 'DELAYED_SPOT_ONLY') return;
    try {
      await this.instrumentsService.upsertFromLiveChain({
        symbol: chain.underlying,
        expiry: chain.selectedExpiry,
        lotSize: chain.lotSize,
        contracts: chain.contracts.map((c) => ({
          strike: c.strike,
          ceToken: c.ce?.instrumentToken,
          peToken: c.pe?.instrumentToken,
        })),
      });
    } catch (err: any) {
      this.logger.debug?.(`Instrument upsert skipped: ${err?.message || err}`);
    }
  }

  /** Years to expiry using IST calendar days (trading-day approximation; min 1 hour). */
  yearsToExpiry(expiryIso: string): number {
    if (!expiryIso) return Math.max(0.001, 7 / 365);
    const iso = this.normalizeToIsoDate(expiryIso);
    const parts = iso.split('-').map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) {
      return Math.max(0.001, 7 / 365);
    }
    const [y, m, d] = parts;
    // Expiry settlement ~15:30 IST
    const expiryMs = Date.UTC(y, m - 1, d, 10, 0, 0); // 15:30 IST = 10:00 UTC
    const nowMs = Date.now();
    const ms = Math.max(expiryMs - nowMs, 60 * 60 * 1000);
    return ms / (365.25 * 24 * 60 * 60 * 1000);
  }

  /** Spot-only payload when live option chain is unavailable — never invents OI. */
  private buildDelayedSpotOnlyChain(
    symbol: string,
    liveSpot: {
      spotPrice: number;
      spotChange: number;
      spotChangePct: number;
      vix?: number;
      lotSize?: number;
      futures?: Array<{ expiry: string; ltp: number; lots: string }>;
      source?: string;
    },
    selectedExpiry?: string,
  ): OptionChainDto {
    const underlyingInfo = POPULAR_FO_SYMBOLS.find((s) => s.symbol === symbol);
    const step = underlyingInfo?.step || 50;
    const atmStrike = Math.round(liveSpot.spotPrice / step) * step;
    const expiryDates = selectedExpiry ? [this.normalizeToIsoDate(selectedExpiry)] : [];

    return {
      underlying: symbol,
      spotPrice: liveSpot.spotPrice,
      spotChange: liveSpot.spotChange,
      spotChangePct: liveSpot.spotChangePct,
      timestamp: new Date().toISOString(),
      expiryDates,
      selectedExpiry: expiryDates[0] || '',
      pcr: 0,
      volumePcr: 0,
      maxPain: atmStrike,
      atmStrike,
      atmIv: null,
      contracts: [],
      source: 'DELAYED_SPOT_ONLY',
      dataNote: liveSpot.spotPrice
        ? 'Index spot from delayed public feed only. Connect Upstox/Dhan (or wait for NSE option-chain) for live OI/LTP/IV — we do not invent option data.'
        : 'No live spot or option chain available. Connect a broker or retry during NSE market hours — we do not invent prices.',
      vix: liveSpot.vix,
      lotSize: liveSpot.lotSize ?? this.getLotSize(symbol),
      futures: liveSpot.futures || [],
    };
  }

  /**
   * Fetches official live Option Chain from NSE India with 2-step warm cookies.
   */
  private async fetchNseOptionChain(
    symbol: string,
    selectedExpiry?: string,
    liveSpot?: { spotPrice: number; spotChange: number; spotChangePct: number },
  ): Promise<OptionChainDto | null> {
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
      signal: AbortSignal.timeout(12000),
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
    const rawExpiryDates: string[] = records.expiryDates || [];
    const expiryDates: string[] = rawExpiryDates.map((d) => this.normalizeToIsoDate(d));
    const targetExpiry = selectedExpiry ? this.normalizeToIsoDate(selectedExpiry) : expiryDates[0] || '';

    const underlyingInfo = POPULAR_FO_SYMBOLS.find((s) => s.symbol === symbol);
    const step = underlyingInfo?.step || 50;
    const atmStrike = Math.round(spotPrice / step) * step;

    // Filter and aggregate contracts for the chosen expiry
    const strikeMap = new Map<number, { ce?: any; pe?: any }>();
    const strikesOiData: Array<{ strike: number; callOi: number; putOi: number }> = [];
    const pcrData: Array<{ callOi: number; putOi: number; callVolume: number; putVolume: number }> = [];

    for (const item of records.data) {
      if (this.normalizeToIsoDate(item.expiryDate) !== targetExpiry) continue;
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

      const r = 0.065; // RBI repo-rate class risk-free benchmark
      const tte = this.yearsToExpiry(targetExpiry);

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

      const ceGreeks = ceIv != null
        ? calculateGreeks({
            spot: spotPrice,
            strike,
            timeToExpiryYears: tte,
            riskFreeRate: r,
            volatility: ceIv,
            optionType: 'CE',
          })
        : null;

      const peGreeks = peIv != null
        ? calculateGreeks({
            spot: spotPrice,
            strike,
            timeToExpiryYears: tte,
            riskFreeRate: r,
            volatility: peIv,
            optionType: 'PE',
          })
        : null;

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
          delta: ceGreeks ? parseFloat(ceGreeks.delta.toFixed(3)) : null,
          gamma: ceGreeks ? parseFloat(ceGreeks.gamma.toFixed(5)) : null,
          theta: ceGreeks ? parseFloat(ceGreeks.theta.toFixed(1)) : null,
          vega: ceGreeks ? parseFloat(ceGreeks.vega.toFixed(1)) : null,
          rho: ceGreeks ? parseFloat(ceGreeks.rho.toFixed(1)) : null,
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
          delta: peGreeks ? parseFloat(peGreeks.delta.toFixed(3)) : null,
          gamma: peGreeks ? parseFloat(peGreeks.gamma.toFixed(5)) : null,
          theta: peGreeks ? parseFloat(peGreeks.theta.toFixed(1)) : null,
          vega: peGreeks ? parseFloat(peGreeks.vega.toFixed(1)) : null,
          rho: peGreeks ? parseFloat(peGreeks.rho.toFixed(1)) : null,
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
    const atmIv = atmRow?.ce?.iv ?? null;

    return {
      underlying: symbol,
      spotPrice,
      spotChange: liveSpot?.spotChange || 0,
      spotChangePct: liveSpot?.spotChangePct || 0,
      timestamp: new Date().toISOString(),
      expiryDates,
      selectedExpiry: targetExpiry,
      pcr: oiPcr,
      volumePcr,
      maxPain,
      atmStrike,
      atmIv,
      contracts,
      source: 'NSE_LIVE',
    };
  }

  /**
   * Intraday candles from Yahoo — empty candles when feed unavailable (no synthetic bars).
   */
  async getIntradayCandles(
    symbol: string,
    interval: string = '5m',
    range: string = '1d',
  ): Promise<{
    symbol: string;
    currentPrice: number;
    previousClose: number;
    change: number;
    changePct: number;
    candles: Array<{
      time: number;
      timeStr: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  }> {
    const clean = (symbol || 'NIFTY').toUpperCase();
    let ticker = `${clean}.NS`;
    if (clean === 'NIFTY' || clean === 'NIFTY50' || clean === 'NIFTY 50') {
      ticker = '^NSEI';
    } else if (clean === 'BANKNIFTY') {
      ticker = '^NSEBANK';
    } else if (clean === 'FINNIFTY') {
      ticker = 'NIFTY_FIN_SERVICE.NS';
    } else if (clean === 'SENSEX') {
      ticker = '^BSESN';
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const result = json?.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const meta = result.meta;
          const currentPrice = Number(meta.regularMarketPrice || 0);
          const previousClose = Number(meta.chartPreviousClose || meta.previousClose || currentPrice);
          const change = parseFloat((currentPrice - previousClose).toFixed(2));
          const changePct = parseFloat(((change / previousClose) * 100).toFixed(2));

          const timestamps: number[] = result.timestamp;
          const quote = result.indicators.quote[0];
          const opens: number[] = quote.open;
          const highs: number[] = quote.high;
          const lows: number[] = quote.low;
          const closes: number[] = quote.close;
          const volumes: number[] = quote.volume;

          const candles = timestamps
            .map((t, i) => {
              if (opens[i] == null || closes[i] == null) return null;
              const d = new Date(t * 1000);
              const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              return {
                time: t * 1000,
                timeStr,
                open: parseFloat(opens[i].toFixed(2)),
                high: parseFloat(highs[i].toFixed(2)),
                low: parseFloat(lows[i].toFixed(2)),
                close: parseFloat(closes[i].toFixed(2)),
                volume: Math.round(volumes[i] || 0),
              };
            })
            .filter(Boolean) as any[];

          if (candles.length > 0) {
            return {
              symbol: clean,
              currentPrice,
              previousClose,
              change,
              changePct,
              candles,
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch candles for ${symbol}: ${err.message}`);
    }

    // No synthetic candles — return empty when live chart feed is unavailable
    const spot = await this.fetchLiveSpotQuote(clean);
    return {
      symbol: clean,
      currentPrice: spot.available ? spot.spotPrice : 0,
      previousClose: spot.available ? spot.previousClose : 0,
      change: spot.available ? spot.spotChange : 0,
      changePct: spot.available ? spot.spotChangePct : 0,
      candles: [],
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
          signal: AbortSignal.timeout(2000),
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

  private normalizeToIsoDate(d: string): string {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    // Handle DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(d);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Handle DD-MMM-YYYY (e.g. 22-Sep-2026 or 22 Sep 2026)
    const ddmmmyyyy = /^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{4})$/.exec(d);
    if (ddmmmyyyy) {
      const [, day, monStr, year] = ddmmmyyyy;
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const m = months[monStr.toLowerCase()];
      if (m) {
        return `${year}-${m}-${day.padStart(2, '0')}`;
      }
    }
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const dt = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      }
    } catch {}
    return d;
  }
}
