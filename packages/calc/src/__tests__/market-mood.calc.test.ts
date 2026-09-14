import { calculateMarketMoodIndex, MarketMoodInput } from '../market-mood.calc';

describe('Market Mood Index — Mathematical Audit & Weights Verification', () => {
  // 1. Exact current demo inputs & sub-scores verification
  test('Exact Demo Sub-scores: Breadth 36, VIX 67, Trend 38, Liquidity 45 -> Composite 47 (Neutral)', () => {
    // Current live environment inputs:
    // Breadth: 36% advances
    // VIX: 11.16 vs 13.5 baseline -> vixRatio = 11.16/13.5 = 0.82667 -> vixScore = 100 - (0.82667 - 0.5)*100 = 67.33 -> 67
    // Trend: 38%
    // Flows: -1000 Cr -> flowScore = 50 + (-1000)/200 = 45
    const input: MarketMoodInput = {
      advanceDeclinePct: 36,
      vixCurrent: 11.16,
      vixBaseline: 13.5,
      pctAbove200dma: 38,
      fiiFLows20d: -450,
      diiFlows20d: -550, // total -1000 Cr
    };

    const result = calculateMarketMoodIndex(input);

    // Verify each individual component score
    expect(result.components.breadthScore).toBe(36);
    expect(result.components.vixScore).toBe(67);
    expect(result.components.maScore).toBe(38);
    expect(result.components.flowScore).toBe(45);

    // Mathematical reconciliation:
    // 36 * 0.30 = 10.80
    // 67.33 * 0.30 = 20.20 (raw)
    // 38 * 0.25 = 9.50
    // 45 * 0.15 = 6.75
    // Sum = 10.80 + 20.20 + 9.50 + 6.75 = 47.25 -> Math.round is 47!
    expect(result.score).toBe(47);
    expect(result.label).toBe('neutral');
  });

  // 2. Weights exact contribution check
  test('Confirms exact weights: Breadth 30%, VIX 30%, MA 25%, Flows 15%', () => {
    // Case where each component is tested in isolation
    // A: Only Breadth 100%, others 0
    const rBreadth = calculateMarketMoodIndex({
      advanceDeclinePct: 100,
      vixCurrent: 25, // vixScore = 0
      vixBaseline: 13.5,
      pctAbove200dma: 0,
      fiiFLows20d: -10000, // flowScore = 0
      diiFlows20d: 0,
    });
    expect(rBreadth.score).toBe(30); // 100 * 0.30 = 30

    // B: Only VIX 100% (vixCurrent very low e.g. 6.75 vs 13.5 -> ratio 0.5 -> score 100)
    const rVix = calculateMarketMoodIndex({
      advanceDeclinePct: 0,
      vixCurrent: 6.75,
      vixBaseline: 13.5,
      pctAbove200dma: 0,
      fiiFLows20d: -10000,
      diiFlows20d: 0,
    });
    expect(rVix.score).toBe(30); // 100 * 0.30 = 30

    // C: Only MA Trend 100%
    const rMa = calculateMarketMoodIndex({
      advanceDeclinePct: 0,
      vixCurrent: 25,
      vixBaseline: 13.5,
      pctAbove200dma: 100,
      fiiFLows20d: -10000,
      diiFlows20d: 0,
    });
    expect(rMa.score).toBe(25); // 100 * 0.25 = 25

    // D: Only Flows 100% (netFlows >= +10000 Cr -> score 100)
    const rFlow = calculateMarketMoodIndex({
      advanceDeclinePct: 0,
      vixCurrent: 25,
      vixBaseline: 13.5,
      pctAbove200dma: 0,
      fiiFLows20d: 10000,
      diiFlows20d: 0,
    });
    expect(rFlow.score).toBe(15); // 100 * 0.15 = 15

    // Total = 30 + 30 + 25 + 15 = 100%
  });

  // 3. Zone Transitions with VIX reactivity
  test('VIX sensitivity shifts composite score and zone labels accurately', () => {
    // Elevated VIX = 24.0 (Fear trigger)
    const fearResult = calculateMarketMoodIndex({
      advanceDeclinePct: 36,
      vixCurrent: 24.0, // High volatility
      vixBaseline: 13.5,
      pctAbove200dma: 38,
      fiiFLows20d: -450,
      diiFlows20d: -550,
    });
    // VIX ratio = 24 / 13.5 = 1.777 -> vixScore = 0
    // Score = 36*0.3 + 0*0.3 + 38*0.25 + 45*0.15 = 10.8 + 9.5 + 6.75 = 27
    expect(fearResult.score).toBe(27);
    expect(fearResult.label).toBe('fear');

    // Low VIX = 8.5 with Bullish Breadth = 80 (Greed trigger)
    const greedResult = calculateMarketMoodIndex({
      advanceDeclinePct: 80,
      vixCurrent: 8.5,
      vixBaseline: 13.5,
      pctAbove200dma: 75,
      fiiFLows20d: 3000,
      diiFlows20d: 3000,
    });
    expect(greedResult.score).toBeGreaterThanOrEqual(61);
    expect(greedResult.label).toMatch(/greed|extreme_greed/);
  });
});
