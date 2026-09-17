import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstrumentDto, OptionType } from '@ff/types';
import { InstrumentEntity } from '../../database/entities/instrument.entity';

/**
 * Underlying metadata only (exchange lot/step conventions).
 * NO spot prices, NO expiry dates — those must come from live NSE/broker feeds.
 */
export const POPULAR_FO_SYMBOLS = [
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', lotSize: 25, step: 50, segment: 'INDICES' as const },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', lotSize: 15, step: 100, segment: 'INDICES' as const },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', lotSize: 40, step: 50, segment: 'INDICES' as const },
  { symbol: 'MIDCPNIFTY', name: 'NIFTY Midcap Select', lotSize: 75, step: 25, segment: 'INDICES' as const },
  { symbol: 'SENSEX', name: 'BSE SENSEX Index', lotSize: 10, step: 100, segment: 'INDICES' as const },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', lotSize: 250, step: 20, segment: 'EQUITY' as const },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', lotSize: 550, step: 10, segment: 'EQUITY' as const },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', lotSize: 700, step: 10, segment: 'EQUITY' as const },
  { symbol: 'INFY', name: 'Infosys Ltd', lotSize: 400, step: 10, segment: 'EQUITY' as const },
  { symbol: 'TCS', name: 'Tata Consultancy Services', lotSize: 175, step: 20, segment: 'EQUITY' as const },
  { symbol: 'SBIN', name: 'State Bank of India', lotSize: 750, step: 5, segment: 'EQUITY' as const },
];

@Injectable()
export class InstrumentsService implements OnModuleInit {
  private readonly logger = new Logger(InstrumentsService.name);

  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly instrumentRepo: Repository<InstrumentEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.instrumentRepo.count();
    this.logger.log(
      `Instruments table has ${count} row(s). Option contracts are populated from live NSE/broker chains — no static seed expiries or spots.`,
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

  async getUnderlyingSymbols(): Promise<Array<{ symbol: string; name: string; lotSize: number; segment: string }>> {
    return POPULAR_FO_SYMBOLS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      lotSize: s.lotSize,
      segment: s.segment,
    }));
  }

  /**
   * Upsert contracts discovered from a live option chain (NSE / broker).
   * Never invents strikes or expiries — only persists what the feed returned.
   */
  async upsertFromLiveChain(params: {
    symbol: string;
    expiry: string;
    contracts: Array<{ strike: number; ceToken?: string; peToken?: string }>;
    lotSize?: number;
  }): Promise<number> {
    const symbol = params.symbol.toUpperCase();
    const meta = POPULAR_FO_SYMBOLS.find((s) => s.symbol === symbol);
    const lotSize = params.lotSize ?? meta?.lotSize ?? 50;
    const exchange = symbol === 'SENSEX' ? 'BFO' : 'NFO';
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

    // Deactivate prior rows for this symbol+expiry, then save live set
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
      updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
