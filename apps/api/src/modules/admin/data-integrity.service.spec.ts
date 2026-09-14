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
      getPeadFeed: jest.fn().mockResolvedValue({
        events: [
          { symbol: 'TRENT', name: 'Trent Limited', surprise: 28.67, drift20d: -6.96, actualEps: 18.4, expectedEps: 14.3, stage: 'Consolidating', resultDate: '2026-09-01' },
          { symbol: 'DIXON', name: 'Dixon Technologies (India) Ltd', surprise: 18.14, drift20d: 0.46, actualEps: 24.1, expectedEps: 20.4, stage: 'Stage 2 Breakout', resultDate: '2026-08-28' },
        ],
        dataSource: 'Live Yahoo Finance + SEBI LODR Filings',
        methodology: 'PEAD drift window',
        trackedEventsCount: 2,
        calendarUniverseActive: 35,
        lastUpdated: new Date().toISOString(),
      }),
      getValuationFinancials: jest.fn().mockResolvedValue({
        source: 'LIVE_FETCH',
        targetCompany: 'Reliance Industries Limited',
        financialsCr: { revenue: 900000, ebitda: 100000, pat: 70000, eps: 100 },
        currentMarketPrice: 1400,
        refreshedAt: new Date().toISOString(),
      }),
      getPeadSurprises: jest.fn().mockResolvedValue({
        events: [
          { symbol: 'TRENT', surprisePct: 28.67, drift20d: 8.32, actualEps: 18.4, expectedEps: 14.3, resultDate: '2026-09-01' },
          { symbol: 'DIXON', surprisePct: 18.14, drift20d: 10.96, actualEps: 24.1, expectedEps: 20.4, resultDate: '2026-08-28' },
        ],
        dataSource: 'NSE / BSE Quarterly Corporate Filings',
        methodology: 'PEAD drift window',
        lastUpdated: new Date().toISOString(),
      }),
      getSectorHeatmap: jest.fn().mockResolvedValue({
        sectors: [
          { symbol: 'NIFTY AUTO', name: 'Nifty Auto', current: 24500, quadrant: 'Leading', compositeScore: 4.5, rs1M: 3.2, rs1W: 1.1, rs1D: 0.5 },
        ],
        benchmark: { symbol: 'NIFTY 50', return1D: 0.1, return1W: 0.5, return1M: 1.2 },
        totalSectors: 8,
        source: 'Live Yahoo Finance 3-Month Daily Candles vs ^NSEI',
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
    it('defines exactly 12 data dependencies covering all platform domains', () => {
      expect(DATA_SOURCES_CATALOG.length).toBe(12);
      const keys = DATA_SOURCES_CATALOG.map((c) => c.sourceKey);
      expect(keys).toContain('amfi_nav');
      expect(keys).toContain('index_snapshots');
      expect(keys).toContain('india_vix');
      expect(keys).toContain('market_mood_index');
      expect(keys).toContain('sector_rotation');
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
      expect(all.length).toBe(12);
      expect(mockHealthRepo.save).toHaveBeenCalledTimes(12);
    }, 30000);
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

    it('refreshes valuation financials from live Screener/Yahoo feeds', async () => {
      const refreshed = await service.forceRefresh('valuation_financials');
      expect(mockTechnoFundaService.getValuationFinancials).toHaveBeenCalled();
      expect(refreshed.sourceKey).toBe('valuation_financials');
      expect(refreshed.mode).toBe('LIVE_FETCH');
      expect(refreshed.rawResponseSnippet).toContain('Reliance Industries Limited');
    });

    it('forces dynamic recalculation of sector_rotation via @ff/calc vs NIFTY 50 benchmark', async () => {
      const refreshed = await service.forceRefresh('sector_rotation');
      expect(mockTechnoFundaService.getSectorHeatmap).toHaveBeenCalled();
      expect(refreshed.sourceKey).toBe('sector_rotation');
      expect(refreshed.mode).toBe('COMPUTED_FROM_LIVE');
      expect(refreshed.rawResponseSnippet).toContain('NIFTY AUTO');
    });

    it('throws NotFoundException on invalid source key', async () => {
      await expect(service.forceRefresh('unknown_provider')).rejects.toThrow(
        'Data source unknown_provider is not registered in catalog',
      );
    });

    it('executes forceRefreshAll across all catalog sources without STATIC_SEED modes', async () => {
      const all = await service.forceRefreshAll();
      expect(all.length).toBe(DATA_SOURCES_CATALOG.length);
      const modes = new Set(all.map((s) => s.mode));
      expect(modes.has('LIVE_FETCH')).toBe(true);
      expect(modes.has('COMPUTED_FROM_LIVE')).toBe(true);
      expect(modes.has('STATIC_SEED')).toBe(false);
    }, 30000);
  });
});
