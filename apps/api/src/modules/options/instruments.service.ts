import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { gunzipSync } from 'zlib';
import { InstrumentDto, OptionType } from '@ff/types';
import { InstrumentEntity } from '../../database/entities/instrument.entity';

export type FoUnderlyingMeta = {
  symbol: string;
  name: string;
  lotSize: number;
  step: number;
  segment: 'INDICES' | 'EQUITY';
  exchange: 'NSE_FO' | 'BSE_FO';
};

/** Bootstrap UI labels only - lot/step always overwritten by live instrument master. */
const UNDERLYING_DISPLAY_NAMES: Record<string, string> = {
  NIFTY: 'NIFTY 50 Index',
  BANKNIFTY: 'NIFTY Bank Index',
  FINNIFTY: 'NIFTY Financial Services',
  MIDCPNIFTY: 'NIFTY Midcap Select',
  SENSEX: 'BSE SENSEX Index',
};

/**
 * Live F&O instrument metadata (lot size, strike step, underlyings).
 * Source: Upstox public complete instruments CSV (refreshed continuously on CDN).
 * No hardcoded lot sizes - those change when NSE/BSE revise contracts.
 */
@Injectable()
export class InstrumentsService implements OnModuleInit {
  private readonly logger = new Logger(InstrumentsService.name);
  private metaBySymbol = new Map<string, FoUnderlyingMeta>();
  private metaFetchedAt = 0;
  private metaInFlight: Promise<void> | null = null;

  private static readonly META_TTL_MS = 6 * 60 * 60 * 1000;
  private static readonly UPSTOX_COMPLETE_CSV =
    'https://assets.upstox.com/market-quote/instruments/exchange/complete.csv.gz';

  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly instrumentRepo: Repository<InstrumentEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.instrumentRepo.count();
    this.logger.log(
      `Instruments table has ${count} row(s). Lot sizes / underlyings load from live Upstox FO master.`,
    );
    void this.ensureLiveMeta().catch((e) =>
      this.logger.warn(`Initial FO meta fetch failed: ${(e as Error)?.message || e}`),
    );
  }

  async searchInstruments(query: {
    symbol?: string;
    expiry?: string;
    optionType?: OptionType;
    strike?: number;
  }): Promise<InstrumentDto[]> {
    const qb = this.instrumentRepo.createQueryBuilder('i').where('i.is_active = :isActive', { isActive: true });

    if (query.symbol) {
      qb.andWhere('i.symbol = :symbol', { symbol: query.symbol.toUpperCase() });
    }
    if (query.expiry) {
      qb.andWhere('i.expiry = :expiry', { expiry: query.expiry });
    }
    if (query.optionType) {
      qb.andWhere('i.option_type = :optionType', { optionType: query.optionType });
    }
    if (query.strike) {
      qb.andWhere('i.strike = :strike', { strike: query.strike });
    }

    const rows = await qb.limit(200).getMany();
    return rows.map((r) => this.mapToDto(r));
  }

  /**
   * Live underlyings with exchange lot size + derived strike step.
   * Prefer index options, then liquid equity options discovered from the master.
   */
  async getUnderlyingSymbols(): Promise<
    Array<{ symbol: string; name: string; lotSize: number; segment: string; step: number }>
  > {
    await this.ensureLiveMeta().catch(() => undefined);
    let all = Array.from(this.metaBySymbol.values());
    if (!all.length) {
      // Fallback: distinct live instruments already upserted from NSE chains
      const rows = await this.instrumentRepo
        .createQueryBuilder('i')
        .select('i.symbol', 'symbol')
        .addSelect('MAX(i.lot_size)', 'lotSize')
        .addSelect('MAX(i.segment)', 'segment')
        .where('i.is_active = :active', { active: true })
        .groupBy('i.symbol')
        .orderBy('i.symbol', 'ASC')
        .getRawMany<{ symbol: string; lotSize: string; segment: string }>();
      all = rows.map((r) => ({
        symbol: r.symbol,
        name: UNDERLYING_DISPLAY_NAMES[r.symbol] || r.symbol,
        lotSize: Math.max(1, Number(r.lotSize) || 1),
        step: 50,
        segment: (r.segment === 'INDICES' ? 'INDICES' : 'EQUITY') as 'INDICES' | 'EQUITY',
        exchange: (r.symbol === 'SENSEX' ? 'BSE_FO' : 'NSE_FO') as 'NSE_FO' | 'BSE_FO',
      }));
    }
    const indices = all
      .filter((m) => m.segment === 'INDICES')
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    const equity = all
      .filter((m) => m.segment === 'EQUITY')
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .slice(0, 40);
    return [...indices, ...equity].map((m) => ({
      symbol: m.symbol,
      name: m.name,
      lotSize: m.lotSize,
      segment: m.segment,
      step: m.step,
    }));
  }

  /** Live market lot for an underlying (contracts → shares). */
  async getLotSize(symbol: string): Promise<number> {
    await this.ensureLiveMeta();
    const hit = this.metaBySymbol.get((symbol || '').toUpperCase());
    if (hit && hit.lotSize > 0) return hit.lotSize;
    // Last resort: any active DB row for this symbol (previously upserted from live chain)
    const row = await this.instrumentRepo.findOne({
      where: { symbol: (symbol || '').toUpperCase(), isActive: true },
      order: { updatedAt: 'DESC' },
    });
    if (row?.lotSize && row.lotSize > 0) return row.lotSize;
    return 1;
  }

  /** Strike step derived from live FO strikes (never a static table). */
  async getStrikeStep(symbol: string): Promise<number> {
    await this.ensureLiveMeta();
    const hit = this.metaBySymbol.get((symbol || '').toUpperCase());
    if (hit && hit.step > 0) return hit.step;
    return 50;
  }

  getCachedLotSizeSync(symbol: string): number | null {
    const hit = this.metaBySymbol.get((symbol || '').toUpperCase());
    return hit?.lotSize && hit.lotSize > 0 ? hit.lotSize : null;
  }

  getCachedStepSync(symbol: string): number | null {
    const hit = this.metaBySymbol.get((symbol || '').toUpperCase());
    return hit?.step && hit.step > 0 ? hit.step : null;
  }

  /**
   * Upsert contracts discovered from a live option chain (NSE / broker).
   * Never invents strikes or expiries - only persists what the feed returned.
   */
  async upsertFromLiveChain(params: {
    symbol: string;
    expiry: string;
    contracts: Array<{ strike: number; ceToken?: string; peToken?: string }>;
    lotSize?: number;
  }): Promise<number> {
    const symbol = params.symbol.toUpperCase();
    await this.ensureLiveMeta().catch(() => undefined);
    const meta = this.metaBySymbol.get(symbol);
    const lotSize =
      (params.lotSize && params.lotSize > 0 ? params.lotSize : null) ||
      meta?.lotSize ||
      (await this.getLotSize(symbol));
    const exchange = meta?.exchange === 'BSE_FO' || symbol === 'SENSEX' ? 'BFO' : 'NFO';
    const segment = meta?.segment === 'INDICES' ? 'INDICES' : 'OPT';

    const entities: Partial<InstrumentEntity>[] = [];
    for (const c of params.contracts) {
      if (!c.strike || !params.expiry) continue;
      entities.push({
        instrumentToken: c.ceToken || `NFO_${symbol}_${params.expiry}_${c.strike}_CE`,
        exchange,
        segment,
        symbol,
        name: `${symbol} ${params.expiry} ${c.strike} CE`,
        expiry: params.expiry,
        strike: c.strike,
        optionType: 'CE',
        lotSize,
        tickSize: 0.05,
        isActive: true,
      });
      entities.push({
        instrumentToken: c.peToken || `NFO_${symbol}_${params.expiry}_${c.strike}_PE`,
        exchange,
        segment,
        symbol,
        name: `${symbol} ${params.expiry} ${c.strike} PE`,
        expiry: params.expiry,
        strike: c.strike,
        optionType: 'PE',
        lotSize,
        tickSize: 0.05,
        isActive: true,
      });
    }

    if (!entities.length) return 0;

    await this.instrumentRepo
      .createQueryBuilder()
      .update(InstrumentEntity)
      .set({ isActive: false })
      .where('symbol = :symbol AND expiry = :expiry', { symbol, expiry: params.expiry })
      .execute();

    await this.instrumentRepo.save(entities, { chunk: 100 });
    this.logger.debug(`Upserted ${entities.length} live instruments for ${symbol} ${params.expiry}`);
    return entities.length;
  }

  private async ensureLiveMeta(): Promise<void> {
    const age = Date.now() - this.metaFetchedAt;
    if (this.metaBySymbol.size > 0 && age < InstrumentsService.META_TTL_MS) return;
    if (this.metaInFlight) return this.metaInFlight;

    this.metaInFlight = this.fetchAndIndexUpstoxMaster()
      .catch((err) => {
        this.logger.warn(`Upstox FO master refresh failed: ${(err as Error)?.message || err}`);
        if (this.metaBySymbol.size === 0) {
          throw err;
        }
      })
      .finally(() => {
        this.metaInFlight = null;
      });
    return this.metaInFlight;
  }

  private async fetchAndIndexUpstoxMaster(): Promise<void> {
    const res = await fetch(InstrumentsService.UPSTOX_COMPLETE_CSV, {
      headers: { Accept: 'application/gzip,application/octet-stream,*/*' },
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`Upstox instruments HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const csv = gunzipSync(buf).toString('utf8');
    const indexed = this.parseFoMasterCsv(csv);
    if (indexed.size === 0) throw new Error('Upstox FO master parsed empty');
    this.metaBySymbol = indexed;
    this.metaFetchedAt = Date.now();
    this.logger.log(`Loaded live FO meta for ${indexed.size} underlyings from Upstox master`);
  }

  private parseFoMasterCsv(csv: string): Map<string, FoUnderlyingMeta> {
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) return new Map();

    const header = parseCsvLine(lines[0]).map(stripCsvQuotes);
    const idx = {
      name: header.indexOf('name'),
      tradingsymbol: header.indexOf('tradingsymbol'),
      lot_size: header.indexOf('lot_size'),
      strike: header.indexOf('strike'),
      instrument_type: header.indexOf('instrument_type'),
      exchange: header.indexOf('exchange'),
    };
    if (idx.lot_size < 0 || idx.instrument_type < 0 || idx.exchange < 0) {
      return new Map();
    }

    type Acc = {
      lots: Map<number, number>;
      strikes: number[];
      segment: 'INDICES' | 'EQUITY';
      exchange: 'NSE_FO' | 'BSE_FO';
      displayName: string;
    };
    const acc = new Map<string, Acc>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cols = parseCsvLine(line).map(stripCsvQuotes);
      const exchange = cols[idx.exchange] || '';
      if (exchange !== 'NSE_FO' && exchange !== 'BSE_FO') continue;
      const itype = cols[idx.instrument_type] || '';
      if (itype !== 'OPTIDX' && itype !== 'OPTSTK') continue;

      const lot = Number(cols[idx.lot_size]);
      const strike = Number(cols[idx.strike]);
      if (!Number.isFinite(lot) || lot <= 0) continue;

      const rawName = (cols[idx.name] || '').trim();
      const tsym = (cols[idx.tradingsymbol] || '').trim();
      const symbol =
        itype === 'OPTIDX'
          ? rawName.toUpperCase().replace(/\s+/g, '')
          : extractEquityUnderlying(tsym) || rawName.toUpperCase().split(/\s+/)[0];
      if (!symbol || symbol.length < 2) continue;

      let row = acc.get(symbol);
      if (!row) {
        row = {
          lots: new Map(),
          strikes: [],
          segment: itype === 'OPTIDX' ? 'INDICES' : 'EQUITY',
          exchange: exchange as 'NSE_FO' | 'BSE_FO',
          displayName: UNDERLYING_DISPLAY_NAMES[symbol] || rawName || symbol,
        };
        acc.set(symbol, row);
      }
      row.lots.set(lot, (row.lots.get(lot) || 0) + 1);
      if (Number.isFinite(strike) && strike > 0 && row.strikes.length < 80) {
        row.strikes.push(strike);
      }
    }

    const out = new Map<string, FoUnderlyingMeta>();
    for (const [symbol, row] of acc) {
      let bestLot = 0;
      let bestCount = 0;
      for (const [lot, count] of row.lots) {
        if (count > bestCount) {
          bestCount = count;
          bestLot = lot;
        }
      }
      const step = deriveStrikeStep(row.strikes);
      out.set(symbol, {
        symbol,
        name: row.displayName,
        lotSize: bestLot,
        step,
        segment: row.segment,
        exchange: row.exchange,
      });
    }
    return out;
  }

  private mapToDto(entity: InstrumentEntity): InstrumentDto {
    return {
      id: entity.id,
      instrumentToken: entity.instrumentToken,
      exchange: entity.exchange,
      segment: entity.segment,
      symbol: entity.symbol,
      name: entity.name,
      expiry: entity.expiry,
      strike: entity.strike ? Number(entity.strike) : null,
      optionType: entity.optionType,
      lotSize: entity.lotSize,
      tickSize: Number(entity.tickSize),
      isActive: entity.isActive,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      cur += ch;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function stripCsvQuotes(value: string): string {
  return (value || '').replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
}

function extractEquityUnderlying(tradingsymbol: string): string | null {
  // RELIANCE26OCT2500CE / HDFCBANK26SEP1700PE
  const m = /^([A-Z]+)(\d{2}[A-Z]{3}\d+)/.exec(tradingsymbol);
  return m?.[1] || null;
}

function deriveStrikeStep(strikes: number[]): number {
  if (strikes.length < 2) return 50;
  const uniq = Array.from(new Set(strikes.map((s) => Math.round(s)))).sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < uniq.length; i++) {
    const d = uniq[i] - uniq[i - 1];
    if (d > 0) diffs.push(d);
  }
  if (!diffs.length) return 50;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] || 50;
}
