import { AppDataSource } from '../data-source';
import { InstrumentEntity } from '../entities/instrument.entity';

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

async function run() {
  console.log('Connecting to PostgreSQL database...');
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(InstrumentEntity);

  const expiries = ['2026-09-24', '2026-10-01', '2026-10-29'];
  const entities: Partial<InstrumentEntity>[] = [];

  for (const item of POPULAR_FO_SYMBOLS) {
    const atm = Math.round(item.spot / item.step) * item.step;

    for (const expiry of expiries) {
      // 15 strikes around ATM (-7 to +7)
      for (let offset = -7; offset <= 7; offset++) {
        const strike = atm + offset * item.step;

        // Call Option (CE)
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

        // Put Option (PE)
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

  console.log(`Inserting ${entities.length} options instruments...`);
  await repo.save(entities, { chunk: 100 });
  console.log('Done! Total instruments in DB:', await repo.count());
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
