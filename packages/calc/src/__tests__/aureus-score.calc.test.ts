import {
  calculateAureusScore,
  calculateRoceSubScore,
  calculateDebtToEquitySubScore,
  calculatePromoterHoldingSubScore,
  calculatePledgeSubScore,
} from '../aureus-score.calc';

describe('Aureus Composite Stock Quality Score Engine (@ff/calc)', () => {
  describe('ROCE Sub-Score (30% Base Weight)', () => {
    it('awards 100 points for stellar ROCE (>= 25%)', () => {
      const res = calculateRoceSubScore(32.5);
      expect(res.score).toBe(100);
      expect(res.status).toBe('OPTIMAL');
      expect(res.displayValue).toBe('32.5%');
    });

    it('interpolates scores appropriately for 15-20% and 10-15%', () => {
      const res1 = calculateRoceSubScore(20);
      expect(res1.score).toBe(85);
      expect(res1.status).toBe('HEALTHY');

      const res2 = calculateRoceSubScore(15);
      expect(res2.score).toBe(70);

      const res3 = calculateRoceSubScore(10);
      expect(res3.score).toBe(50);
      expect(res3.status).toBe('MODERATE');
    });

    it('penalizes weak ROCE (< 10%) and zeroes negative ROCE', () => {
      const weak = calculateRoceSubScore(5);
      expect(weak.score).toBe(25);
      expect(weak.status).toBe('WEAK');

      const negative = calculateRoceSubScore(-3.2);
      expect(negative.score).toBe(0);
      expect(negative.status).toBe('CRITICAL');
    });

    it('handles null/undefined gracefully as DATA_UNAVAILABLE', () => {
      const res = calculateRoceSubScore(null);
      expect(res.score).toBeNull();
      expect(res.status).toBe('DATA_UNAVAILABLE');
      expect(res.displayValue).toBe('N/A');
    });
  });

  describe('Debt-to-Equity Sub-Score (25% Base Weight)', () => {
    it('awards 100 for virtually zero debt (<= 0.1x)', () => {
      const res = calculateDebtToEquitySubScore(0.04);
      expect(res.score).toBe(100);
      expect(res.status).toBe('OPTIMAL');
    });

    it('scores moderate leverage conservatively', () => {
      const low = calculateDebtToEquitySubScore(0.5);
      expect(low.score).toBe(85);

      const moderate = calculateDebtToEquitySubScore(1.0);
      expect(moderate.score).toBe(65);

      const elevated = calculateDebtToEquitySubScore(1.5);
      expect(elevated.score).toBe(40);
    });

    it('penalizes high debt severely (> 2.0x)', () => {
      const distress = calculateDebtToEquitySubScore(3.5);
      expect(distress.score).toBe(5);
      expect(distress.status).toBe('CRITICAL');

      const extreme = calculateDebtToEquitySubScore(5.0);
      expect(extreme.score).toBe(0);
    });

    it('handles missing D/E as DATA_UNAVAILABLE', () => {
      const res = calculateDebtToEquitySubScore(undefined);
      expect(res.score).toBeNull();
      expect(res.status).toBe('DATA_UNAVAILABLE');
    });
  });

  describe('Promoter Holding Sub-Score (25% Base Weight)', () => {
    it('awards 100 for high promoter alignment (>= 65%)', () => {
      const res = calculatePromoterHoldingSubScore(72.5);
      expect(res.score).toBe(100);
      expect(res.status).toBe('OPTIMAL');
    });

    it('handles professionally managed institutions with 0% promoter (e.g. ICICI, HDFC, L&T)', () => {
      const res = calculatePromoterHoldingSubScore(0, 78.4);
      expect(res.score).toBe(85);
      expect(res.status).toBe('HEALTHY');
      expect(res.notes).toContain('Professionally managed');
    });

    it('scores standard tiers correctly', () => {
      expect(calculatePromoterHoldingSubScore(50).score).toBe(85);
      expect(calculatePromoterHoldingSubScore(35).score).toBe(65);
      expect(calculatePromoterHoldingSubScore(25).score).toBe(40);
      expect(calculatePromoterHoldingSubScore(10).score).toBe(16);
    });
  });

  describe('Promoter Pledge Sub-Score (20% Base Weight)', () => {
    it('awards 100 for zero encumbrance (0% pledge)', () => {
      const res = calculatePledgeSubScore(0);
      expect(res.score).toBe(100);
      expect(res.status).toBe('OPTIMAL');
    });

    it('penalizes elevated and critical pledge levels', () => {
      expect(calculatePledgeSubScore(5).score).toBe(70);
      expect(calculatePledgeSubScore(15).score).toBe(35);
      expect(calculatePledgeSubScore(35).score).toBe(0);
      expect(calculatePledgeSubScore(35).status).toBe('CRITICAL');
    });

    it('marks unannounced pledge as DATA_UNAVAILABLE without faking zero', () => {
      const res = calculatePledgeSubScore(null);
      expect(res.score).toBeNull();
      expect(res.status).toBe('DATA_UNAVAILABLE');
      expect(res.notes).toContain('XBRL statutory filing required');
    });
  });

  describe('Composite Aureus Score & Honest Partial Scoring', () => {
    it('calculates full composite score with all 4 pillars (Pristine Grade AAA)', () => {
      const result = calculateAureusScore({
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services',
        roce: 58.2,
        debtToEquity: 0.08,
        promoterHoldingPercent: 71.8,
        pledgePercent: 0,
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.tier).toBe('EXCEPTIONAL');
      expect(result.isPartial).toBe(false);
      expect(result.missingComponents).toHaveLength(0);
      expect(result.totalWeightAvailable).toBe(100);
      expect(result.subScores.roce.weight).toBe(30);
      expect(result.subScores.debtToEquity.weight).toBe(25);
      expect(result.subScores.promoterHolding.weight).toBe(25);
      expect(result.subScores.pledge.weight).toBe(20);
    });

    it('calculates honest normalized partial score when Pledge % is missing from feed', () => {
      // 3 pillars available: ROCE (30), D/E (25), Promoter (25) -> Sum = 80
      // Normalized weights: ROCE: 30/80 = 37.5%, D/E: 25/80 = 31.3%, Promoter: 25/80 = 31.3%
      const result = calculateAureusScore({
        symbol: 'TRENT',
        companyName: 'Trent Limited',
        roce: 28.5, // 100
        debtToEquity: 0.35, // ~91
        promoterHoldingPercent: 37.0, // ~68
        pledgePercent: null, // missing in standard feed
      });

      expect(result.score).toBeDefined();
      expect(result.score).toBeGreaterThan(70);
      expect(result.isPartial).toBe(true);
      expect(result.missingComponents).toEqual(['Promoter Pledge %']);
      expect(result.totalWeightAvailable).toBe(80);
      expect(result.subScores.pledge.score).toBeNull();
      expect(result.subScores.pledge.status).toBe('DATA_UNAVAILABLE');
      expect(result.subScores.roce.weight).toBe(37.5);
      expect(result.methodologyNotice).toContain('80% baseline coverage');
    });

    it('returns INSUFFICIENT_DATA when fewer than 3 pillars are available', () => {
      const result = calculateAureusScore({
        symbol: 'UNKNOWN',
        companyName: 'Incomplete Filings Ltd',
        roce: 22.0,
        debtToEquity: null,
        promoterHoldingPercent: null,
        pledgePercent: null,
      });

      expect(result.score).toBeNull();
      expect(result.tier).toBe('INSUFFICIENT_DATA');
      expect(result.isPartial).toBe(true);
      expect(result.missingComponents).toEqual([
        'Debt-to-Equity',
        'Promoter Holding',
        'Promoter Pledge %',
      ]);
      expect(result.summary).toContain('Minimum 3 pillars required');
    });

    it('computes High Risk rating for leveraged loss-making entity', () => {
      const result = calculateAureusScore({
        symbol: 'DISTRESSED',
        companyName: 'Distressed Asset Ltd',
        roce: -4.5, // 0
        debtToEquity: 3.2, // 8
        promoterHoldingPercent: 18.0, // 29
        pledgePercent: 45.0, // 0
      });

      expect(result.score).toBeLessThan(25);
      expect(result.tier).toBe('HIGH_RISK');
      expect(result.tierLabel).toContain('Distressed Quality');
    });

    it('evaluates Dixon Technologies profile accurately', () => {
      const result = calculateAureusScore({
        symbol: 'DIXON',
        companyName: 'Dixon Technologies (India) Limited',
        roce: 32.4, // Optimal
        debtToEquity: 0.22, // Healthy
        promoterHoldingPercent: 33.8, // Moderate (~34%)
        pledgePercent: 0, // Clean
      });

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(['EXCEPTIONAL', 'STRONG']).toContain(result.tier);
      expect(result.isPartial).toBe(false);
    });
  });
});
