import { MarketIndexService } from './market-index.service';

describe('MarketIndexService (NSE/BSE Snapshots & Section 58)', () => {
  let service: MarketIndexService;

  beforeEach(() => {
    service = new MarketIndexService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns market overview with indices, India VIX, and Section 58 licensing notice', async () => {
    const overview = await service.getMarketOverview();

    expect(overview).toBeDefined();
    expect(overview.indices.length).toBeGreaterThanOrEqual(3);
    expect(overview.licensingNotice).toContain('Section 58');
    expect(overview.indiaVix).toBeGreaterThan(0);
    expect(overview.marketBreadth).toBeDefined();
    expect(overview.marketBreadth?.breadthPct).toBeGreaterThanOrEqual(0);
    expect(overview.marketBreadth?.breadthPct).toBeLessThanOrEqual(100);

    const nifty = overview.indices.find((i) => i.symbol === 'NIFTY 50');
    expect(nifty).toBeDefined();
    expect(nifty?.current).toBeGreaterThan(15000);
    expect(nifty?.delayedMinutes).toBe(15);
  }, 30000);

  it('caches market overview response for repeated calls', async () => {
    const first = await service.getMarketOverview();
    const second = await service.getMarketOverview();

    expect(second.isCached).toBe(true);
    expect(second.indices[0].current).toBe(first.indices[0].current);
  }, 30000);
});
