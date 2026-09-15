// ── packages/calc/src/sector-rotation.calc.ts ─────────────────────────────
// Sector Rotation Signal Engine (RRG & Relative Strength).
// Evaluates sectoral index returns over 1D, 1W (5 trading days), and 1M (21 trading days)
// against the NIFTY 50 benchmark to identify rotational momentum and classify sectors
// into the 4 classic RRG quadrants:
//   1. Leading:   RS_1M > 0  && RS_1W >= 0  (Sustained outperformance & positive momentum)
//   2. Weakening: RS_1M > 0  && RS_1W < 0   (Intermediate leader losing short-term momentum)
//   3. Lagging:   RS_1M <= 0 && RS_1W < 0   (Sustained underperformance & negative momentum)
//   4. Improving: RS_1M <= 0 && RS_1W >= 0  (Underperformer bottoming & gaining short-term momentum)

export type RotationQuadrant = 'Leading' | 'Weakening' | 'Lagging' | 'Improving';

export type MomentumTrend = 'ACCELERATING' | 'DECELERATING' | 'STABLE';

export interface SectorCandleInput {
  ticker: string;
  name: string;
  symbol: string;
  closes: number[]; // Ordered chronologically (oldest -> newest, latest at end)
  currentPrice?: number;
  previousClose?: number;
}

export interface SectorPerformanceMetrics {
  ticker: string;
  name: string;
  symbol: string;
  currentPrice: number;
  return1D: number; // %
  return1W: number; // % (5 trading sessions)
  return1M: number; // % (21 trading sessions)
  rs1D: number; // Relative strength vs benchmark (percentage points)
  rs1W: number;
  rs1M: number;
  compositeScore: number; // Weighted composite relative strength
  quadrant: RotationQuadrant;
  quadrantLabel: string;
  quadrantDescription: string;
  quadrantColor: string;
  rank: number;
  momentumTrend: MomentumTrend;
}

export interface BenchmarkMetrics {
  ticker: string;
  name: string;
  currentPrice: number;
  return1D: number;
  return1W: number;
  return1M: number;
}

export interface SectorRotationAnalysisResult {
  benchmark: BenchmarkMetrics;
  sectors: SectorPerformanceMetrics[];
  topLeadingSectors: SectorPerformanceMetrics[];
  topLaggingSectors: SectorPerformanceMetrics[];
  quadrantSummary: {
    leadingCount: number;
    weakeningCount: number;
    laggingCount: number;
    improvingCount: number;
  };
  methodologyNotice: string;
  computedAt: string;
}

/**
 * Computes return percentage from price series given a session offset.
 */
export function computeSessionReturn(closes: number[], offsetDays: number, fallbackPrev?: number): number {
  if (!closes || closes.length === 0) return 0;
  const current = closes[closes.length - 1];
  if (current === undefined || isNaN(current) || current <= 0) return 0;

  let basePrice: number | undefined;

  if (offsetDays === 1) {
    basePrice = closes.length > 1 ? closes[closes.length - 2] : fallbackPrev;
  } else {
    const targetIdx = closes.length - 1 - offsetDays;
    basePrice = targetIdx >= 0 ? closes[targetIdx] : closes[0];
  }

  if (basePrice === undefined || isNaN(basePrice) || basePrice <= 0) return 0;
  return Math.round(((current - basePrice) / basePrice) * 10000) / 100;
}

/**
 * Classifies a sector into one of the 4 Relative Rotation Graph (RRG) quadrants.
 */
export function classifyRotationQuadrant(rs1M: number, rs1W: number): {
  quadrant: RotationQuadrant;
  quadrantLabel: string;
  quadrantDescription: string;
  quadrantColor: string;
} {
  if (rs1M > 0 && rs1W >= 0) {
    return {
      quadrant: 'Leading',
      quadrantLabel: 'Leading Outperformer',
      quadrantDescription: 'Positive relative strength over both 1-month and 1-week horizons with expanding institutional leadership.',
      quadrantColor: '#10B981', // emerald-500
    };
  }
  if (rs1M > 0 && rs1W < 0) {
    return {
      quadrant: 'Weakening',
      quadrantLabel: 'Weakening Leader',
      quadrantDescription: 'Positive intermediate-term relative strength (1M), but encountering short-term exhaustion or profit taking.',
      quadrantColor: '#F59E0B', // amber-500
    };
  }
  if (rs1M <= 0 && rs1W < 0) {
    return {
      quadrant: 'Lagging',
      quadrantLabel: 'Lagging Underperformer',
      quadrantDescription: 'Sustained relative weakness underperforming NIFTY 50 across both 1-month and 1-week time horizons.',
      quadrantColor: '#EF4444', // red-500
    };
  }
  return {
    quadrant: 'Improving',
    quadrantLabel: 'Improving Momentum',
    quadrantDescription: 'Negative 1-month relative performance, but displaying nascent 1-week turnaround momentum.',
    quadrantColor: '#06B6D4', // cyan-500
  };
}

/**
 * Analyzes sector rotation for a set of sectoral indices against a benchmark (e.g. NIFTY 50).
 */
export function analyzeSectorRotation(
  benchmarkInput: SectorCandleInput,
  sectorsInput: SectorCandleInput[],
): SectorRotationAnalysisResult {
  const bCloses = benchmarkInput.closes.filter((c) => typeof c === 'number' && !isNaN(c));
  const bCurrent =
    typeof benchmarkInput.currentPrice === 'number' && benchmarkInput.currentPrice > 0
      ? benchmarkInput.currentPrice
      : bCloses.length > 0
        ? bCloses[bCloses.length - 1]
        : 0;
  const b1D = computeSessionReturn(bCloses, 1, benchmarkInput.previousClose);
  const b1W = computeSessionReturn(bCloses, 5);
  const b1M = computeSessionReturn(bCloses, 21);

  const benchmark: BenchmarkMetrics = {
    ticker: benchmarkInput.ticker,
    name: benchmarkInput.name,
    currentPrice: Math.round(bCurrent * 100) / 100,
    return1D: b1D,
    return1W: b1W,
    return1M: b1M,
  };

  const calculatedSectors: Array<Omit<SectorPerformanceMetrics, 'rank'>> = sectorsInput.map((sec) => {
    const closes = sec.closes.filter((c) => typeof c === 'number' && !isNaN(c));
    const current =
      typeof sec.currentPrice === 'number' && sec.currentPrice > 0
        ? sec.currentPrice
        : closes.length > 0
          ? closes[closes.length - 1]
          : 0;
    const return1D = computeSessionReturn(closes, 1, sec.previousClose);
    const return1W = computeSessionReturn(closes, 5);
    const return1M = computeSessionReturn(closes, 21);

    const rs1D = Math.round((return1D - b1D) * 100) / 100;
    const rs1W = Math.round((return1W - b1W) * 100) / 100;
    const rs1M = Math.round((return1M - b1M) * 100) / 100;

    // Weighted composite score: 20% 1D, 30% 1W, 50% 1M
    const compositeScore = Math.round((0.2 * rs1D + 0.3 * rs1W + 0.5 * rs1M) * 100) / 100;

    const { quadrant, quadrantLabel, quadrantDescription, quadrantColor } =
      classifyRotationQuadrant(rs1M, rs1W);

    let momentumTrend: MomentumTrend = 'STABLE';
    if (rs1W > rs1M + 0.5) {
      momentumTrend = 'ACCELERATING';
    } else if (rs1W < rs1M - 0.5) {
      momentumTrend = 'DECELERATING';
    }

    return {
      ticker: sec.ticker,
      name: sec.name,
      symbol: sec.symbol,
      currentPrice: Math.round(current * 100) / 100,
      return1D,
      return1W,
      return1M,
      rs1D,
      rs1W,
      rs1M,
      compositeScore,
      quadrant,
      quadrantLabel,
      quadrantDescription,
      quadrantColor,
      momentumTrend,
    };
  });

  // Sort descending by compositeScore to assign ranks
  calculatedSectors.sort((a, b) => b.compositeScore - a.compositeScore);

  const sectors: SectorPerformanceMetrics[] = calculatedSectors.map((s, idx) => ({
    ...s,
    rank: idx + 1,
  }));

  const leading = sectors.filter((s) => s.quadrant === 'Leading');
  const weakening = sectors.filter((s) => s.quadrant === 'Weakening');
  const lagging = sectors.filter((s) => s.quadrant === 'Lagging');
  const improving = sectors.filter((s) => s.quadrant === 'Improving');

  return {
    benchmark,
    sectors,
    topLeadingSectors: leading.slice(0, 3),
    topLaggingSectors: lagging.slice(-3),
    quadrantSummary: {
      leadingCount: leading.length,
      weakeningCount: weakening.length,
      laggingCount: lagging.length,
      improvingCount: improving.length,
    },
    methodologyNotice:
      'Sector rotation is computed against NIFTY 50 benchmark across 1D, 1W (5 sessions), and 1M (21 sessions) daily close candles.',
    computedAt: new Date().toISOString(),
  };
}
