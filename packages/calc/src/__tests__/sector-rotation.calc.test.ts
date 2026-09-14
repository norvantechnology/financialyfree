import {
  computeSessionReturn,
  classifyRotationQuadrant,
  analyzeSectorRotation,
  SectorCandleInput,
} from '../sector-rotation.calc';

describe('Sector Rotation Signal Engine (@ff/calc)', () => {
  describe('computeSessionReturn', () => {
    it('computes 1D return accurately from consecutive closes', () => {
      const closes = [100, 102.5];
      const ret = computeSessionReturn(closes, 1);
      expect(ret).toBe(2.5);
    });

    it('computes 1W (5 session) return', () => {
      // 6 items: index 0 to 5 -> current is closes[5] = 110, 5 sessions ago is closes[0] = 100
      const closes = [100, 101, 103, 106, 108, 110];
      const ret = computeSessionReturn(closes, 5);
      expect(ret).toBe(10);
    });

    it('computes 1M (21 session) return', () => {
      // 22 items: 100 at start, 120 at end -> +20%
      const closes = Array.from({ length: 22 }, (_, i) => 100 + (i * 20) / 21);
      const ret = computeSessionReturn(closes, 21);
      expect(ret).toBe(20);
    });

    it('safely handles empty or single candle array with fallback', () => {
      expect(computeSessionReturn([], 1)).toBe(0);
      expect(computeSessionReturn([150], 1, 140)).toBe(7.14);
    });
  });

  describe('classifyRotationQuadrant (RRG Rules)', () => {
    it('classifies Leading when RS_1M > 0 and RS_1W >= 0', () => {
      const res = classifyRotationQuadrant(4.5, 1.2);
      expect(res.quadrant).toBe('Leading');
      expect(res.quadrantColor).toBe('#10B981');
    });

    it('classifies Weakening when RS_1M > 0 and RS_1W < 0', () => {
      const res = classifyRotationQuadrant(6.2, -1.8);
      expect(res.quadrant).toBe('Weakening');
      expect(res.quadrantColor).toBe('#F59E0B');
    });

    it('classifies Lagging when RS_1M <= 0 and RS_1W < 0', () => {
      const res = classifyRotationQuadrant(-3.5, -2.1);
      expect(res.quadrant).toBe('Lagging');
      expect(res.quadrantColor).toBe('#EF4444');
    });

    it('classifies Improving when RS_1M <= 0 and RS_1W >= 0', () => {
      const res = classifyRotationQuadrant(-2.0, 0.8);
      expect(res.quadrant).toBe('Improving');
      expect(res.quadrantColor).toBe('#06B6D4');
    });
  });

  describe('analyzeSectorRotation (Full Multi-Sector Benchmark Analysis)', () => {
    const generateCloses = (start: number, count: number, stepPct: number) => {
      const arr = [start];
      for (let i = 1; i < count; i++) {
        arr.push(arr[i - 1] * (1 + stepPct / 100));
      }
      return arr;
    };

    const benchmarkCloses = generateCloses(20000, 30, 0.1); // Steady ~0.1% daily gain
    const benchmarkInput: SectorCandleInput = {
      ticker: '^NSEI',
      name: 'NIFTY 50',
      symbol: 'NIFTY 50',
      closes: benchmarkCloses,
    };

    it('analyzes and ranks sectors correctly across 4 quadrants', () => {
      // 1. Metal: Strong outperformer (+0.4% daily) -> Leading
      const metalCloses = generateCloses(6000, 30, 0.4);

      // 2. Realty: Outperformed over 1M (+1.0% daily base) but dipped in last 5 days (-0.6% daily) -> Weakening
      const realtyCloses = generateCloses(800, 25, 1.0);
      for (let i = 0; i < 5; i++) {
        realtyCloses.push(realtyCloses[realtyCloses.length - 1] * 0.994); // -0.6% per day recently
      }

      // 3. IT: Weak overall (-0.3% daily) -> Lagging
      const itCloses = generateCloses(35000, 30, -0.3);

      // 4. Pharma: Lagging over 1M (-0.5% daily base) but bottoming/improving in last 5 days (+0.6% daily) -> Improving
      const pharmaCloses = generateCloses(18000, 25, -0.5);
      for (let i = 0; i < 5; i++) {
        pharmaCloses.push(pharmaCloses[pharmaCloses.length - 1] * 1.006); // +0.6% per day recently
      }

      const sectorsInput: SectorCandleInput[] = [
        { ticker: '^CNXMETAL', name: 'NIFTY METAL', symbol: 'METAL', closes: metalCloses },
        { ticker: '^CNXREALTY', name: 'NIFTY REALTY', symbol: 'REALTY', closes: realtyCloses },
        { ticker: '^CNXIT', name: 'NIFTY IT', symbol: 'IT', closes: itCloses },
        { ticker: '^CNXPHARMA', name: 'NIFTY PHARMA', symbol: 'PHARMA', closes: pharmaCloses },
      ];

      const result = analyzeSectorRotation(benchmarkInput, sectorsInput);

      expect(result.benchmark).toBeDefined();
      expect(result.benchmark.return1M).toBeDefined();
      expect(result.sectors).toHaveLength(4);

      // Ranks should be 1 to 4 in order of composite score
      expect(result.sectors[0].rank).toBe(1);
      expect(result.sectors[1].rank).toBe(2);
      expect(result.sectors[2].rank).toBe(3);
      expect(result.sectors[3].rank).toBe(4);

      // Metal should be Leading with high rank
      const metal = result.sectors.find((s) => s.symbol === 'METAL');
      expect(metal?.quadrant).toBe('Leading');
      expect(metal?.rs1M).toBeGreaterThan(0);
      expect(metal?.rs1W).toBeGreaterThan(0);

      // Realty should be Weakening
      const realty = result.sectors.find((s) => s.symbol === 'REALTY');
      expect(realty?.quadrant).toBe('Weakening');

      // IT should be Lagging
      const it = result.sectors.find((s) => s.symbol === 'IT');
      expect(it?.quadrant).toBe('Lagging');

      // Pharma should be Improving
      const pharma = result.sectors.find((s) => s.symbol === 'PHARMA');
      expect(pharma?.quadrant).toBe('Improving');

      // Summary counts
      expect(result.quadrantSummary.leadingCount).toBe(1);
      expect(result.quadrantSummary.weakeningCount).toBe(1);
      expect(result.quadrantSummary.laggingCount).toBe(1);
      expect(result.quadrantSummary.improvingCount).toBe(1);
    });
  });
});
