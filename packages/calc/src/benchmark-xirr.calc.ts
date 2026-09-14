/**
 * XIRR Comparison: Portfolio vs. Nifty 50 Benchmark Engine
 * Evaluates investor money-weighted return (XIRR) against simulated Nifty 50 Total Return Index (TRI) benchmark
 * over identical cashflow investment dates.
 */

import { calculateXIRR } from './goal.calc';

export interface CashflowItem {
  amount: number;       // Negative for investment, positive for redemption or final valuation
  date: string | Date;  // ISO date string or Date
  description?: string;
}

export interface BenchmarkXirrInput {
  cashflows: CashflowItem[];
  currentPortfolioValue: number;
  benchmarkName?: string; // default "Nifty 50 Total Return Index"
  benchmarkCurrentNav?: number; // default current Nifty TRI level (~32,500)
}

export interface BenchmarkXirrResult {
  portfolioXirrPct: number;
  benchmarkXirrPct: number;
  alphaPct: number; // portfolioXirr - benchmarkXirr
  isOutperforming: boolean;
  benchmarkName: string;
  totalCapitalInvested: number;
  portfolioCurrentValue: number;
  benchmarkSimulatedValue: number;
  wealthDifference: number; // Portfolio - Benchmark
  alphaStatus: 'STRONG_ALPHA' | 'MODEST_ALPHA' | 'PAR_MATCH' | 'LAGGING_BENCHMARK';
  alphaBadgeColor: string;
  verdict: string;
  cashflowTimeline: Array<{
    date: string;
    investorCashflow: number;
    niftySimulatedUnits: number;
    cumulativeUnits: number;
    niftyPriceAtDate: number;
  }>;
  formula: string;
}

// Historical Nifty 50 TRI price anchors from 2018 to 2026 for accurate interpolation
const HISTORICAL_NIFTY_TRI_ANCHORS: Array<{ year: number; month: number; triPrice: number }> = [
  { year: 2018, month: 1, triPrice: 14200 },
  { year: 2018, month: 7, triPrice: 15100 },
  { year: 2019, month: 1, triPrice: 15300 },
  { year: 2019, month: 7, triPrice: 16100 },
  { year: 2020, month: 1, triPrice: 17200 },
  { year: 2020, month: 3, triPrice: 11800 }, // Covid crash trough
  { year: 2020, month: 7, triPrice: 15400 },
  { year: 2020, month: 11, triPrice: 18200 },
  { year: 2021, month: 1, triPrice: 19800 },
  { year: 2021, month: 7, triPrice: 22000 },
  { year: 2021, month: 10, triPrice: 25100 },
  { year: 2022, month: 1, triPrice: 24200 },
  { year: 2022, month: 6, triPrice: 21500 },
  { year: 2022, month: 12, triPrice: 25600 },
  { year: 2023, month: 1, triPrice: 24900 },
  { year: 2023, month: 6, triPrice: 26800 },
  { year: 2023, month: 12, triPrice: 29800 },
  { year: 2024, month: 3, triPrice: 30800 },
  { year: 2024, month: 6, triPrice: 32600 },
  { year: 2024, month: 9, triPrice: 35200 },
  { year: 2024, month: 12, triPrice: 34100 },
  { year: 2025, month: 3, triPrice: 33800 },
  { year: 2025, month: 6, triPrice: 35400 },
  { year: 2025, month: 9, triPrice: 36800 },
  { year: 2025, month: 12, triPrice: 37900 },
  { year: 2026, month: 1, triPrice: 38400 },
  { year: 2026, month: 6, triPrice: 39800 },
  { year: 2026, month: 9, triPrice: 40500 },
];

function estimateNiftyTriPrice(date: Date): number {
  const targetTime = date.getTime();
  const firstAnchor = new Date(HISTORICAL_NIFTY_TRI_ANCHORS[0].year, HISTORICAL_NIFTY_TRI_ANCHORS[0].month - 1, 1).getTime();
  const lastAnchorObj = HISTORICAL_NIFTY_TRI_ANCHORS[HISTORICAL_NIFTY_TRI_ANCHORS.length - 1];
  const lastAnchor = new Date(lastAnchorObj.year, lastAnchorObj.month - 1, 1).getTime();

  if (targetTime <= firstAnchor) return HISTORICAL_NIFTY_TRI_ANCHORS[0].triPrice;
  if (targetTime >= lastAnchor) return lastAnchorObj.triPrice;

  // Linear interpolation between closest anchor months
  for (let i = 0; i < HISTORICAL_NIFTY_TRI_ANCHORS.length - 1; i++) {
    const a1 = HISTORICAL_NIFTY_TRI_ANCHORS[i];
    const a2 = HISTORICAL_NIFTY_TRI_ANCHORS[i + 1];
    const t1 = new Date(a1.year, a1.month - 1, 1).getTime();
    const t2 = new Date(a2.year, a2.month - 1, 1).getTime();

    if (targetTime >= t1 && targetTime <= t2) {
      const ratio = (targetTime - t1) / (t2 - t1);
      return a1.triPrice + ratio * (a2.triPrice - a1.triPrice);
    }
  }

  return lastAnchorObj.triPrice;
}

export function calculateBenchmarkXirr(input: BenchmarkXirrInput): BenchmarkXirrResult {
  const benchmarkName = input.benchmarkName || 'Nifty 50 Total Return Index (TRI)';
  const currentPortVal = Math.max(0, input.currentPortfolioValue || 0);
  const rawCashflows = input.cashflows || [];

  const today = new Date();
  const currentNiftyPrice = input.benchmarkCurrentNav ?? estimateNiftyTriPrice(today);

  // Normalize cashflow dates
  const sortedCashflows = rawCashflows
    .map((c) => ({
      amount: Number(c.amount),
      date: typeof c.date === 'string' ? new Date(c.date) : c.date,
      description: c.description,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Portfolio cashflows including current value today
  const portfolioFlows = [
    ...sortedCashflows,
    { amount: currentPortVal, date: today },
  ];

  let portfolioXirr = 0;
  try {
    portfolioXirr = Math.round(calculateXIRR(portfolioFlows) * 10) / 10;
  } catch {
    portfolioXirr = 0;
  }

  // Simulate benchmark units bought on each investment date
  let cumulativeUnits = 0;
  let totalInvested = 0;
  const benchmarkSimFlows: Array<{ amount: number; date: Date }> = [];
  const cashflowTimeline: BenchmarkXirrResult['cashflowTimeline'] = [];

  for (const cf of sortedCashflows) {
    const niftyPrice = estimateNiftyTriPrice(cf.date);
    if (cf.amount < 0) {
      const invested = Math.abs(cf.amount);
      totalInvested += invested;
      const unitsBought = invested / niftyPrice;
      cumulativeUnits += unitsBought;

      benchmarkSimFlows.push({ amount: cf.amount, date: cf.date });
      cashflowTimeline.push({
        date: cf.date.toISOString().split('T')[0],
        investorCashflow: cf.amount,
        niftySimulatedUnits: Math.round(unitsBought * 1000) / 1000,
        cumulativeUnits: Math.round(cumulativeUnits * 1000) / 1000,
        niftyPriceAtDate: Math.round(niftyPrice),
      });
    } else if (cf.amount > 0) {
      // Partial redemption
      const unitsSold = Math.min(cumulativeUnits, cf.amount / niftyPrice);
      cumulativeUnits = Math.max(0, cumulativeUnits - unitsSold);

      benchmarkSimFlows.push({ amount: cf.amount, date: cf.date });
      cashflowTimeline.push({
        date: cf.date.toISOString().split('T')[0],
        investorCashflow: cf.amount,
        niftySimulatedUnits: -Math.round(unitsSold * 1000) / 1000,
        cumulativeUnits: Math.round(cumulativeUnits * 1000) / 1000,
        niftyPriceAtDate: Math.round(niftyPrice),
      });
    }
  }

  const benchmarkTerminalValue = Math.round(cumulativeUnits * currentNiftyPrice);
  benchmarkSimFlows.push({ amount: benchmarkTerminalValue, date: today });

  let benchmarkXirr = 0;
  try {
    benchmarkXirr = Math.round(calculateXIRR(benchmarkSimFlows) * 10) / 10;
  } catch {
    benchmarkXirr = 0;
  }

  const alphaPct = Math.round((portfolioXirr - benchmarkXirr) * 10) / 10;
  const isOutperforming = alphaPct > 0;
  const wealthDifference = Math.round(currentPortVal - benchmarkTerminalValue);

  let alphaStatus: BenchmarkXirrResult['alphaStatus'] = 'PAR_MATCH';
  let alphaBadgeColor = '#2563EB';

  if (alphaPct >= 2.0) {
    alphaStatus = 'STRONG_ALPHA';
    alphaBadgeColor = '#16A34A';
  } else if (alphaPct > 0.3) {
    alphaStatus = 'MODEST_ALPHA';
    alphaBadgeColor = '#059669';
  } else if (alphaPct >= -0.3) {
    alphaStatus = 'PAR_MATCH';
    alphaBadgeColor = '#2563EB';
  } else {
    alphaStatus = 'LAGGING_BENCHMARK';
    alphaBadgeColor = '#DC2626';
  }

  let verdict = '';
  if (isOutperforming) {
    verdict = `Superior Performance: Your portfolio delivered an XIRR of ${portfolioXirr}% vs ${benchmarkXirr}% on the ${benchmarkName}, generating +${alphaPct}% annual Alpha. You created ₹${Math.abs(wealthDifference).toLocaleString('en-IN')} in excess wealth over passive index investing.`;
  } else if (alphaPct >= -0.5) {
    verdict = `Index Matching: Your portfolio returned an XIRR of ${portfolioXirr}% virtually identical to the ${benchmarkName} (${benchmarkXirr}%). Your asset allocation closely mirrors broad market trajectory.`;
  } else {
    verdict = `Underperforming Index: Your portfolio XIRR of ${portfolioXirr}% trailed the ${benchmarkName} (${benchmarkXirr}%) by ${Math.abs(alphaPct)}%. Passive index allocation would have created ₹${Math.abs(wealthDifference).toLocaleString('en-IN')} more wealth over this period. Review underperforming active funds.`;
  }

  return {
    portfolioXirrPct: portfolioXirr,
    benchmarkXirrPct: benchmarkXirr,
    alphaPct,
    isOutperforming,
    benchmarkName,
    totalCapitalInvested: Math.round(totalInvested),
    portfolioCurrentValue: Math.round(currentPortVal),
    benchmarkSimulatedValue: benchmarkTerminalValue,
    wealthDifference,
    alphaStatus,
    alphaBadgeColor,
    verdict,
    cashflowTimeline,
    formula: 'Alpha = Portfolio_XIRR - Benchmark_XIRR; Benchmark_Units = Sum(CF_i / Nifty_TRI(t_i)); Benchmark_Value = Units_Total * Nifty_TRI(today)',
  };
}
