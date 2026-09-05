import { TechnoFundaService } from './techno-funda.service';

describe('TechnoFundaService (Sprint 8)', () => {
  let service: TechnoFundaService;

  beforeEach(() => {
    service = new TechnoFundaService();
  });

  describe('calculateMoodLabel', () => {
    it('accurately categorizes score across all 5 sentiment zones', () => {
      expect(service.calculateMoodLabel(15)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(29)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(30)).toBe('fear');
      expect(service.calculateMoodLabel(49)).toBe('fear');
      expect(service.calculateMoodLabel(50)).toBe('neutral');
      expect(service.calculateMoodLabel(64)).toBe('neutral');
      expect(service.calculateMoodLabel(65)).toBe('greed');
      expect(service.calculateMoodLabel(79)).toBe('greed');
      expect(service.calculateMoodLabel(80)).toBe('extreme_greed');
      expect(service.calculateMoodLabel(95)).toBe('extreme_greed');
    });
  });

  describe('getMarketMoodIndex', () => {
    it('returns valid MMI with components, advisory, and data source citations', () => {
      const result = service.getMarketMoodIndex();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('breadth');
      expect(result.components).toHaveProperty('vix');
      expect(result.components).toHaveProperty('maPositioning');
      expect(result.components).toHaveProperty('fiiDiiFlow');
      expect(result.dataSource).toContain('NSE');
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
  });

  describe('getVahanData', () => {
    it('returns auto sector categories with YoY registrations and MoRTH source', () => {
      const vahan = service.getVahanData();
      expect(vahan.categories.length).toBeGreaterThanOrEqual(4);
      expect(vahan.dataSource).toContain('VAHAN');
      const twoWheeler = vahan.categories.find((c) => c.category === '2W');
      expect(twoWheeler?.registrations).toBeGreaterThan(1000000);
      expect(twoWheeler?.yoyChange).toBeGreaterThan(0);
    });
  });

  describe('getOverview', () => {
    it('returns composite overview with mandatory AMFI & SEBI disclaimers', () => {
      const overview = service.getOverview();
      expect(overview.marketMood).toBeDefined();
      expect(overview.topPeadSurprises).toHaveLength(3);
      expect(overview.vahanSummary).toBeDefined();
      expect(overview.complianceDisclaimer).toContain('ARN-350272');
      expect(overview.complianceDisclaimer).toContain('not a SEBI-registered Research Analyst');
    });
  });
});
