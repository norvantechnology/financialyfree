import { VahanEtlService } from './vahan-etl.service';

describe('VahanEtlService (VAHAN Dashboard ETL & Caching)', () => {
  let service: VahanEtlService;

  beforeEach(() => {
    service = new VahanEtlService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns structured Vahan auto registration payload with categories and top states', async () => {
    const data = await service.getVahanData();

    expect(data).toBeDefined();
    expect(data.categories.length).toBe(4);
    expect(data.topStates.length).toBeGreaterThanOrEqual(5);
    expect(data.dataSource).toContain('parivahan.gov.in');
    expect(data.refreshCadence).toContain('24h');

    const twoWheeler = data.categories.find((c) => c.category === '2W');
    expect(twoWheeler).toBeDefined();
    expect(twoWheeler?.registrations).toBeGreaterThan(1000000);

    const up = data.topStates.find((s) => s.stateCode === 'UP');
    expect(up).toBeDefined();
    expect(up?.totalRegistrations).toBeGreaterThan(50000000);
  }, 15000);

  it('caches the Vahan payload across multiple calls', async () => {
    const first = await service.getVahanData();
    const second = await service.getVahanData();

    expect(first.retrievedAt).toBe(second.retrievedAt);
    expect(first.topStates[0].totalRegistrations).toBe(second.topStates[0].totalRegistrations);
  });
});
