import { DataIntegrityService, DATA_SOURCES_CATALOG } from './data-integrity.service';
import { Repository } from 'typeorm';

describe('DataIntegrityService (/admin/data-integrity Audit Registry)', () => {
  let service: DataIntegrityService;
  let mockHealthRepo: Partial<Repository<any>>;
  let mockAmfiNavService: any;
  let mockMarketIndexService: any;
  let mockTechnoFundaService: any;
  let mockVahanEtlService: any;
  let storedEntities: Map<string, any>;

  beforeEach(() => {
    storedEntities = new Map();

    mockHealthRepo = {
      findOne: jest.fn().mockImplementation(({ where: { sourceKey } }) => {
        return Promise.resolve(storedEntities.get(sourceKey) || null);
      }),
      find: jest.fn().mockImplementation(() => {
        return Promise.resolve(Array.from(storedEntities.values()));
      }),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-uuid-' + dto.sourceKey })),
      save: jest.fn().mockImplementation((entity) => {
        storedEntities.set(entity.sourceKey, entity);
        return Promise.resolve(entity);
      }),
    };

    mockAmfiNavService = {
      syncDailyNavs: jest.fn().mockResolvedValue({
        totalParsed: 14098,
        schemesUpdated: 6,
        historyRecordsAdded: 2,
        durationMs: 380,
        sourceUrl: 'https://portal.amfiindia.com/spages/NAVAll.txt',
      }),
    };

    mockMarketIndexService = {
      getMarketOverview: jest.fn().mockResolvedValue({
        indices: [
          { symbol: 'NIFTY 50', name: 'Nifty 50 Index', current: 23897.7, change: 24.3, changePct: 0.1, dayHigh: 24005, dayLow: 23895, lastUpdated: new Date().toISOString() },
          { symbol: 'SENSEX', name: 'BSE Sensex Index', current: 76515.43, change: 362.53, changePct: 0.48, dayHigh: 76883, dayLow: 76515, lastUpdated: new Date().toISOString() },
        ],
        indiaVix: 10.68,
        retrievedAt: new Date().toISOString(),
        licensingNotice: 'Delayed market quotes',
      }),
    };

    mockTechnoFundaService = {
      getMarketMoodIndex: jest.fn().mockResolvedValue({
        score: 69,
        label: 'greed',
        components: { breadth: 64, vix: 71, maPositioning: 71, fiiDiiFlow: 71 },
        advisory: 'Market sentiment is bullish and constructive.',
        methodology: 'Composite 4 components',
        dataSource: 'Live market inputs',
        lastUpdated: new Date().toISOString(),
      }),
      getPeadSurprises: jest.fn().mockReturnValue({
        events: [
          { symbol: 'TRENT', surprisePct: 28.67, drift20d: 8.32, actualEps: 18.4, expectedEps: 14.3, resultDate: '2026-09-01' },
          { symbol: 'DIXON', surprisePct: 18.14, drift20d: 10.96, actualEps: 24.1, expectedEps: 20.4, resultDate: '2026-08-28' },
        ],
        dataSource: 'NSE / BSE Quarterly Corporate Filings',
        methodology: 'PEAD drift window',
        lastUpdated: new Date().toISOString(),
      }),
    };

    mockVahanEtlService = {
      getVahanData: jest.fn().mockResolvedValue({
        dataSource: 'Government of India public VAHAN dashboard (parivahan.gov.in)',
        isLiveScraped: true,
        topStates: [{ stateCode: 'UP', stateName: 'Uttar Pradesh', totalRegistrations: 56451661, formattedCount: '5.65 Cr' }],
        categories: [{ category: '2W', label: 'Two-Wheelers', registrations: 1428500, yoyChange: 14.2 }],
        retrievedAt: new Date().toISOString(),
      }),
    };

    service = new DataIntegrityService(
      mockHealthRepo as any,
      mockAmfiNavService,
      mockMarketIndexService,
      mockTechnoFundaService,
      mockVahanEtlService,
    );
  });

  describe('Catalog & Seeding', () => {
    it('defines exactly 11 data dependencies covering all platform domains', () => {
      expect(DATA_SOURCES_CATALOG.length).toBe(11);
      const keys = DATA_SOURCES_CATALOG.map((c) => c.sourceKey);
      expect(keys).toContain('amfi_nav');
      expect(keys).toContain('index_snapshots');
      expect(keys).toContain('india_vix');
      expect(keys).toContain('market_mood_index');
      expect(keys).toContain('vahan_etl');
      expect(keys).toContain('pead_source');
      expect(keys).toContain('valuation_financials');
      expect(keys).toContain('buybacks');
      expect(keys).toContain('results_calendar');
      expect(keys).toContain('shareholding');
      expect(keys).toContain('news');
    });

    it('retrieves all sources and self-heals unseeded items', async () => {
      const all = await service.getAllSources();
      expect(all.length).toBe(11);
      expect(mockHealthRepo.save).toHaveBeenCalledTimes(11);
    });
  });

  describe('Force Refresh Handlers', () => {
    it('forces live refresh of amfi_nav and updates PostgreSQL health record', async () => {
      const refreshed = await service.forceRefresh('amfi_nav');
      expect(mockAmfiNavService.syncDailyNavs).toHaveBeenCalled();
      expect(refreshed.sourceKey).toBe('amfi_nav');
      expect(refreshed.mode).toBe('LIVE_FETCH');
      expect(refreshed.status).toBe('SUCCESS');
      expect(refreshed.rawResponseSnippet).toContain('14098');
      expect(refreshed.lastFetchedAt).toBeDefined();
    });

    it('forces live refresh of index_snapshots bypassing cache', async () => {
      const refreshed = await service.forceRefresh('index_snapshots');
      expect(mockMarketIndexService.getMarketOverview).toHaveBeenCalledWith(true);
      expect(refreshed.sourceKey).toBe('index_snapshots');
      expect(refreshed.mode).toBe('LIVE_FETCH');
      expect(refreshed.rawResponseSnippet).toContain('NIFTY 50');
    });

    it('forces dynamic recalculation of market_mood_index via @ff/calc inputs', async () => {
      const refreshed = await service.forceRefresh('market_mood_index');
      expect(mockTechnoFundaService.getMarketMoodIndex).toHaveBeenCalled();
      expect(refreshed.sourceKey).toBe('market_mood_index');
      expect(refreshed.mode).toBe('COMPUTED_FROM_LIVE');
      expect(refreshed.rawResponseSnippet).toContain('"score": 69');
    });

    it('forces live scrape of vahan_etl against MoRTH dashboard', async () => {
      const refreshed = await service.forceRefresh('vahan_etl');
      expect(mockVahanEtlService.getVahanData).toHaveBeenCalledWith(true);
      expect(refreshed.sourceKey).toBe('vahan_etl');
      expect(refreshed.mode).toBe('LIVE_FETCH');
      expect(refreshed.rawResponseSnippet).toContain('Uttar Pradesh');
    });

    it('refreshes static seed data with fresh server timestamp and statutory disclosure payload', async () => {
      const refreshed = await service.forceRefresh('valuation_financials');
      expect(refreshed.sourceKey).toBe('valuation_financials');
      expect(refreshed.mode).toBe('STATIC_SEED');
      expect(refreshed.rawResponseSnippet).toContain('Tata Motors Limited');
      expect(refreshed.rawResponseSnippet).toContain('104839');
    });

    it('throws NotFoundException on invalid source key', async () => {
      await expect(service.forceRefresh('unknown_provider')).rejects.toThrow(
        'Data source unknown_provider is not registered in catalog',
      );
    });

    it('executes forceRefreshAll across all 11 sources', async () => {
      const all = await service.forceRefreshAll();
      expect(all.length).toBe(11);
      const modes = new Set(all.map((s) => s.mode));
      expect(modes.has('LIVE_FETCH')).toBe(true);
      expect(modes.has('COMPUTED_FROM_LIVE')).toBe(true);
      expect(modes.has('STATIC_SEED')).toBe(true);
    });
  });
});
