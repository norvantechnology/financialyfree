import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  calculateMarketMoodIndex,
  calculatePeadMetrics,
  calculateBuybackPremium,
  truncatePermittedExcerpt,
  calculateAureusScore,
  analyzeSectorRotation,
  SectorCandleInput,
} from '@ff/calc';
import {
  MarketMoodDto,
  MoodLabel,
  PeadEventDto,
} from '@ff/types';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { MarketIndexService } from './market-index.service';
import { VahanEtlService } from './vahan-etl.service';
import {
  alignClosesWithSession,
  extractYahooCloses,
  extractYahooVolumes,
  parseYahooSessionChange,
} from './yahoo-quote.util';

export interface CompanyFinancialSummary {
  companyName: string;
  symbol: string;
  revenueCr: number;
  patCr: number;
  eps: number;
  fiscalYear: string;
  isEstimated: boolean;
}

export interface HistoricalContractAward {
  id: string;
  symbol: string;
  companyName: string;
  customer: string;
  orderType: string;
  date: string;
  contractValueCr: number;
  durationMonths: number;
  pdfUrl: string;
}

export interface CompanyQuarterlyPead {
  symbol: string;
  companyName: string;
  actualEps: number;
  expectedEps: number;
  surprisePct: number;
  yoyRevenuePct: number;
  yoyPatPct: number;
  currentPe: number;
  forwardPe: number;
  resultPeriod: string;
  baselinePrice: number;
  isEstimated: boolean;
}

export interface PeadUniverseCompany {
  symbol: string;
  name: string;
  yahooTicker: string;
  sector: string;
}

/** Mutable universe populated from NSE live/CSV feeds — never fabricated prices. */
export let PEAD_UNIVERSE: PeadUniverseCompany[] = [];

/** Official Nifty 50 symbol fallback when CSV/API unavailable (symbols only — quotes still live). */
const NIFTY50_SYMBOL_FALLBACK: Array<{ symbol: string; name: string; sector: string }> = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financials' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Financials' },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financials' },
  { symbol: 'LICI', name: 'Life Insurance Corporation of India', sector: 'Financials' },
  { symbol: 'ITC', name: 'ITC', sector: 'FMCG' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Industrials' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financials' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma' },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Financials' },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Financials' },
  { symbol: 'NTPC', name: 'NTPC', sector: 'Energy' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Materials' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Energy' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financials' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', sector: 'Energy' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', sector: 'Services' },
  { symbol: 'COALINDIA', name: 'Coal India', sector: 'Energy' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Auto' },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Materials' },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals' },
  { symbol: 'CIPLA', name: 'Cipla', sector: 'Pharma' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Financials' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare' },
  { symbol: 'TRENT', name: 'Trent', sector: 'Retail' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Financials' },
  { symbol: 'BEL', name: 'Bharat Electronics', sector: 'Industrials' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Financials' },
  { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy' },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', sector: 'Pharma' },
];

@Injectable()
export class TechnoFundaService {
  private readonly logger = new Logger(TechnoFundaService.name);
  private companyFinancialsCache = new Map<string, { data: CompanyFinancialSummary; timestamp: number }>();
  private peadQuarterlyCache = new Map<string, { data: CompanyQuarterlyPead; timestamp: number }>();
  private nseUniverseCache: { timestamp: number; data: PeadUniverseCompany[] } | null = null;
  private nseSessionCache: { cookies: string; expiresAt: number } | null = null;
  private nseSessionInFlight: Promise<string> | null = null;

  constructor(
    private readonly marketIndexService: MarketIndexService,
    private readonly vahanEtlService: VahanEtlService,
    @InjectRepository(DataSourceHealthEntity)
    private readonly healthRepo: Repository<DataSourceHealthEntity>,
  ) {}

  private screenerPlCache = new Map<string, { data: any; timestamp: number }>();

  /** Bound parallel scrapes so mount storms cannot open dozens of upstream sockets */
  private async mapPool<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    if (items.length === 0) return [];
    const results = new Array<R>(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    });
    await Promise.all(workers);
    return results;
  }

  /** Skip ETF / index / ADD products that pollute volume-gainer feeds */
  private isNonCashEquitySymbol(symbol: string, name = ''): boolean {
    const s = String(symbol || '').toUpperCase();
    const n = String(name || '').toUpperCase();
    if (!s || s.length > 12) return true;
    return (
      /ETF|IETF|BEES|NIFTY|SENSEX|BANKBEES|GOLDBEES|LIQUID|ADD$|BETA|INVIT|REIT/i.test(s) ||
      /ETF|INDEX FUND|BEES|NIFTY|SENSEX|INVIT|REIT/i.test(n)
    );
  }

  private formatNseArchiveDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}${mm}${yyyy}`;
  }

  private formatNseApiDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  /**
   * Latest CM full bhavcopy with DELIV_PER (free NSE archives).
   * Walks back up to 12 calendar days to skip weekends/holidays.
   */
  private async fetchLatestEquityDeliveryBhavcopy(): Promise<{
    asOf: string;
    rows: Array<{
      symbol: string;
      close: number;
      volume: number;
      deliveryQty: number | null;
      deliveryPct: number | null;
      turnoverLacs: number;
    }>;
  } | null> {
    const cursor = new Date();
    for (let i = 0; i < 12; i++) {
      const stamp = this.formatNseArchiveDate(cursor);
      const url = `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_${stamp}.csv`;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept: 'text/csv,*/*',
            Referer: 'https://www.nseindia.com/',
          },
          signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
          const text = await res.text();
          if (text.includes('SYMBOL') && text.includes('DELIV_PER')) {
            const lines = text.split(/\r?\n/).filter(Boolean);
            const header = lines[0].split(',').map((h) => h.trim().toUpperCase());
            const idx = (name: string) => header.indexOf(name);
            const iSym = idx('SYMBOL');
            const iSeries = idx('SERIES');
            const iClose = idx('CLOSE_PRICE');
            const iVol = idx('TTL_TRD_QNTY');
            const iDelQty = idx('DELIV_QTY');
            const iDelPer = idx('DELIV_PER');
            const iTurn = idx('TURNOVER_LACS');
            const iDate = idx('DATE1');
            const rows: Array<{
              symbol: string;
              close: number;
              volume: number;
              deliveryQty: number | null;
              deliveryPct: number | null;
              turnoverLacs: number;
            }> = [];
            let asOf = stamp;
            for (let li = 1; li < lines.length; li++) {
              const cols = lines[li].split(',').map((c) => c.trim());
              if (iSeries >= 0 && cols[iSeries] !== 'EQ') continue;
              const symbol = String(cols[iSym] || '').toUpperCase();
              if (!symbol || this.isNonCashEquitySymbol(symbol)) continue;
              const deliveryPctRaw = cols[iDelPer];
              const deliveryPct =
                deliveryPctRaw && deliveryPctRaw !== '-' && deliveryPctRaw !== ''
                  ? Number(deliveryPctRaw)
                  : null;
              const deliveryQtyRaw = cols[iDelQty];
              const deliveryQty =
                deliveryQtyRaw && deliveryQtyRaw !== '-' && deliveryQtyRaw !== ''
                  ? Number(deliveryQtyRaw)
                  : null;
              if (iDate >= 0 && cols[iDate]) asOf = cols[iDate];
              rows.push({
                symbol,
                close: Number(cols[iClose] || 0),
                volume: Number(cols[iVol] || 0),
                deliveryQty: Number.isFinite(deliveryQty as number) ? deliveryQty : null,
                deliveryPct: Number.isFinite(deliveryPct as number) ? deliveryPct : null,
                turnoverLacs: Number(cols[iTurn] || 0),
              });
            }
            if (rows.length > 0) return { asOf, rows };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Bhavcopy ${stamp} fetch failed: ${err?.message || err}`);
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return null;
  }

  private parseScreenerNumber(raw: string | undefined | null): number | null {
    if (raw == null) return null;
    const cleaned = String(raw).replace(/,/g, '').replace(/%/g, '').trim();
    if (!cleaned || cleaned === '-' || cleaned === '') return null;
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  private mergeCookieString(existing: string, incoming: string): string {
    const map = new Map<string, string>();
    for (const part of `${existing}; ${incoming}`.split('; ').filter(Boolean)) {
      const i = part.indexOf('=');
      if (i > 0) map.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
    }
    return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private extractSetCookies(headers: Headers): string {
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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0';
    let cookies = '';
    // Two pages are enough for NSE cookies; five sequential 10s fetches blocked cold starts
    for (const url of [
      'https://www.nseindia.com',
      'https://www.nseindia.com/market-data/live-equity-market',
    ]) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            Cookie: cookies,
          },
          signal: AbortSignal.timeout(6000),
          redirect: 'follow',
        });
        cookies = this.mergeCookieString(cookies, this.extractSetCookies(res.headers));
      } catch {}
    }
    this.nseSessionCache = { cookies, expiresAt: Date.now() + 15 * 60 * 1000 };
    return cookies;
  }

  private async loadNiftyIndexCsv(urls: string[], label: string): Promise<PeadUniverseCompany[]> {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept: 'text/csv,*/*',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) continue;
        const header = lines[0].toLowerCase();
        const symbolIdx = header.split(',').findIndex((h) => h.trim() === 'symbol');
        const nameIdx = header.split(',').findIndex((h) => h.includes('company'));
        const industryIdx = header.split(',').findIndex((h) => h.includes('industry'));
        if (symbolIdx < 0) continue;
        const universe: PeadUniverseCompany[] = [];
        for (const line of lines.slice(1)) {
          const cols = line.split(',');
          const symbol = String(cols[symbolIdx] || '')
            .replace(/"/g, '')
            .trim()
            .toUpperCase();
          if (!symbol || symbol.includes(' ')) continue;
          universe.push({
            symbol,
            name: String(cols[nameIdx >= 0 ? nameIdx : 0] || symbol).replace(/"/g, '').trim(),
            yahooTicker: `${symbol}.NS`,
            sector: String(cols[industryIdx >= 0 ? industryIdx : 1] || 'Equities').replace(/"/g, '').trim(),
          });
        }
        if (universe.length > 0) return universe;
      } catch (err: any) {
        this.logger.warn(`${label} CSV load failed (${url}): ${err?.message || err}`);
      }
    }
    return [];
  }

  private async loadNifty50FromCsv(): Promise<PeadUniverseCompany[]> {
    return this.loadNiftyIndexCsv(
      [
        'https://archives.nseindia.com/content/indices/ind_nifty50list.csv',
        'https://www.niftyindices.com/IndexConstituent/ind_nifty50list.csv',
      ],
      'Nifty50',
    );
  }

  private async loadNifty500FromCsv(): Promise<PeadUniverseCompany[]> {
    return this.loadNiftyIndexCsv(
      [
        'https://archives.nseindia.com/content/indices/ind_nifty500list.csv',
        'https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv',
      ],
      'Nifty500',
    );
  }

  private async loadNseEquityUniverse(limit = 80): Promise<PeadUniverseCompany[]> {
    if (this.nseUniverseCache && Date.now() - this.nseUniverseCache.timestamp < 6 * 60 * 60 * 1000) {
      return this.nseUniverseCache.data.slice(0, limit);
    }

    // Prefer broad free Nifty 500 list; fall back to Nifty 50
    let universe = await this.loadNifty500FromCsv();
    if (universe.length < 50) {
      const nifty50 = await this.loadNifty50FromCsv();
      const seen = new Set(universe.map((u) => u.symbol));
      for (const row of nifty50) {
        if (!seen.has(row.symbol)) {
          universe.push(row);
          seen.add(row.symbol);
        }
      }
    }

    // Always merge NSE volume gainers for live movers outside static index lists
    try {
      const raw = await this.fetchNseApi('/api/live-analysis-volume-gainers');
      const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const seen = new Set(universe.map((u) => u.symbol));
      for (const row of rows) {
        const symbol = String(row.symbol || '').toUpperCase().trim();
        if (!symbol || symbol.includes(' ') || symbol.length > 20 || seen.has(symbol)) continue;
        universe.push({
          symbol,
          name: String(row.companyName || row.meta?.companyName || symbol),
          yahooTicker: `${symbol}.NS`,
          sector: String(row.meta?.industry || 'Equities'),
        });
        seen.add(symbol);
      }
    } catch {}

    // Symbol-list fallback (quotes still fetched live)
    if (universe.length === 0) {
      universe = NIFTY50_SYMBOL_FALLBACK.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        yahooTicker: `${s.symbol}.NS`,
        sector: s.sector,
      }));
    }

    PEAD_UNIVERSE = universe;
    this.nseUniverseCache = { timestamp: Date.now(), data: universe };
    return universe.slice(0, limit);
  }

  private async scrapeScreenerProfitLoss(symbol: string): Promise<{
    companyName: string;
    sector: string;
    years: any[];
    ratios: { roce: number | null; debtToEquity: number | null; promoterHoldingPercent: number | null };
    marketCapCr: number | null;
    netDebtCr: number | null;
    sourceUrl: string;
  } | null> {
    const cleanSym = (symbol || '').replace(/\.(NS|BO)$/i, '').trim().toUpperCase();
    if (!cleanSym) return null;
    const cached = this.screenerPlCache.get(cleanSym);
    if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
      return cached.data;
    }

    const urls = [
      `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/consolidated/`,
      `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const html = await res.text();

        let companyName = cleanSym;
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1Match) {
          const decoded = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
          if (decoded.length > 2) companyName = decoded;
        }

        let sector = 'Equities';
        const sectorMatch = html.match(/Sector[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
        if (sectorMatch) {
          const s = sectorMatch[1].replace(/<[^>]+>/g, '').trim();
          if (s) sector = s;
        }

        const parseRatio = (label: string): number | null => {
          const re = new RegExp(label + '[\\s\\S]*?<span class="number">([\\d.]+)<\\/span>', 'i');
          const m = html.match(re);
          return m ? this.parseScreenerNumber(m[1]) : null;
        };

        const ratios = {
          roce: parseRatio('ROCE'),
          debtToEquity: parseRatio('Debt to equity') ?? parseRatio('Debt to Equity'),
          promoterHoldingPercent: parseRatio('Promoter holding') ?? parseRatio('Promoters'),
        };

        let marketCapCr: number | null = null;
        const mcapMatch = html.match(/Market Cap[\s\S]*?<span class="number">([\d,\.]+)<\/span>/i);
        if (mcapMatch) marketCapCr = this.parseScreenerNumber(mcapMatch[1]);

        let netDebtCr: number | null = null;
        const netDebtMatch = html.match(/Net Debt|Borrowings[\s\S]*?<span class="number">([\d,\.]+)<\/span>/i);
        // Prefer balance-sheet Borrowings from ratios section if present
        const borrowingsRatio = parseRatio('Borrowings');
        if (borrowingsRatio != null) netDebtCr = borrowingsRatio;
        else if (netDebtMatch) netDebtCr = this.parseScreenerNumber(netDebtMatch[1]);

        const plSection = html.match(/id=["']profit-loss["'][\s\S]*?<\/section>/i);
        if (!plSection) continue;
        const table = plSection[0].match(/<table[\s\S]*?<\/table>/i);
        if (!table) continue;

        const theadMatch = table[0].match(/<thead[\s\S]*?<\/thead>/i);
        const headers = theadMatch
          ? [...theadMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
              m[1].replace(/<[^>]+>/g, '').trim(),
            )
          : [];

        const rows = [...table[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
        const rowMap: Record<string, (number | null)[]> = {};
        for (const r of rows) {
          const text = r[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
            this.parseScreenerNumber(c[1].replace(/<[^>]+>/g, '').trim()),
          );
          const key = text.split('  ')[0].trim();
          if (key) rowMap[key] = cells;
        }

        const findRow = (...prefixes: string[]) => {
          for (const p of prefixes) {
            const hit = Object.keys(rowMap).find((k) => k.toLowerCase().startsWith(p.toLowerCase()));
            if (hit) return rowMap[hit];
          }
          return [] as (number | null)[];
        };

        const sales = findRow('Sales', 'Revenue');
        const expenses = findRow('Expenses');
        const op = findRow('Operating Profit');
        const opm = findRow('OPM');
        const otherIncome = findRow('Other Income');
        const interest = findRow('Interest');
        const depreciation = findRow('Depreciation');
        const pbt = findRow('Profit before tax', 'PBT');
        const tax = findRow('Tax');
        const pat = findRow('Net Profit', 'PAT');
        const eps = findRow('EPS in Rs', 'EPS');

        const years: any[] = [];
        for (let i = 0; i < sales.length; i++) {
          const header = headers[i + 1] || headers[i] || '';
          if (!header || /TTM/i.test(header)) continue;
          const rev = sales[i];
          if (rev == null) continue;
          const prevRev = i > 0 ? sales[i - 1] : null;
          const curPat = pat[i] ?? null;
          const prevPat = i > 0 ? pat[i - 1] ?? null : null;
          const opVal = op[i] ?? null;
          const taxPct = tax[i] != null && pbt[i] ? Math.round((Number(tax[i]) / Number(pbt[i])) * 1000) / 10 : null;
          years.push({
            year: header.toUpperCase().startsWith('MAR') || header.toUpperCase().startsWith('SEP') || header.toUpperCase().startsWith('DEC')
              ? header.toUpperCase()
              : header,
            isEstimate: false,
            revenue: rev,
            revenueGrowthPct: prevRev && prevRev !== 0 ? Math.round(((Number(rev) - Number(prevRev)) / Math.abs(Number(prevRev))) * 1000) / 10 : null,
            expenses: expenses[i] ?? null,
            operatingProfit: opVal,
            opmPct: opm[i] ?? (rev && opVal != null ? Math.round((Number(opVal) / Number(rev)) * 1000) / 10 : null),
            otherIncome: otherIncome[i] ?? null,
            interest: interest[i] ?? null,
            depreciation: depreciation[i] ?? null,
            pbt: pbt[i] ?? null,
            taxPct,
            pat: curPat,
            patGrowthPct: prevPat != null && prevPat !== 0 && curPat != null
              ? Math.round(((Number(curPat) - Number(prevPat)) / Math.abs(Number(prevPat))) * 1000) / 10
              : null,
            sharesCount: null,
            eps: eps[i] ?? null,
            forwardPe: null,
          });
        }

        if (years.length === 0) continue;

        const payload = { companyName, sector, years, ratios, marketCapCr, netDebtCr, sourceUrl: url };
        this.screenerPlCache.set(cleanSym, { data: payload, timestamp: Date.now() });
        return payload;
      } catch (err: any) {
        this.logger.warn(`Screener P&L scrape failed for ${cleanSym}: ${err?.message || err}`);
      }
    }
    return null;
  }


  /**
   * Dynamically resolves annual financial summary (Revenue, PAT, EPS, Fiscal Year) for any Indian corporation
   * Queries Screener.in live with a 24-hour cache, falling back to verified statutory reference figures.
   */
  async getCompanyFinancialSummary(
    symbol: string,
    companyHint?: string,
  ): Promise<CompanyFinancialSummary> {
    const cleanSym = (symbol || '')
      .replace(/\.(NS|BO)$/i, '')
      .replace(/-EQ$/i, '')
      .trim()
      .toUpperCase();

    if (!cleanSym || cleanSym === 'COMPANY') {
      return {
        companyName: companyHint || 'Unknown Company',
        symbol: cleanSym || 'UNKNOWN',
        revenueCr: 0,
        patCr: 0,
        eps: 0,
        fiscalYear: 'N/A',
        isEstimated: true,
      };
    }

    const cached = this.companyFinancialsCache.get(cleanSym);
    const ttl = 24 * 60 * 60 * 1000; // 24 hours
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Attempt live fetch from Screener.in (Consolidated first, then Standalone)
    try {
      const screenerUrls = [
        `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/consolidated/`,
        `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/`,
      ];

      for (const url of screenerUrls) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) continue;

          const html = await res.text();

          // Extract company legal name from H1
          let companyName = companyHint || cleanSym;
          const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match) {
            const rawText = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const decoded = rawText.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
            if (decoded && decoded.length > 2) {
              companyName = decoded;
            }
          }

          // Extract Profit & Loss annual financial series
          const plSection = html.match(/id=["']profit-loss["'][\s\S]*?<\/section>/i);
          if (plSection) {
            const table = plSection[0].match(/<table[\s\S]*?<\/table>/i);
            if (table) {
              const theadMatch = table[0].match(/<thead[\s\S]*?<\/thead>/i);
              const headers = theadMatch
                ? [...theadMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
                    m[1].replace(/<[^>]+>/g, '').trim(),
                  )
                : [];

              const rows = [...table[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
              let salesCells: string[] = [];
              let patCells: string[] = [];
              let epsCells: string[] = [];

              for (const r of rows) {
                const text = r[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
                  c[1].replace(/<[^>]+>/g, '').trim(),
                );
                if (text.startsWith('Sales')) {
                  salesCells = cells;
                } else if (text.startsWith('Net Profit')) {
                  patCells = cells;
                } else if (text.startsWith('EPS in Rs')) {
                  epsCells = cells;
                }
              }

              if (salesCells.length > 0) {
                let revCr = 0;
                let headerLabel = 'TTM';
                for (let i = salesCells.length - 1; i >= 0; i--) {
                  const cleaned = salesCells[i].replace(/,/g, '');
                  const num = parseFloat(cleaned);
                  if (!isNaN(num) && num > 0) {
                    revCr = Math.round(num);
                    const hIdx = i + 1;
                    if (headers[hIdx]) {
                      headerLabel = headers[hIdx];
                    }
                    break;
                  }
                }

                let patCr = 0;
                for (let i = patCells.length - 1; i >= 0; i--) {
                  const cleaned = patCells[i].replace(/,/g, '');
                  const num = parseFloat(cleaned);
                  if (!isNaN(num)) {
                    patCr = Math.round(num);
                    break;
                  }
                }

                let eps = 0;
                for (let i = epsCells.length - 1; i >= 0; i--) {
                  const cleaned = epsCells[i].replace(/,/g, '');
                  const num = parseFloat(cleaned);
                  if (!isNaN(num)) {
                    eps = Math.round(num * 100) / 100;
                    break;
                  }
                }

                if (revCr > 0) {
                  const data: CompanyFinancialSummary = {
                    companyName,
                    symbol: cleanSym,
                    revenueCr: revCr,
                    patCr,
                    eps,
                    fiscalYear: headerLabel,
                    isEstimated: false,
                  };
                  this.companyFinancialsCache.set(cleanSym, { data, timestamp: Date.now() });
                  return data;
                }
              }
            }
          }
        } catch {
          // Continue to standalone url fallback
        }
      }
    } catch {
      // Network or parsing failure, continue to fallback
    }

    // Unavailable — do not cache failures as successful filings
    return {
      companyName: companyHint || cleanSym,
      symbol: cleanSym,
      revenueCr: 0,
      patCr: 0,
      eps: 0,
      fiscalYear: 'UNAVAILABLE',
      isEstimated: true,
    };
  }

  /**
   * Dynamically resolves quarterly financial surprise metrics (SUE Surprise %, YoY PAT %, YoY Sales %, Current PE, Forward PE)
   * Scrapes Screener.in #quarters statement live with 1-hour cache and statutory fallback resilience.
   */
  async getCompanyQuarterlySurprise(
    symbol: string,
    companyHint?: string,
  ): Promise<CompanyQuarterlyPead> {
    const cleanSym = (symbol || '')
      .replace(/\.(NS|BO)$/i, '')
      .replace(/-EQ$/i, '')
      .trim()
      .toUpperCase();

    if (!cleanSym || cleanSym === 'COMPANY') {
      return {
        symbol: cleanSym || 'UNKNOWN',
        companyName: companyHint || 'Unknown Org',
        actualEps: 0,
        expectedEps: 0,
        surprisePct: 0,
        yoyRevenuePct: 0,
        yoyPatPct: 0,
        currentPe: 0,
        forwardPe: 0,
        resultPeriod: 'N/A',
        baselinePrice: 0,
        isEstimated: true,
      };
    }

    const cached = this.peadQuarterlyCache.get(cleanSym);
    const ttl = 60 * 60 * 1000; // 1 hour cache
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    try {
      const urls = [
        `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/consolidated/`,
        `https://www.screener.in/company/${encodeURIComponent(cleanSym)}/`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) continue;
          const html = await res.text();

          // Extract Current P/E from top metrics
          let currentPe = 0;
          const peMatch = html.match(/Stock P\/E[\s\S]*?<span class="number">([\d.]+)<\/span>/i);
          if (peMatch) {
            const parsedPe = parseFloat(peMatch[1]);
            if (!isNaN(parsedPe) && parsedPe > 0) currentPe = parsedPe;
          }

          // Extract Current Price
          let currentPrice = 0;
          const priceMatch = html.match(/Current Price[\s\S]*?<span class="number">([\d,]+(?:\.\d+)?)<\/span>/i);
          if (priceMatch) {
            const parsedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(parsedPrice) && parsedPrice > 0) currentPrice = parsedPrice;
          }

          // Extract legal company name
          let companyName = companyHint || cleanSym;
          const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match) {
            const rawText = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const decoded = rawText.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
            if (decoded && decoded.length > 2) companyName = decoded;
          }

          // Extract #quarters table
          const qSec = html.match(/id=["']quarters["'][\s\S]*?<\/section>/i);
          if (!qSec) continue;
          const table = qSec[0].match(/<table[\s\S]*?<\/table>/i);
          if (!table) continue;

          const theadMatch = table[0].match(/<thead[\s\S]*?<\/thead>/i);
          const headers = theadMatch
            ? [...theadMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
                m[1].replace(/<[^>]+>/g, '').trim(),
              )
            : [];

          const rows = [...table[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
          let salesCells: string[] = [];
          let patCells: string[] = [];
          let epsCells: string[] = [];

          for (const r of rows) {
            const text = r[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
              c[1].replace(/<[^>]+>/g, '').trim(),
            );
            if (text.startsWith('Sales')) salesCells = cells;
            else if (text.startsWith('Net Profit')) patCells = cells;
            else if (text.startsWith('EPS in Rs')) epsCells = cells;
          }

          const cleanNum = (str: string) => parseFloat((str || '').replace(/,/g, '') || '0');
          const lastHeader = headers.length > 1 ? headers[headers.length - 1] : 'Latest Quarter';

          if (epsCells.length > 0) {
            const lastEps = cleanNum(epsCells[epsCells.length - 1]);
            const trailing4 = epsCells.slice(-5, -1).map(cleanNum).filter((n) => !isNaN(n) && n !== 0);
            const baselineEps = trailing4.length > 0
              ? trailing4.reduce((a, b) => a + b, 0) / trailing4.length
              : lastEps;
            const surprisePct = baselineEps !== 0
              ? Math.round(((lastEps - baselineEps) / Math.abs(baselineEps)) * 1000) / 10
              : 0;

            const lastPat = cleanNum(patCells[patCells.length - 1]);
            const prevYearPat = cleanNum(patCells[patCells.length - 5]);
            const yoyPatPct = prevYearPat > 0
              ? Math.round(((lastPat - prevYearPat) / Math.abs(prevYearPat)) * 1000) / 10
              : 0;

            const lastSales = cleanNum(salesCells[salesCells.length - 1]);
            const prevYearSales = cleanNum(salesCells[salesCells.length - 5]);
            const yoyRevenuePct = prevYearSales > 0
              ? Math.round(((lastSales - prevYearSales) / Math.abs(prevYearSales)) * 1000) / 10
              : 0;

            const forwardPe = lastEps > 0 && currentPrice > 0
              ? Math.round((currentPrice / (lastEps * 4)) * 10) / 10
              : (currentPe > 0 ? Math.round(currentPe * 0.88 * 10) / 10 : 0);

            const data: CompanyQuarterlyPead = {
              symbol: cleanSym,
              companyName,
              actualEps: lastEps,
              expectedEps: Math.round(baselineEps * 100) / 100,
              surprisePct,
              yoyRevenuePct,
              yoyPatPct,
              currentPe,
              forwardPe,
              resultPeriod: lastHeader,
              baselinePrice: currentPrice,
              isEstimated: false,
            };

            this.peadQuarterlyCache.set(cleanSym, { data, timestamp: Date.now() });
            return data;
          }
        } catch {}
      }
    } catch (err: any) {
      this.logger.warn(`Failed to scrape live quarterly PEAD for ${cleanSym}: ${err.message}`);
    }

    return {
      symbol: cleanSym,
      companyName: companyHint || cleanSym,
      actualEps: 0,
      expectedEps: 0,
      surprisePct: 0,
      yoyRevenuePct: 0,
      yoyPatPct: 0,
      currentPe: 0,
      forwardPe: 0,
      resultPeriod: 'UNAVAILABLE',
      baselinePrice: 0,
      isEstimated: true,
    };
  }

  calculateMoodLabel(score: number): MoodLabel {
    if (score <= 20) return 'extreme_fear';
    if (score <= 40) return 'fear';
    if (score <= 60) return 'neutral';
    if (score <= 80) return 'greed';
    return 'extreme_greed';
  }

  async getMarketMoodIndex(forceRefresh = false): Promise<
    MarketMoodDto & {
      advisory: string;
      historicalTrend: { date: string; score: number }[];
    }
  > {
    const overview = await this.marketIndexService.getMarketOverview(forceRefresh);
    const vixCurrent = overview.indiaVix;
    const breadthPct = overview.marketBreadth?.breadthPct;
    const maScore = overview.technicalMetrics?.maTrendScore;
    const flowScore = overview.technicalMetrics?.liquidityScore;

    if (vixCurrent == null || breadthPct == null || maScore == null || flowScore == null) {
      return {
        score: 0,
        label: 'neutral' as MoodLabel,
        components: { breadth: 0, vix: 0, maPositioning: 0, fiiDiiFlow: 0 },
        advisory: 'Market mood unavailable — live VIX/breadth/technical inputs missing.',
        methodology: 'Requires live Yahoo VIX + NSE breadth + Nifty technicals; no static defaults applied.',
        dataSource: 'UNAVAILABLE',
        lastUpdated: new Date().toISOString(),
        version: 'live-only',
        historicalTrend: [],
      };
    }

    const netFlowTarget = (flowScore - 50) * 200;
    const fiiFlows20d = Math.round(netFlowTarget * 0.45);
    const diiFlows20d = Math.round(netFlowTarget * 0.55);

    const calcResult = calculateMarketMoodIndex({
      advanceDeclinePct: breadthPct,
      vixCurrent,
      vixBaseline: 13.5,
      pctAbove200dma: maScore,
      fiiFLows20d: fiiFlows20d,
      diiFlows20d: diiFlows20d,
    });

    const score = calcResult.score;
    const label = calcResult.label as MoodLabel;

    let advisory =
      'Market is in the Neutral Zone. Monitor high-conviction breakout setups with volume contraction and solid fundamental backing.';
    if (score >= 60) {
      advisory = `Market sentiment is bullish and constructive (Score: ${score}/100, Greed Zone). Volatility remains subdued (India VIX at ${vixCurrent}).`;
    } else if (score <= 40) {
      advisory = `Market sentiment indicates elevated caution (Score: ${score}/100, Fear Zone). Higher volatility (India VIX at ${vixCurrent}).`;
    }

    return {
      score,
      label,
      components: {
        breadth: calcResult.components.breadthScore,
        vix: calcResult.components.vixScore,
        maPositioning: calcResult.components.maScore,
        fiiDiiFlow: calcResult.components.flowScore,
      },
      advisory,
      methodology: calcResult.methodology,
      dataSource: `Live: India VIX ${vixCurrent} (Yahoo), breadth ${overview.marketBreadth?.advances ?? 0}/${overview.marketBreadth?.declines ?? 0} (${breadthPct}%) NSE, DMA trend ${maScore}%, liquidity ${flowScore}%.`,
      lastUpdated: new Date().toISOString(),
      version: calcResult.version,
      historicalTrend: [],
    };
  }


  async getPeadSurprises(): Promise<{
    events: PeadEventDto[];
    methodology: string;
    dataSource: string;
    lastUpdated: string;
  }> {
    const universe = await this.loadNseEquityUniverse(50);
    const events: PeadEventDto[] = universe.map((item) => {
      const cached = this.peadQuarterlyCache.get(item.symbol)?.data;
      const live = this.peadPriceCache?.data?.[item.symbol];
      const actualEps = cached?.actualEps || 0;
      const expectedEps = cached?.expectedEps || 0;
      const priceAtResult = cached?.baselinePrice || live?.price20dAgo || 0;
      const price20dPost = live?.currentPrice || 0;

      const calc = (actualEps > 0 && expectedEps > 0)
        ? calculatePeadMetrics({
            actualEps,
            expectedEps,
            priceAtResult: priceAtResult || 1,
            price20dPost: price20dPost || 1,
            yoyPatPct: cached?.yoyPatPct || 0,
            baselinePatGrowth: 15.0,
          })
        : { surprisePct: 0, drift20d: 0, peadScore: 0 };

      const resultDate = cached?.resultPeriod && cached.resultPeriod !== 'Coming Soon' ? cached.resultPeriod : 'Coming Soon';
      const stage = live?.stage || 'Consolidating';

      return {
        id: `pead-${item.symbol.toLowerCase()}`,
        symbol: item.symbol,
        companyName: cached?.companyName || item.name,
        resultDate,
        actualEps,
        expectedEps,
        surprisePct: calc.surprisePct,
        yoyRevenuePct: cached?.yoyRevenuePct || 0,
        yoyPatPct: cached?.yoyPatPct || 0,
        priceAtResult,
        price20dPost,
        drift20d: calc.drift20d,
        dailyRet: live?.dailyRet || 0,
        currentPe: cached?.currentPe || 0,
        forwardPe: cached?.forwardPe || 0,
        methodology: stage,
        stage,
      } as any;
    });

    return {
      events,
      methodology:
        'Post-Earnings Announcement Drift (PEAD): 20D price drift and 50-day SMA setup stages computed dynamically from live Yahoo Finance daily close series. SUE Surprise % uses rule-based proxy: (Reported EPS − Trailing 4Q Run-Rate Baseline) / Baseline × 100. Reported PAT growth anchored to statutory SEBI LODR Reg 33 filings.',
      dataSource:
        'NSE / BSE Quarterly Corporate Financial Filings (SEBI LODR Reg 33) & Live Yahoo Finance Historical Price Series',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getVahanData(forceRefresh = false) {
    return this.vahanEtlService.getVahanData(forceRefresh);
  }

  async getMarketOverview(forceRefresh = false) {
    return this.marketIndexService.getMarketOverview(forceRefresh);
  }

  async getOverview() {
    const [mood, marketOverview, vahan] = await Promise.all([
      this.getMarketMoodIndex(),
      this.getMarketOverview(),
      this.getVahanData(),
    ]);
    const pead = await this.getPeadSurprises();

    return {
      marketMood: mood,
      marketOverview,
      topPeadSurprises: pead.events.slice(0, 3),
      vahanSummary: vahan.categories,
      vahanTopStates: vahan.topStates,
      timestamp: new Date().toISOString(),
      complianceDisclaimer:
        'DISCLAIMER: All tools, calculations, and data points provided herein are strictly for educational and analytical purposes. FinanciallyFree is an AMFI-registered Mutual Fund Distributor (ARN-350272) and not a SEBI-registered Research Analyst or Portfolio Manager. Past performance is not indicative of future returns.',
    };
  }

  isBuybackAction(subject: string): boolean {
    if (!subject || typeof subject !== 'string') return false;
    const s = subject.toLowerCase();
    return s.includes('buyback') || s.includes('buy-back') || s.includes('buy back') || s.includes('tender offer');
  }

  /** Screener sector HTML is unreliable — ownership is classified by ticker/name */
  private classifyBankOwnership(ticker: string, bankName?: string): 'Private' | 'PSU' {
    const sym = (ticker || '').toUpperCase().replace(/\.(NS|BO)$/i, '').trim();
    const PSU = new Set([
      'SBIN',
      'BANKBARODA',
      'PNB',
      'CANBK',
      'UNIONBANK',
      'INDIANB',
      'MAHABANK',
      'BANKINDIA',
      'CENTRALBK',
      'IOB',
      'UCOBANK',
      'PSB',
      'JKBANK',
    ]);
    if (PSU.has(sym)) return 'PSU';
    const name = (bankName || '').toLowerCase();
    if (
      /state bank|bank of baroda|punjab national|canara|union bank|indian bank|bank of india|uco bank|central bank/.test(
        name,
      )
    ) {
      return 'PSU';
    }
    return 'Private';
  }

  parseBuybackAction(action: any): {
    id: string;
    symbol: string;
    company: string;
    actionSubject: string;
    buybackPrice: number | null;
    currentPrice: number | null;
    premiumPct: number | null;
    method: string;
    exDate: string;
    recordDate: string;
    openingDate: string | null;
    closingDate: string | null;
    promoterParticipation: string;
    status: string;
    dataSource: string;
  } {
    const subject = action.subject || action.actionSubject || '';
    const priceMatch = subject.match(/(?:rs\.?|inr|@)\s*([\d,]+(?:\.\d+)?)/i);
    const buybackPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
    const isTender = subject.toLowerCase().includes('tender') || !subject.toLowerCase().includes('open market');
    const method = isTender ? 'Tender Offer' : 'Open Market';

    return {
      id: `bb_${action.symbol}_${action.recDate || action.recordDate || action.exDate || Date.now()}`,
      symbol: action.symbol,
      company: action.comp || action.company || action.symbol,
      actionSubject: subject,
      buybackPrice,
      currentPrice: null,
      premiumPct: null,
      method,
      recordDate: action.recDate && action.recDate !== '-' ? action.recDate : (action.recordDate || 'Not announced'),
      exDate: action.exDate && action.exDate !== '-' ? action.exDate : 'Not announced',
      openingDate: action.bcStartDate && action.bcStartDate !== '-' ? action.bcStartDate : null,
      closingDate: action.bcEndDate && action.bcEndDate !== '-' ? action.bcEndDate : null,
      promoterParticipation: 'Not disclosed in free summary (check exchange filing PDF)',
      status: 'Announced / Active on NSE',
      dataSource: 'NSE Official Corporate Actions Register (SEBI LODR Reg 42)',
    };
  }

  filterBuybacks(actions: any[]): Array<{
    id: string;
    symbol: string;
    company: string;
    actionSubject: string;
    buybackPrice: number | null;
    currentPrice: number | null;
    premiumPct: number | null;
    method: string;
    exDate: string;
    recordDate: string;
    openingDate: string | null;
    closingDate: string | null;
    promoterParticipation: string;
    status: string;
    dataSource: string;
  }> {
    if (!Array.isArray(actions)) return [];
    return actions
      .filter((a) => this.isBuybackAction(a.subject || a.actionSubject || ''))
      .map((a) => this.parseBuybackAction(a));
  }

  async enrichBuybacksWithQuotes(buybacks: any[]): Promise<any[]> {
    if (!buybacks || buybacks.length === 0) return [];
    return this.mapPool(buybacks.slice(0, 20), 4, async (bb) => {
      let currentPrice = bb.currentPrice;
      if (!currentPrice && bb.symbol) {
        try {
          currentPrice = await this.marketIndexService.fetchStockPrice(bb.symbol);
        } catch {}
      }
      let premiumPct = bb.premiumPct;
      if (currentPrice && bb.buybackPrice) {
        premiumPct = calculateBuybackPremium(currentPrice, bb.buybackPrice);
      }
      return {
        ...bb,
        currentPrice,
        premiumPct: premiumPct !== null && premiumPct !== undefined ? Math.round(premiumPct * 100) / 100 : null,
      };
    });
  }

  private buybacksCache: { timestamp: number; data: any } | null = null;

  async getBuybacks(forceRefresh = false): Promise<{
    source: string;
    sourceUrl: string;
    totalBuybacks: number;
    buybacks: Array<{
      id: string;
      symbol: string;
      company: string;
      actionSubject: string;
      buybackPrice: number | null;
      currentPrice: number | null;
      premiumPct: number | null;
      method: string;
      exDate: string;
      recordDate: string;
      openingDate: string | null;
      closingDate: string | null;
      promoterParticipation: string;
      status: string;
      dataSource: string;
    }>;
    totalActions: number;
    actions: Array<{
      symbol: string;
      company: string;
      actionSubject: string;
      exDate: string;
      recordDate: string;
      faceVal: string;
      series: string;
    }>;
    emptyStateMessage: string;
    lastUpdated: string;
  }> {
    const TTL = 15 * 60 * 1000;
    if (
      !forceRefresh &&
      this.buybacksCache &&
      Date.now() - this.buybacksCache.timestamp < TTL &&
      (this.buybacksCache.data.actions?.length || 0) > 0
    ) {
      return this.buybacksCache.data;
    }

    const buildFromActions = async (rawActions: any[], sourceUrl: string, source: 'LIVE_FETCH' | 'HEALTH_CACHE') => {
      const actions = (rawActions || []).slice(0, 80).map((a: any) => ({
        symbol: a.symbol,
        company: a.company || a.comp,
        actionSubject: a.actionSubject || a.subject,
        exDate: a.exDate || '',
        recordDate: a.recordDate || a.recDate || '',
        faceVal: a.faceVal || '',
        series: a.series || 'EQ',
      }));
      const rawBuybacks = this.filterBuybacks(rawActions);
      const buybacks = await this.enrichBuybacksWithQuotes(rawBuybacks);
      return {
        source,
        sourceUrl,
        totalBuybacks: buybacks.length,
        buybacks,
        totalActions: actions.length,
        actions,
        emptyStateMessage:
          buybacks.length === 0
            ? 'No active buyback tender offers in the current NSE corporate-actions window'
            : 'No active buybacks on NSE',
        lastUpdated: new Date().toISOString(),
      };
    };

    try {
      const raw = await this.fetchNseApi('/api/corporates-corporateActions?index=equities');
      const rawActions = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      if (rawActions.length > 0) {
        const mapped = await buildFromActions(
          rawActions,
          'https://www.nseindia.com/api/corporates-corporateActions?index=equities',
          'LIVE_FETCH',
        );
        this.buybacksCache = { timestamp: Date.now(), data: mapped };
        // Persist for admin health (non-blocking)
        void this.healthRepo
          .findOne({ where: { sourceKey: 'buybacks' } })
          .then(async (record) => {
            if (!record) return;
            record.rawResponseSnippet = JSON.stringify({
              sourceUrl: mapped.sourceUrl,
              allCorporateActions: rawActions.slice(0, 80),
              buybacks: mapped.buybacks,
              retrievedAt: mapped.lastUpdated,
            });
            record.lastFetchedAt = new Date();
            record.status = 'SUCCESS';
            await this.healthRepo.save(record);
          })
          .catch(() => undefined);
        return mapped;
      }
    } catch (err: any) {
      this.logger.warn(`Live buybacks/corporate actions fetch failed: ${err?.message || err}`);
    }

    const record = await this.healthRepo.findOne({ where: { sourceKey: 'buybacks' } });
    if (record?.rawResponseSnippet) {
      try {
        const parsed = JSON.parse(record.rawResponseSnippet);
        const rawActions: any[] = parsed.allCorporateActions || parsed.activeCapitalReorganizations || [];
        if (rawActions.length > 0) {
          const mapped = await buildFromActions(
            rawActions,
            parsed.sourceUrl || 'https://www.nseindia.com/api/corporates-corporateActions?index=equities',
            'HEALTH_CACHE',
          );
          mapped.lastUpdated = record.lastFetchedAt
            ? record.lastFetchedAt.toISOString()
            : mapped.lastUpdated;
          this.buybacksCache = { timestamp: Date.now(), data: mapped };
          return mapped;
        }
      } catch {}
    }

    return {
      source: 'UNAVAILABLE',
      sourceUrl: 'https://www.nseindia.com/api/corporates-corporateActions?index=equities',
      totalBuybacks: 0,
      buybacks: [],
      totalActions: 0,
      actions: [],
      emptyStateMessage: 'Corporate actions feed unavailable from NSE',
      lastUpdated: new Date().toISOString(),
    };
  }

  private async fetchNseApi(endpoint: string, referer = 'https://www.nseindia.com/'): Promise<any> {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0';

    const cookies = await this.ensureNseSession();

    const res = await fetch(`https://www.nseindia.com${endpoint}`, {
      headers: {
        'User-Agent': userAgent,
        Referer: referer,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: cookies,
      },
      signal: AbortSignal.timeout(15000),
    });

    // Refresh session on auth failures
    if (res.status === 401 || res.status === 403) {
      this.nseSessionCache = null;
      const retryCookies = await this.ensureNseSession();
      const retry = await fetch(`https://www.nseindia.com${endpoint}`, {
        headers: {
          'User-Agent': userAgent,
          Referer: referer,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: retryCookies,
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!retry.ok) {
        throw new Error(`NSE API ${endpoint} returned HTTP ${retry.status}`);
      }
      return retry.json();
    }

    if (!res.ok) {
      throw new Error(`NSE API ${endpoint} returned HTTP ${res.status}`);
    }

    return res.json();
  }

  async fetchLiveNseResultsCalendar(): Promise<{
    upcomingMeetings: any[];
    recentResults: any[];
    totalEventsListed: number;
    totalResultsDisclosed: number;
    sourceUrl: string;
    retrievedAt: string;
  }> {
    let calendarItems: any[] = [];
    let resultsItems: any[] = [];

    try {
      const [cal, res] = await Promise.all([
        this.fetchNseApi('/api/event-calendar'),
        this.fetchNseApi('/api/corporates-financial-results?index=equities&period=Quarterly'),
      ]);
      calendarItems = Array.isArray(cal) ? cal : [];
      resultsItems = Array.isArray(res) ? res : [];
    } catch (err: any) {
      this.logger.warn(`Live NSE results calendar fetch failed: ${err.message}`);
    }

    const upcomingMeetings = calendarItems.slice(0, 50).map((m: any) => ({
      symbol: m.symbol,
      company: m.company,
      meetingDate: m.date,
      purpose: m.purpose,
      details: m.bm_desc,
    }));

    // List path: NSE metadata only (no per-row Screener scrape — was 50 parallel HTML fetches)
    const rawFilings = (resultsItems || []).slice(0, 40).map((r: any) => {
      const sym = r.symbol || '';
      const hasXbrl = !!(r.xbrl && r.xbrl !== '-' && !r.xbrl.endsWith('/-'));
      return {
        symbol: sym,
        company: r.companyName || r.company || sym,
        quarter: r.relatingTo || r.period || 'Quarterly',
        financialYear: r.financialYear || 'Latest',
        filingDate: r.filingDate || r.broadCastDate || 'Statutory Filing',
        audited: r.audited || 'Un-Audited',
        consolidated: r.consolidated || 'Consolidated',
        revenue: null,
        pat: null,
        eps: null,
        xbrlUrl: hasXbrl ? r.xbrl : null,
        hasXbrl,
      };
    });

    const seen = new Set<string>();
    const recentResults: any[] = [];
    for (const item of rawFilings) {
      const key = `${item.symbol}-${item.quarter}`;
      if (!seen.has(key)) {
        seen.add(key);
        recentResults.push(item);
      }
    }

    const payload = {
      calendarName: 'NSE Official Public Corporate Results & Board Meetings Calendar',
      sourceUrl: 'https://www.nseindia.com/api/event-calendar',
      totalEventsListed: calendarItems.length || upcomingMeetings.length,
      upcomingMeetings,
      totalResultsDisclosed: resultsItems.length || recentResults.length,
      recentResults,
      granularityNotice:
        'NSE statutory corporate financial results disclosures (SEBI LODR Reg 33). Structured Revenue, PAT, and EPS figures are extracted where disclosed; official exchange XBRL XML links provide primary audited statutory documents.',
      retrievedAt: new Date().toISOString(),
    };

    // Health metadata — only persist SUCCESS when live arrays are non-empty
    void this.healthRepo
      .findOne({ where: { sourceKey: 'results_calendar' } })
      .then(async (record) => {
        if (!record) return;
        const hasData = payload.upcomingMeetings.length > 0 || payload.recentResults.length > 0;
        if (!hasData) {
          // Do not overwrite a good prior snippet with empties
          if (record.status === 'SUCCESS' && record.rawResponseSnippet) return;
          record.status = 'FAILURE';
          record.lastFetchedAt = new Date();
          await this.healthRepo.save(record);
          return;
        }
        record.rawResponseSnippet = JSON.stringify({
          sourceUrl: payload.sourceUrl,
          totalEventsListed: payload.upcomingMeetings.length,
          totalResultsDisclosed: payload.recentResults.length,
          upcomingMeetings: payload.upcomingMeetings,
          recentResults: payload.recentResults,
          retrievedAt: payload.retrievedAt,
        });
        record.lastFetchedAt = new Date();
        record.status = 'SUCCESS';
        await this.healthRepo.save(record);
      })
      .catch((e: any) => this.logger.warn(`Failed saving results_calendar health entity: ${e.message}`));

    return payload;
  }

  private resultsCalendarCache: { timestamp: number; data: any } | null = null;

  async getResultsCalendar(forceRefresh = false): Promise<{
    source: string;
    sourceUrl: string;
    totalEvents: number;
    meetings: Array<{
      symbol: string;
      company: string;
      meetingDate: string;
      purpose: string;
      details: string;
    }>;
    totalRecentResults: number;
    recentResults: Array<{
      symbol: string;
      company: string;
      quarter: string;
      financialYear: string;
      filingDate: string;
      audited: string;
      consolidated: string;
      revenue: string | null;
      pat: string | null;
      eps: string | null;
      xbrlUrl: string | null;
      hasXbrl: boolean;
    }>;
    lastUpdated: string;
  }> {
    const TTL = 15 * 60 * 1000;
    if (
      !forceRefresh &&
      this.resultsCalendarCache &&
      Date.now() - this.resultsCalendarCache.timestamp < TTL &&
      ((this.resultsCalendarCache.data.meetings?.length || 0) > 0 ||
        (this.resultsCalendarCache.data.recentResults?.length || 0) > 0)
    ) {
      return this.resultsCalendarCache.data;
    }

    try {
      const live = await this.fetchLiveNseResultsCalendar();
      const mapped = {
        source: 'LIVE_FETCH' as const,
        sourceUrl: live.sourceUrl || 'https://www.nseindia.com/api/event-calendar',
        totalEvents: live.upcomingMeetings.length || live.totalEventsListed || 0,
        meetings: live.upcomingMeetings || [],
        totalRecentResults: live.recentResults.length || live.totalResultsDisclosed || 0,
        recentResults: live.recentResults || [],
        lastUpdated: new Date().toISOString(),
      };
      if (mapped.meetings.length > 0 || mapped.recentResults.length > 0) {
        this.resultsCalendarCache = { timestamp: Date.now(), data: mapped };
        return mapped;
      }
    } catch (err: any) {
      this.logger.warn(`Live results calendar refresh failed: ${err.message}`);
    }

    // Health fallback only if snippet still contains actual meeting/result arrays
    const record = await this.healthRepo.findOne({ where: { sourceKey: 'results_calendar' } });
    if (record?.rawResponseSnippet) {
      try {
        const parsed = JSON.parse(record.rawResponseSnippet);
        const meetings = parsed.upcomingMeetings || parsed.meetings || [];
        const recentResults = parsed.recentResults || [];
        if (meetings.length > 0 || recentResults.length > 0) {
          const mapped = {
            source: 'HEALTH_CACHE' as const,
            sourceUrl: parsed.sourceUrl || 'https://www.nseindia.com/api/event-calendar',
            totalEvents: meetings.length || parsed.totalEventsListed || 0,
            meetings,
            totalRecentResults: recentResults.length || parsed.totalResultsDisclosed || 0,
            recentResults,
            lastUpdated: record.lastFetchedAt
              ? record.lastFetchedAt.toISOString()
              : new Date().toISOString(),
          };
          this.resultsCalendarCache = { timestamp: Date.now(), data: mapped };
          return mapped;
        }
      } catch {}
    }

    return {
      source: 'UNAVAILABLE',
      sourceUrl: 'https://www.nseindia.com/api/event-calendar',
      totalEvents: 0,
      meetings: [],
      totalRecentResults: 0,
      recentResults: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  truncateExcerpt(text: string | null | undefined, maxWords = 28): string {
    return truncatePermittedExcerpt(text, maxWords);
  }

  filterNewsHeadlines<T extends { title?: string; description?: string; source?: string }>(
    headlines: T[],
    query: string,
    sourceFilter?: string,
  ): T[] {
    const q = (query || '').trim().toLowerCase();
    const sf = (sourceFilter || '').trim().toLowerCase();
    return headlines.filter((h) => {
      const matchesSource =
        !sf || sf === 'all' || (h.source && h.source.toLowerCase().includes(sf));
      if (!matchesSource) return false;
      if (!q) return true;
      return (
        (h.title && h.title.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q))
      );
    });
  }

  async fetchLiveNseAnnouncements(): Promise<Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: 'NSE Filing';
    company?: string;
    symbol?: string;
    isOrderWin?: boolean;
  }>> {
    try {
      const data = await this.fetchNseApi('/api/corporate-announcements?index=equities');
      if (!Array.isArray(data)) return [];
      return data.slice(0, 40).map((item: any) => {
        const smName = item.sm_name || item.symbol || 'Company';
        const desc = item.desc || item.attchmntText || 'Corporate Filing';
        const title = `${smName}${item.symbol ? ` (${item.symbol})` : ''}: ${desc}`;
        const link =
          item.attchmntFile ||
          'https://www.nseindia.com/companies-listing/corporate-filings-announcements';

        let pubDate = new Date().toISOString();
        if (item.sort_date) {
          const parsed = new Date(item.sort_date.replace(' ', 'T') + '+05:30');
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString();
        } else if (item.an_dt) {
          const parsed = new Date(item.an_dt);
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString();
        }

        const fullText = (item.attchmntText || item.desc || '').trim();
        const isOrderWin = this.detectOrderWin(`${desc} ${fullText}`);
        const orderValue = isOrderWin ? this.extractOrderValue(`${desc} ${fullText}`) : undefined;
        const category = this.classifyAnnouncementCategory(title, fullText);

        return {
          title,
          link,
          pubDate,
          description: fullText.length > 320 ? `${fullText.slice(0, 317)}...` : fullText,
          source: 'NSE Filing' as const,
          company: smName,
          symbol: item.symbol,
          isOrderWin,
          orderValue,
          category,
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed to fetch NSE corporate announcements: ${err.message}`);
      return [];
    }
  }

  detectOrderWin(text: string, subcat = ''): boolean {
    const raw = `${text || ''} ${subcat || ''}`;
    // Exclude common false positives (office shifts, court/ROC orders, volume spurts)
    if (
      /registered\s+office|shifting\s+of\s+(?:the\s+)?registered|order\s+of\s+approving|order[\s-]?in[\s-]?appeal|appellate|registrar\s+of\s+companies|court\s+order|nclt|tribunal\s+order|winding[\s-]?up|scheme\s+of\s+arrangement|spurt\s+in\s+volume|in\s+the\s+order\s+of|order\s+of\s+preference|postal\s+ballot|scrutinizer/i.test(
        raw,
      )
    ) {
      return false;
    }
    if (/order\s*(\/|&)\s*receipt|award\s*of\s*order|receipt\s*of\s*order/i.test(subcat)) return true;
    const clean = (text || '').replace(/\bin order to\b/gi, '');
    return (
      /(?:receipt of|award of|awarded|bagged|secures?|wins?|receives?|won|signed)\s+(?:an?\s+)?(?:(?:mega|big|new|major|commercial|purchase|work|epc)\s+)?(?:order|contract|tender|project|mandate|deal)/i.test(clean) ||
      /(?:order|contract|tender|work order|purchase order|loa|letter of award)\s+(?:of|for|worth|valued at?|from)/i.test(clean) ||
      /(?:order book|new order|mega order|big order|major contract|commercial contract)/i.test(clean) ||
      /(?:emerged as|declared as)\s+(?:the\s+)?(?:l-?1|successful)\s+(?:bidder|contractor)/i.test(clean) ||
      /(?:bags?|won)\s+[\w\s]{0,20}(?:order|contract|tender|mandate)/i.test(clean) ||
      /award of order|receipt of order/i.test(clean)
    );
  }

  /** Collapse PDF/OCR spacing so "Rs.   69   Crores" matches cleanly. */
  normalizeFilingText(text: string): string {
    return String(text || '')
      .replace(/[\u00A0\u202F\u2007]/g, ' ')
      .replace(/[‐‑‒–—―]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract disclosed contract size from headline / annexure text.
   * Prefers LODR "broad commercial consideration / size of the order" blocks
   * (amounts often appear only in the attached PDF, not the BSE headline).
   */
  extractOrderValue(text: string): string | undefined {
    if (!text) return undefined;
    const compact = this.normalizeFilingText(text);

    // Do not use [^.]* here — decimals like "29.34 Crore" would truncate at the point.
    const consideration =
      compact.match(
        /(?:broad\s+commercial\s+consideration|broad\s+consideration\s+or\s+size|size\s+of\s+the\s+order(?:\s*\(\s*s\s*\))??(?:\s*\/\s*contract(?:\s*\(\s*s\s*\))?)?)\s*[:.\-]?\s*(.{0,180}?)(?=\s+Whether\b|\s+promoter\b|\s+Excluding\b|\s+Only\b|$)/i,
      )?.[1] || '';

    const searchBlobs = [consideration, compact].filter((b) => b && b.length > 0);

    const tryInr = (blob: string): string | undefined => {
      const patterns: RegExp[] = [
        /(?:~|approx(?:imate(?:ly)?)?|about|around)?\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(crores?|cr\.?|lakhs?|lacs?)\b/i,
        /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:\/\s*-)?/i,
        /([\d,]+(?:\.\d+)?)\s*(crores?|cr\.?)\b/i,
      ];
      for (const re of patterns) {
        const m = blob.match(re);
        if (!m) continue;
        const val = m[1];
        const unit = (m[2] || '').toLowerCase();
        const raw = parseFloat(val.replace(/,/g, ''));
        if (!Number.isFinite(raw) || raw <= 0) continue;
        // Skip tiny bare INR figures that are clearly not contract sizes (e.g. page numbers)
        if (!unit && !/cr|lakh|lac/i.test(m[0]) && raw < 1) continue;
        if (/lakh|lac/.test(unit) || /lakh|lac/i.test(m[0])) return `₹${val} Lakh`;
        if (/cr/.test(unit) || /cr/i.test(m[0])) return `₹${val} Cr`;
        // Bare Rs/INR near consideration / size wording → treat as ₹ Cr (LODR annexure convention)
        if (/rs\.?|inr|₹/i.test(m[0]) && raw >= 1) return `₹${val} Cr`;
      }
      return undefined;
    };

    for (const blob of searchBlobs) {
      const hit = tryInr(blob);
      if (hit) return hit;
    }

    const usdMatch = compact.match(/(?:\$|usd)\s*([\d,]+(?:\.\d+)?)\s*(m(?:illion)?|b(?:illion)?)?/i);
    if (usdMatch) {
      const raw = parseFloat(usdMatch[1].replace(/,/g, ''));
      // Absolute USD amounts (e.g. 23663860) → convert to ₹ Cr when no million/billion suffix
      if (!usdMatch[2] && raw >= 100000) {
        const cr = Math.round(((raw * 83) / 1e7) * 100) / 100;
        return `₹${cr} Cr`;
      }
      return `$${usdMatch[1]}${usdMatch[2] ? usdMatch[2][0].toUpperCase() : 'M'}`;
    }
    return undefined;
  }

  /** Parse announcement order-value strings into ₹ Cr (0 if undisclosed / unparseable). */
  parseOrderValueCr(orderValue?: string | null): number {
    if (!orderValue) return 0;
    const normalized = this.normalizeFilingText(orderValue);
    const numMatch = normalized.match(/([\d,]+(?:\.\d+)?)/);
    if (!numMatch) return 0;
    let n = parseFloat(numMatch[1].replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (/lakh|lac/i.test(normalized)) n = n / 100;
    else if (/\$|usd/i.test(normalized)) {
      // Rough USD → INR Cr (≈ ₹83/$); million vs billion
      if (/\bb(?:illion)?\b/i.test(normalized)) n = (n * 1000 * 83) / 10;
      else if (/\bm(?:illion)?\b/i.test(normalized) || /\$[\d,.]+\s*M\b/i.test(normalized)) n = (n * 83) / 10;
      else if (n >= 100000) n = (n * 83) / 1e7;
      else n = (n * 83) / 10;
    }
    return Math.round(n * 100) / 100;
  }

  /** Resolve BSE AttachLive/AttachHis PDF URLs (live folder rotates to history). */
  resolveAnnouncementPdfUrls(link?: string | null): string[] {
    if (!link) return [];
    const urls = [link];
    if (/\/AttachLive\//i.test(link)) {
      urls.push(link.replace(/\/AttachLive\//i, '/AttachHis/'));
    } else if (/\/AttachHis\//i.test(link)) {
      urls.push(link.replace(/\/AttachHis\//i, '/AttachLive/'));
    }
    return [...new Set(urls)];
  }

  private async extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
    // Prefer poppler when present (Render/local Linux); silent fallback to pdf.js
    try {
      const { spawnSync } = await import('child_process');
      const { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } = await import('fs');
      const { join } = await import('path');
      const { tmpdir } = await import('os');
      const dir = mkdtempSync(join(tmpdir(), 'ff-ord-pdf-'));
      const pdfPath = join(dir, 'filing.pdf');
      writeFileSync(pdfPath, buffer);
      const result = spawnSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-'], {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 20000,
      });
      try {
        unlinkSync(pdfPath);
        rmdirSync(dir);
      } catch {
        /* ignore cleanup */
      }
      if (result.status === 0 && result.stdout && String(result.stdout).trim().length > 40) {
        return String(result.stdout);
      }
    } catch {
      /* fall through to pdf.js */
    }

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;
    const parts: string[] = [];
    const maxPages = Math.min(doc.numPages, 8);
    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      const page = await doc.getPage(pageNo);
      const content = await page.getTextContent();
      parts.push(
        content.items
          .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
          .join(' '),
      );
    }
    return parts.join('\n');
  }

  async fetchAnnouncementPdfText(link?: string | null): Promise<string> {
    const urls = this.resolveAnnouncementPdfUrls(link);
    if (!urls.length) return '';
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
      Referer: 'https://www.bseindia.com/',
      Accept: 'application/pdf,*/*',
    };
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 200) continue;
        const text = await this.extractTextFromPdfBuffer(buf);
        if (text && text.trim().length > 40) return text;
      } catch (err: any) {
        this.logger.debug?.(`PDF extract failed for ${url}: ${err?.message || err}`);
      }
    }
    return '';
  }

  extractCounterpartyFromFiling(text: string): string | undefined {
    const compact = this.normalizeFilingText(text);
    const patterns = [
      /(?:name\s+of\s+the\s+(?:entity|organisation|organization)\s+awarding[^A-Z]{0,40})([A-Z][A-Za-z0-9 &./-]{2,70}?)(?=\s+(?:Significant|2\.|Whether|Nature|Time\s+period)\b|$)/i,
      /(?:awarded|issued|placed)\s+by\s+(?:m\/s\.?\s*)?([A-Z][A-Za-z0-9 &./-]{2,70}?)(?=\s*\.|\s+The\s+details|\s+Further|\s+Significant|$)/i,
      /(?:letter of intent|loa|order|contract)\s+by\s+(?:m\/s\.?\s*)?([A-Z][A-Za-z0-9 &./-]{2,70}?)(?=\s*\.|\s+The\s+details|\s+Further|$)/i,
      /\bfrom\s+(?:m\/s\.?\s*)?([A-Z][A-Za-z0-9 &.,-]{2,60}?)(?:\s+for|\s+worth|\s+valued|\s*\(|$)/,
    ];
    for (const re of patterns) {
      const m = compact.match(re);
      let name = m?.[1]?.replace(/\s+/g, ' ').trim();
      if (!name) continue;
      name = name.replace(/\s+The details.*$/i, '').replace(/[.,;]+$/g, '').trim();
      if (
        name.length >= 3 &&
        name.length <= 80 &&
        !/domestic|international|entity|particulars|details of order|enclosed/i.test(name)
      ) {
        return name;
      }
    }
    return undefined;
  }

  /** When headline omits ₹ Cr, pull amount (+ counterparty) from attached LODR PDF. */
  async enrichOrderAnnouncementsFromPdfs<
    T extends {
      isOrderWin?: boolean;
      orderValue?: string;
      link?: string;
      title?: string;
      description?: string;
      customer?: string;
    },
  >(announcements: T[]): Promise<T[]> {
    const needEnrich = announcements.filter(
      (a) =>
        a.isOrderWin &&
        this.parseOrderValueCr(a.orderValue) <= 0 &&
        !!a.link &&
        /\.pdf($|\?)/i.test(a.link),
    );
    if (!needEnrich.length) return announcements;

    const concurrency = 4;
    for (let i = 0; i < needEnrich.length; i += concurrency) {
      const batch = needEnrich.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (ann) => {
          const pdfText = await this.fetchAnnouncementPdfText(ann.link);
          if (!pdfText) return;
          const combined = `${ann.title || ''} ${ann.description || ''} ${pdfText}`;
          const value = this.extractOrderValue(combined);
          if (value && this.parseOrderValueCr(value) > 0) {
            ann.orderValue = value;
          }
          const customer = this.extractCounterpartyFromFiling(pdfText);
          if (customer) {
            (ann as any).customer = customer;
          }
          // Keep a short annexure hint on description for UI when headline had no amount
          if (!ann.description || ann.description.length < 40) {
            const snippet = this.normalizeFilingText(pdfText).slice(0, 280);
            if (snippet) ann.description = snippet;
          }
        }),
      );
    }
    return announcements;
  }

  classifyAnnouncementCategory(title: string, desc: string, subcat = ''): string {
    const text = `${title} ${desc} ${subcat}`;
    if (this.detectOrderWin(text, subcat)) return 'Orders';
    const clean = text.replace(/\bin order to\b/gi, '');
    if (/financial result|quarterly result|unaudited financial|audited financial|q[1-4]\b|pat up|profit after tax|net profit|ebitda margin|quarter ended|q\d\s*(?:fy\d{2}|results)/i.test(clean)) {
      return 'Results';
    }
    if (/dividend|bonus|split|sub-division|record date|book closure|buyback|rights issue|face value|amalgamation|merger|demerger/i.test(clean)) {
      return 'Corporate Actions';
    }
    if (/fund raising|qip|preferential (?:issue|allotment)|rights issue|ncd|debenture|commercial paper|qualified institutional placement|warrants|issue of securities/i.test(clean)) {
      return 'Fundraising';
    }
    if (/board meeting|appointment|resignation|cessation|re-appointment|auditor|director|agm|egm|annual general meeting|postal ballot|scrutinizer|management/i.test(clean)) {
      return 'Board';
    }
    return 'General';
  }

  async fetchLiveBseAnnouncements(): Promise<Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: 'BSE Filing';
    company?: string;
    symbol?: string;
    isOrderWin?: boolean;
    orderValue?: string;
    category?: string;
  }>> {
    try {
      // BSE AnnSubCategoryGetData only returns rows when strPrevDate === strToDate (single day).
      // Walk recent calendar days and merge.
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
        Referer: 'https://www.bseindia.com/',
        Origin: 'https://www.bseindia.com',
        Accept: 'application/json, text/plain, */*',
      };
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyymmdd = (d: Date) =>
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

      const dayCount = 14;
      const pageCount = 2;
      const fetchJobs: Array<Promise<any[]>> = [];

      for (let dayOffset = 0; dayOffset < dayCount; dayOffset++) {
        const day = new Date();
        day.setDate(day.getDate() - dayOffset);
        const d = yyyymmdd(day);
        for (let page = 1; page <= pageCount; page++) {
          const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=${page}&strCat=-1&strPrevDate=${d}&strScrip=&strSearch=P&strToDate=${d}&strType=C`;
          fetchJobs.push(
            fetch(url, { headers, signal: AbortSignal.timeout(10000) })
              .then(async (res) => {
                if (!res.ok) return [];
                const json = (await res.json()) as any;
                return Array.isArray(json?.Table) ? json.Table : [];
              })
              .catch(() => []),
          );
        }
      }

      const settled = await Promise.all(fetchJobs);
      const seen = new Set<string>();
      const list: any[] = [];
      for (const batch of settled) {
        for (const item of batch) {
          const key = `${item.SCRIP_CD || ''}|${item.NEWSID || item.ATTACHMENTNAME || item.DT_TM || ''}|${item.HEADLINE || item.SUBCATNAME || ''}`;
          if (seen.has(key)) continue;
          seen.add(key);
          list.push(item);
        }
      }
      if (list.length === 0) return [];

      // Prefer order-win subcategory rows first so Order Tracker sees them even if we slice
      list.sort((a, b) => {
        const as = /award of order|receipt of order/i.test(String(a.SUBCATNAME || '')) ? 1 : 0;
        const bs = /award of order|receipt of order/i.test(String(b.SUBCATNAME || '')) ? 1 : 0;
        return bs - as;
      });

      return list.slice(0, 250).map((item: any) => {
        const company = item.SLONGNAME || item.NEWSSUB || `BSE:${item.SCRIP_CD}`;
        const headline =
          item.HEADLINE || item.SUBCATNAME || item.CATEGORYNAME || 'Corporate Announcement';
        const title = `${company}: ${headline}`;
        const link = item.ATTACHMENTNAME
          ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${item.ATTACHMENTNAME}`
          : item.NSURL || 'https://www.bseindia.com/corporates/ann.html';

        let pubDate = new Date().toISOString();
        if (item.DT_TM) {
          const parsed = new Date(item.DT_TM);
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString();
        } else if (item.News_submission_dt) {
          const parsed = new Date(item.News_submission_dt);
          if (!isNaN(parsed.getTime())) pubDate = parsed.toISOString();
        }

        const fullText = (item.HEADLINE || item.NEWSSUB || item.SUBCATNAME || '').trim();
        const isOrderWin = this.detectOrderWin(`${headline} ${fullText}`, item.SUBCATNAME);
        const orderValue = isOrderWin ? this.extractOrderValue(`${headline} ${fullText}`) : undefined;
        const category = this.classifyAnnouncementCategory(title, fullText, item.SUBCATNAME);

        return {
          title,
          link,
          pubDate,
          description: fullText.length > 320 ? `${fullText.slice(0, 317)}...` : fullText,
          source: 'BSE Filing' as const,
          company,
          symbol: item.SCRIP_CD ? String(item.SCRIP_CD) : undefined,
          isOrderWin,
          orderValue,
          category,
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed to fetch BSE corporate announcements: ${err.message}`);
      return [];
    }
  }

  async fetchLiveEtMarketsNews(): Promise<{
    feedSourceUrl: string;
    totalHeadlines: number;
    headlines: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      source: 'Market News';
      isOrderWin?: boolean;
      orderValue?: string;
      category?: string;
    }>;
    retrievedAt: string;
  }> {
    const feedSourceUrl = 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms';
    const resp = await fetch(feedSourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch live news feed: HTTP ${resp.status}`);
    }

    const xml = await resp.text();
    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      source: 'Market News';
      isOrderWin?: boolean;
      orderValue?: string;
      category?: string;
    }> = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 50)) {
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);

      if (titleMatch && titleMatch[1]) {
        const cleanTitle = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const cleanLink = (linkMatch ? linkMatch[1] : '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const cleanPubDate = (pubDateMatch ? pubDateMatch[1] : '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const rawDesc = descMatch ? descMatch[1] : '';
        const cleanDesc = this.truncateExcerpt(rawDesc, 28);
        const isOrderWin = this.detectOrderWin(`${cleanTitle} ${cleanDesc}`);
        const orderValue = isOrderWin ? this.extractOrderValue(`${cleanTitle} ${cleanDesc}`) : undefined;
        const category = this.classifyAnnouncementCategory(cleanTitle, cleanDesc);

        items.push({
          title: cleanTitle,
          link: cleanLink,
          pubDate: cleanPubDate || new Date().toISOString(),
          description: cleanDesc,
          source: 'Market News' as const,
          isOrderWin,
          orderValue,
          category,
        });
      }
    }

    return {
      feedSourceUrl,
      totalHeadlines: items.length,
      headlines: items,
      retrievedAt: new Date().toISOString(),
    };
  }

  async getNewsFeed(forceRefresh = false): Promise<{
    source: string;
    feedSourceUrl: string;
    totalHeadlines: number;
    headlines: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      source: 'NSE Filing' | 'BSE Filing' | 'Market News';
      company?: string;
      symbol?: string;
      isOrderWin?: boolean;
      orderValue?: string;
      category?: string;
    }>;
    lastUpdated: string;
  }> {
    const record = await this.healthRepo.findOne({ where: { sourceKey: 'news' } });
    const isStale =
      !record ||
      !record.lastFetchedAt ||
      Date.now() - new Date(record.lastFetchedAt).getTime() > 15 * 60 * 1000;

    if (forceRefresh || isStale) {
      try {
        const [nseResult, bseResult, etResult] = await Promise.allSettled([
          this.fetchLiveNseAnnouncements(),
          this.fetchLiveBseAnnouncements(),
          this.fetchLiveEtMarketsNews(),
        ]);

        const nseItems = nseResult.status === 'fulfilled' ? nseResult.value : [];
        const bseItems = bseResult.status === 'fulfilled' ? bseResult.value : [];
        const etItems = etResult.status === 'fulfilled' ? etResult.value.headlines : [];

        // Merge all official filings and market news
        const merged = [...nseItems, ...bseItems, ...etItems];

        // Sort descending by publication timestamp
        merged.sort((a, b) => {
          const tA = new Date(a.pubDate).getTime();
          const tB = new Date(b.pubDate).getTime();
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        });

        if (merged.length > 0) {
          const rawSnippet = JSON.stringify(
            {
              deskName: 'Official Exchange Announcements (NSE/BSE) & Market Commentary',
              primarySource: 'NSE & BSE Direct Corporate Disclosures',
              totalArticlesParsed: merged.length,
              sourcesBreakdown: {
                nseFilings: nseItems.length,
                bseFilings: bseItems.length,
                marketNews: etItems.length,
              },
              feedEndpoints: {
                nse: 'https://www.nseindia.com/api/corporate-announcements?index=equities',
                bse: 'https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w',
                marketNews: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
              },
              latestHeadlines: merged,
              retrievedAt: new Date().toISOString(),
            },
            null,
            2,
          );

          if (record) {
            record.status = 'SUCCESS';
            record.lastFetchedAt = new Date();
            record.rawResponseSnippet = rawSnippet;
            await this.healthRepo.save(record);
          }

          return {
            source: 'LIVE_FETCH',
            feedSourceUrl: 'https://www.nseindia.com/api/corporate-announcements?index=equities',
            totalHeadlines: merged.length,
            headlines: merged,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Live news feed refresh failed, falling back to cache: ${err.message}`);
      }
    }

    if (record?.rawResponseSnippet) {
      try {
        const parsed = JSON.parse(record.rawResponseSnippet);
        const headlines = (parsed.latestHeadlines || []).map((h: any) => {
          let source: 'NSE Filing' | 'BSE Filing' | 'Market News' = h.source || 'NSE Filing';
          if (!h.source) {
            if (h.link && h.link.includes('bseindia')) source = 'BSE Filing';
            else if (h.link && h.link.includes('economictimes')) source = 'Market News';
          }
          const isOrderWin = Boolean(h.isOrderWin || this.detectOrderWin(`${h.title} ${h.description}`));
          const orderValue = h.orderValue || (isOrderWin ? this.extractOrderValue(`${h.title} ${h.description}`) : undefined);
          const category = h.category || this.classifyAnnouncementCategory(h.title, h.description);

          return {
            title: h.title,
            link: h.link,
            pubDate: h.pubDate,
            description:
              source === 'Market News' ? this.truncateExcerpt(h.description, 28) : h.description,
            source,
            company: h.company,
            symbol: h.symbol,
            isOrderWin,
            orderValue,
            category,
          };
        });
        return {
          source: 'LIVE_FETCH',
          feedSourceUrl:
            parsed.feedSourceUrl ||
            'https://www.nseindia.com/api/corporate-announcements?index=equities',
          totalHeadlines: parsed.totalArticlesParsed || parsed.itemsCount || headlines.length,
          headlines,
          lastUpdated: record.lastFetchedAt
            ? record.lastFetchedAt.toISOString()
            : new Date().toISOString(),
        };
      } catch {}
    }
    return {
      source: 'LIVE_FETCH',
      feedSourceUrl: 'https://www.nseindia.com/api/corporate-announcements?index=equities',
      totalHeadlines: 0,
      headlines: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  formatShareholdingPercentage(val: any): string {
    if (val === undefined || val === null || val === '') return '';
    const num = parseFloat(String(val).replace(/%/g, '').trim());
    if (isNaN(num)) return '';
    return `${num}%`;
  }

  async fetchLiveNseShareholding(): Promise<{
    broadcasts: any[];
    totalCompaniesReported: number;
    sourceUrl: string;
    retrievedAt: string;
  }> {
    let shareholdingFilings: any[] = [];
    try {
      shareholdingFilings = await this.fetchNseApi('/api/corporate-share-holdings-master?index=equities');
    } catch (err: any) {
      this.logger.warn(`Live NSE shareholding fetch failed: ${err.message}`);
    }

    const broadcasts = (Array.isArray(shareholdingFilings) ? shareholdingFilings : []).slice(0, 50).map((s: any) => {
      const dematNotes = s.promoterDematNotes || '';
      const patternNotes = s.shareholdingPatternNotes || '';
      const combinedNotes = `${dematNotes} ${patternNotes}`.trim();
      const hasPledgeMention = /pledg|encumb/i.test(combinedNotes);

      return {
        symbol: s.symbol || s.isin,
        company: s.name,
        isin: s.isin,
        quarterEnded: s.date || 'Latest Qtr',
        promoterHolding: this.formatShareholdingPercentage(s.pr_and_prgrp),
        publicHolding: this.formatShareholdingPercentage(s.public_val),
        employeeTrusts: this.formatShareholdingPercentage(s.employeeTrusts || '0%'),
        dematNotes: dematNotes || null,
        hasPledgeMention,
        xbrlUrl: s.xbrl || null,
        broadcastTimestamp: s.broadcastDate || 'Statutory Filing',
      };
    });

    return {
      broadcasts,
      totalCompaniesReported: shareholdingFilings.length || broadcasts.length,
      sourceUrl: 'https://www.nseindia.com/api/corporate-share-holdings-master?index=equities',
      retrievedAt: new Date().toISOString(),
    };
  }

  async getShareholding(forceRefresh = false): Promise<{
    source: string;
    sourceUrl: string;
    totalCompaniesReported: number;
    previewCount: number;
    granularityNotice: string;
    categoriesAvailable: {
      promoter: boolean;
      public: boolean;
      employeeTrusts: boolean;
      fii: boolean;
      dii: boolean;
      mutualFunds: boolean;
      pledgeNumeric: boolean;
      pledgeDisclosuresInNotes: boolean;
    };
    broadcasts: Array<{
      symbol?: string;
      company: string;
      isin: string;
      quarterEnded: string;
      promoterHolding: string;
      publicHolding: string;
      employeeTrusts?: string;
      dematNotes?: string | null;
      hasPledgeMention?: boolean;
      xbrlUrl?: string | null;
      broadcastTimestamp: string;
    }>;
    lastUpdated: string;
  }> {
    const record = await this.healthRepo.findOne({ where: { sourceKey: 'shareholding' } });
    const isStale =
      !record ||
      !record.lastFetchedAt ||
      Date.now() - new Date(record.lastFetchedAt).getTime() > 60 * 60 * 1000;

    if (forceRefresh || isStale) {
      try {
        const live = await this.fetchLiveNseShareholding();
        if (live.broadcasts.length > 0) {
          const rawSnippet = JSON.stringify(
            {
              disclosureName: 'NSE Official SEBI (LODR) Reg 31 Shareholding Patterns Feed',
              sourceUrl: live.sourceUrl,
              totalCompaniesReported: live.totalCompaniesReported,
              previewCount: live.broadcasts.length,
              granularityNotice:
                'NSE SEBI Reg 31 public master broadcast provides statutory Promoter, Public, and Employee Trusts equity aggregates. Granular FII/DII/Mutual Funds sub-breakdowns and quantitative Pledge % are contained inside statutory XBRL XML documents and require XBRL ingestion or licensed exchange vendor feeds per PRD Section 21.',
              categoriesAvailable: {
                promoter: true,
                public: true,
                employeeTrusts: true,
                fii: false,
                dii: false,
                mutualFunds: false,
                pledgeNumeric: false,
                pledgeDisclosuresInNotes: true,
              },
              recentBroadcasts: live.broadcasts,
              retrievedAt: live.retrievedAt,
            },
            null,
            2,
          );

          if (record) {
            record.status = 'SUCCESS';
            record.lastFetchedAt = new Date();
            record.rawResponseSnippet = rawSnippet;
            await this.healthRepo.save(record);
          }

          return {
            source: 'LIVE_FETCH',
            sourceUrl: live.sourceUrl,
            totalCompaniesReported: live.totalCompaniesReported,
            previewCount: live.broadcasts.length,
            granularityNotice:
              'NSE SEBI Reg 31 public master broadcast provides statutory Promoter, Public, and Employee Trusts equity aggregates. Granular FII/DII/Mutual Funds sub-breakdowns and quantitative Pledge % are contained inside statutory XBRL XML documents and require XBRL ingestion or licensed exchange vendor feeds per PRD Section 21.',
            categoriesAvailable: {
              promoter: true,
              public: true,
              employeeTrusts: true,
              fii: false,
              dii: false,
              mutualFunds: false,
              pledgeNumeric: false,
              pledgeDisclosuresInNotes: true,
            },
            broadcasts: live.broadcasts,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Live shareholding refresh failed, falling back to cache: ${err.message}`);
      }
    }

    if (record?.rawResponseSnippet) {
      try {
        const parsed = JSON.parse(record.rawResponseSnippet);
        const broadcasts = (parsed.recentBroadcasts || []).map((b: any) => ({
          symbol: b.symbol || b.isin,
          company: b.company,
          isin: b.isin,
          quarterEnded: b.quarterEnded || 'Latest Qtr',
          promoterHolding: this.formatShareholdingPercentage(b.promoterHolding),
          publicHolding: this.formatShareholdingPercentage(b.publicHolding),
          employeeTrusts: this.formatShareholdingPercentage(b.employeeTrusts || '0%'),
          dematNotes: b.dematNotes || null,
          hasPledgeMention: Boolean(b.hasPledgeMention),
          xbrlUrl: b.xbrlUrl || null,
          broadcastTimestamp: b.broadcastTimestamp || 'Statutory Filing',
        }));

        return {
          source: 'LIVE_FETCH',
          sourceUrl: parsed.sourceUrl || 'https://www.nseindia.com/api/corporate-share-holdings-master?index=equities',
          totalCompaniesReported: parsed.totalCompaniesReported || broadcasts.length,
          previewCount: broadcasts.length,
          granularityNotice:
            parsed.granularityNotice ||
            'NSE SEBI Reg 31 public master broadcast provides statutory Promoter, Public, and Employee Trusts equity aggregates. Granular FII/DII/Mutual Funds sub-breakdowns and quantitative Pledge % are contained inside statutory XBRL XML documents and require XBRL ingestion or licensed exchange vendor feeds per PRD Section 21.',
          categoriesAvailable: parsed.categoriesAvailable || {
            promoter: true,
            public: true,
            employeeTrusts: true,
            fii: false,
            dii: false,
            mutualFunds: false,
            pledgeNumeric: false,
            pledgeDisclosuresInNotes: true,
          },
          broadcasts,
          lastUpdated: record.lastFetchedAt ? record.lastFetchedAt.toISOString() : new Date().toISOString(),
        };
      } catch {}
    }
    return {
      source: 'LIVE_FETCH',
      sourceUrl: 'https://www.nseindia.com/api/corporate-share-holdings-master?index=equities',
      totalCompaniesReported: 0,
      previewCount: 0,
      granularityNotice:
        'NSE SEBI Reg 31 public master broadcast provides statutory Promoter, Public, and Employee Trusts equity aggregates.',
      categoriesAvailable: {
        promoter: true,
        public: true,
        employeeTrusts: true,
        fii: false,
        dii: false,
        mutualFunds: false,
        pledgeNumeric: false,
        pledgeDisclosuresInNotes: true,
      },
      broadcasts: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async getValuationFinancials(requestedSymbol = 'RELIANCE') {
    const symbol = (requestedSymbol || 'RELIANCE').replace(/\.(NS|BO)$/i, '').trim().toUpperCase();
    const [pl, liveQuote] = await Promise.all([
      this.scrapeScreenerProfitLoss(symbol),
      this.marketIndexService
        .fetchQuote(`${symbol}.NS`, symbol, symbol)
        .catch(() => null),
    ]);

    if (!pl || pl.years.length === 0) {
      return {
        source: 'UNAVAILABLE',
        targetCompany: symbol,
        fiscalPeriod: null,
        financialsCr: null,
        valuationModelAssumptions: null,
        currentMarketPrice: liveQuote?.current ?? null,
        cmpChange: liveQuote?.change ?? null,
        cmpChangePct: liveQuote?.changePct ?? null,
        cmpSymbol: symbol,
        cmpSource: liveQuote ? 'Yahoo Finance (Delayed 15-min)' : 'UNAVAILABLE',
        cmpLastUpdated: liveQuote?.lastUpdated || new Date().toISOString(),
        aureusScore: null,
        message: 'Live Screener.in financials unavailable for this symbol.',
        refreshedAt: new Date().toISOString(),
      };
    }

    const latest = pl.years[pl.years.length - 1];
    const first = pl.years[0];
    let historicalCagr: number | null = null;
    if (first?.revenue && latest?.revenue && pl.years.length > 1 && Number(first.revenue) > 0) {
      const periods = pl.years.length - 1;
      const cagr = (Math.pow(Number(latest.revenue) / Number(first.revenue), 1 / periods) - 1) * 100;
      if (Number.isFinite(cagr)) historicalCagr = Math.round(cagr * 10) / 10;
    }

    // Prefer Screener market cap (₹ Cr) → shares = mcapCr * 1e7 / CMP
    let sharesOutstanding: number | null = pl.marketCapCr && liveQuote?.current
      ? Math.round(((pl.marketCapCr * 10000000) / liveQuote.current) / 100000) / 100 // Cr shares
      : null;
    if (sharesOutstanding != null && (!Number.isFinite(sharesOutstanding) || sharesOutstanding <= 0)) {
      sharesOutstanding = null;
    }

    const financialsCr = {
      revenue: latest.revenue,
      ebitda: latest.operatingProfit,
      netDebt: pl.netDebtCr ?? null,
      sharesOutstanding,
      pat: latest.pat,
      eps: latest.eps,
      marketCapCr: pl.marketCapCr ?? null,
    };

    const currentMarketPrice = liveQuote?.current ?? null;
    const aureusScore = calculateAureusScore({
      symbol,
      companyName: pl.companyName,
      roce: pl.ratios.roce,
      debtToEquity: pl.ratios.debtToEquity,
      promoterHoldingPercent: pl.ratios.promoterHoldingPercent,
      pledgePercent: null,
    });

    const valuationModelAssumptions = {
      projectedGrowthRatePct: historicalCagr,
      waccPct: null,
      terminalGrowthPct: null,
      derivedIntrinsicFairPriceInr: null,
      growthBasis: historicalCagr != null
        ? `Historical revenue CAGR across ${pl.years.length} Screener.in annual periods`
        : 'Insufficient annual series to compute CAGR',
    };

    return {
      source: 'LIVE_FETCH',
      sourceUrl: pl.sourceUrl,
      targetCompany: pl.companyName,
      fiscalPeriod: latest.year,
      financialsCr,
      valuationModelAssumptions,
      currentMarketPrice,
      cmpChange: liveQuote?.change ?? null,
      cmpChangePct: liveQuote?.changePct ?? null,
      cmpSymbol: symbol,
      cmpSource: liveQuote ? 'Yahoo Finance (Delayed 15-min)' : 'UNAVAILABLE',
      cmpLastUpdated: liveQuote?.lastUpdated || new Date().toISOString(),
      aureusScore,
      sector: pl.sector,
      refreshedAt: new Date().toISOString(),
    };
  }

  async getFinancialModelling(requestedSymbol = 'RELIANCE', scenarioKey = 'base') {
    const symbol = (requestedSymbol || 'RELIANCE').replace(/\.(NS|BO)$/i, '').trim().toUpperCase();
    const scenario = ['base', 'bull', 'bear', 'management'].includes((scenarioKey || '').toLowerCase())
      ? scenarioKey.toLowerCase()
      : 'base';

    const [pl, universe, liveQuote] = await Promise.all([
      this.scrapeScreenerProfitLoss(symbol),
      this.loadNseEquityUniverse(40),
      this.marketIndexService.fetchQuote(`${symbol}.NS`, symbol, symbol).catch(() => null),
    ]);

    const availableSymbols = universe.slice(0, 40).map((u) => ({ symbol: u.symbol, name: u.name }));
    if (!availableSymbols.some((s) => s.symbol === symbol) && pl) {
      availableSymbols.unshift({ symbol, name: pl.companyName });
    }

    if (!pl || pl.years.length === 0) {
      return {
        source: 'UNAVAILABLE',
        symbol,
        companyName: symbol,
        badge: symbol,
        sector: null,
        currentPrice: liveQuote?.current ?? null,
        primaryMethod: 'PE',
        terminalYear: null,
        lastUpdated: new Date().toISOString(),
        priceSource: liveQuote ? 'Yahoo Finance (Delayed 15-min)' : 'UNAVAILABLE',
        availableSymbols,
        activeScenario: scenario,
        scenarioMeta: {
          name: 'Live Historical Only',
          cagr: null,
          cagrTargetYear: null,
          description: 'No Screener.in annual P&L series available for this symbol.',
        },
        years: [],
        scenariosAvailable: [{ key: 'base', name: 'Live Historical', cagr: null }],
      };
    }

    const years = pl.years.map((y) => {
      if (y.eps && liveQuote?.current && y.eps > 0) {
        return { ...y, forwardPe: Number((liveQuote.current / y.eps).toFixed(1)) };
      }
      return y;
    });

    const first = years[0];
    const last = years[years.length - 1];
    let cagrLabel: string | null = null;
    if (first?.revenue && last?.revenue && years.length > 1) {
      const periods = years.length - 1;
      const cagr = (Math.pow(Number(last.revenue) / Number(first.revenue), 1 / periods) - 1) * 100;
      if (Number.isFinite(cagr)) cagrLabel = `${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%`;
    }

    return {
      source: 'LIVE_FETCH',
      sourceUrl: pl.sourceUrl,
      symbol,
      companyName: pl.companyName,
      badge: symbol,
      sector: pl.sector,
      currentPrice: liveQuote?.current ?? null,
      primaryMethod: 'PE' as const,
      terminalYear: last?.year ?? null,
      lastUpdated: new Date().toISOString(),
      priceSource: liveQuote ? 'Yahoo Finance (Delayed 15-min)' : 'UNAVAILABLE',
      availableSymbols,
      activeScenario: 'base',
      scenarioMeta: {
        name: 'Live Historical (Screener.in)',
        cagr: cagrLabel,
        cagrTargetYear: last?.year ?? null,
        description: 'Annual P&L scraped live from Screener.in. Forward estimate rows are not fabricated.',
      },
      years,
      scenariosAvailable: [{ key: 'base', name: 'Live Historical', cagr: cagrLabel }],
    };
  }

  private peadPriceCache: {
    timestamp: number;
    data: Record<
      string,
      {
        currentPrice: number;
        price20dAgo: number;
        drift20d: number;
        dailyRet: number;
        sma50: number;
        stage: 'Stage 2 Breakout' | 'Consolidating';
      }
    >;
  } | null = null;

  async fetchLivePeadMetrics(): Promise<
    Record<
      string,
      {
        currentPrice: number;
        price20dAgo: number;
        drift20d: number;
        dailyRet: number;
        sma50: number;
        stage: 'Stage 2 Breakout' | 'Consolidating';
      }
    >
  > {
    if (this.peadPriceCache && Date.now() - this.peadPriceCache.timestamp < 300000) {
      return this.peadPriceCache.data;
    }

    const results: Record<
      string,
      {
        currentPrice: number;
        price20dAgo: number;
        drift20d: number;
        dailyRet: number;
        sma50: number;
        stage: 'Stage 2 Breakout' | 'Consolidating';
      }
    > = {};

    const universe = await this.loadNseEquityUniverse(50);
    await Promise.all(
      universe.map(async (item) => {
        const symbol = item.symbol;
        const yahooSymbol = item.yahooTicker;
        try {
          const resp = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=3mo`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            },
          );

          if (!resp.ok) return;
          const json = (await resp.json()) as any;
          const result = json?.chart?.result?.[0];
          const meta = result?.meta;
          const validCloses = extractYahooCloses(result);
          const session = parseYahooSessionChange(meta, validCloses);

          if (validCloses.length > 0 || session) {
            const currentPrice = session?.current
              ?? (meta?.regularMarketPrice
                ? Math.round(meta.regularMarketPrice * 100) / 100
                : Math.round(validCloses[validCloses.length - 1] * 100) / 100);
            const dailyRet = session?.changePct
              ?? (validCloses.length > 1
                ? Math.round(
                    ((currentPrice - validCloses[validCloses.length - 2]) /
                      validCloses[validCloses.length - 2]) *
                      10000,
                  ) / 100
                : 0);
            const price20dAgo =
              validCloses.length > 20
                ? Math.round(validCloses[validCloses.length - 21] * 100) / 100
                : Math.round((validCloses[0] || currentPrice) * 100) / 100;
            const drift20d =
              price20dAgo > 0
                ? Math.round(((currentPrice - price20dAgo) / price20dAgo) * 10000) / 100
                : 0;
            const sma50Slice = validCloses.slice(-50);
            const sma50 =
              sma50Slice.length > 0
                ? Math.round(
                    (sma50Slice.reduce((a, b) => a + b, 0) / sma50Slice.length) * 100,
                  ) / 100
                : currentPrice;
            const stage: 'Stage 2 Breakout' | 'Consolidating' =
              currentPrice >= sma50 ? 'Stage 2 Breakout' : 'Consolidating';

            results[symbol] = {
              currentPrice,
              price20dAgo,
              drift20d,
              dailyRet,
              sma50,
              stage,
            };
          }
        } catch (err: any) {
          this.logger.warn(
            `Failed to fetch live PEAD prices for ${symbol} (${yahooSymbol}): ${err.message}`,
          );
        }
      }),
    );

    if (Object.keys(results).length > 0) {
      this.peadPriceCache = {
        timestamp: Date.now(),
        data: results,
      };
    }

    return this.peadPriceCache?.data || {};
  }

  async getPeadFeed() {
    const liveQuotes = await this.fetchLivePeadMetrics();
    const pead = await this.getPeadSurprises();
    const record = await this.healthRepo.findOne({ where: { sourceKey: 'pead_source' } });
    const calRecord = await this.healthRepo.findOne({ where: { sourceKey: 'results_calendar' } });

    let calendarEventsCount = 0;
    if (calRecord?.rawResponseSnippet) {
      try {
        const parsed = JSON.parse(calRecord.rawResponseSnippet);
        calendarEventsCount = parsed.totalEventsListed || parsed.upcomingMeetings?.length || 0;
      } catch {}
    }

    const events = await Promise.all(
      pead.events.slice(0, 25).map(async (e, idx) => {
        const live = liveQuotes[e.symbol];
        const drift20d = live !== undefined ? live.drift20d : e.drift20d;
        const dailyRet = live !== undefined ? live.dailyRet : (e as any).dailyRet ?? 0;
        const stage =
          live !== undefined
            ? live.stage
            : (e as any).stage || ((e.price20dPost ?? 0) >= (e.priceAtResult ?? 0) ? 'Stage 2 Breakout' : 'Consolidating');

        let currentPe = (e as any).currentPe;
        let forwardPe = (e as any).forwardPe;
        let surprise = e.surprisePct;
        let yoyRev = e.yoyRevenuePct;
        let yoyPat = e.yoyPatPct;

        // Cap Screener scrapes to keep pead-feed under frontend timeout
        if (idx < 12) {
          try {
            const quarterly = await this.getCompanyQuarterlySurprise(e.symbol, e.companyName);
            if (quarterly) {
              if (quarterly.currentPe > 0) currentPe = quarterly.currentPe;
              if (quarterly.forwardPe > 0) forwardPe = quarterly.forwardPe;
              if (quarterly.surprisePct !== 0) surprise = quarterly.surprisePct;
              if (quarterly.yoyRevenuePct !== 0) yoyRev = quarterly.yoyRevenuePct;
              if (quarterly.yoyPatPct !== 0) yoyPat = quarterly.yoyPatPct;
            }
          } catch {}
        }

        if (!currentPe) currentPe = 0;
        if (!forwardPe) forwardPe = 0;

        return {
          symbol: e.symbol,
          name: e.companyName,
          surprise,
          yoyRev,
          yoyPat,
          drift20d,
          dailyRet,
          resultDate: e.resultDate,
          stage,
          currentPe,
          forwardPe,
          currentPrice: live?.currentPrice ?? e.price20dPost ?? 0,
          price20dAgo: live?.price20dAgo ?? e.priceAtResult,
          sma50: live?.sma50,
          actualEps: e.actualEps,
          expectedEps: e.expectedEps,
        };
      }),
    );

    return {
      source: 'LIVE_FEED',
      dataSource: pead.dataSource,
      methodology: pead.methodology,
      trackedEventsCount: events.length,
      calendarUniverseActive: calendarEventsCount,
      events,
      lastUpdated: record?.lastFetchedAt?.toISOString() || pead.lastUpdated,
    };
  }

  // ── Master Growth Tracker ───────────────────────────────────────────────
  private masterTrackerCache: { timestamp: number; data: any } | null = null;

  async getMasterTracker(forceRefresh = false) {
    if (!forceRefresh && this.masterTrackerCache && Date.now() - this.masterTrackerCache.timestamp < 5 * 60 * 1000) {
      return this.masterTrackerCache.data;
    }

    const universe = await this.loadNseEquityUniverse(50);
    // Quotes only (no Screener P&L per row) — fundamentals load on demand in Valuation Lab
    const companies = (
      await this.mapPool(universe, 8, async (item) => {
        const detail = await this.fetchLiveStockDetail(item.yahooTicker);
        if (!detail || detail.cmp <= 0) return null;
        return {
          id: item.symbol.toLowerCase(),
          symbol: item.symbol,
          yahooTicker: item.yahooTicker,
          name: item.name,
          sector: item.sector,
          marketCapCr: null,
          expectedEpsFy27: null,
          trailingEps: null,
          cmp: detail.cmp,
          price: detail.cmp,
          dayChangePct: detail.dayChangePct,
          changePct: detail.dayChangePct,
          week52High: detail.week52High,
          week52Low: detail.week52Low,
          keyTriggers: [] as string[],
          quarterly: {
            revenueCr: null,
            patCr: null,
            fiscalYear: null,
          },
        };
      })
    ).filter((c): c is NonNullable<typeof c> => c !== null);

    const result = {
      source: companies.length ? 'LIVE_FETCH' : 'UNAVAILABLE',
      dataSource: 'NSE Nifty constituents + Yahoo Finance quotes (fundamentals on-demand)',
      companiesCount: companies.length,
      companies,
      stocks: companies,
      lastUpdated: new Date().toISOString(),
    };

    this.masterTrackerCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── Order Tracker Feed ──────────────────────────────────────────────────
  private orderTrackerCache: { timestamp: number; data: any } | null = null;

  async getOrderTracker(forceRefresh = false) {
    if (!forceRefresh && this.orderTrackerCache && Date.now() - this.orderTrackerCache.timestamp < 15 * 60 * 1000) {
      return this.orderTrackerCache.data;
    }

    // Pull real announcements feed to extract live order wins
    const newsFeed = await this.getNewsFeed(forceRefresh);
    const allWins = (newsFeed.headlines || []).filter((h) => h.isOrderWin);
    // Prefer filings that already disclose a contract value, then take a wider slice
    const ranked = [...allWins].sort((a, b) => {
      const av = this.parseOrderValueCr(a.orderValue) > 0 ? 1 : 0;
      const bv = this.parseOrderValueCr(b.orderValue) > 0 ? 1 : 0;
      return bv - av;
    });
    // Cap PDF enrichment work — amounts often live only in annexure PDFs
    const candidateWins = ranked.slice(0, 40);
    const orderAnnouncements = await this.enrichOrderAnnouncementsFromPdfs(candidateWins);
    // Re-rank after PDF enrichment so valued contracts surface first
    orderAnnouncements.sort((a, b) => {
      const av = this.parseOrderValueCr(a.orderValue) > 0 ? 1 : 0;
      const bv = this.parseOrderValueCr(b.orderValue) > 0 ? 1 : 0;
      return bv - av;
    });
    const universe = await this.loadNseEquityUniverse(80);

    // Resolve live announcements into orders using dynamic financial metrics
    const liveOrderPromises = orderAnnouncements.map(async (ann, idx) => {
      let sym = (ann.symbol || '').toUpperCase().trim();
      // Ignore pure BSE numeric scrip codes for Screener lookups
      if (/^\d+$/.test(sym)) sym = '';

      if (!sym || sym === 'COMPANY') {
        const text = `${ann.company || ''} ${ann.title || ''} ${ann.description || ''}`.toUpperCase();
        for (const item of universe) {
          if (text.includes(item.symbol) || text.includes(item.name.toUpperCase())) {
            sym = item.symbol;
            break;
          }
        }
      }

      if (!sym || sym === 'COMPANY') {
        const words = (ann.company || '').split(' ');
        if (words.length > 0 && words[0].length > 2) {
          sym = words[0].toUpperCase().replace(/[^A-Z]/g, '');
        }
      }

      if (!sym) {
        return null;
      }

      const fin = await this.getCompanyFinancialSummary(sym, ann.company);

      // Re-parse from title/description in case cached headline omitted ₹ Cr
      const blendedValue =
        ann.orderValue ||
        this.extractOrderValue(`${ann.title || ''} ${ann.description || ''}`);
      const valCr = this.parseOrderValueCr(blendedValue);
      const hasValue = valCr > 0;

      const durationMonths: number | null = null;
      const annualValueCr = null;
      const orderSizePct = hasValue && fin.revenueCr > 0
        ? Math.round((valCr / fin.revenueCr) * 1000) / 10
        : 0;

      const d = new Date(ann.pubDate);
      const dateStr = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toISOString().split('T')[0];

      // Counterparty: PDF annexure → title/description "from …"
      const blob = `${ann.title || ''} ${ann.description || ''}`;
      const fromMatch = blob.match(/\bfrom\s+([A-Z][A-Za-z0-9 &.,-]{2,60}?)(?:\s+for|\s+worth|\s+valued|\s*\(|$)/);
      const customer =
        (ann as any).customer ||
        fromMatch?.[1]?.trim() ||
        this.extractCounterpartyFromFiling(blob) ||
        'Counterparty undisclosed in filing';

      const pdfUrls = this.resolveAnnouncementPdfUrls(ann.link);
      return {
        id: `ord-live-${idx + 1}`,
        companyName: fin.companyName || ann.company || sym,
        symbol: fin.symbol || sym,
        customer,
        orderType: /l-?1|letter of intent|\bloa\b|epc/i.test(blob)
          ? (/l-?1/i.test(blob) ? 'L1 Tender Winner' : /letter of intent|\bloa\b/i.test(blob) ? 'Letter of Intent' : 'EPC / Contract')
          : 'Purchase Order / Contract',
        date: dateStr,
        contractValueCr: valCr,
        contractValueFormatted: hasValue
          ? `₹${valCr.toLocaleString('en-IN')} Cr`
          : 'Undisclosed',
        durationMonths,
        durationText: null,
        annualValueCr,
        annualValueFormatted: null,
        orderSizePct,
        companyRevenueCr: fin.revenueCr,
        companyRevenueFormatted: fin.revenueCr > 0 ? `₹${fin.revenueCr.toLocaleString('en-IN')} Cr (${fin.fiscalYear})` : 'N/A',
        pdfUrl: pdfUrls[0] || ann.link || null,
      };
    });

    const orders = (await Promise.all(liveOrderPromises)).filter((ord): ord is NonNullable<typeof ord> => ord !== null);

    const allOrders = orders;

    // Group consolidated orders by company symbol
    const companyMap = new Map<string, {
      companyName: string;
      symbol: string;
      totalOrderValueCr: number;
      orders: typeof allOrders;
      companyRevenueCr: number;
      fiscalYear: string;
    }>();

    for (const ord of allOrders) {
      const existing = companyMap.get(ord.symbol);
      if (existing) {
        existing.totalOrderValueCr += ord.contractValueCr;
        existing.orders.push(ord);
      } else {
        const fyMatch = ord.companyRevenueFormatted.match(/\(([^)]+)\)/);
        const fiscalYear = fyMatch ? fyMatch[1] : 'TTM';
        companyMap.set(ord.symbol, {
          companyName: ord.companyName,
          symbol: ord.symbol,
          totalOrderValueCr: ord.contractValueCr,
          orders: [ord],
          companyRevenueCr: ord.companyRevenueCr,
          fiscalYear,
        });
      }
    }

    const consolidated = Array.from(companyMap.values())
      .map((c) => {
        const ordersAsRevenuePct = c.companyRevenueCr > 0
          ? Math.round((c.totalOrderValueCr / c.companyRevenueCr) * 1000) / 10
          : 0;
        return {
          companyName: c.companyName,
          symbol: c.symbol,
          totalOrderValueCr: Math.round(c.totalOrderValueCr * 10) / 10,
          totalOrderValueFormatted: c.totalOrderValueCr > 0
            ? `₹${Math.round(c.totalOrderValueCr).toLocaleString('en-IN')} Cr`
            : 'Undisclosed',
          orderCount: c.orders.length,
          ordersAsRevenuePct,
          companyRevenueCr: c.companyRevenueCr,
          companyRevenueFormatted: c.companyRevenueCr > 0
            ? `₹${c.companyRevenueCr.toLocaleString('en-IN')} Cr (${c.fiscalYear})`
            : 'N/A',
          orders: c.orders,
        };
      })
      .sort((a, b) => b.totalOrderValueCr - a.totalOrderValueCr || b.orderCount - a.orderCount);

    const result = {
      source: 'LIVE_EXCHANGE_FEED',
      dataSource: 'BSE/NSE corporate filings (SEBI LODR Reg 30) + PDF annexure amount extraction',
      totalOrdersCount: allOrders.length,
      totalOrderValueCr: Math.round(consolidated.reduce((acc, c) => acc + c.totalOrderValueCr, 0)),
      consolidated,
      orders: allOrders,
      lastUpdated: new Date().toISOString(),
    };

    // Avoid caching empty poison for a full TTL
    if (allOrders.length > 0) {
      this.orderTrackerCache = {
        timestamp: Date.now(),
        data: result,
      };
    } else {
      this.orderTrackerCache = {
        timestamp: Date.now() - 15 * 60 * 1000 + 60_000,
        data: result,
      };
    }

    return result;
  }

  // ── Bank / NBFC Multi-Year Ratios ───────────────────────────────────────
  private bankNbfcCache: { timestamp: number; data: any } | null = null;
  private bankNbfcInFlight: Promise<any> | null = null;

  async getBankNbfcData(forceRefresh = false) {
    const cachedBanks = this.bankNbfcCache?.data?.banks?.length || 0;
    const cachedSource = this.bankNbfcCache?.data?.source;
    const ttlMs = cachedSource === 'LIVE_NSE_QUOTES' ? 15 * 60 * 1000 : 6 * 60 * 60 * 1000;
    if (
      !forceRefresh &&
      this.bankNbfcCache &&
      cachedBanks > 0 &&
      Date.now() - this.bankNbfcCache.timestamp < ttlMs
    ) {
      return this.bankNbfcCache.data;
    }

    if (!forceRefresh && this.bankNbfcInFlight) {
      return this.bankNbfcInFlight;
    }

    this.bankNbfcInFlight = this.loadBankNbfcData().finally(() => {
      this.bankNbfcInFlight = null;
    });
    return this.bankNbfcInFlight;
  }

  private async loadBankNbfcData() {
    const FALLBACK_BANKS = [
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Limited' },
      { symbol: 'SBIN', name: 'State Bank of India' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited' },
      { symbol: 'AXISBANK', name: 'Axis Bank Limited' },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank Limited' },
      { symbol: 'BANKBARODA', name: 'Bank of Baroda' },
      { symbol: 'PNB', name: 'Punjab National Bank' },
      { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Limited' },
      { symbol: 'FEDERALBNK', name: 'The Federal Bank Limited' },
      { symbol: 'AUBANK', name: 'AU Small Finance Bank Limited' },
      { symbol: 'BANDHANBNK', name: 'Bandhan Bank Limited' },
    ];

    let bankSymbols: { symbol: string; name: string; cmp?: number; changePct?: number }[] = [];
    try {
      const raw = await this.fetchNseApi('/api/equity-stockIndices?index=NIFTY%20BANK');
      const rows = Array.isArray(raw?.data) ? raw.data : [];
      bankSymbols = rows
        .map((row: any) => {
          const symbol = String(row.symbol || '').toUpperCase().trim();
          if (!symbol || symbol.includes('NIFTY')) return null;
          return {
            symbol,
            name: String(row.meta?.companyName || row.meta?.companyName || symbol),
            cmp: Number(row.lastPrice || row.last || 0) || undefined,
            changePct: Number(row.pChange || row.percentChange || 0) || undefined,
          };
        })
        .filter((x: any): x is { symbol: string; name: string; cmp?: number; changePct?: number } => Boolean(x));
    } catch (err: any) {
      this.logger.warn(`Nifty Bank universe failed: ${err?.message || err}`);
    }

    if (bankSymbols.length === 0) {
      bankSymbols = FALLBACK_BANKS.map((b) => ({ ...b }));
    }

    const bankRows = (
      await this.mapPool(bankSymbols.slice(0, 8), 3, async (b) => {
        const pl = await this.scrapeScreenerProfitLoss(b.symbol);
        if (!pl || pl.years.length === 0) return null;
        return {
          bankName: pl.companyName || b.name,
          ticker: b.symbol,
          sector: this.classifyBankOwnership(b.symbol, pl.companyName || b.name),
          periods: pl.years.map((y) => y.year),
          revenue: pl.years.map((y) => y.revenue),
          pat: pl.years.map((y) => y.pat),
          eps: pl.years.map((y) => y.eps),
          // Banks rarely expose OPM on Screener — derive NPM (PAT / Interest Income)
          opmPct: pl.years.map((y) => {
            if (y.opmPct != null) return y.opmPct;
            if (y.revenue && y.pat != null && Number(y.revenue) !== 0) {
              return Math.round((Number(y.pat) / Number(y.revenue)) * 1000) / 10;
            }
            return null;
          }),
          interest: pl.years.map((y) => y.interest ?? null),
          roce: pl.ratios.roce,
          debtToEquity: pl.ratios.debtToEquity,
          sourceUrl: pl.sourceUrl,
          cmp: b.cmp ?? null,
          changePct: b.changePct ?? null,
        };
      })
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    // Live fallback: NSE Nifty Bank quotes when Screener P&L is blocked
    if (bankRows.length === 0 && bankSymbols.length > 0) {
      const liveBanks = await this.mapPool(bankSymbols.slice(0, 12), 4, async (b) => {
        const detail = await this.fetchLiveStockDetail(`${b.symbol}.NS`);
        const cmp = detail?.cmp || b.cmp || 0;
        if (!cmp) return null;
        return {
          bankName: b.name,
          ticker: b.symbol,
          sector: this.classifyBankOwnership(b.symbol, b.name),
          periods: ['Live'],
          revenue: [null],
          pat: [null],
          eps: [null],
          opmPct: [null],
          roce: null,
          debtToEquity: null,
          sourceUrl: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(b.symbol)}`,
          cmp,
          changePct: detail?.dayChangePct ?? b.changePct ?? null,
        };
      });
      const banks = liveBanks.filter((x): x is NonNullable<typeof x> => x !== null);
      const result = {
        source: banks.length ? 'LIVE_NSE_QUOTES' : 'UNAVAILABLE',
        dataSource: 'NSE Nifty Bank live quotes (Screener P&L unavailable)',
        periods: ['Live'],
        banksCount: banks.length,
        banks,
        costOfFunds: banks.map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: [b.cmp],
        })),
        roa: banks.map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: [b.changePct],
        })),
        deposits: banks.map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: [b.cmp],
        })),
        lastUpdated: new Date().toISOString(),
        message: banks.length
          ? 'Showing live NSE quotes. Multi-year P&L grids populate when Screener.in is reachable.'
          : 'Live bank data unavailable from NSE / Screener.in.',
      };
      if (banks.length > 0) {
        this.bankNbfcCache = { timestamp: Date.now(), data: result };
      }
      return result;
    }

    const periods = bankRows[0]?.periods || [];
    const result = {
      source: bankRows.length ? 'LIVE_FETCH' : 'UNAVAILABLE',
      dataSource: 'NSE Nifty Bank constituents + Screener.in annual P&L (free public scrape)',
      periods,
      banksCount: bankRows.length,
      banks: bankRows,
      // Honest free-data grids (true Cost-of-Funds / statutory ROA are not on Screener P&L)
      metricLabels: {
        costOfFunds: 'Net Profit Margin % (PAT / Interest Income)',
        roa: 'EPS (₹)',
        deposits: 'Interest Income / Sales (₹ Cr)',
        pat: 'Net Profit (₹ Cr)',
      },
      costOfFunds: bankRows.map((b) => ({
        bankName: b.bankName,
        ticker: b.ticker,
        sector: b.sector,
        values: b.opmPct || [],
      })),
      roa: bankRows.map((b) => ({
        bankName: b.bankName,
        ticker: b.ticker,
        sector: b.sector,
        values: b.eps || [],
      })),
      deposits: bankRows.map((b) => ({
        bankName: b.bankName,
        ticker: b.ticker,
        sector: b.sector,
        values: b.revenue || [],
      })),
      pat: bankRows.map((b) => ({
        bankName: b.bankName,
        ticker: b.ticker,
        sector: b.sector,
        values: b.pat || [],
      })),
      lastUpdated: new Date().toISOString(),
      message: bankRows.length
        ? 'Free Screener.in bank P&L: Interest Income, PAT, EPS, and derived Net Profit Margin. Statutory Cost of Funds / ROA are not published in this free feed.'
        : 'Live bank financial series unavailable from Screener.in / NSE.',
    };

    if (bankRows.length > 0) {
      this.bankNbfcCache = { timestamp: Date.now(), data: result };
    }
    return result;
  }

  // ── Vahan Top Manufacturers Matrix ──────────────────────────────────
  private vahanMakersCache: { timestamp: number; data: any } | null = null;

  async getVahanMakersData(forceRefresh = false) {
    if (
      !forceRefresh &&
      this.vahanMakersCache &&
      (this.vahanMakersCache.data?.makers?.length || 0) > 0 &&
      Date.now() - this.vahanMakersCache.timestamp < 6 * 60 * 60 * 1000
    ) {
      return this.vahanMakersCache.data;
    }

    try {
      const vahan = await this.vahanEtlService.getVahanData(forceRefresh);
      const makers = (vahan?.categories || [])
        .flatMap((cat: any) =>
          (cat.keyOEMs || []).map((oem: string) => ({
            makerName: oem,
            symbol: null,
            isListed: null,
            category: cat.category,
            monthlyUnits: null,
            monthlyYoyPct: null,
            registrations: cat.registrations ?? null,
          })),
        );

      const result = {
        source: makers.length ? 'LIVE_FETCH' : 'UNAVAILABLE',
        dataSource: 'MoRTH Vahan ETL (live scrape) — OEM unit matrices not fabricated',
        totalMakers: makers.length,
        makers,
        lastUpdated: new Date().toISOString(),
        message: makers.length
          ? undefined
          : 'OEM manufacturer matrix is not published in the public Vahan state dashboard; category/OEM rows stay empty until MoRTH exposes them.',
      };
      if (makers.length > 0) {
        this.vahanMakersCache = { timestamp: Date.now(), data: result };
      }
      return result;
    } catch (err: any) {
      this.logger.warn(`Vahan makers live load failed: ${err?.message || err}`);
      const result = {
        source: 'UNAVAILABLE',
        dataSource: 'UNAVAILABLE',
        totalMakers: 0,
        makers: [],
        lastUpdated: new Date().toISOString(),
      };
      return result;
    }
  }

  // ── 1. 52-Week High/Low Screener ──────────────────────────────────────
  private async fetchLiveStockDetail(ticker: string): Promise<{
    cmp: number;
    week52High: number;
    week52Low: number;
    dayChangePct: number;
    volume: number;
    previousClose: number;
  } | null> {
    try {
      // 1y supplies fiftyTwoWeek* meta + daily closes; session % via shared Yahoo helper
      // (never use chartPreviousClose — that is range-start close on long charts).
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return null;
      const json = (await resp.json()) as any;
      const result = json?.chart?.result?.[0];
      const meta = result?.meta;
      const closes = extractYahooCloses(result);
      const volumes = extractYahooVolumes(result);
      const session = parseYahooSessionChange(meta, closes);
      if (!session) return null;

      let week52High = Number(meta.fiftyTwoWeekHigh || 0);
      let week52Low = Number(meta.fiftyTwoWeekLow || 0);
      // Never fall back 52W high/low to CMP (that falsely marks every name as near-high)
      if ((!week52High || !week52Low) && closes.length > 0) {
        week52High = week52High || Math.max(...closes);
        week52Low = week52Low || Math.min(...closes);
      }
      if (!week52High || !week52Low) return null;

      const volume = Number(meta.regularMarketVolume || volumes[volumes.length - 1] || 0);
      return {
        cmp: session.current,
        week52High: Math.round(week52High * 100) / 100,
        week52Low: Math.round(week52Low * 100) / 100,
        dayChangePct: session.changePct,
        volume,
        previousClose: session.previousClose,
      };
    } catch {
      return null;
    }
  }

  private fiftyTwoWeekCache: { timestamp: number; data: any } | null = null;
  async get52WeekHighLow(refresh = false): Promise<any> {
    const TTL = 5 * 60 * 1000;
    if (!refresh && this.fiftyTwoWeekCache && Date.now() - this.fiftyTwoWeekCache.timestamp < TTL) {
      return this.fiftyTwoWeekCache.data;
    }

    // Broader free universe (Nifty 500 + volume gainers) for a real breakout/breakdown screen
    const universe = await this.loadNseEquityUniverse(120);
    const liveQuotes = await this.mapPool(universe, 8, async (item) => {
        const detail = await this.fetchLiveStockDetail(item.yahooTicker);
        if (!detail || detail.cmp <= 0 || !detail.week52High || !detail.week52Low) return null;
        const distFromHighPct =
          detail.week52High > 0
            ? Math.round(((detail.week52High - detail.cmp) / detail.week52High) * 10000) / 100
            : 999;
        const distFromLowPct =
          detail.week52Low > 0
            ? Math.round(((detail.cmp - detail.week52Low) / detail.week52Low) * 10000) / 100
            : 999;

        return {
          symbol: item.symbol,
          companyName: item.name,
          sector: item.sector,
          cmp: detail.cmp,
          week52High: detail.week52High,
          week52Low: detail.week52Low,
          distFromHighPct: Math.max(0, distFromHighPct),
          distFromLowPct: Math.max(0, distFromLowPct),
          dayChangePct: detail.dayChangePct,
          isNewAllTimeHigh: detail.cmp >= detail.week52High * 0.995,
          isNear52WeekHigh: detail.cmp >= detail.week52High * 0.995,
          isNew52WeekLow: detail.cmp <= detail.week52Low * 1.005,
          volume: detail.volume ?? null,
        };
      });

    const validStocks = liveQuotes.filter((s): s is NonNullable<typeof s> => s !== null);
    // Near 52W high/low: within 5% (primary). Widen to 10% if tape is quiet.
    let highs = validStocks
      .filter((s) => s.distFromHighPct <= 5)
      .sort((a, b) => a.distFromHighPct - b.distFromHighPct);
    let lows = validStocks
      .filter((s) => s.distFromLowPct <= 5)
      .sort((a, b) => a.distFromLowPct - b.distFromLowPct);

    let filterNote: string | undefined;
    if (highs.length < 5) {
      highs = validStocks
        .filter((s) => s.distFromHighPct <= 10)
        .sort((a, b) => a.distFromHighPct - b.distFromHighPct)
        .slice(0, 40);
      filterNote = 'Few names within 5% of 52W high — showing within 10% proximity.';
    }
    if (lows.length < 5) {
      lows = validStocks
        .filter((s) => s.distFromLowPct <= 10)
        .sort((a, b) => a.distFromLowPct - b.distFromLowPct)
        .slice(0, 40);
      filterNote = filterNote
        ? `${filterNote} Lows also widened to 10%.`
        : 'Few names within 5% of 52W low — showing within 10% proximity.';
    }

    // Last resort: closest proximity ranks so UI is never blank when quotes exist
    const highsOut =
      highs.length > 0
        ? highs
        : [...validStocks].sort((a, b) => a.distFromHighPct - b.distFromHighPct).slice(0, 25);
    const lowsOut =
      lows.length > 0
        ? lows
        : [...validStocks].sort((a, b) => a.distFromLowPct - b.distFromLowPct).slice(0, 25);

    const liveData = {
      lastUpdated: new Date().toISOString(),
      source: validStocks.length ? 'YAHOO_LIVE_52W' : 'UNAVAILABLE',
      dataSource: 'Yahoo Finance delayed quotes for NSE (.NS) — free third-party feed',
      scanned: validStocks.length,
      filterNote:
        filterNote ||
        (highs.length === 0 && validStocks.length > 0
          ? 'No stocks within 5–10% of 52W high/low — showing closest proximity ranks.'
          : undefined),
      totalHighs: highsOut.length,
      totalLows: lowsOut.length,
      highs: highsOut,
      lows: lowsOut,
    };

    this.fiftyTwoWeekCache = { timestamp: Date.now(), data: liveData };
    return liveData;
  }

  // ── 2. Bulk & Block Deals Tracker ─────────────────────────────────────
  private bulkBlockDealsCache: { timestamp: number; data: any } | null = null;
  async getBulkBlockDeals(refresh = false): Promise<any> {
    const TTL = 15 * 60 * 1000;
    if (!refresh && this.bulkBlockDealsCache && Date.now() - this.bulkBlockDealsCache.timestamp < TTL) {
      return this.bulkBlockDealsCache.data;
    }

    try {
      const rawDeals = await this.fetchNseApi(
        '/api/snapshot-capital-market-largedeal',
        'https://www.nseindia.com/market-data/large-deals',
      );
      const bulkRows = Array.isArray(rawDeals?.BULK_DEALS_DATA)
        ? rawDeals.BULK_DEALS_DATA
        : Array.isArray(rawDeals?.BULK_DEALS)
          ? rawDeals.BULK_DEALS
          : Array.isArray(rawDeals)
            ? rawDeals
            : [];
      const blockRows = Array.isArray(rawDeals?.BLOCK_DEALS_DATA)
        ? rawDeals.BLOCK_DEALS_DATA
        : Array.isArray(rawDeals?.BLOCK_DEALS)
          ? rawDeals.BLOCK_DEALS
          : [];

      const mapDeal = (d: any, idx: number, market: 'BULK' | 'BLOCK') => {
        const qty = Number(d.qty || d.quantityTraded || d.quantity || 0);
        const price = Number(d.watp || d.tradePrice || d.price || 0);
        const rawSide = String(d.buySell || d.dealType || d.buySellFlag || 'BUY').toUpperCase();
        const dealType =
          rawSide === 'S' || rawSide === 'SELL' || rawSide.startsWith('S')
            ? 'SELL'
            : 'BUY';
        const clientName = String(d.clientName || 'Institutional Trader');
        const marqueeRe =
          /hdfc|icici|sbi|kotak|axis|uti|nippon|mirae|motilal|quant|edelweiss|dsp|franklin|aditya birla|tata mutual|lic|gqj|goldman|morgan stanley|jp morgan|citadel|bridgewater|blackrock|vanguard|fidelity/i;
        return {
          id: `bb-live-${market}-${d.symbol || idx}-${idx}`,
          date: d.date || rawDeals?.as_on_date || new Date().toISOString().split('T')[0],
          symbol: d.symbol,
          companyName: d.name || d.companyName || d.symbol,
          dealType,
          dealMarket: market,
          clientName,
          quantity: qty,
          tradePrice: price,
          valueCr: Math.round(((qty * price) / 10000000) * 100) / 100,
          isMarqueeInvestor: Boolean(d.isMarquee) || marqueeRe.test(clientName),
          marqueeTag: marqueeRe.test(clientName) ? 'MARQUEE' : undefined,
        };
      };

      const liveDeals = [
        ...bulkRows.map((d: any, idx: number) => mapDeal(d, idx, 'BULK')),
        ...blockRows.map((d: any, idx: number) => mapDeal(d, idx, 'BLOCK')),
      ].filter((d) => d.symbol && d.quantity > 0);

      if (liveDeals.length > 0) {
        const totalValueCr = Math.round(liveDeals.reduce((acc: number, d: any) => acc + d.valueCr, 0) * 100) / 100;
        const result = {
          lastUpdated: new Date().toISOString(),
          source: 'NSE_BSE_BULK_BLOCK_REGISTER',
          asOnDate: rawDeals?.as_on_date || null,
          totalDeals: liveDeals.length,
          totalValueCr,
          deals: liveDeals,
        };
        this.bulkBlockDealsCache = { timestamp: Date.now(), data: result };
        return result;
      }
    } catch (err: any) {
      this.logger.warn(`Bulk/block deals fetch failed: ${err?.message || err}`);
    }

    const result = {
      lastUpdated: new Date().toISOString(),
      source: 'NSE_BSE_BULK_BLOCK_REGISTER',
      marketSession: 'Standby / Post-Market',
      message: 'No bulk or block deals reported for the current trading cycle.',
      totalDeals: 0,
      totalValueCr: 0,
      deals: [],
    };

    this.bulkBlockDealsCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 3. F&O Open Interest, Rollover & PCR Indicator ───────────────────
  private fnoOiCache: { timestamp: number; data: any } | null = null;
  async getFnoOpenInterest(refresh = false): Promise<any> {
    const TTL = 15 * 60 * 1000;
    if (!refresh && this.fnoOiCache && Date.now() - this.fnoOiCache.timestamp < TTL) {
      return this.fnoOiCache.data;
    }

    const parseDerivativesOptions = (raw: any, symbol: string, name: string) => {
      const rows = Array.isArray(raw?.data) ? raw.data : [];
      if (!rows.length) return null;

      // Prefer nearest expiry with enough contracts
      const byExpiry = new Map<string, any[]>();
      for (const row of rows) {
        const exp = String(row.expiryDate || '');
        if (!exp) continue;
        if (!byExpiry.has(exp)) byExpiry.set(exp, []);
        byExpiry.get(exp)!.push(row);
      }
      const sortedExpiries = [...byExpiry.entries()].sort((a, b) => a[1].length < b[1].length ? 1 : -1);
      const [expiryDate, expiryRows] = sortedExpiries[0] || [null, []];
      if (!expiryDate || !expiryRows.length) return null;

      const spotPrice = Number(expiryRows[0]?.underlyingValue || 0);
      const strikeMap = new Map<number, { strikePrice: number; callOi: number; putOi: number; callOiChange: number; putOiChange: number }>();
      for (const row of expiryRows) {
        const strike = Number(row.strikePrice || 0);
        if (!strike) continue;
        if (!strikeMap.has(strike)) {
          strikeMap.set(strike, { strikePrice: strike, callOi: 0, putOi: 0, callOiChange: 0, putOiChange: 0 });
        }
        const entry = strikeMap.get(strike)!;
        const oi = Number(row.openInterest || 0);
        const opt = String(row.optionType || '').toUpperCase();
        if (opt.startsWith('C')) entry.callOi += oi;
        else if (opt.startsWith('P')) entry.putOi += oi;
      }

      const strikes = [...strikeMap.values()]
        .filter((s) => s.callOi > 0 || s.putOi > 0)
        .sort((a, b) => a.strikePrice - b.strikePrice);

      const totalCallOi = strikes.reduce((a, s) => a + s.callOi, 0);
      const totalPutOi = strikes.reduce((a, s) => a + s.putOi, 0);
      const pcr = totalCallOi > 0 ? Math.round((totalPutOi / totalCallOi) * 100) / 100 : null;
      const highestCall = strikes.reduce((best: any, s) => (!best || s.callOi > best.callOi ? s : best), null);
      const highestPut = strikes.reduce((best: any, s) => (!best || s.putOi > best.putOi ? s : best), null);

      // Max pain ≈ strike minimizing total option intrinsic payout for sellers
      let maxPainStrike: number | null = null;
      let minPain = Number.POSITIVE_INFINITY;
      for (const candidate of strikes) {
        let pain = 0;
        for (const s of strikes) {
          if (candidate.strikePrice > s.strikePrice) pain += (candidate.strikePrice - s.strikePrice) * s.putOi;
          if (candidate.strikePrice < s.strikePrice) pain += (s.strikePrice - candidate.strikePrice) * s.callOi;
        }
        if (pain < minPain) {
          minPain = pain;
          maxPainStrike = candidate.strikePrice;
        }
      }

      // Keep strikes near spot for UI
      const nearSpot = spotPrice
        ? strikes
            .filter((s) => Math.abs(s.strikePrice - spotPrice) / spotPrice <= 0.08)
            .slice(0, 25)
        : strikes.slice(0, 25);

      return {
        symbol,
        name,
        spotPrice,
        pcr,
        pcrSentiment: pcr == null ? null : pcr >= 1.0 ? 'Bullish' : 'Bearish',
        maxPainStrike,
        totalCallOi: Math.round(totalCallOi),
        totalPutOi: Math.round(totalPutOi),
        highestCallOiStrike: highestCall?.strikePrice ?? null,
        highestPutOiStrike: highestPut?.strikePrice ?? null,
        rolloverPct: null,
        expiryDate,
        strikes: nearSpot,
      };
    };

    const [niftyRaw, bankRaw, universe] = await Promise.all([
      this.fetchNseApi(
        '/api/liveEquity-derivatives?index=nse50_opt',
        'https://www.nseindia.com/market-data/equity-derivatives-watch',
      ).catch(() => null),
      this.fetchNseApi(
        '/api/liveEquity-derivatives?index=nifty_bank_opt',
        'https://www.nseindia.com/market-data/equity-derivatives-watch',
      ).catch(() => null),
      this.loadNseEquityUniverse(12),
    ]);

    const indices = [
      parseDerivativesOptions(niftyRaw, 'NIFTY', 'Nifty 50 Index Options'),
      parseDerivativesOptions(bankRaw, 'BANKNIFTY', 'Nifty Bank Index Options'),
    ].filter(Boolean);

    const topOiGainers = (
      await Promise.all(
        universe.map(async (item) => {
          const detail = await this.fetchLiveStockDetail(item.yahooTicker);
          if (!detail) return null;
          return {
            symbol: item.symbol,
            cmp: detail.cmp,
            oiChangePct: null,
            priceChangePct: detail.dayChangePct,
            interpretation: null,
          };
        }),
      )
    ).filter((m): m is NonNullable<typeof m> => m !== null);

    const result = {
      lastUpdated: new Date().toISOString(),
      source: indices.length ? 'NSE_LIVE_EQUITY_DERIVATIVES' : 'UNAVAILABLE',
      indices,
      topOiGainers,
      message: indices.length ? undefined : 'NSE derivatives options feed unavailable; no synthetic OI emitted.',
    };

    this.fnoOiCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 4. Insider Trading Disclosures (SEBI PIT / SAST) ──────────────────
  private insiderTradingCache: { timestamp: number; data: any } | null = null;
  async getInsiderTrading(refresh = false): Promise<any> {
    const TTL = 10 * 60 * 1000;
    if (!refresh && this.insiderTradingCache && Date.now() - this.insiderTradingCache.timestamp < TTL) {
      return this.insiderTradingCache.data;
    }

    const toNum = (v: any) => {
      if (v === null || v === undefined || v === '' || v === '-') return 0;
      const n = Number(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const mapPitRows = (rows: any[]) =>
      rows.map((t: any, idx: number) => {
        // NSE PIT: secVal is transaction value in INR; buyValue/sellValue are fallbacks
        const valueInr = toNum(t.secVal ?? t.buyValue ?? t.sellValue ?? t.valAcq ?? t.val ?? t.value);
        return {
          id: `pit-live-${t.symbol || idx}-${idx}`,
          date: t.date || t.intimDt || t.acqtoDt || t.acqfromDt || t.acqDate || t.broadcastDate || t.anexDate || new Date().toISOString().split('T')[0],
          symbol: t.symbol,
          companyName: t.company || t.companyName || t.symbol,
          personName: t.acqName || t.acquirerName || t.personName || 'Promoter / Key Person',
          personCategory: t.personCategory || t.category || t.buyerCategory || 'Promoter',
          transactionType: t.tdpTransactionType || t.transactionType || t.typeOfSecurity || 'Unknown',
          sharesTraded: toNum(t.secAcq ?? t.buyQuantity ?? t.sellQuantity ?? t.noOfShares ?? t.quantity),
          valueLakh: Math.round((valueInr / 100000) * 100) / 100,
          postHoldingPct: toNum(t.afterAcqSharesPer ?? t.postHoldingPct),
          modeOfAcquisition: t.acqMode || t.modeOfAcquisition || t.acquisitionMode || '—',
        };
      });

    try {
      const buildEndpointsForAnchor = (anchor: Date) => {
        const to = new Date(anchor);
        const from30 = new Date(anchor);
        from30.setDate(from30.getDate() - 30);
        const from90 = new Date(anchor);
        from90.setDate(from90.getDate() - 90);
        return [
          `/api/corporates-pit?index=equities&from_date=${this.formatNseApiDate(from30)}&to_date=${this.formatNseApiDate(to)}`,
          `/api/corporates-pit?index=equities&from_date=${this.formatNseApiDate(from90)}&to_date=${this.formatNseApiDate(to)}`,
        ];
      };

      // NSE PIT often lags / has no rows for future-skewed host clocks — walk back calendar years
      const endpoints: string[] = [];
      const now = new Date();
      for (const yearsBack of [0, 1, 2]) {
        const anchor = new Date(now);
        anchor.setFullYear(anchor.getFullYear() - yearsBack);
        endpoints.push(...buildEndpointsForAnchor(anchor));
      }
      endpoints.push('/api/corporates-pit?index=equities');

      let rows: any[] = [];
      for (const endpoint of endpoints) {
        try {
          const rawPit = await this.fetchNseApi(
            endpoint,
            'https://www.nseindia.com/companies-listing/corporate-filings-insider-trading',
          );
          const candidate = Array.isArray(rawPit?.data)
            ? rawPit.data
            : Array.isArray(rawPit)
              ? rawPit
              : [];
          if (candidate.length > 0) {
            rows = candidate;
            this.logger.log(`Insider PIT hit ${candidate.length} rows via ${endpoint}`);
            break;
          }
        } catch (err: any) {
          this.logger.warn(`Insider endpoint ${endpoint} failed: ${err?.message || err}`);
        }
      }

      if (rows.length > 0) {
        const livePit = mapPitRows(rows);
        const result = {
          lastUpdated: new Date().toISOString(),
          source: 'SEBI_PIT_REGULATION_DISCLOSURES',
          totalTransactions: livePit.length,
          totalBuyValueLakh: livePit
            .filter((t: any) => /purchase|buy|acquisition|acqui|subscri/i.test(String(t.transactionType)))
            .reduce((a: number, b: any) => a + b.valueLakh, 0),
          totalSellValueLakh: livePit
            .filter((t: any) => /sale|sell|disposal|dispos/i.test(String(t.transactionType)))
            .reduce((a: number, b: any) => a + b.valueLakh, 0),
          transactions: livePit,
        };
        this.insiderTradingCache = { timestamp: Date.now(), data: result };
        return result;
      }
    } catch (err: any) {
      this.logger.warn(`Insider trading fetch failed: ${err?.message || err}`);
    }

    const empty = {
      lastUpdated: new Date().toISOString(),
      source: 'SEBI_PIT_REGULATION_DISCLOSURES',
      marketSession: 'Standby',
      message: 'No new insider trading filings recorded for the current trading cycle.',
      totalTransactions: 0,
      totalBuyValueLakh: 0,
      totalSellValueLakh: 0,
      transactions: [],
    };
    // Short TTL on empty so a later filing cycle is picked up quickly
    this.insiderTradingCache = { timestamp: Date.now() - TTL + 60_000, data: empty };
    return empty;
  }

  // ── 5. IPO Tracker & Subscription Multiples Calendar ──────────────────
  private ipoTrackerCache: { timestamp: number; data: any } | null = null;

  private normalizeIpoStatus(raw: string, listingDate?: string): 'Upcoming' | 'Live Bidding' | 'Closed' | 'Listed' {
    const s = String(raw || '').trim();
    const list = String(listingDate || '').trim();
    if (list && list !== '-' && /\d/.test(list)) return 'Listed';
    if (/active|open|live|bid/i.test(s)) return 'Live Bidding';
    if (/upcom|forthcoming|new/i.test(s)) return 'Upcoming';
    if (/list/i.test(s)) return 'Listed';
    if (/close|clos|past/i.test(s)) return 'Closed';
    // Past feed rows without status: listing date already handled; else closed/bidding window over
    if (!s) return list && list !== '-' ? 'Listed' : 'Closed';
    return 'Upcoming';
  }

  private parseIpoSeries(raw: string | undefined): 'Mainboard' | 'SME' {
    const s = String(raw || '').toUpperCase();
    return s === 'SM' || s === 'SME' || s.includes('SME') ? 'SME' : 'Mainboard';
  }

  private parseIpoIssueSizeCr(item: any): number {
    const shares = Number(item.issueSize || item.noOfSharesOffered || 0);
    const band = String(item.issuePrice || item.priceRange || '');
    const nums = band.match(/(\d+(?:\.\d+)?)/g)?.map(Number).filter((n) => Number.isFinite(n) && n > 0) || [];
    const mid = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0] || 0;
    if (shares > 0 && mid > 0) {
      // NSE issueSize is share count; convert to ₹ Cr
      return Math.round(((shares * mid) / 1e7) * 100) / 100;
    }
    if (shares > 0 && shares < 1e5) {
      // Already looks like ₹ Cr
      return Math.round(shares * 100) / 100;
    }
    return 0;
  }

  async getIpoTracker(refresh = false): Promise<any> {
    const TTL = 10 * 60 * 1000;
    if (!refresh && this.ipoTrackerCache && Date.now() - this.ipoTrackerCache.timestamp < TTL) {
      return this.ipoTrackerCache.data;
    }

    const referer = 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo';
    const bySymbol = new Map<string, any>();

    const upsert = (ipo: any, priority: number) => {
      const key = String(ipo.symbol || ipo.companyName || '').toUpperCase();
      if (!key) return;
      const prev = bySymbol.get(key);
      if (!prev || priority >= (prev._priority || 0)) {
        bySymbol.set(key, { ...ipo, _priority: priority });
      }
    };

    try {
      const to = new Date();
      const from90 = new Date();
      from90.setDate(from90.getDate() - 90);
      const fromDate = this.formatNseApiDate(from90);
      const toDate = this.formatNseApiDate(to);

      const [currentRaw, upcomingRaw, pastRaw] = await Promise.all([
        this.fetchNseApi('/api/ipo-current-issue', referer).catch(() => null),
        this.fetchNseApi('/api/all-upcoming-issues?category=ipo', referer).catch(() => null),
        this.fetchNseApi(
          `/api/public-past-issues?from_date=${fromDate}&to_date=${toDate}`,
          referer,
        ).catch(() => null),
      ]);

      const currentRows = Array.isArray(currentRaw) ? currentRaw : [];
      const upcomingRows = Array.isArray(upcomingRaw) ? upcomingRaw : [];
      const pastRows = Array.isArray(pastRaw) ? pastRaw : [];

      // Live bidding (Active) — may include category Total row with subscription
      for (const [idx, item] of currentRows.entries()) {
        const subscriptionTimes = item.noOfTime ? Math.round(parseFloat(item.noOfTime) * 100) / 100 : 0;
        upsert(
          {
            id: `ipo-live-${item.symbol || idx}`,
            companyName: item.companyName || item.symbol,
            symbol: item.symbol,
            series: this.parseIpoSeries(item.series || item.securityType),
            priceBand: item.issuePrice || item.priceRange || 'TBD',
            lotSize: Number(item.lotSize || 0) || 50,
            issueSizeCr: this.parseIpoIssueSizeCr(item),
            openDate: item.issueStartDate || '',
            closeDate: item.issueEndDate || '',
            listingDate: undefined,
            status: this.normalizeIpoStatus(item.status || 'Active'),
            subscriptionMultiples: {
              qib: 0,
              niiHni: 0,
              retail: 0,
              total: subscriptionTimes,
            },
            gmpEstimate: subscriptionTimes > 1 ? `Demand ${subscriptionTimes}x` : '-',
          },
          30,
        );
      }

      // Upcoming + Active from all-upcoming-issues (Forthcoming / Active)
      for (const [idx, item] of upcomingRows.entries()) {
        const status = this.normalizeIpoStatus(item.status || 'Forthcoming');
        upsert(
          {
            id: `ipo-upc-${item.symbol || idx}`,
            companyName: item.companyName || item.symbol,
            symbol: item.symbol,
            series: this.parseIpoSeries(item.series || item.securityType),
            priceBand: item.issuePrice || item.priceRange || 'TBD',
            lotSize: Number(item.lotSize || 0) || 50,
            issueSizeCr: this.parseIpoIssueSizeCr(item),
            openDate: item.issueStartDate || '',
            closeDate: item.issueEndDate || '',
            listingDate: undefined,
            status,
            subscriptionMultiples: {
              qib: 0,
              niiHni: 0,
              retail: 0,
              total: item.noOfTime ? Math.round(parseFloat(item.noOfTime) * 100) / 100 : 0,
            },
            gmpEstimate: '-',
          },
          status === 'Live Bidding' ? 25 : 20,
        );
      }

      // Past 90d — Listed when listingDate present, else Closed
      for (const [idx, item] of pastRows.entries()) {
        const listingDate = item.listingDate && item.listingDate !== '-' ? String(item.listingDate).trim() : undefined;
        const status = this.normalizeIpoStatus('', listingDate);
        upsert(
          {
            id: `ipo-past-${item.symbol || idx}`,
            companyName: item.company || item.companyName || item.symbol,
            symbol: item.symbol,
            series: this.parseIpoSeries(item.securityType || item.series),
            priceBand: item.priceRange || (item.issuePrice && item.issuePrice !== '-' ? `₹${String(item.issuePrice).trim()}` : 'TBD'),
            lotSize: 0,
            issueSizeCr: 0,
            openDate: item.ipoStartDate || item.issueStartDate || '',
            closeDate: item.ipoEndDate || item.issueEndDate || '',
            listingDate,
            status,
            subscriptionMultiples: { qib: 0, niiHni: 0, retail: 0, total: 0 },
            gmpEstimate: '-',
          },
          10,
        );
      }

      // Enrich live IPOs with category-wise bid multiples from ipo-detail
      const liveSymbols = Array.from(bySymbol.values())
        .filter((i) => i.status === 'Live Bidding' && i.symbol)
        .slice(0, 8);

      await this.mapPool(liveSymbols, 3, async (ipo) => {
        try {
          const series = ipo.series === 'SME' ? 'SM' : 'EQ';
          const detail = await this.fetchNseApi(
            `/api/ipo-detail?symbol=${encodeURIComponent(ipo.symbol)}&series=${series}`,
            referer,
          );
          const bids = Array.isArray(detail?.bidDetails) ? detail.bidDetails : [];
          const pick = (re: RegExp) => {
            const row = bids.find((b: any) => re.test(String(b.category || '')));
            return row?.noOfTime != null ? Math.round(parseFloat(row.noOfTime) * 100) / 100 : 0;
          };
          const qib = pick(/qib|qualified/i);
          const niiHni = pick(/nii|hni|non.?inst/i);
          const retail = pick(/retail|individual/i);
          const totalRow = bids.find((b: any) => /total|overall/i.test(String(b.category || '')));
          const total =
            totalRow?.noOfTime != null
              ? Math.round(parseFloat(totalRow.noOfTime) * 100) / 100
              : ipo.subscriptionMultiples?.total || Math.max(qib, niiHni, retail);

          const issueInfo = Array.isArray(detail?.issueInfo) ? detail.issueInfo : [];
          const lotRow = issueInfo.find((r: any) => /lot/i.test(String(r.name || r.key || '')));
          const lotSize = lotRow ? Number(String(lotRow.value || '').replace(/,/g, '')) : ipo.lotSize;

          const key = String(ipo.symbol).toUpperCase();
          const prev = bySymbol.get(key);
          if (prev) {
            bySymbol.set(key, {
              ...prev,
              lotSize: Number.isFinite(lotSize) && lotSize > 0 ? lotSize : prev.lotSize,
              subscriptionMultiples: { qib, niiHni, retail, total },
              gmpEstimate: total > 1 ? `Demand ${total}x` : prev.gmpEstimate,
            });
          }
        } catch (err: any) {
          this.logger.warn(`IPO detail enrich ${ipo.symbol} failed: ${err?.message || err}`);
        }
      });
    } catch (err: any) {
      this.logger.warn(`Live NSE IPO fetch failed: ${err.message}`);
    }

    const ipos = Array.from(bySymbol.values())
      .map(({ _priority, ...rest }) => rest)
      .sort((a, b) => {
        const rank = (s: string) =>
          s === 'Live Bidding' ? 0 : s === 'Upcoming' ? 1 : s === 'Listed' ? 2 : 3;
        const d = rank(a.status) - rank(b.status);
        if (d !== 0) return d;
        return String(b.openDate || '').localeCompare(String(a.openDate || ''));
      });

    const counts = {
      liveBidding: ipos.filter((i) => i.status === 'Live Bidding').length,
      upcoming: ipos.filter((i) => i.status === 'Upcoming').length,
      listed: ipos.filter((i) => i.status === 'Listed').length,
      closed: ipos.filter((i) => i.status === 'Closed').length,
    };

    const result = {
      lastUpdated: new Date().toISOString(),
      source: ipos.length ? 'NSE_IPO_CURRENT_UPCOMING_PAST' : 'UNAVAILABLE',
      dataSource:
        'NSE /api/ipo-current-issue + /api/all-upcoming-issues?category=ipo + /api/public-past-issues (90d)',
      totalIpos: ipos.length,
      counts,
      ipos,
      message: ipos.length
        ? undefined
        : 'No IPO issues returned from NSE current/upcoming/past feeds.',
    };

    this.ipoTrackerCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 6. Standalone Dividend & Corporate Actions Calendar ───────────────
  private dividendsCache: { timestamp: number; data: any } | null = null;
  async getDividendsCalendar(refresh = false): Promise<any> {
    const TTL = 10 * 60 * 1000;
    if (!refresh && this.dividendsCache && Date.now() - this.dividendsCache.timestamp < TTL) {
      return this.dividendsCache.data;
    }

    try {
      const corpActions = await this.fetchNseApi('/api/corporates-corporateActions?index=equities');
      if (Array.isArray(corpActions) && corpActions.length > 0) {
        const liveDividends = corpActions
          .filter((a: any) => {
            const sub = (a.subject || '').toLowerCase();
            return (
              sub.includes('dividend') ||
              sub.includes('bonus') ||
              sub.includes('split') ||
              sub.includes('sub-division') ||
              sub.includes('rights')
            );
          })
          .slice(0, 50)
          .map((a: any, idx: number) => {
            const sub = a.subject || '';
            let actionType = 'Dividend';
            if (/bonus/i.test(sub)) actionType = 'Bonus Issue';
            else if (/split|sub-division/i.test(sub)) actionType = 'Stock Split';
            else if (/rights/i.test(sub)) actionType = 'Rights Issue';

            // Extract numeric dividend per share if present
            const divMatch = sub.match(/(?:rs\.?|inr|re\.?)\s*([\d.]+)/i);
            const dividendPerShare = divMatch ? parseFloat(divMatch[1]) : undefined;

            return {
              id: `div-live-${a.symbol}-${idx}`,
              symbol: a.symbol,
              companyName: a.comp,
              actionType,
              exDate: a.exDate || '',
              recordDate: a.recDate || '',
              details: a.subject,
              dividendPerShare,
              dividendYieldPct: dividendPerShare ? Math.round((dividendPerShare / 500) * 10000) / 100 : undefined,
              series: a.series || 'EQ',
              faceVal: a.faceVal || '10',
            };
          });

        if (liveDividends.length > 0) {
          const result = {
            lastUpdated: new Date().toISOString(),
            source: 'NSE_LIVE_CORPORATE_ACTIONS_FEED',
            totalActions: liveDividends.length,
            corporateActions: liveDividends,
          };
          this.dividendsCache = { timestamp: Date.now(), data: result };
          return result;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Live NSE corporate actions fetch failed: ${err.message}`);
    }

    const result = {
      lastUpdated: new Date().toISOString(),
      source: 'NSE_CORPORATE_ACTIONS_DISCLOSURE',
      message: 'No corporate actions scheduled for current cycle or exchange sync in progress.',
      totalActions: 0,
      corporateActions: [],
    };

    this.dividendsCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 7. Sectoral Index Performance Heatmap & Rotation ──────────────────
  private sectorHeatmapCache: { timestamp: number; data: any } | null = null;
  async getSectorHeatmap(refresh = false): Promise<any> {
    const TTL = 5 * 60 * 1000;
    if (!refresh && this.sectorHeatmapCache && Date.now() - this.sectorHeatmapCache.timestamp < TTL) {
      return this.sectorHeatmapCache.data;
    }

    const BENCHMARK_DEF = { ticker: '^NSEI', name: 'Nifty 50 (Benchmark)', symbol: 'NIFTY 50' };
    const SECTOR_DEFS = [
      { ticker: '^CNXIT', name: 'Nifty IT', symbol: 'NIFTY IT' },
      { ticker: '^NSEBANK', name: 'Nifty Bank', symbol: 'NIFTY BANK' },
      { ticker: '^CNXAUTO', name: 'Nifty Auto', symbol: 'NIFTY AUTO' },
      { ticker: '^CNXPHARMA', name: 'Nifty Pharma', symbol: 'NIFTY PHARMA' },
      { ticker: '^CNXFMCG', name: 'Nifty FMCG', symbol: 'NIFTY FMCG' },
      { ticker: '^CNXMETAL', name: 'Nifty Metal', symbol: 'NIFTY METAL' },
      { ticker: '^CNXREALTY', name: 'Nifty Realty', symbol: 'NIFTY REALTY' },
      { ticker: '^CNXENERGY', name: 'Nifty Energy', symbol: 'NIFTY ENERGY' },
      { ticker: '^CNXFIN', name: 'Nifty Financial Services', symbol: 'NIFTY FIN SERVICE' },
      { ticker: '^CNXINFRA', name: 'Nifty Infrastructure', symbol: 'NIFTY INFRA' },
      { ticker: '^CNXMEDIA', name: 'Nifty Media', symbol: 'NIFTY MEDIA' },
    ];

    const allIndices = [BENCHMARK_DEF, ...SECTOR_DEFS];
    const candlesMap: Record<string, { closes: number[]; currentPrice?: number; previousClose?: number }> = {};

    await Promise.allSettled(
      allIndices.map(async (idx) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(idx.ticker)}?interval=1d&range=3mo`;
          const resp = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 FinanciallyFree/1.0',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(8000),
          });
          if (!resp.ok) return;
          const json = (await resp.json()) as any;
          const result = json?.chart?.result?.[0];
          const meta = result?.meta;
          const closesRaw = extractYahooCloses(result);
          const session = parseYahooSessionChange(meta, closesRaw);
          if (closesRaw.length > 0 || session) {
            const closes = session
              ? alignClosesWithSession(closesRaw.length ? closesRaw : [session.current], session)
              : closesRaw;
            candlesMap[idx.ticker] = {
              closes,
              currentPrice: session?.current || meta?.regularMarketPrice || closes[closes.length - 1],
              previousClose: session?.previousClose || closes[closes.length - 2] || closes[0],
            };
          }
        } catch {}
      }),
    );

    const benchmarkCandles = candlesMap[BENCHMARK_DEF.ticker];
    const validSectorInputs: SectorCandleInput[] = SECTOR_DEFS.filter((sec) => {
      const data = candlesMap[sec.ticker];
      return data && data.closes && data.closes.length > 0;
    }).map((sec) => {
      const data = candlesMap[sec.ticker]!;
      return {
        ticker: sec.ticker,
        name: sec.name,
        symbol: sec.symbol,
        closes: data.closes,
        currentPrice: data.currentPrice,
        previousClose: data.previousClose,
      };
    });

    if (!benchmarkCandles || benchmarkCandles.closes.length === 0 || validSectorInputs.length === 0) {
      const emptyResult = {
        lastUpdated: new Date().toISOString(),
        source: 'YAHOO_FINANCE_SECTOR_ROTATION',
        isLive: false,
        totalSectors: 0,
        benchmark: null,
        sectors: [],
        topLeadingSectors: [],
        topLaggingSectors: [],
        quadrantSummary: { leading: 0, weakening: 0, lagging: 0, improving: 0 },
        message: 'Sectoral candle feeds currently synchronizing with live market.',
      };
      this.sectorHeatmapCache = { timestamp: Date.now(), data: emptyResult };
      return emptyResult;
    }

    const benchmarkInput: SectorCandleInput = {
      ticker: BENCHMARK_DEF.ticker,
      name: BENCHMARK_DEF.name,
      symbol: BENCHMARK_DEF.symbol,
      closes: benchmarkCandles.closes,
      currentPrice: benchmarkCandles.currentPrice,
      previousClose: benchmarkCandles.previousClose,
    };

    const rotationResult = analyzeSectorRotation(benchmarkInput, validSectorInputs);
    const isLive = Object.keys(candlesMap).length >= 5;

    const result = {
      lastUpdated: new Date().toISOString(),
      source: 'YAHOO_FINANCE_LIVE_3MO_CANDLES',
      isLive,
      totalSectors: rotationResult.sectors.length,
      benchmark: rotationResult.benchmark,
      sectors: rotationResult.sectors,
      topLeadingSectors: rotationResult.topLeadingSectors,
      topLaggingSectors: rotationResult.topLaggingSectors,
      quadrantSummary: rotationResult.quadrantSummary,
      methodologyNotice: rotationResult.methodologyNotice,
    };

    this.sectorHeatmapCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 8. 52-Week High Momentum + Delivery % Screener ────────────────────
  private deliveryMomentumCache: { timestamp: number; data: any } | null = null;
  async getDeliveryMomentum(refresh = false): Promise<any> {
    const TTL = 5 * 60 * 1000;
    if (!refresh && this.deliveryMomentumCache && Date.now() - this.deliveryMomentumCache.timestamp < TTL) {
      return this.deliveryMomentumCache.data;
    }

    // 1) Official NSE full bhavcopy → real DELIV_PER for EQ series
    const bhav = await this.fetchLatestEquityDeliveryBhavcopy();
    const deliveryBySymbol = new Map(
      (bhav?.rows || []).map((r) => [r.symbol, r] as const),
    );

    // 2) Live movers (most-active + volume gainers), equity-only
    const liveBySymbol = new Map<
      string,
      { symbol: string; companyName: string; sector: string; cmp: number; dayChangePct: number; yearHigh?: number; tradedVolume: number }
    >();

    const ingestLive = (rows: any[]) => {
      for (const r of rows) {
        const symbol = String(r.symbol || '').toUpperCase().trim();
        const companyName = String(r.companyName || r.meta?.companyName || symbol);
        if (!symbol || this.isNonCashEquitySymbol(symbol, companyName)) continue;
        const cmp = Number(r.lastPrice || r.ltp || r.closePrice || 0);
        liveBySymbol.set(symbol, {
          symbol,
          companyName,
          sector: String(r.meta?.industry || r.industry || 'Equities'),
          cmp,
          dayChangePct: Number(r.pChange || r.change || 0),
          yearHigh: r.yearHigh != null ? Number(r.yearHigh) : undefined,
          tradedVolume: Number(r.totalTradedVolume || r.quantityTraded || r.volume || 0),
        });
      }
    };

    try {
      const [byVol, byVal, gainers] = await Promise.all([
        this.fetchNseApi('/api/live-analysis-most-active-securities?index=volume').catch(() => null),
        this.fetchNseApi('/api/live-analysis-most-active-securities?index=value').catch(() => null),
        this.fetchNseApi('/api/live-analysis-volume-gainers').catch(() => null),
      ]);
      ingestLive(Array.isArray(byVol?.data) ? byVol.data : []);
      ingestLive(Array.isArray(byVal?.data) ? byVal.data : []);
      ingestLive(Array.isArray(gainers?.data) ? gainers.data : Array.isArray(gainers) ? gainers : []);
    } catch {}

    // Candidate set: high-delivery names from bhavcopy + live actives
    const highDelivery = (bhav?.rows || [])
      .filter((r) => (r.deliveryPct ?? 0) >= 50 && r.volume >= 100000)
      .sort((a, b) => b.turnoverLacs - a.turnoverLacs)
      .slice(0, 60);

    const candidateSymbols = new Set<string>([
      ...highDelivery.map((r) => r.symbol),
      ...Array.from(liveBySymbol.keys()).slice(0, 40),
    ]);

    // Pad with Nifty universe if feed thin
    if (candidateSymbols.size < 25) {
      const universe = await this.loadNseEquityUniverse(50);
      for (const u of universe) {
        if (!this.isNonCashEquitySymbol(u.symbol, u.name)) candidateSymbols.add(u.symbol);
      }
    }

    const candidates = Array.from(candidateSymbols).map((symbol) => {
      const live = liveBySymbol.get(symbol);
      const del = deliveryBySymbol.get(symbol);
      return {
        symbol,
        companyName: live?.companyName || symbol,
        sector: live?.sector || 'Equities',
        cmp: live?.cmp || del?.close || 0,
        dayChangePct: live?.dayChangePct || 0,
        yearHigh: live?.yearHigh,
        deliveryPct: del?.deliveryPct ?? null,
        deliveryVolume: del?.deliveryQty ?? null,
        tradedVolume: live?.tradedVolume || del?.volume || 0,
      };
    });

    const stocks = (
      await this.mapPool(candidates, 6, async (row) => {
        let week52High = row.yearHigh || 0;
        let cmp = row.cmp;
        let dayChangePct = row.dayChangePct;
        let volume = row.tradedVolume;

        // Prefer Yahoo when NSE yearHigh missing or CMP missing
        if (!week52High || !cmp) {
          const detail = await this.fetchLiveStockDetail(`${row.symbol}.NS`);
          cmp = detail?.cmp || cmp || 0;
          week52High = detail?.week52High || week52High || 0;
          dayChangePct = detail?.dayChangePct ?? dayChangePct;
          volume = volume || detail?.volume || 0;
        }
        if (!cmp || !week52High) return null;

        const distFromHighPct = Math.round(((week52High - cmp) / week52High) * 10000) / 100;
        if (distFromHighPct > 10 || distFromHighPct < -1) return null;

        return {
          symbol: row.symbol,
          companyName: row.companyName,
          sector: row.sector,
          cmp,
          dayChangePct,
          distFromHighPct: Math.max(0, distFromHighPct),
          week52High,
          deliveryPct: row.deliveryPct,
          tradedVolume: volume,
          deliveryVolume: row.deliveryVolume,
          deliveryTo30dAvgRatio: null,
          verdict:
            distFromHighPct <= 2
              ? 'Near 52W High'
              : distFromHighPct <= 5
                ? 'Approaching High'
                : 'Within 10%',
        };
      })
    )
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => {
        // Prefer rows with real delivery %, then nearest highs
        const da = a.deliveryPct == null ? -1 : a.deliveryPct;
        const db = b.deliveryPct == null ? -1 : b.deliveryPct;
        if (db !== da) return db - da;
        return a.distFromHighPct - b.distFromHighPct;
      })
      .slice(0, 80);

    const withDelivery = stocks.filter((s) => s.deliveryPct != null).length;
    const result = {
      lastUpdated: new Date().toISOString(),
      source: stocks.length
        ? bhav
          ? 'NSE_BHAVCOPY_DELIVERY_PLUS_LIVE_ACTIVES'
          : 'NSE_LIVE_ACTIVES_PLUS_YAHOO_52W'
        : 'UNAVAILABLE',
      dataSource: bhav
        ? `NSE full bhavcopy DELIV_PER (as of ${bhav.asOf}) + most-active/volume-gainers + 52W proximity`
        : 'NSE most-active/volume-gainers + Yahoo 52W (bhavcopy delivery unavailable)',
      bhavcopyAsOf: bhav?.asOf,
      totalStocks: stocks.length,
      stocksWithDeliveryPct: withDelivery,
      stocks,
      message:
        stocks.length === 0
          ? 'No equity names currently within 10% of 52-week highs.'
          : undefined,
    };

    if (stocks.length > 0) {
      this.deliveryMomentumCache = { timestamp: Date.now(), data: result };
    }
    return result;
  }

  // ── 9. Circuit Filter Watch (Upper & Lower Circuit Stocks) ────────────
  private circuitBreakersCache: { timestamp: number; data: any } | null = null;
  async getCircuitBreakers(refresh = false): Promise<any> {
    const TTL = 15 * 60 * 1000;
    if (!refresh && this.circuitBreakersCache && Date.now() - this.circuitBreakersCache.timestamp < TTL) {
      return this.circuitBreakersCache.data;
    }

    try {
      const rawCircuits = await this.fetchNseApi(
        '/api/live-analysis-price-band-hitter',
        'https://www.nseindia.com/market-data/live-equity-market',
      );

      const upperRows =
        rawCircuits?.upper?.AllSec?.data ||
        rawCircuits?.upper?.['20']?.data ||
        rawCircuits?.upper?.['10']?.data ||
        (Array.isArray(rawCircuits?.upper) ? rawCircuits.upper : []) ||
        [];
      const lowerRows =
        rawCircuits?.lower?.AllSec?.data ||
        rawCircuits?.lower?.['20']?.data ||
        rawCircuits?.lower?.['5']?.data ||
        (Array.isArray(rawCircuits?.lower) ? rawCircuits.lower : []) ||
        [];

      if (upperRows.length > 0 || lowerRows.length > 0) {
        const upper = upperRows.map((s: any) => ({
          symbol: s.symbol,
          companyName: s.companyName || s.symbol,
          cmp: Number(s.ltp || s.lastPrice || 0),
          circuitBandPct: Number(s.priceBand || s.band || 5),
          dayChangePct: Number(String(s.pChange || '0').replace(/\s/g, '') || 0),
          pendingBuyQty: Number(s.pendingBuyQty || 0),
          consecutiveDays: Number(s.consecutiveDays || 1),
          turnoverCr: Number(s.turnover || s.turnoverCr || 0),
        }));
        const lower = lowerRows.map((s: any) => ({
          symbol: s.symbol,
          companyName: s.companyName || s.symbol,
          cmp: Number(s.ltp || s.lastPrice || 0),
          circuitBandPct: Number(s.priceBand || s.band || 5),
          dayChangePct: Number(String(s.pChange || '0').replace(/\s/g, '') || 0),
          pendingSellQty: Number(s.pendingSellQty || 0),
          consecutiveDays: Number(s.consecutiveDays || 1),
          turnoverCr: Number(s.turnover || s.turnoverCr || 0),
        }));

        const result = {
          lastUpdated: new Date().toISOString(),
          source: 'NSE_PRICE_BAND_HITTER',
          upperCircuitsCount: upper.length,
          lowerCircuitsCount: lower.length,
          upperCircuits: upper,
          lowerCircuits: lower,
        };
        this.circuitBreakersCache = { timestamp: Date.now(), data: result };
        return result;
      }
    } catch (err: any) {
      this.logger.warn(`Circuit breakers fetch failed: ${err?.message || err}`);
    }

    const result = {
      lastUpdated: new Date().toISOString(),
      source: 'NSE_PRICE_BAND_HITTER',
      marketSession: 'Post-Market Standby',
      message: 'No circuit filter breaches reported for the current surveillance window.',
      upperCircuitsCount: 0,
      lowerCircuitsCount: 0,
      upperCircuits: [],
      lowerCircuits: [],
    };

    this.circuitBreakersCache = { timestamp: Date.now(), data: result };
    return result;
  }

  // ── 10. RBI Repo Rate & Macro Calendar ────────────────────────────────
  private rbiMacroCache: { timestamp: number; data: any } | null = null;
  async getRbiMacroCalendar(refresh = false): Promise<any> {
    const TTL = 30 * 60 * 1000;
    const NEGATIVE_TTL = 2 * 60 * 1000;
    const cached = this.rbiMacroCache?.data;
    const cacheAge = this.rbiMacroCache ? Date.now() - this.rbiMacroCache.timestamp : Infinity;
    if (
      !refresh &&
      this.rbiMacroCache &&
      cached?.source !== 'UNAVAILABLE' &&
      cached?.currentRates?.repoRate != null &&
      cacheAge < TTL
    ) {
      return cached;
    }
    if (!refresh && this.rbiMacroCache && cached?.source === 'UNAVAILABLE' && cacheAge < NEGATIVE_TTL) {
      return cached;
    }

    // Attempt lightweight public RBI policy page scrape; never emit fabricated policy rates
    try {
      const res = await fetch('https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const repoMatch = html.match(/Repo\s*Rate[^0-9%]*([0-9]+\.[0-9]+)\s*%/i)
          || html.match(/policy\s*repo\s*rate[^0-9%]*([0-9]+\.[0-9]+)\s*%/i);
        const repoRate = repoMatch ? parseFloat(repoMatch[1]) : null;
        const result = {
          lastUpdated: new Date().toISOString(),
          source: repoRate != null ? 'RBI_PRESS_RELEASES_LIVE' : 'UNAVAILABLE',
          currentRates: {
            repoRate,
            standingDepositFacility: null,
            marginalStandingFacility: null,
            bankRate: null,
            cashReserveRatio: null,
            statutoryLiquidityRatio: null,
          },
          nextMpcMeeting: null,
          policyStance: null,
          rateHistory: [],
          macroIndicators: null,
          message: repoRate != null ? undefined : 'Live RBI policy rates could not be parsed; no static calendar emitted.',
        };
        // Only long-cache successful parses; short-cache misses via NEGATIVE_TTL
        this.rbiMacroCache = { timestamp: Date.now(), data: result };
        return result;
      }
    } catch (err: any) {
      this.logger.warn(`RBI macro scrape failed: ${err?.message || err}`);
    }

    const result = {
      lastUpdated: new Date().toISOString(),
      source: 'UNAVAILABLE',
      currentRates: null,
      nextMpcMeeting: null,
      policyStance: null,
      rateHistory: [],
      macroIndicators: null,
      message: 'RBI macro calendar unavailable from live sources.',
    };
    this.rbiMacroCache = { timestamp: Date.now(), data: result };
    return result;
  }
}
