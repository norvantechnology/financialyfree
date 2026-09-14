import { VahanEtlService } from './vahan-etl.service';

describe('VahanEtlService (VAHAN Dashboard ETL & Caching)', () => {
  let service: VahanEtlService;

  beforeEach(() => {
    service = new VahanEtlService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns structured Vahan payload; categories may be empty when not live-scraped', async () => {
    const data = await service.getVahanData();

    expect(data).toBeDefined();
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.topStates)).toBe(true);
    expect(data.dataSource).toContain('parivahan.gov.in');
    expect(data.refreshCadence).toContain('24h');
    expect(['LIVE_FETCH', 'UNAVAILABLE', 'STATIC_SEED']).toContain(data.mode);
  }, 15000);

  it('caches the Vahan payload across multiple calls', async () => {
    const first = await service.getVahanData();
    const second = await service.getVahanData();

    expect(first.retrievedAt).toBe(second.retrievedAt);
    if (first.topStates[0] && second.topStates[0]) {
      expect(first.topStates[0].totalRegistrations).toBe(second.topStates[0].totalRegistrations);
    }
  });

  it('persists daily scraped snapshots into vahan_snapshots and retrieves them correctly', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = await service.saveSnapshot({
      snapshotDate: today,
      category: '2W',
      label: 'Two-Wheelers (2W)',
      registrations: 1428500,
      recordedAt: new Date().toISOString(),
      isLiveScraped: true,
      source: 'parivahan.gov.in (Live Test)',
    });

    expect(saved).toBeDefined();
    expect(saved.id).toBe(`vsnap_${today}_2W`);
    expect(saved.registrations).toBe(1428500);

    const retrieved = await service.getSnapshots('2W');
    expect(retrieved.length).toBeGreaterThanOrEqual(1);
    const found = retrieved.find((s) => s.id === `vsnap_${today}_2W`);
    expect(found).toBeDefined();
    expect(found?.registrations).toBe(1428500);
  });

  it('returns "YoY trend building  insufficient historical data yet" when historical baseline < 12 months', async () => {
    const yoy = await service.computeYoY('2W', 1450000);
    expect(yoy.yoyChange).toBeNull();
    expect(yoy.yoyStatusText).toBe('YoY trend building  insufficient historical data yet');
    expect(yoy.isRealHistorical).toBe(false);
  });

  it('correctly calculates authentic YoY growth percentage when a 12-month historical snapshot exists', async () => {
    // Simulate a snapshot from ~365 days ago
    const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await service.saveSnapshot({
      snapshotDate: pastDate,
      category: 'PV',
      label: 'Passenger Vehicles (PV)',
      registrations: 300000,
      recordedAt: new Date().toISOString(),
      isLiveScraped: true,
      source: 'parivahan.gov.in (Historical Baseline Test)',
    });

    // Current units: 345,000 -> Expected growth: ((345000 - 300000) / 300000) * 100 = 15.0%
    const yoy = await service.computeYoY('PV', 345000);
    expect(yoy.yoyChange).toBe(15);
    expect(yoy.yoyStatusText).toBe('+15.0% YoY Growth');
    expect(yoy.isRealHistorical).toBe(true);
  });

  it('provides transparent metadata with isModeled flag and illustrative OEM disclaimers', async () => {
    const data = await service.getVahanData();
    expect(data.mode).toMatch(/LIVE_FETCH|STATIC_SEED/);
    expect(data.status).toBe('SUCCESS');

    for (const cat of data.categories) {
      expect(cat.isModeled).toBe(true);
      expect(cat.oemDisclaimer).toContain('Illustrative');
      expect(cat.keyOEMs.length).toBeGreaterThan(0);
      expect(cat.formattedRegistrations).toBeDefined();
      // No fake YoY %
      expect(cat.yoyChange).toBeNull();
      expect(cat.yoyStatusText).toBe('YoY trend building  insufficient historical data yet');
    }
  });
});

