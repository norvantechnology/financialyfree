/**
 * Rule of 72 & Wealth Doubling Lab Engine
 * Pure mathematical calculation engine for wealth doubling, tripling, and quadrupling.
 */

export interface RuleOf72Input {
  annualReturnPct: number; // e.g. 12 for 12%
  initialCapital?: number; // e.g. 500000 for ₹5,00,000
  inflationPct?: number;   // e.g. 6 for 6%
}

export interface AssetBenchmark {
  name: string;
  category: 'Fixed Income' | 'Hybrid' | 'Equities' | 'High Growth';
  expectedReturnPct: number;
  doublingYearsRule72: number;
  exactDoublingYears: number;
  realDoublingYearsInflationAdj: number;
  multiplierAt10Years: number;
  multiplierAt20Years: number;
}

export interface WealthMilestone {
  label: string;
  multiplier: number;
  projectedCorpus: number;
  yearsRequired: number;
}

export interface RuleOf72Result {
  annualReturnPct: number;
  inflationPct: number;
  initialCapital: number;

  doubling: {
    ruleOf72Years: number;
    exactYears: number;
    errorMarginPct: number;
  };

  tripling: {
    ruleOf114Years: number;
    exactYears: number;
  };

  quadrupling: {
    ruleOf144Years: number;
    exactYears: number;
  };

  inflationAdjusted: {
    realReturnPct: number;
    realDoublingYears: number;
    purchasingPowerHalvingYears: number; // Rule of 72 applied to inflation alone
  };

  milestones: WealthMilestone[];
  benchmarks: AssetBenchmark[];
  formula: string;
}

export const ASSET_CLASS_BENCHMARKS: Array<{
  name: string;
  category: 'Fixed Income' | 'Hybrid' | 'Equities' | 'High Growth';
  expectedReturnPct: number;
}> = [
  { name: 'Savings Account', category: 'Fixed Income', expectedReturnPct: 3.0 },
  { name: 'Bank Fixed Deposit (1-3Y)', category: 'Fixed Income', expectedReturnPct: 7.1 },
  { name: 'Corporate Bond / Debt Fund', category: 'Fixed Income', expectedReturnPct: 7.8 },
  { name: 'Balanced Advantage Fund', category: 'Hybrid', expectedReturnPct: 10.5 },
  { name: 'Nifty 50 Index Fund', category: 'Equities', expectedReturnPct: 12.5 },
  { name: 'Flexi Cap / Large & Mid Cap', category: 'Equities', expectedReturnPct: 14.5 },
  { name: 'Nifty Smallcap 250 Index', category: 'High Growth', expectedReturnPct: 16.5 },
];

export function calculateRuleOf72(input: RuleOf72Input): RuleOf72Result {
  const r = Math.max(0.1, input.annualReturnPct || 12.0);
  const inflation = Math.max(0, input.inflationPct ?? 6.0);
  const capital = Math.max(1000, input.initialCapital || 500000);

  const rDec = r / 100;
  const infDec = inflation / 100;

  // Rule of 72 Doubling
  const rule72Years = Math.round((72 / r) * 10) / 10;
  const exactDoublingYears = Math.round((Math.log(2) / Math.log(1 + rDec)) * 10) / 10;
  const errorMarginPct = Math.round(Math.abs(rule72Years - exactDoublingYears) / exactDoublingYears * 1000) / 10;

  // Rule of 114 Tripling
  const rule114Years = Math.round((114 / r) * 10) / 10;
  const exactTriplingYears = Math.round((Math.log(3) / Math.log(1 + rDec)) * 10) / 10;

  // Rule of 144 Quadrupling
  const rule144Years = Math.round((144 / r) * 10) / 10;
  const exactQuadruplingYears = Math.round((Math.log(4) / Math.log(1 + rDec)) * 10) / 10;

  // Real Return adjusted for inflation
  // Fisher equation: 1 + r_real = (1 + r) / (1 + i)
  const realReturnDec = (1 + rDec) / (1 + infDec) - 1;
  const realReturnPct = Math.round(realReturnDec * 1000) / 10;
  const realDoublingYears = realReturnDec > 0
    ? Math.round((Math.log(2) / Math.log(1 + realReturnDec)) * 10) / 10
    : 999;
  const purchasingPowerHalvingYears = inflation > 0
    ? Math.round((72 / inflation) * 10) / 10
    : 999;

  // Milestones: 2x, 3x, 4x, 5x, 10x
  const milestones: WealthMilestone[] = [
    {
      label: '2x (Double Wealth)',
      multiplier: 2,
      projectedCorpus: capital * 2,
      yearsRequired: exactDoublingYears,
    },
    {
      label: '3x (Triple Wealth)',
      multiplier: 3,
      projectedCorpus: capital * 3,
      yearsRequired: exactTriplingYears,
    },
    {
      label: '4x (Quadruple Wealth)',
      multiplier: 4,
      projectedCorpus: capital * 4,
      yearsRequired: exactQuadruplingYears,
    },
    {
      label: '5x (Penta Wealth)',
      multiplier: 5,
      projectedCorpus: capital * 5,
      yearsRequired: Math.round((Math.log(5) / Math.log(1 + rDec)) * 10) / 10,
    },
    {
      label: '10x (Deca Wealth)',
      multiplier: 10,
      projectedCorpus: capital * 10,
      yearsRequired: Math.round((Math.log(10) / Math.log(1 + rDec)) * 10) / 10,
    },
  ];

  // Benchmarks list
  const benchmarks: AssetBenchmark[] = ASSET_CLASS_BENCHMARKS.map((b) => {
    const rate = b.expectedReturnPct;
    const dec = rate / 100;
    const r72 = Math.round((72 / rate) * 10) / 10;
    const exact = Math.round((Math.log(2) / Math.log(1 + dec)) * 10) / 10;
    const realDec = (1 + dec) / (1 + infDec) - 1;
    const realDouble = realDec > 0 ? Math.round((Math.log(2) / Math.log(1 + realDec)) * 10) / 10 : 999;

    return {
      name: b.name,
      category: b.category,
      expectedReturnPct: rate,
      doublingYearsRule72: r72,
      exactDoublingYears: exact,
      realDoublingYearsInflationAdj: realDouble,
      multiplierAt10Years: Math.round(Math.pow(1 + dec, 10) * 100) / 100,
      multiplierAt20Years: Math.round(Math.pow(1 + dec, 20) * 100) / 100,
    };
  });

  return {
    annualReturnPct: r,
    inflationPct: inflation,
    initialCapital: capital,
    doubling: {
      ruleOf72Years: rule72Years,
      exactYears: exactDoublingYears,
      errorMarginPct,
    },
    tripling: {
      ruleOf114Years: rule114Years,
      exactYears: exactTriplingYears,
    },
    quadrupling: {
      ruleOf144Years: rule144Years,
      exactYears: exactQuadruplingYears,
    },
    inflationAdjusted: {
      realReturnPct,
      realDoublingYears,
      purchasingPowerHalvingYears,
    },
    milestones,
    benchmarks,
    formula: 'Rule of 72: T = 72 / r; Exact Doubling: T = ln(2)/ln(1+r); Real Doubling: T = ln(2)/ln(1 + (r - i)/(1 + i))',
  };
}
