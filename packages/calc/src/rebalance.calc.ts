/**
 * Portfolio Rebalancing Alert Engine
 * Pure mathematical calculation engine for asset allocation drift and rebalancing.
 */

export type AssetClass = 'equity' | 'debt' | 'gold' | 'cash';

export interface TargetAllocation {
  equity: number; // e.g. 70 for 70%
  debt: number;   // e.g. 25 for 25%
  gold: number;   // e.g. 5 for 5%
  cash?: number;  // e.g. 0 for 0%
}

export interface HoldingAssetItem {
  id?: string;
  schemeName: string;
  assetClass: AssetClass;
  currentValue: number;
  investedAmount?: number;
  folioNumber?: string;
}

export interface AssetClassDrift {
  assetClass: AssetClass;
  label: string;
  currentAmount: number;
  currentPct: number;
  targetPct: number;
  targetAmount: number;
  driftPct: number; // currentPct - targetPct (positive = overweight, negative = underweight)
  driftAmount: number; // currentAmount - targetAmount
  action: 'BUY' | 'SELL' | 'HOLD';
  recommendedAmount: number; // abs(driftAmount)
}

export interface RebalanceResult {
  totalPortfolioValue: number;
  drifts: AssetClassDrift[];
  hasDrift: boolean;
  driftThresholdPct: number;
  maxDriftPct: number;
  maxDriftAsset: AssetClass;
  urgency: 'none' | 'moderate' | 'high';
  alertMessage: string;
  rebalanceRecommendations: Array<{
    assetClass: AssetClass;
    action: 'BUY' | 'SELL';
    amount: number;
    reason: string;
  }>;
  turnoverAmount: number;
  formula: string;
}

export interface RebalanceInput {
  holdings: HoldingAssetItem[];
  targetAllocation?: TargetAllocation;
  driftThresholdPct?: number; // default 5%
}

const DEFAULT_TARGET: TargetAllocation = {
  equity: 70,
  debt: 25,
  gold: 5,
  cash: 0,
};

const ASSET_LABELS: Record<AssetClass, string> = {
  equity: 'Equity & Mutual Funds',
  debt: 'Debt & Fixed Income',
  gold: 'Gold & Commodities',
  cash: 'Liquid Cash & Equivalents',
};

/**
 * Calculates portfolio allocation drift against target weights and generates rebalancing alerts.
 */
export function calculatePortfolioRebalancing(input: RebalanceInput): RebalanceResult {
  const holdings = input.holdings || [];
  const target = input.targetAllocation || DEFAULT_TARGET;
  const threshold = input.driftThresholdPct ?? 5.0;

  // Normalize target percentages so they sum to 100
  const rawTargetSum = (target.equity || 0) + (target.debt || 0) + (target.gold || 0) + (target.cash || 0);
  const normalizedTarget: Record<AssetClass, number> = {
    equity: rawTargetSum > 0 ? ((target.equity || 0) / rawTargetSum) * 100 : 70,
    debt: rawTargetSum > 0 ? ((target.debt || 0) / rawTargetSum) * 100 : 25,
    gold: rawTargetSum > 0 ? ((target.gold || 0) / rawTargetSum) * 100 : 5,
    cash: rawTargetSum > 0 ? ((target.cash || 0) / rawTargetSum) * 100 : 0,
  };

  const assetAmounts: Record<AssetClass, number> = {
    equity: 0,
    debt: 0,
    gold: 0,
    cash: 0,
  };

  for (const h of holdings) {
    const asset = (h.assetClass || 'equity').toLowerCase() as AssetClass;
    if (assetAmounts[asset] !== undefined) {
      assetAmounts[asset] += Number(h.currentValue || 0);
    } else {
      assetAmounts.equity += Number(h.currentValue || 0);
    }
  }

  const totalValue = Object.values(assetAmounts).reduce((a, b) => a + b, 0);

  const drifts: AssetClassDrift[] = (['equity', 'debt', 'gold', 'cash'] as AssetClass[]).map((asset) => {
    const currentAmount = assetAmounts[asset];
    const currentPct = totalValue > 0 ? (currentAmount / totalValue) * 100 : 0;
    const targetPct = normalizedTarget[asset];
    const targetAmount = totalValue > 0 ? (targetPct / 100) * totalValue : 0;
    const driftPct = Math.round((currentPct - targetPct) * 100) / 100;
    const driftAmount = Math.round(currentAmount - targetAmount);

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (Math.abs(driftPct) >= threshold) {
      action = driftPct > 0 ? 'SELL' : 'BUY';
    }

    return {
      assetClass: asset,
      label: ASSET_LABELS[asset],
      currentAmount: Math.round(currentAmount),
      currentPct: Math.round(currentPct * 10) / 10,
      targetPct: Math.round(targetPct * 10) / 10,
      targetAmount: Math.round(targetAmount),
      driftPct,
      driftAmount,
      action,
      recommendedAmount: Math.abs(driftAmount),
    };
  });

  // Find max drift
  let maxDriftPct = 0;
  let maxDriftAsset: AssetClass = 'equity';
  for (const d of drifts) {
    if (Math.abs(d.driftPct) > Math.abs(maxDriftPct)) {
      maxDriftPct = d.driftPct;
      maxDriftAsset = d.assetClass;
    }
  }

  const hasDrift = Math.abs(maxDriftPct) >= threshold;
  const urgency: 'none' | 'moderate' | 'high' = !hasDrift
    ? 'none'
    : Math.abs(maxDriftPct) >= threshold * 1.5
    ? 'high'
    : 'moderate';

  let alertMessage = 'Portfolio allocation matches your investment targets within safe tolerance.';
  if (hasDrift) {
    const sign = maxDriftPct > 0 ? '+' : '';
    const dir = maxDriftPct > 0 ? 'drifted above' : 'fallen below';
    alertMessage = `${ASSET_LABELS[maxDriftAsset].split(' ')[0]} allocation has ${dir} target by ${sign}${maxDriftPct.toFixed(1)}% (Target: ${normalizedTarget[maxDriftAsset].toFixed(1)}%, Actual: ${drifts.find((d) => d.assetClass === maxDriftAsset)?.currentPct.toFixed(1)}%). Rebalancing recommended.`;
  }

  const rebalanceRecommendations: Array<{
    assetClass: AssetClass;
    action: 'BUY' | 'SELL';
    amount: number;
    reason: string;
  }> = [];

  for (const d of drifts) {
    if (d.action !== 'HOLD') {
      const dirText = d.action === 'SELL' ? 'Trim' : 'Add';
      rebalanceRecommendations.push({
        assetClass: d.assetClass,
        action: d.action,
        amount: d.recommendedAmount,
        reason: `${dirText} ₹${d.recommendedAmount.toLocaleString('en-IN')} in ${d.label} to reset drift from ${d.driftPct > 0 ? '+' : ''}${d.driftPct}% to target.`,
      });
    }
  }

  // Calculate turnover: sum of all SELL amounts needed
  const turnoverAmount = drifts
    .filter((d) => d.action === 'SELL')
    .reduce((sum, d) => sum + d.recommendedAmount, 0);

  return {
    totalPortfolioValue: Math.round(totalValue),
    drifts,
    hasDrift,
    driftThresholdPct: threshold,
    maxDriftPct: Math.round(maxDriftPct * 10) / 10,
    maxDriftAsset,
    urgency,
    alertMessage,
    rebalanceRecommendations,
    turnoverAmount,
    formula: 'Drift% = ActualWeight% - TargetWeight%; Action = if |Drift%| >= Threshold then (Drift% > 0 ? SELL : BUY)',
  };
}
