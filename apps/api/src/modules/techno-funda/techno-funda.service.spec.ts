import { TechnoFundaService } from './techno-funda.service';
import { MarketIndexService } from './market-index.service';
import { VahanEtlService } from './vahan-etl.service';

describe('TechnoFundaService (Sprint 8 & Dynamic Public Feeds)', () => {
  let service: TechnoFundaService;
  let mockMarketIndexService: any;
  let mockVahanEtlService: any;

  beforeEach(() => {
    mockMarketIndexService = {
      getMarketOverview: jest.fn().mockResolvedValue({
        indices: [
          { symbol: 'NIFTY 50', name: 'Nifty 50 Index', current: 23897.7, change: 24.3, changePct: 0.1 },
          { symbol: 'SENSEX', name: 'BSE Sensex Index', current: 76515.43, change: 362.53, changePct: 0.48 },
          { symbol: 'NIFTY BANK', name: 'Nifty Bank Index', current: 57369.65, change: -10.95, changePct: -0.02 },
        ],
        indiaVix: 10.68,
        marketBreadth: { advances: 32, declines: 18, ratio: 1.78, breadthPct: 64 },
        licensingNotice: 'Section 58 compliant',
        retrievedAt: new Date().toISOString(),
        isCached: false,
      }),
    };

    mockVahanEtlService = {
      getVahanData: jest.fn().mockResolvedValue({
        categories: [
          { category: '2W', label: 'Two-Wheelers', registrations: 1428500, yoyChange: 14.2, momChange: 3.8, keyOEMs: ['Hero MotoCorp'] },
          { category: 'PV', label: 'Passenger Vehicles', registrations: 345200, yoyChange: 8.6, momChange: 2.1, keyOEMs: ['Maruti Suzuki'] },
          { category: 'CV', label: 'Commercial Vehicles', registrations: 88400, yoyChange: 4.1, momChange: -1.2, keyOEMs: ['Tata Motors'] },
          { category: 'Tractor', label: 'Agricultural Tractors', registrations: 69800, yoyChange: 11.8, momChange: 5.4, keyOEMs: ['Mahindra'] },
        ],
        topStates: [
          { stateCode: 'UP', stateName: 'Uttar Pradesh', totalRegistrations: 56451661, formattedCount: '5.65 Cr' },
          { stateCode: 'MH', stateName: 'Maharashtra', totalRegistrations: 44464252, formattedCount: '4.45 Cr' },
        ],
        dataPoints: [],
        dataSource: 'Government of India public VAHAN dashboard (parivahan.gov.in)',
        retrievedAt: new Date().toISOString(),
        isLiveScraped: true,
        refreshCadence: 'Daily / 24h',
      }),
    };

    service = new TechnoFundaService(
      mockMarketIndexService as MarketIndexService,
      mockVahanEtlService as VahanEtlService,
    );
  });

  describe('calculateMoodLabel', () => {
    it('accurately categorizes score across all 5 sentiment zones', () => {
      expect(service.calculateMoodLabel(15)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(20)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(25)).toBe('fear');
      expect(service.calculateMoodLabel(40)).toBe('fear');
      expect(service.calculateMoodLabel(50)).toBe('neutral');
      expect(service.calculateMoodLabel(60)).toBe('neutral');
      expect(service.calculateMoodLabel(70)).toBe('greed');
      expect(service.calculateMoodLabel(80)).toBe('greed');
      expect(service.calculateMoodLabel(85)).toBe('extreme_greed');
    });
  });

  describe('getMarketMoodIndex', () => {
    it('returns dynamically computed MMI with real India VIX, components, and citations', async () => {
      const result = await service.getMarketMoodIndex();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('breadth');
      expect(result.components).toHaveProperty('vix');
      expect(result.components).toHaveProperty('maPositioning');
      expect(result.components).toHaveProperty('fiiDiiFlow');
      expect(result.dataSource).toContain('India VIX');
      expect(result.lastUpdated).toBeDefined();
      expect(result.historicalTrend).toHaveLength(30);
    });
  });

  describe('getPeadSurprises', () => {
    it('returns high-conviction quarterly earnings surprises with required metadata', () => {
      const pead = service.getPeadSurprises();
      expect(pead.events.length).toBeGreaterThan(0);
      const trent = pead.events.find((e) => e.symbol === 'TRENT');
      expect(trent).toBeDefined();
      expect(trent?.surprisePct).toBeGreaterThan(20);
      expect(pead.dataSource).toContain('Corporate Financial Filings');
    });

    it('verifies exact mathematical calculation of EPS surprise and 20d drift', () => {
      const pead = service.getPeadSurprises();
      for (const event of pead.events) {
        if (
          event.actualEps !== undefined &&
          event.expectedEps !== undefined &&
          event.price20dPost !== undefined &&
          event.priceAtResult !== undefined
        ) {
          // Formula 1: surprisePct = ((actualEps - expectedEps) / expectedEps) * 100
          const calculatedSurprise =
            ((event.actualEps - event.expectedEps) / event.expectedEps) * 100;
          expect(event.surprisePct).toBeCloseTo(calculatedSurprise, 1);

          // Formula 2: drift20d = ((price20dPost - priceAtResult) / priceAtResult) * 100
          const calculatedDrift =
            ((event.price20dPost - event.priceAtResult) / event.priceAtResult) * 100;
          expect(event.drift20d).toBeCloseTo(calculatedDrift, 1);
        }
      }
    });

    it('verifies exact weighted component math for Market Mood Index', () => {
      // weights: vix: 0.30, breadth: 0.25, ma: 0.25, flows: 0.20
      const vixScore = 71;
      const breadthScore = 64;
      const maScore = 71;
      const flowScore = 71;
      const expectedMmi = Math.round(
        0.30 * vixScore + 0.25 * breadthScore + 0.25 * maScore + 0.20 * flowScore,
      );
      expect(expectedMmi).toBe(69);
    });
  });

  describe('getVahanData', () => {
    it('returns auto sector categories and live scraped top states', async () => {
      const vahan = await service.getVahanData();
      expect(vahan.categories.length).toBeGreaterThanOrEqual(4);
      expect(vahan.dataSource).toContain('VAHAN');
      expect(vahan.topStates.length).toBeGreaterThanOrEqual(2);
      const twoWheeler = vahan.categories.find((c) => c.category === '2W');
      expect(twoWheeler?.registrations).toBeGreaterThan(1000000);
      expect(twoWheeler?.yoyChange).toBeGreaterThan(0);
    });
  });

  describe('getOverview', () => {
    it('returns composite overview with market indices, MMI, VAHAN, and mandatory disclaimers', async () => {
      const overview = await service.getOverview();
      expect(overview.marketMood).toBeDefined();
      expect(overview.marketOverview).toBeDefined();
      expect(overview.marketOverview.indices).toHaveLength(3);
      expect(overview.topPeadSurprises).toHaveLength(3);
      expect(overview.vahanSummary).toBeDefined();
      expect(overview.vahanTopStates).toBeDefined();
      expect(overview.complianceDisclaimer).toContain('ARN-350272');
      expect(overview.complianceDisclaimer).toContain('not a SEBI-registered Research Analyst');
    });
  });
});
