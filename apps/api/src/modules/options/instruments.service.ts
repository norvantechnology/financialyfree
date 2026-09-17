import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstrumentDto, OptionType } from '@ff/types';
import { InstrumentEntity } from '../../database/entities/instrument.entity';

export const POPULAR_FO_SYMBOLS = [
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', lotSize: 25, step: 50, spot: 25150, segment: 'INDICES' as const },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', lotSize: 15, step: 100, spot: 52350, segment: 'INDICES' as const },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', lotSize: 25, step: 50, spot: 23800, segment: 'INDICES' as const },
  { symbol: 'SENSEX', name: 'BSE SENSEX Index', lotSize: 10, step: 100, spot: 82400, segment: 'INDICES' as const },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', lotSize: 250, step: 20, spot: 2950, segment: 'EQUITY' as const },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', lotSize: 550, step: 10, spot: 1640, segment: 'EQUITY' as const },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', lotSize: 700, step: 10, spot: 1210, segment: 'EQUITY' as const },
  { symbol: 'INFY', name: 'Infosys Ltd', lotSize: 400, step: 10, spot: 1940, segment: 'EQUITY' as const },
  { symbol: 'TCS', name: 'Tata Consultancy Services', lotSize: 175, step: 20, spot: 4320, segment: 'EQUITY' as const },
  { symbol: 'SBIN', name: 'State Bank of India', lotSize: 750, step: 5, spot: 815, segment: 'EQUITY' as const },
];

@Injectable()
export class InstrumentsService implements OnModuleInit {
  private readonly logger = new Logger(InstrumentsService.name);

  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly instrumentRepo: Repository<InstrumentEntity>,
  ) {}

  async onModuleInit() {
    // Seed initial active contracts if table is empty
    const count = await this.instrumentRepo.count();
    if (count === 0) {
      this.logger.log('Initializing F&O instruments master catalog in PostgreSQL...');
      await this.seedInitialInstruments();
    }
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

  async seedInitialInstruments(): Promise<number> {
    const expiries = ['2026-09-24', '2026-10-01', '2026-10-29'];
    const entities: Partial<InstrumentEntity>[] = [];

    for (const item of POPULAR_FO_SYMBOLS) {
      const atm = Math.round(item.spot / item.step) * item.step;

      for (const expiry of expiries) {
        // Create 15 strikes around ATM
        for (let offset = -7; offset <= 7; offset++) {
          const strike = atm + offset * item.step;

          // Call Option
          entities.push({
            instrumentToken: `NFO_${item.symbol}_${expiry}_${strike}_CE`,
            exchange: item.symbol === 'SENSEX' ? 'BFO' : 'NFO',
            segment: item.segment === 'INDICES' ? 'INDICES' : 'OPT',
            symbol: item.symbol,
            name: `${item.symbol} ${expiry} ${strike} CE`,
            expiry,
            strike,
            optionType: 'CE',
            lotSize: item.lotSize,
            tickSize: 0.05,
            isActive: true,
          });

          // Put Option
          entities.push({
            instrumentToken: `NFO_${item.symbol}_${expiry}_${strike}_PE`,
            exchange: item.symbol === 'SENSEX' ? 'BFO' : 'NFO',
            segment: item.segment === 'INDICES' ? 'INDICES' : 'OPT',
            symbol: item.symbol,
            name: `${item.symbol} ${expiry} ${strike} PE`,
            expiry,
            strike,
            optionType: 'PE',
            lotSize: item.lotSize,
            tickSize: 0.05,
            isActive: true,
          });
        }
      }
    }

    await this.instrumentRepo.save(entities, { chunk: 100 });
    this.logger.log(`Successfully seeded ${entities.length} F&O instruments.`);
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
