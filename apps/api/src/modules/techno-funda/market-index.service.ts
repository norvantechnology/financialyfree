import { Injectable, Logger } from '@nestjs/common';
import { extractYahooCloses, parseYahooSessionChange } from './yahoo-quote.util';

export interface IndexSnapshot {
  symbol: string;
  name: string;
  ticker: string;
  current: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  lastUpdated: string;
  delayedMinutes: number;
  source: string;
}

export interface MarketOverviewData {
  indices: IndexSnapshot[];
  indiaVix: number | null;
  marketBreadth: {
    advances: number;
    declines: number;
    ratio: number;
    breadthPct: number;
  } | null;
  technicalMetrics?: {
    dma50: number;
    dma200: number;
    maTrendScore: number;
    volume20dRatio: number;
    liquidityScore: number;
  };
  licensingNotice: string;
  retrievedAt: string;
  isCached: boolean;
}

interface CacheEntry {
  data: MarketOverviewData;
  expiresAt: number;
}

type TataMotorsPriceResult = {
  currentPrice: number;
  change: number;
  changePct: number;
  symbol: string;
  ticker: string;
  source: string;
  lastUpdated: string;
};

@Injectable()
export class MarketIndexService {
  private readonly logger = new Logger(MarketIndexService.name);
  private cache: CacheEntry | null = null;
  private overviewInFlight: Promise<MarketOverviewData> | null = null;
  private tataMotorsPriceCache: { data: TataMotorsPriceResult; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute - fresher Nifty/Sensex/Bank day-change on the top bar

  private readonly INDICES = [
    { ticker: '^NSEI', symbol: 'NIFTY 50', name: 'Nifty 50 Index' },
    { ticker: '^BSESN', symbol: 'SENSEX', name: 'BSE Sensex Index' },
    { ticker: '^NSEBANK', symbol: 'NIFTY BANK', name: 'Nifty Bank Index' },
    { ticker: '^INDIAVIX', symbol: 'INDIA VIX', name: 'India Volatility Index' },
  ];

  private readonly LICENSING_NOTICE =
    'Delayed market quotes (15-min delay) provided solely for educational and research demonstration per PRD Section 58. Commercial client redistribution requires a formal licensing agreement with NSE Data & Analytics Ltd / BSE Ltd or an authorized data vendor (TrueData/GDFL).';

  async getMarketOverview(forceRefresh = false): Promise<MarketOverviewData> {
    const now = Date.now();
    if (!forceRefresh && this.cache && this.cache.expiresAt > now) {
      return { ...this.cache.data, isCached: true };
    }
    // Coalesce concurrent /indices + /market-mood cold misses into one upstream fan-out
    if (!forceRefresh && this.overviewInFlight) {
      return this.overviewInFlight;
    }

    this.overviewInFlight = this.loadMarketOverviewFresh(now).finally(() => {
      this.overviewInFlight = null;
    });
    return this.overviewInFlight;
  }

  private async loadMarketOverviewFresh(now: number): Promise<MarketOverviewData> {
    try {
      const results = await Promise.allSettled(
        this.INDICES.map((idx) => this.fetchQuote(idx.ticker, idx.symbol, idx.name)),
      );

      const snapshots: IndexSnapshot[] = [];
      let indiaVix: number | null = null;

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          if (res.value.symbol === 'INDIA VIX') {
            indiaVix = res.value.current;
          } else {
            snapshots.push(res.value);
          }
        }
      }

      if (snapshots.length < 3) {
        this.logger.warn('Incomplete index quotes fetched; returning available snapshots only.');
      }

      let [liveBreadth, techMetrics] = await Promise.all([
        this.fetchNseBreadth(),
        this.fetchNiftyHistoricalTrend(),
      ]);

      if (!liveBreadth) {
        liveBreadth = await this.fetchYahooNiftyBreadth();
      }

      const marketBreadth = liveBreadth
        ? {
            advances: liveBreadth.advances,
            declines: liveBreadth.declines,
            ratio: Math.round((liveBreadth.advances / Math.max(1, liveBreadth.declines)) * 100) / 100,
            breadthPct: liveBreadth.breadthPct,
          }
        : null;

      const overview: MarketOverviewData = {
        indices: snapshots,
        indiaVix,
        marketBreadth,
        technicalMetrics: techMetrics || undefined,
        licensingNotice: this.LICENSING_NOTICE,
        retrievedAt: new Date().toISOString(),
        isCached: false,
      };

      if (snapshots.length >= 3 && indiaVix != null && marketBreadth && techMetrics) {
        this.cache = {
          data: overview,
          expiresAt: now + this.CACHE_TTL_MS,
        };
      }

      return overview;
    } catch (err: any) {
      this.logger.error(`Failed to fetch live market indices: ${err.message}`);
      if (this.cache) {
        return { ...this.cache.data, isCached: true };
      }
      return {
        indices: [],
        indiaVix: null,
        marketBreadth: null,
        licensingNotice: this.LICENSING_NOTICE,
        retrievedAt: new Date().toISOString(),
        isCached: false,
      };
    }
  }

  async fetchStockPrice(symbol: string): Promise<number | null> {
    try {
      const cleanSymbol = symbol.trim().toUpperCase();
      const candidates =
        cleanSymbol === 'TATAMOTORS' || cleanSymbol === 'TATAMOTORS.NS'
          ? ['TATAMOTORS.NS', 'TMCV.NS']
          : cleanSymbol.endsWith('.NS') || cleanSymbol.endsWith('.BO')
            ? [cleanSymbol]
            : [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`];

      for (const ticker of candidates) {
        try {
          const quote = await this.fetchQuote(ticker, cleanSymbol, cleanSymbol);
          if (quote && quote.current > 0) {
            return quote.current;
          }
        } catch {}
      }
      return null;
    } catch {
      return null;
    }
  }

  async fetchQuote(
    ticker: string,
    symbol: string,
    name: string,
  ): Promise<IndexSnapshot | null> {
    const encoded = encodeURIComponent(ticker);
    // 5d supplies prior daily closes; range=1d often has a misleading chartPreviousClose for indices
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=5d`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} for ${ticker}`);
    }

    const json = (await resp.json()) as any;
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const closes = extractYahooCloses(result);
    const session = parseYahooSessionChange(meta, closes);
    if (!session) {
      throw new Error(`Invalid payload for ${ticker}`);
    }

    const dayHigh = meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh) : session.current;
    const dayLow = meta.regularMarketDayLow ? Number(meta.regularMarketDayLow) : session.current;
    const timeSec = meta.regularMarketTime || Math.floor(Date.now() / 1000);

    return {
      symbol,
      name,
      ticker,
      current: session.current,
      change: session.change,
      changePct: session.changePct,
      dayHigh,
      dayLow,
      previousClose: session.previousClose,
      lastUpdated: new Date(timeSec * 1000).toISOString(),
      delayedMinutes: 15,
      source: 'Yahoo Finance Delayed Feed (15-min)',
    };
  }

  async getTataMotorsPrice(forceRefresh = false): Promise<TataMotorsPriceResult | null> {
    const now = Date.now();
    if (!forceRefresh && this.tataMotorsPriceCache && this.tataMotorsPriceCache.expiresAt > now) {
      return this.tataMotorsPriceCache.data;
    }

    const tickers = [
      { ticker: 'TATAMOTORS.NS', symbol: 'TATAMOTORS' },
      { ticker: 'TMCV.NS', symbol: 'TATAMOTORS (TMCV)' },
    ];

    for (const t of tickers) {
      try {
        const quote = await this.fetchQuote(t.ticker, t.symbol, 'Tata Motors Limited');
        if (quote && quote.current > 0) {
          const res = {
            currentPrice: quote.current,
            change: quote.change,
            changePct: quote.changePct,
            symbol: t.symbol,
            ticker: t.ticker,
            source: 'Yahoo Finance Delayed Feed (15-min)',
            lastUpdated: quote.lastUpdated,
          };
          this.tataMotorsPriceCache = { data: res, expiresAt: now + this.CACHE_TTL_MS };
          return res;
        }
      } catch {}
    }

    this.logger.warn('Tata Motors live quote unavailable; returning null.');
    return null;
  }

  private extractNseCookies(headers: Headers): string {
    const getSetCookie = (headers as any).getSetCookie?.bind(headers);
    const list: string[] = typeof getSetCookie === 'function' ? getSetCookie() : [];
    if (list.length > 0) {
      return list.map((c: string) => c.split(';')[0].trim()).filter(Boolean).join('; ');
    }
    const raw = headers.get('set-cookie') || '';
    return raw
      .split(/,(?=[^;]+=)/)
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }

  private async fetchNseBreadth(): Promise<{ advances: number; declines: number; breadthPct: number } | null> {
    try {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

      const homeResp = await fetch('https://www.nseindia.com', {
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      });
      let cookies = this.extractNseCookies(homeResp.headers);

      // Warm market-data page - NSE often requires this before JSON APIs succeed
      try {
        const warm = await fetch('https://www.nseindia.com/market-data/live-equity-market', {
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html',
            Cookie: cookies,
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(8000),
        });
        const warmCookies = this.extractNseCookies(warm.headers);
        if (warmCookies) {
          const map = new Map<string, string>();
          for (const part of `${cookies}; ${warmCookies}`.split('; ').filter(Boolean)) {
            const i = part.indexOf('=');
            if (i > 0) map.set(part.slice(0, i), part.slice(i + 1));
          }
          cookies = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
        }
      } catch {}

      const indicesResp = await fetch('https://www.nseindia.com/api/allIndices', {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.nseindia.com/market-data/live-equity-market',
          Cookie: cookies,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!indicesResp.ok) return null;

      const data = (await indicesResp.json()) as any;
      const nifty = data?.data?.find(
        (idx: any) => idx.index === 'NIFTY 50' || idx.indexSymbol === 'NIFTY 50',
      );

      if (nifty && typeof nifty.advances === 'number' && typeof nifty.declines === 'number') {
        const advances = Number(nifty.advances);
        const declines = Number(nifty.declines);
        const total = advances + declines || 50;
        const breadthPct = Math.round((advances / total) * 100);
        return { advances, declines, breadthPct };
      }
      return null;
    } catch (err: any) {
      this.logger.debug(`NSE live breadth fetch skipped: ${err.message}`);
      return null;
    }
  }

  private async fetchYahooNiftyBreadth(): Promise<{ advances: number; declines: number; breadthPct: number } | null> {
    const symbols = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS', 'ICICIBANK.NS',
      'INFY.NS', 'SBIN.NS', 'ITC.NS', 'HINDUNILVR.NS', 'LT.NS',
      'BAJFINANCE.NS', 'HCLTECH.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'AXISBANK.NS',
      'KOTAKBANK.NS', 'NTPC.NS', 'ULTRACEMCO.NS', 'POWERGRID.NS', 'ONGC.NS',
      'WIPRO.NS', 'TITAN.NS', 'M&M.NS', 'COALINDIA.NS', 'ADANIENT.NS',
    ];
    try {
      let advances = 0;
      let declines = 0;
      await Promise.all(
        symbols.map(async (ticker) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
            const resp = await fetch(url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            });
            if (!resp.ok) return;
            const json = (await resp.json()) as any;
            const result = json?.chart?.result?.[0];
            const session = parseYahooSessionChange(result?.meta, extractYahooCloses(result));
            if (!session) return;
            if (session.changePct >= 0) advances += 1;
            else declines += 1;
          } catch {}
        }),
      );
      const total = advances + declines;
      if (total < 10) return null;
      return {
        advances,
        declines,
        breadthPct: Math.round((advances / total) * 100),
      };
    } catch {
      return null;
    }
  }

  private async fetchNiftyHistoricalTrend(): Promise<{
    dma50: number;
    dma200: number;
    maTrendScore: number;
    volume20dRatio: number;
    liquidityScore: number;
  } | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1y`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 GoalCompass/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) return null;
      const json = (await resp.json()) as any;
      const result = json?.chart?.result?.[0];
      if (!result) return null;

      const closes: number[] = (result.indicators?.quote?.[0]?.close || []).filter(
        (c: any): c is number => typeof c === 'number' && !isNaN(c) && c > 0,
      );
      const volumes: number[] = (result.indicators?.quote?.[0]?.volume || []).filter(
        (v: any): v is number => typeof v === 'number' && !isNaN(v) && v > 0,
      );

      if (closes.length < 50) return null;

      const currentPrice =
        result.meta?.regularMarketPrice || closes[closes.length - 1];

      // 50-DMA
      const last50 = closes.slice(-50);
      const dma50 = Math.round((last50.reduce((a, b) => a + b, 0) / 50) * 100) / 100;

      // 200-DMA
      const last200 = closes.length >= 200 ? closes.slice(-200) : closes;
      const dma200 = Math.round((last200.reduce((a, b) => a + b, 0) / last200.length) * 100) / 100;

      // Real % above 200-DMA proxy
      const pctAbove200 = ((currentPrice - dma200) / dma200) * 100;
      const maTrendScore = Math.min(95, Math.max(10, Math.round(50 + pctAbove200 * 3.5)));

      // 20-day Volume Trend vs 50-day average volume
      let volume20dRatio = 1.0;
      let liquidityScore = 50;
      if (volumes.length >= 50) {
        const vol20 = volumes.slice(-20);
        const avgVol20 = vol20.reduce((a, b) => a + b, 0) / 20;
        const vol50 = volumes.slice(-50);
        const avgVol50 = vol50.reduce((a, b) => a + b, 0) / 50;
        if (avgVol50 > 0) {
          volume20dRatio = Math.round((avgVol20 / avgVol50) * 100) / 100;
          liquidityScore = Math.min(95, Math.max(15, Math.round(volume20dRatio * 52)));
        }
      }

      return {
        dma50,
        dma200,
        maTrendScore,
        volume20dRatio,
        liquidityScore,
      };
    } catch (err: any) {
      this.logger.debug(`Historical trend computation skipped: ${err.message}`);
      return null;
    }
  }
}
