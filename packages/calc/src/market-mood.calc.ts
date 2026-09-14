/**
 * Market Mood Index calculator (Section 69.3).
 * House-built composite gauge  version is tracked for reproducibility.
 * Range: 0–100. Labels: Extreme Fear → Fear → Neutral → Greed → Extreme Greed
 */

export interface MarketMoodInput {
  /** Advance/Decline ratio as a percentage of advances (0–100) */
  advanceDeclinePct: number;
  /** India VIX current level */
  vixCurrent: number;
  /** India VIX 52-week average (baseline) */
  vixBaseline: number;
  /** % of NIFTY500 stocks above 200-day SMA (0–100) */
  pctAbove200dma: number;
  /** Net FII flows past 20 trading days in ₹ crore (can be negative) */
  fiiFLows20d: number;
  /** Net DII flows past 20 trading days in ₹ crore */
  diiFlows20d: number;
}

export interface MarketMoodResult {
  score: number; // 0–100
  label: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  components: {
    breadthScore: number;
    vixScore: number;
    maScore: number;
    flowScore: number;
  };
  version: string;
  methodology: string;
}

const MOOD_VERSION = '1.0.0';

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function calculateMarketMoodIndex(input: MarketMoodInput): MarketMoodResult {
  const { advanceDeclinePct, vixCurrent, vixBaseline, pctAbove200dma, fiiFLows20d, diiFlows20d } =
    input;

  // Component 1: Market Breadth (advance/decline %) → 0–100
  const breadthScore = clamp(advanceDeclinePct, 0, 100);

  // Component 2: VIX (inverted  high VIX = fear)
  const vixRatio = vixBaseline > 0 ? vixCurrent / vixBaseline : 1;
  const vixScore = clamp(100 - (vixRatio - 0.5) * 100, 0, 100);

  // Component 3: % stocks above 200-DMA → 0–100
  const maScore = clamp(pctAbove200dma, 0, 100);

  // Component 4: FII + DII net flows (normalize to 0–100 around ₹0 baseline)
  const netFlows = fiiFLows20d + diiFlows20d;
  // ₹10,000 Cr net inflow → ~100 score; ₹10,000 Cr outflow → ~0 score
  const flowScore = clamp(50 + netFlows / 200, 0, 100);

  // Weighted composite: breadth 30%, VIX 30%, MA 25%, flows 15%
  const score = breadthScore * 0.3 + vixScore * 0.3 + maScore * 0.25 + flowScore * 0.15;
  const rounded = Math.round(score);

  let label: MarketMoodResult['label'];
  if (rounded <= 20) label = 'extreme_fear';
  else if (rounded <= 40) label = 'fear';
  else if (rounded <= 60) label = 'neutral';
  else if (rounded <= 80) label = 'greed';
  else label = 'extreme_greed';

  return {
    score: rounded,
    label,
    components: {
      breadthScore: Math.round(breadthScore),
      vixScore: Math.round(vixScore),
      maScore: Math.round(maScore),
      flowScore: Math.round(flowScore),
    },
    version: MOOD_VERSION,
    methodology:
      'Composite of 4 components: Market Breadth (Advance/Decline, 30%), VIX vs baseline (inverted, 30%), % stocks above 200-DMA (25%), Net FII+DII flows 20d (15%). Score 0–100; ≤20 Extreme Fear, ≤40 Fear, ≤60 Neutral, ≤80 Greed, >80 Extreme Greed.',
  };
}
