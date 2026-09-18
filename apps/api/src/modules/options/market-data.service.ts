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
import { InstrumentsService } from './instruments.service';

type SpotQuoteResult = {
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  timestamp: string;
  source: string;
  vix?: number;
  vixChangePct?: number;
  lotSize: number;
  futures: Array<{ expiry: string; ltp: number; lots: string; changePct?: number }>;
  available: boolean;
};

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private nseSessionCache: { cookies: string; expiresAt: number } | null = null;
  private nseSessionInFlight: Promise<string> | null = null;
  private liveVixCache: { vix: number; changePct: number; expiresAt: number } | null = null;
  /** Shared public NSE/broker-fail chain - one scrape serves all users. */
  private readonly chainCache = new Map<
    string,
    { chain: OptionChainDto; fetchedAt: number }
  >();
  /** In-flight coalescing so 1,000 concurrent users trigger one upstream scrape. */
  private readonly chainInFlight = new Map<string, Promise<OptionChainDto>>();
  private readonly spotQuoteCache = new Map<
    string,
    { quote: SpotQuoteResult; fetchedAt: number }
  >();
  private readonly spotInFlight = new Map<string, Promise<SpotQuoteResult>>();
  /** Fresh window: return without re-scraping NSE (ms). */
  private static readonly HOT_TTL_MS = 5_000;
  /** Stale-while-revalidate: return immediately + refresh in background (ms). */
  private static readonly SWR_TTL_MS = 90_000;
  /** Absolute max age before cache is discarded on failures (ms). */
  private static readonly CHAIN_CACHE_TTL_MS = 30 * 60 * 1000;
  private static readonly SPOT_TTL_MS = 5_000;
  private static readonly NSE_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

  constructor(
    private readonly brokerAuthService: BrokerAuthService,
    private readonly instrumentsService: InstrumentsService,
  ) {}

  private cacheKey(symbol: string, expiry?: string): string {
    return `${symbol.toUpperCase()}:${expiry || 'nearest'}`;
  }

  private rememberChain(chain: OptionChainDto): void {
    if (!chain.contracts?.length) return;
    if (chain.source === 'DELAYED_SPOT_ONLY') return;
    // Never put user-broker chains in the shared public cache
    if (chain.source === 'BROKER_LIVE') return;
    const now = Date.now();
    const entry = { chain: { ...chain }, fetchedAt: now };
    this.chainCache.set(this.cacheKey(chain.underlying, chain.selectedExpiry), entry);
    this.chainCache.set(this.cacheKey(chain.underlying), entry);
  }

  private getSharedCacheEntry(symbol: string, expiry?: string) {
    const clean = symbol.toUpperCase();
    if (expiry) {
      const iso = this.normalizeToIsoDate(expiry);
      return (
        this.chainCache.get(this.cacheKey(clean, expiry)) ||
        this.chainCache.get(this.cacheKey(clean, iso)) ||
        null
      );
    }
    return this.chainCache.get(this.cacheKey(clean)) || null;
  }

  private serveFromSharedCache(
    hit: { chain: OptionChainDto; fetchedAt: number },
    opts?: { stale?: boolean },
  ): OptionChainDto {
    const ageSec = Math.max(0, Math.round((Date.now() - hit.fetchedAt) / 1000));
    const isStale = Boolean(opts?.stale) || ageSec > Math.floor(MarketDataService.HOT_TTL_MS / 1000);
    const sym = (hit.chain.underlying || '').toUpperCase();
    const spotHit = this.spotQuoteCache.get(sym);
    const liveSpot =
      spotHit && Date.now() - spotHit.fetchedAt < MarketDataService.SPOT_TTL_MS * 3
        ? spotHit.quote
        : null;
    // Refresh spot in background so next poll overlays a fresher Yahoo quote
    void this.fetchLiveSpotQuote(sym).catch(() => undefined);
    const liveLot = this.getLotSize(sym);
    return {
      ...hit.chain,
      spotPrice: liveSpot?.spotPrice || hit.chain.spotPrice,
      spotChange: liveSpot?.spotChange ?? hit.chain.spotChange,
      spotChangePct: liveSpot?.spotChangePct ?? hit.chain.spotChangePct,
      vix: liveSpot?.vix ?? hit.chain.vix,
      vixChangePct: liveSpot?.vixChangePct ?? hit.chain.vixChangePct,
      lotSize: liveLot > 1 ? liveLot : hit.chain.lotSize,
      futures: liveSpot?.futures?.length ? liveSpot.futures : hit.chain.futures,
      timestamp: new Date().toISOString(),
      source: isStale && hit.chain.source === 'NSE_LIVE' ? 'NSE_CACHED' : hit.chain.source,
      dataNote: isStale
        ? `Shared cache (${ageSec}s ago). Spot refreshed live; OI/LTP refresh in background.`
        : hit.chain.dataNote ||
          'Official NSE option-chain (v3). Served from shared hot cache.',
    };
  }

  private readCachedChain(
    symbol: string,
    expiry: string | undefined,
    liveSpot: {
      spotPrice: number;
      spotChange: number;
      spotChangePct: number;
      vix?: number;
      vixChangePct?: number;
      lotSize?: number;
      futures?: Array<{ expiry: string; ltp: number; lots: string }>;
    },
  ): OptionChainDto | null {
    const hit = this.getSharedCacheEntry(symbol, expiry);
    if (!hit) return null;
    if (Date.now() - hit.fetchedAt > MarketDataService.CHAIN_CACHE_TTL_MS) return null;
    const ageMin = Math.max(1, Math.round((Date.now() - hit.fetchedAt) / 60000));
    return {
      ...hit.chain,
      spotPrice: liveSpot.spotPrice || hit.chain.spotPrice,
      spotChange: liveSpot.spotChange,
      spotChangePct: liveSpot.spotChangePct,
      vix: liveSpot.vix ?? hit.chain.vix,
      vixChangePct: liveSpot.vixChangePct ?? hit.chain.vixChangePct,
      lotSize: liveSpot.lotSize ?? hit.chain.lotSize,
      futures: liveSpot.futures?.length ? liveSpot.futures : hit.chain.futures,
      timestamp: new Date().toISOString(),
      source: 'NSE_CACHED',
      dataNote: `Cached NSE option-chain from ~${ageMin}m ago (live NSE scrape unavailable from this host). Spot refreshed from delayed feed.`,
    };
  }

  /**
   * Live market lot from Upstox FO instrument master (cached).
   * Falls back to 1 only if master has not loaded yet - never a static NSE schedule table.
   */
  getLotSize(symbol: string): number {
    const live =
      this.instrumentsService.getCachedLotSizeSync(symbol) ||
      this.instrumentsService.getCachedLotSizeSync((symbol || '').toUpperCase());
    return live && live > 0 ? live : 1;
  }

  private deriveStrikeStep(strikes: number[], symbol?: string): number {
    if (strikes.length >= 2) {
      const uniq = Array.from(new Set(strikes.map((s) => Math.round(s)))).sort((a, b) => a - b);
      const diffs: number[] = [];
      for (let i = 1; i < uniq.length; i++) {
        const d = uniq[i] - uniq[i - 1];
        if (d > 0) diffs.push(d);
      }
      if (diffs.length) {
        diffs.sort((a, b) => a - b);
        return diffs[Math.floor(diffs.length / 2)] || 50;
      }
    }
    return (
      (symbol ? this.instrumentsService.getCachedStepSync(symbol) : null) || 50
    );
  }

  /**
   * Fetches real-time India VIX from Yahoo Finance (^INDIAVIX).
   * Cached in memory for 15 seconds to avoid rate limiting.
   */
  async fetchLiveVix(): Promise<{ vix: number; changePct: number } | undefined> {
    if (this.liveVixCache && this.liveVixCache.expiresAt > Date.now()) {
      return { vix: this.liveVixCache.vix, changePct: this.liveVixCache.changePct };
    }
    const meta = await this.fetchYahooChartMeta('^INDIAVIX');
    const vix = Number(meta?.regularMarketPrice);
    if (Number.isFinite(vix) && vix > 0) {
      const prev = Number(meta?.chartPreviousClose || meta?.previousClose || vix);
      const changePct =
        prev > 0 ? parseFloat((((vix - prev) / prev) * 100).toFixed(2)) : 0;
      this.liveVixCache = { vix, changePct, expiresAt: Date.now() + 15000 };
      return { vix, changePct };
    }
    return undefined;
  }

  private async fetchYahooChartMeta(ticker: string): Promise<any | null> {
    const hosts = [
      'https://query1.finance.yahoo.com',
      'https://query2.finance.yahoo.com',
    ];
    for (const host of hosts) {
      try {
        const url = `${host}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept: 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) continue;
        const json = (await res.json()) as any;
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) return meta;
      } catch {
        // try next
      }
    }
    return null;
  }

  /**
   * Spot quote with 5s shared cache + in-flight coalesce (Yahoo/NSE).
   */
  async fetchLiveSpotQuote(symbol: string): Promise<SpotQuoteResult> {
    const clean = (symbol || 'NIFTY').toUpperCase();
    const cached = this.spotQuoteCache.get(clean);
    if (cached && Date.now() - cached.fetchedAt < MarketDataService.SPOT_TTL_MS) {
      return cached.quote;
    }
    const inflight = this.spotInFlight.get(clean);
    if (inflight) return inflight;

    const pending = this.fetchLiveSpotQuoteUncached(clean)
      .then((quote) => {
        this.spotQuoteCache.set(clean, { quote, fetchedAt: Date.now() });
        return quote;
      })
      .finally(() => {
        this.spotInFlight.delete(clean);
      });
    this.spotInFlight.set(clean, pending);
    return pending;
  }

  private async fetchLiveSpotQuoteUncached(clean: string): Promise<SpotQuoteResult> {
    const lotSize = this.getLotSize(clean);
    const vixQuote = await this.fetchLiveVix();
    const vix = vixQuote?.vix;
    const vixChangePct = vixQuote?.changePct;

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
      const meta = await this.fetchYahooChartMeta(ticker);
      if (meta && meta.regularMarketPrice) {
        const spotPrice = Number(meta.regularMarketPrice);
        const previousClose = Number(meta.chartPreviousClose || meta.previousClose || spotPrice);
        const spotChange = parseFloat((spotPrice - previousClose).toFixed(2));
        const spotChangePct = previousClose
          ? parseFloat(((spotChange / previousClose) * 100).toFixed(2))
          : 0;
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
          vixChangePct,
          lotSize,
          futures: [],
          available: true,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live quote for ${clean} (${ticker}): ${err.message}`);
    }

    // Secondary free attempt: NSE allIndices (when session cookies work)
    try {
      const nseSpot = await this.fetchNseIndexSpot(clean);
      if (nseSpot) {
        return {
          ...nseSpot,
          vix,
          vixChangePct,
          lotSize,
          futures: [],
          available: true,
        };
      }
    } catch (err: any) {
      this.logger.warn(`NSE index spot failed for ${clean}: ${err?.message || err}`);
    }

    return {
      spotPrice: 0,
      spotChange: 0,
      spotChangePct: 0,
      previousClose: 0,
      dayHigh: 0,
      dayLow: 0,
      timestamp: new Date().toISOString(),
      source: 'unavailable',
      vix,
      vixChangePct,
      lotSize,
      futures: [],
      available: false,
    };
  }

  /**
   * Shared public option-chain (scales to many users):
   * - Hot cache (<5s): instant
   * - SWR (<90s): instant stale + one background refresh
   * - Cold: single coalesced NSE/proxy scrape
   * Broker live is only used when `brokerOverride` is set (never shared).
   */
  async getOptionChain(
    symbol: string,
    expiry?: string | Date,
    userId?: string,
    brokerOverride?: BrokerType,
    opts?: { preferFresh?: boolean; forceRefresh?: boolean },
  ): Promise<OptionChainDto> {
    const cleanSymbol = (symbol || 'NIFTY').toUpperCase();
    // Normalize early - TypeORM `date` columns may arrive as Date objects; raw strings
    // break cache keys and NSE expiry matching if left as "Tue Sep 29 ...".
    const expiryIso = expiry ? this.toExpiryIso(expiry) : undefined;
    // Warm FO meta in background; hot path uses sync cache (never block polls on CSV download)
    void this.instrumentsService.getLotSize(cleanSymbol).catch(() => 1);

    // Explicit broker request - user-scoped, never shared
    if (userId && brokerOverride && brokerOverride !== 'sandbox') {
      const liveSpot = await this.fetchLiveSpotQuote(cleanSymbol);
      try {
        const token = await this.brokerAuthService.getDecryptedToken(userId, brokerOverride);
        if (token && !/_mock_|mock_/i.test(token)) {
          const adapter = this.brokerAuthService.getAdapter(brokerOverride);
          const brokerChain = await adapter.getOptionChain(cleanSymbol, expiryIso, token);
          if (brokerChain?.contracts?.length) {
            const enriched = {
              ...brokerChain,
              source: 'BROKER_LIVE' as const,
              dataNote: `Live option chain via your ${brokerOverride} connection`,
              vix: brokerChain.vix ?? liveSpot.vix,
              vixChangePct: brokerChain.vixChangePct ?? liveSpot.vixChangePct,
              lotSize: brokerChain.lotSize ?? liveSpot.lotSize,
              futures: brokerChain.futures ?? liveSpot.futures,
            };
            void this.persistLiveInstruments(enriched);
            return enriched;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Broker chain fetch for ${brokerOverride} failed: ${err.message}`);
      }
    }

    // Sandbox marks / square-off: coalesce a scrape (still shares in-flight)
    if (opts?.forceRefresh) {
      return this.coalescedSharedChainFetch(cleanSymbol, expiryIso);
    }

    // Shared hot / SWR path (public NSE) - one scrape serves everyone
    const hit = this.getSharedCacheEntry(cleanSymbol, expiryIso);
    const age = hit ? Date.now() - hit.fetchedAt : Number.POSITIVE_INFINITY;

    // Prefer fresh: avoid serving up-to-90s stale quotes (still allow hot <5s)
    if (opts?.preferFresh) {
      if (hit?.chain.contracts?.length && age < MarketDataService.HOT_TTL_MS) {
        // Guard: never serve a different expiry than requested
        if (!expiryIso || this.expiryMatches(hit.chain.selectedExpiry, expiryIso)) {
          return this.serveFromSharedCache(hit, { stale: false });
        }
      }
      return this.coalescedSharedChainFetch(cleanSymbol, expiryIso);
    }

    if (hit?.chain.contracts?.length) {
      if (expiryIso && !this.expiryMatches(hit.chain.selectedExpiry, expiryIso)) {
        return this.coalescedSharedChainFetch(cleanSymbol, expiryIso);
      }
      if (age < MarketDataService.HOT_TTL_MS) {
        return this.serveFromSharedCache(hit, { stale: false });
      }
      if (age < MarketDataService.SWR_TTL_MS) {
        void this.coalescedSharedChainFetch(cleanSymbol, expiryIso);
        return this.serveFromSharedCache(hit, { stale: true });
      }
    }

    return this.coalescedSharedChainFetch(cleanSymbol, expiryIso);
  }

  /** Public expiry normalizer - handles Date, ISO datetime, DD-MMM-YYYY */
  toExpiryIso(d: string | Date | null | undefined): string {
    return this.normalizeToIsoDate(d as string | Date);
  }

  /** Compare ISO / display expiry strings safely */
  private expiryMatches(a?: string | Date | null, b?: string | Date | null): boolean {
    if (!a || !b) return false;
    return this.normalizeToIsoDate(a) === this.normalizeToIsoDate(b);
  }

  private coalescedSharedChainFetch(
    symbol: string,
    expiry?: string,
  ): Promise<OptionChainDto> {
    const key = this.cacheKey(symbol, expiry);
    const existing = this.chainInFlight.get(key);
    if (existing) return existing;

    const pending = this.fetchSharedNseChain(symbol, expiry).finally(() => {
      this.chainInFlight.delete(key);
    });
    this.chainInFlight.set(key, pending);
    return pending;
  }

  private async fetchSharedNseChain(
    cleanSymbol: string,
    expiry?: string,
  ): Promise<OptionChainDto> {
    const liveSpot = await this.fetchLiveSpotQuote(cleanSymbol);

    // Prefer proxy first on cloud (Render→NSE often blocked); try direct as secondary.
    const preferProxy = Boolean(
      (process.env.NSE_PROXY_URL || '').trim() ||
        ((process.env.FRONTEND_URL || process.env.WEB_URL || '') &&
          !/localhost|127\.0\.0\.1/.test(process.env.FRONTEND_URL || process.env.WEB_URL || '')),
    );

    const tryProxy = async () => {
      try {
        const proxied = await this.fetchNseOptionChainViaProxy(cleanSymbol, expiry, liveSpot);
        if (proxied?.contracts?.length) {
          const liveLot = this.getLotSize(cleanSymbol);
          const enriched = {
            ...proxied,
            vix: liveSpot.vix ?? proxied.vix,
            vixChangePct: liveSpot.vixChangePct ?? proxied.vixChangePct,
            lotSize: liveLot > 1 ? liveLot : proxied.lotSize || liveSpot.lotSize || 1,
            futures: liveSpot.futures?.length ? liveSpot.futures : proxied.futures,
          };
          this.rememberChain(enriched);
          void this.persistLiveInstruments(enriched);
          return enriched;
        }
      } catch (err: any) {
        this.logger.warn(`NSE proxy chain fetch failed: ${err.message}`);
      }
      return null;
    };

    const tryDirect = async () => {
      try {
        const nseLive = await this.fetchNseOptionChain(cleanSymbol, expiry, liveSpot);
        if (nseLive?.contracts?.length) {
          const liveLot = this.getLotSize(cleanSymbol);
          const enriched = {
            ...nseLive,
            vix: liveSpot.vix,
            vixChangePct: liveSpot.vixChangePct,
            lotSize: liveLot > 1 ? liveLot : nseLive.lotSize || liveSpot.lotSize || 1,
            futures: liveSpot.futures,
            dataNote:
              nseLive.dataNote ||
              'Official NSE option-chain (v3). OI/LTP refresh during market hours.',
          };
          this.rememberChain(enriched);
          void this.persistLiveInstruments(enriched);
          return enriched;
        }
      } catch (err: any) {
        this.logger.warn(`Direct NSE chain fetch failed: ${err.message}`);
      }
      return null;
    };

    const primary = preferProxy ? await tryProxy() : await tryDirect();
    if (primary) return primary;
    const secondary = preferProxy ? await tryDirect() : await tryProxy();
    if (secondary) return secondary;

    const cached = this.readCachedChain(cleanSymbol, expiry, liveSpot);
    if (cached) return cached;

    return this.buildDelayedSpotOnlyChain(cleanSymbol, liveSpot, expiry);
  }

  /** Call Next.js NSE scrape when Nest host cannot reach NSE. */
  private async fetchNseOptionChainViaProxy(
    symbol: string,
    selectedExpiry: string | undefined,
    liveSpot: { spotPrice: number; spotChange: number; spotChangePct: number },
  ): Promise<OptionChainDto | null> {
    const explicit = (process.env.NSE_PROXY_URL || '').replace(/\/+$/, '');
    const base = (
      explicit ||
      process.env.FRONTEND_URL ||
      process.env.WEB_URL ||
      ''
    ).replace(/\/+$/, '');
    if (!base) return null;
    // Skip accidental localhost FRONTEND_URL in cloud; allow explicit NSE_PROXY_URL always
    if (!explicit && /localhost|127\.0\.0\.1/.test(base)) return null;

    const qs = new URLSearchParams({ symbol });
    if (selectedExpiry) qs.set('expiry', selectedExpiry);
    const url = `${base}/api/internal/nse-chain?${qs.toString()}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    const secret = process.env.NSE_PROXY_SECRET;
    if (secret) headers['x-nse-proxy-secret'] = secret;

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      this.logger.warn(`NSE proxy HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as {
      success?: boolean;
      data?: { selectedExpiryIso?: string; nseJson?: unknown };
    };
    if (!body?.success || !body.data?.nseJson) return null;

    const mapped = this.mapNseOptionChainJson(
      symbol,
      body.data.selectedExpiryIso || selectedExpiry,
      liveSpot,
      body.data.nseJson,
    );
    if (!mapped) return null;
    return {
      ...mapped,
      source: 'NSE_LIVE',
      dataNote: 'Official NSE option-chain via edge proxy (v3).',
    };
  }

  /** Persist live strikes/expiries into instruments - never static seed rows. */
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

  /** Spot-only payload when live option chain is unavailable - never invents OI. */
  private buildDelayedSpotOnlyChain(
    symbol: string,
    liveSpot: {
      spotPrice: number;
      spotChange: number;
      spotChangePct: number;
      vix?: number;
      vixChangePct?: number;
      lotSize?: number;
      futures?: Array<{ expiry: string; ltp: number; lots: string }>;
      source?: string;
    },
    selectedExpiry?: string,
  ): OptionChainDto {
    const step = this.deriveStrikeStep([], symbol);
    const atmStrike =
      liveSpot.spotPrice > 0 ? Math.round(liveSpot.spotPrice / step) * step : 0;
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
        ? 'Index spot from delayed public feed only. Connect Upstox/Dhan (or wait for NSE option-chain) for live OI/LTP/IV - we do not invent option data.'
        : 'No live spot or option chain available. Connect a broker or retry during NSE market hours - we do not invent prices.',
      vix: liveSpot.vix,
      vixChangePct: liveSpot.vixChangePct,
      lotSize: liveSpot.lotSize ?? this.getLotSize(symbol),
      futures: liveSpot.futures || [],
    };
  }

  /**
   * Fetches official Option Chain from NSE India (v3 API + contract-info expiries).
   * Legacy option-chain-indices / equities endpoints now 404.
   */
  private async fetchNseOptionChain(
    symbol: string,
    selectedExpiry?: string,
    liveSpot?: { spotPrice: number; spotChange: number; spotChangePct: number },
  ): Promise<OptionChainDto | null> {
    const cookies = await this.ensureNseSession();
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'].includes(symbol);
    const userAgent = MarketDataService.NSE_UA;

    const nseHeaders = (cookieJar: string) => ({
      'User-Agent': userAgent,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: cookieJar,
      Referer: 'https://www.nseindia.com/option-chain',
      'X-Requested-With': 'XMLHttpRequest',
    });

    const fetchJson = async (url: string, cookieJar: string): Promise<{ ok: boolean; status: number; json: any }> => {
      const res = await fetch(url, {
        headers: nseHeaders(cookieJar),
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 401 || res.status === 403) {
        this.logger.warn(`NSE ${url} returned ${res.status} - refreshing session`);
        this.nseSessionCache = null;
        const fresh = await this.ensureNseSession();
        const retry = await fetch(url, {
          headers: nseHeaders(fresh),
          signal: AbortSignal.timeout(20000),
        });
        if (!retry.ok) {
          return { ok: false, status: retry.status, json: null };
        }
        return { ok: true, status: retry.status, json: await retry.json() };
      }
      if (!res.ok) {
        return { ok: false, status: res.status, json: null };
      }
      return { ok: true, status: res.status, json: await res.json() };
    };

    // 1) Contract info → available expiries (DD-MMM-YYYY)
    const infoUrl = `https://www.nseindia.com/api/option-chain-contract-info?symbol=${encodeURIComponent(symbol)}`;
    const info = await fetchJson(infoUrl, cookies);
    if (!info.ok || !info.json) {
      this.logger.warn(`NSE contract-info returned status ${info.status}`);
      return null;
    }

    const rawExpiryDates: string[] = info.json.expiryDates || [];
    if (!rawExpiryDates.length) {
      this.logger.warn(`NSE contract-info returned no expiries for ${symbol}`);
      return null;
    }

    const expiryDatesIso = rawExpiryDates.map((d) => this.normalizeToIsoDate(d));
    const targetIso = selectedExpiry
      ? this.normalizeToIsoDate(selectedExpiry)
      : expiryDatesIso[0];
    const targetIdx = Math.max(0, expiryDatesIso.indexOf(targetIso));
    const nseExpiry = rawExpiryDates[targetIdx] || rawExpiryDates[0];

    // 2) Option chain v3 (requires expiry)
    const type = isIndex ? 'Indices' : 'Equity';
    const chainUrl =
      `https://www.nseindia.com/api/option-chain-v3?type=${type}` +
      `&symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(nseExpiry)}`;
    const chain = await fetchJson(chainUrl, cookies);
    if (!chain.ok || !chain.json) {
      this.logger.warn(`NSE option-chain-v3 returned status ${chain.status}`);
      return null;
    }

    // Prefer contract-info expiry list (complete); v3 may only echo the selected expiry
    const merged = {
      ...chain.json,
      records: {
        ...(chain.json.records || {}),
        expiryDates: rawExpiryDates,
      },
    };

    return this.mapNseOptionChainJson(symbol, targetIso || expiryDatesIso[0], liveSpot, merged);
  }

  private mapNseOptionChainJson(
    symbol: string,
    selectedExpiry: string | undefined,
    liveSpot: { spotPrice: number; spotChange: number; spotChangePct: number } | undefined,
    json: any,
  ): OptionChainDto | null {
    const records = json?.records;
    if (!records || !records.data) {
      return null;
    }

    // Prefer Yahoo live spot when present - NSE underlyingValue can lag behind proxy cache
    const spotPrice =
      (liveSpot?.spotPrice && liveSpot.spotPrice > 0 ? liveSpot.spotPrice : 0) ||
      records.underlyingValue ||
      0;
    const rawExpiryDates: string[] = records.expiryDates || [];
    const expiryDates: string[] = rawExpiryDates.map((d: string) => this.normalizeToIsoDate(d));
    const targetExpiry = selectedExpiry ? this.normalizeToIsoDate(selectedExpiry) : expiryDates[0] || '';

    // Filter and aggregate contracts for the chosen expiry
    const strikeMap = new Map<number, { ce?: any; pe?: any }>();
    const strikesOiData: Array<{ strike: number; callOi: number; putOi: number }> = [];
    const pcrData: Array<{ callOi: number; putOi: number; callVolume: number; putVolume: number }> = [];

    for (const item of records.data) {
      // v3 rows use expiryDates / nested CE.expiryDate; legacy used expiryDate
      const rowExpiryRaw =
        item.expiryDate || item.expiryDates || item.CE?.expiryDate || item.PE?.expiryDate || '';
      const rowExpiry = this.normalizeToIsoDate(String(rowExpiryRaw));
      // When NSE already filtered by expiry (v3), rowExpiry may be empty - keep the row
      if (targetExpiry && rowExpiry && rowExpiry !== targetExpiry) continue;

      const strike = Number(item.strikePrice);
      if (!Number.isFinite(strike)) continue;
      const prev = strikeMap.get(strike) || {};
      // Merge so a sparse CE-only / PE-only row never wipes the other side
      strikeMap.set(strike, {
        ce: item.CE || item.ce || prev.ce,
        pe: item.PE || item.pe || prev.pe,
      });

      const cOi = Number(item.CE?.openInterest || item.ce?.openInterest || 0) || 0;
      const pOi = Number(item.PE?.openInterest || item.pe?.openInterest || 0) || 0;
      const cVol = Number(item.CE?.totalTradedVolume || item.ce?.totalTradedVolume || 0) || 0;
      const pVol = Number(item.PE?.totalTradedVolume || item.pe?.totalTradedVolume || 0) || 0;

      strikesOiData.push({ strike, callOi: cOi, putOi: pOi });
      pcrData.push({ callOi: cOi, putOi: pOi, callVolume: cVol, putVolume: pVol });
    }

    const { oiPcr, volumePcr } = calculatePcr(pcrData);
    const maxPain = calculateMaxPain(strikesOiData);

    // Full NSE strike ladder - UI filters (±10/15/20/All); do not invent a truncated “demo” chain
    const allStrikes = Array.from(strikeMap.keys()).sort((a, b) => a - b);
    // Strike step from live ladder (or Upstox master) - never a static table
    const step = this.deriveStrikeStep(allStrikes, symbol);
    const atmStrike = spotPrice > 0 ? Math.round(spotPrice / step) * step : allStrikes[Math.floor(allStrikes.length / 2)] || 0;
    // BS IV solve only near ATM (far strikes use exchange IV or stay blank - no fake greeks)
    const greekRadius = 40 * step;

    /** Pick first finite number (optionally allow zero). */
    const pickNum = (allowZero: boolean, ...vals: unknown[]) => {
      for (const v of vals) {
        const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
        if (!Number.isFinite(n)) continue;
        if (n > 0 || (allowZero && n === 0)) return n;
        // Negative values (OI change, price change) are meaningful
        if (n < 0) return n;
      }
      return allowZero ? 0 : 0;
    };

    /**
     * Resolve display LTP so deep ITM / illiquid rows don't show stale prints
     * below intrinsic (common after-hours / low-volume NSE lastPrice).
     */
    const resolveLtp = (
      optionType: 'CE' | 'PE',
      strike: number,
      last: number,
      bid: number,
      ask: number,
    ): { ltp: number; quality: 'trade' | 'mid' | 'stale' } => {
      const mid =
        bid > 0 && ask > 0 ? Math.round(((bid + ask) / 2) * 100) / 100 : 0;
      const intrinsic =
        optionType === 'CE'
          ? Math.max(0, spotPrice - strike)
          : Math.max(0, strike - spotPrice);

      let ltp = last > 0 ? last : mid > 0 ? mid : bid > 0 ? bid : ask > 0 ? ask : 0;
      let quality: 'trade' | 'mid' | 'stale' = last > 0 ? 'trade' : mid > 0 ? 'mid' : 'stale';

      // Last print outside the live bid/ask band → prefer mid
      if (last > 0 && bid > 0 && ask > 0 && ask >= bid) {
        if (last < bid * 0.995 || last > ask * 1.005) {
          ltp = mid;
          quality = 'mid';
        }
      }

      // Stale ITM: last trade below ~intrinsic (can't trade through parity by that much)
      if (intrinsic > 1 && ltp > 0 && ltp < intrinsic * 0.985) {
        if (mid >= intrinsic * 0.985) {
          ltp = mid;
          quality = 'mid';
        } else if (ask >= intrinsic * 0.985) {
          ltp = Math.round(ask * 100) / 100;
          quality = 'mid';
        } else {
          ltp = Math.round(intrinsic * 100) / 100;
          quality = 'stale';
        }
      }

      return { ltp, quality };
    };

    const resolveChangePct = (changePct: number, change: number, prevClose: number, ltp: number) => {
      if (Number.isFinite(changePct) && changePct !== 0) return changePct;
      if (prevClose > 0 && Number.isFinite(change) && change !== 0) {
        return (change / prevClose) * 100;
      }
      if (prevClose > 0 && ltp > 0) {
        return ((ltp - prevClose) / prevClose) * 100;
      }
      return changePct || 0;
    };

    const contracts = allStrikes.map((strike) => {
      const data = strikeMap.get(strike) || {};
      const ceRaw = data.ce || {};
      const peRaw = data.pe || {};
      const nearAtm = Math.abs(strike - atmStrike) <= greekRadius;

      const ceBid = pickNum(false, ceRaw.buyPrice1, ceRaw.bidprice, ceRaw.bidPrice, ceRaw.bid);
      const ceAsk = pickNum(false, ceRaw.sellPrice1, ceRaw.askPrice, ceRaw.askprice, ceRaw.ask);
      const peBid = pickNum(false, peRaw.buyPrice1, peRaw.bidprice, peRaw.bidPrice, peRaw.bid);
      const peAsk = pickNum(false, peRaw.sellPrice1, peRaw.askPrice, peRaw.askprice, peRaw.ask);
      const ceLast = pickNum(
        false,
        ceRaw.lastPrice,
        ceRaw.lastTradedPrice,
        ceRaw.LTP,
        ceRaw.ltp,
        ceRaw.last,
      );
      const peLast = pickNum(
        false,
        peRaw.lastPrice,
        peRaw.lastTradedPrice,
        peRaw.LTP,
        peRaw.ltp,
        peRaw.last,
      );
      const ceQuote = resolveLtp('CE', strike, ceLast, ceBid, ceAsk);
      const peQuote = resolveLtp('PE', strike, peLast, peBid, peAsk);
      const ceLtp = ceQuote.ltp;
      const peLtp = peQuote.ltp;

      const ceOiChg = pickNum(
        true,
        ceRaw.changeinOpenInterest,
        ceRaw.changeInOpenInterest,
        ceRaw.oiChange,
      );
      const peOiChg = pickNum(
        true,
        peRaw.changeinOpenInterest,
        peRaw.changeInOpenInterest,
        peRaw.oiChange,
      );
      const ceOiChgPct = pickNum(
        true,
        ceRaw.pchangeinOpenInterest,
        ceRaw.pChangeinOpenInterest,
        ceRaw.oiChangePct,
      );
      const peOiChgPct = pickNum(
        true,
        peRaw.pchangeinOpenInterest,
        peRaw.pChangeinOpenInterest,
        peRaw.oiChangePct,
      );
      const ceChange = pickNum(true, ceRaw.change);
      const peChange = pickNum(true, peRaw.change);
      const cePrev = pickNum(false, ceRaw.previousClose, ceRaw.prevClose, ceRaw.previousClosePrice);
      const pePrev = pickNum(false, peRaw.previousClose, peRaw.prevClose, peRaw.previousClosePrice);
      const ceChangePct = resolveChangePct(
        pickNum(true, ceRaw.pChange, ceRaw.PChange, ceRaw.pchange),
        ceChange,
        cePrev,
        ceLtp,
      );
      const peChangePct = resolveChangePct(
        pickNum(true, peRaw.pChange, peRaw.PChange, peRaw.pchange),
        peChange,
        pePrev,
        peLtp,
      );

      const r = 0.065; // RBI repo-rate class risk-free benchmark
      const tte = this.yearsToExpiry(targetExpiry);

      const exchangeCeIv =
        typeof ceRaw.impliedVolatility === 'number' && ceRaw.impliedVolatility > 0
          ? ceRaw.impliedVolatility / 100
          : null;
      const exchangePeIv =
        typeof peRaw.impliedVolatility === 'number' && peRaw.impliedVolatility > 0
          ? peRaw.impliedVolatility / 100
          : null;

      const ceIv =
        exchangeCeIv ??
        (nearAtm && ceLtp > 0
          ? impliedVolatility({
              targetPrice: ceLtp,
              spot: spotPrice,
              strike,
              timeToExpiryYears: tte,
              riskFreeRate: r,
              optionType: 'CE',
            })
          : null);

      const peIv =
        exchangePeIv ??
        (nearAtm && peLtp > 0
          ? impliedVolatility({
              targetPrice: peLtp,
              spot: spotPrice,
              strike,
              timeToExpiryYears: tte,
              riskFreeRate: r,
              optionType: 'PE',
            })
          : null);

      const ceGreeks =
        ceIv != null
          ? calculateGreeks({
              spot: spotPrice,
              strike,
              timeToExpiryYears: tte,
              riskFreeRate: r,
              volatility: ceIv,
              optionType: 'CE',
            })
          : null;

      const peGreeks =
        peIv != null
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
          change: ceChange,
          changePct: ceChangePct,
          iv: ceIv ? parseFloat((ceIv * 100).toFixed(2)) : null,
          delta: ceGreeks ? parseFloat(ceGreeks.delta.toFixed(3)) : null,
          gamma: ceGreeks ? parseFloat(ceGreeks.gamma.toFixed(5)) : null,
          theta: ceGreeks ? parseFloat(ceGreeks.theta.toFixed(1)) : null,
          vega: ceGreeks ? parseFloat(ceGreeks.vega.toFixed(1)) : null,
          rho: ceGreeks ? parseFloat(ceGreeks.rho.toFixed(1)) : null,
          oi: pickNum(true, ceRaw.openInterest) || 0,
          oiChange: ceOiChg,
          oiChangePct: ceOiChgPct,
          volume: pickNum(true, ceRaw.totalTradedVolume) || 0,
          buildup: classifyOiBuildup(ceChange, ceOiChg),
          bidPrice: ceBid || undefined,
          askPrice: ceAsk || undefined,
          quoteQuality: ceQuote.quality,
        },
        pe: {
          instrumentToken: `NFO_${symbol}_${targetExpiry}_${strike}_PE`,
          strike,
          optionType: 'PE' as const,
          ltp: peLtp,
          change: peChange,
          changePct: peChangePct,
          iv: peIv ? parseFloat((peIv * 100).toFixed(2)) : null,
          delta: peGreeks ? parseFloat(peGreeks.delta.toFixed(3)) : null,
          gamma: peGreeks ? parseFloat(peGreeks.gamma.toFixed(5)) : null,
          theta: peGreeks ? parseFloat(peGreeks.theta.toFixed(1)) : null,
          vega: peGreeks ? parseFloat(peGreeks.vega.toFixed(1)) : null,
          rho: peGreeks ? parseFloat(peGreeks.rho.toFixed(1)) : null,
          oi: pickNum(true, peRaw.openInterest) || 0,
          oiChange: peOiChg,
          oiChangePct: peOiChgPct,
          volume: pickNum(true, peRaw.totalTradedVolume) || 0,
          buildup: classifyOiBuildup(peChange, peOiChg),
          bidPrice: peBid || undefined,
          askPrice: peAsk || undefined,
          quoteQuality: peQuote.quality,
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
      lotSize: this.getLotSize(symbol),
      source: 'NSE_LIVE',
      dataNote:
        contracts.some((c) => c.ce.oi > 0 || c.pe.oi > 0)
          ? 'Official NSE option-chain (v3). OI/LTP refresh during market hours.'
          : 'Official NSE option-chain (v3). Quotes present; OI/last trade often zero after market close.',
    };
  }

  /**
   * Intraday candles from Yahoo - empty candles when feed unavailable (no synthetic bars).
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

    // No synthetic candles - return empty when live chart feed is unavailable
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
    const userAgent = MarketDataService.NSE_UA;
    let cookies = '';
    const mergeCookies = (res: Response) => {
      const anyHeaders = res.headers as any;
      const list: string[] =
        typeof anyHeaders.getSetCookie === 'function'
          ? anyHeaders.getSetCookie()
          : res.headers.get('set-cookie')
            ? [res.headers.get('set-cookie') as string]
            : [];
      for (const raw of list) {
        const first = raw.split(';')[0]?.trim();
        if (!first) continue;
        cookies = cookies ? `${cookies}; ${first}` : first;
      }
    };

    for (const url of ['https://www.nseindia.com', 'https://www.nseindia.com/option-chain']) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            Cookie: cookies,
          },
          signal: AbortSignal.timeout(10000),
          redirect: 'follow',
        });
        mergeCookies(res);
      } catch (err: any) {
        this.logger.debug(`NSE warm ${url} skipped: ${err?.message || err}`);
      }
    }
    this.nseSessionCache = { cookies, expiresAt: Date.now() + 10 * 60 * 1000 };
    return cookies;
  }

  /** Free NSE index spot via allIndices (requires warmed cookies). */
  private async fetchNseIndexSpot(symbol: string): Promise<{
    spotPrice: number;
    spotChange: number;
    spotChangePct: number;
    previousClose: number;
    dayHigh: number;
    dayLow: number;
    timestamp: string;
    source: string;
  } | null> {
    const cookies = await this.ensureNseSession();
    if (!cookies) return null;

    const nameMap: Record<string, string> = {
      NIFTY: 'Nifty 50',
      BANKNIFTY: 'Nifty Bank',
      FINNIFTY: 'Nifty Financial Services',
      MIDCPNIFTY: 'NIFTY MIDCAP SELECT',
    };
    const indexName = nameMap[symbol.toUpperCase()];
    if (!indexName) return null;

    const res = await fetch('https://www.nseindia.com/api/allIndices', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: cookies,
        Referer: 'https://www.nseindia.com',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const row = (json?.data || []).find(
      (d: any) => String(d?.index || d?.indexSymbol || '').toLowerCase() === indexName.toLowerCase()
        || String(d?.index || '').toUpperCase().includes(symbol.toUpperCase()),
    );
    if (!row) return null;
    const spotPrice = Number(row.last || row.lastPrice || 0);
    if (!spotPrice) return null;
    const previousClose = Number(row.previousClose || row.prevClose || spotPrice);
    const spotChange = parseFloat((spotPrice - previousClose).toFixed(2));
    const spotChangePct = previousClose
      ? parseFloat(((spotChange / previousClose) * 100).toFixed(2))
      : Number(row.percentChange || 0);
    return {
      spotPrice,
      spotChange,
      spotChangePct,
      previousClose,
      dayHigh: Number(row.high || spotPrice),
      dayLow: Number(row.low || spotPrice),
      timestamp: new Date().toISOString(),
      source: 'NSE allIndices',
    };
  }

  private normalizeToIsoDate(d: string | Date | null | undefined): string {
    if (d == null || d === '') return '';
    // TypeORM `date` columns often hydrate as Date at UTC midnight
    if (d instanceof Date && !isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    const raw = String(d).trim();
    // ISO date or datetime → take calendar date prefix
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    // Handle DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Handle DD-MMM-YYYY (e.g. 22-Sep-2026 or 22 Sep 2026)
    const ddmmmyyyy = /^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{4})$/.exec(raw);
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
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getUTCFullYear();
        const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const dt = String(parsed.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      }
    } catch {
      /* keep raw */
    }
    return raw;
  }
}
