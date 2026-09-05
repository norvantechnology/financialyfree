/**
 * Goal & SIP Calculation Engine
 * Formula source: Standard Future Value of annuity formula.
 * All calculations must be auditable — every function returns the formula string.
 */

export interface SipCalcInput {
  targetCorpus: number; // INR
  horizonYears: number;
  expectedReturnPct: number; // e.g. 12 for 12% p.a.
  currentSavings: number; // INR already invested toward this goal
}

export interface SipCalcResult {
  monthlySip: number; // INR, rounded up to nearest rupee
  projectedCorpus: number; // INR
  formula: string;
  assumptions: {
    targetCorpus: number;
    horizonYears: number;
    expectedReturnPct: number;
    currentSavings: number;
    monthlyRate: number;
    months: number;
  };
}

/**
 * Calculate monthly SIP required to reach a target corpus.
 *
 * FV_lumpsum = currentSavings × (1 + r)^n
 * Remaining = targetCorpus - FV_lumpsum
 * SIP = Remaining × r / ((1 + r)^n - 1)
 * where r = monthly rate, n = months
 */
export function calculateSIPRequired(input: SipCalcInput): SipCalcResult {
  const { targetCorpus, horizonYears, expectedReturnPct, currentSavings } = input;

  const monthlyRate = expectedReturnPct / 100 / 12;
  const months = horizonYears * 12;

  // Future value of current savings
  const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, months);

  // Remaining corpus needed from SIP
  const remainingCorpus = Math.max(0, targetCorpus - fvCurrentSavings);

  let monthlySip = 0;
  if (remainingCorpus > 0 && monthlyRate > 0) {
    const compoundFactor = Math.pow(1 + monthlyRate, months);
    monthlySip = (remainingCorpus * monthlyRate) / (compoundFactor - 1);
  } else if (remainingCorpus > 0) {
    // 0% return edge case
    monthlySip = remainingCorpus / months;
  }

  // Round up to nearest rupee
  monthlySip = Math.ceil(monthlySip);

  // Verify projected corpus from this SIP
  const projectedCorpus = calculateCorpusProjection({
    monthlySip,
    currentSavings,
    horizonYears,
    expectedReturnPct,
    annualStepUpPct: 0,
  }).projectedCorpus;

  return {
    monthlySip,
    projectedCorpus,
    formula:
      'SIP = (TargetCorpus - CurrentSavings×(1+r)^n) × r / ((1+r)^n - 1) where r = monthly rate = annualRate/12, n = horizonMonths',
    assumptions: {
      targetCorpus,
      horizonYears,
      expectedReturnPct,
      currentSavings,
      monthlyRate,
      months,
    },
  };
}

export interface CorpusProjectionInput {
  monthlySip: number;
  currentSavings: number;
  horizonYears: number;
  expectedReturnPct: number;
  annualStepUpPct: number; // e.g. 10 for 10% step-up each year
}

export interface CorpusProjectionResult {
  projectedCorpus: number;
  totalInvested: number;
  totalGains: number;
  yearlyBreakdown: Array<{
    year: number;
    corpus: number;
    invested: number;
    monthlySipThisYear: number;
  }>;
}

/**
 * Project corpus over time with optional annual SIP step-up.
 * Returns year-by-year breakdown for charts.
 */
export function calculateCorpusProjection(input: CorpusProjectionInput): CorpusProjectionResult {
  const { monthlySip, currentSavings, horizonYears, expectedReturnPct, annualStepUpPct } = input;

  const monthlyRate = expectedReturnPct / 100 / 12;
  const yearlyBreakdown: CorpusProjectionResult['yearlyBreakdown'] = [];

  let corpus = currentSavings;
  let totalInvested = currentSavings;
  let currentMonthlySip = monthlySip;

  for (let year = 1; year <= horizonYears; year++) {
    for (let month = 1; month <= 12; month++) {
      corpus = corpus * (1 + monthlyRate) + currentMonthlySip;
      totalInvested += currentMonthlySip;
    }

    yearlyBreakdown.push({
      year,
      corpus: Math.round(corpus),
      invested: Math.round(totalInvested),
      monthlySipThisYear: Math.round(currentMonthlySip),
    });

    // Apply step-up for next year
    currentMonthlySip = currentMonthlySip * (1 + annualStepUpPct / 100);
  }

  return {
    projectedCorpus: Math.round(corpus),
    totalInvested: Math.round(totalInvested),
    totalGains: Math.round(corpus - totalInvested),
    yearlyBreakdown,
  };
}

/**
 * Calculate CAGR (Compound Annual Growth Rate).
 * CAGR = (endValue / startValue)^(1/years) - 1
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate XIRR using Newton-Raphson method.
 * cashflows: array of { amount: number (negative = outflow), date: Date }
 */
export function calculateXIRR(
  cashflows: Array<{ amount: number; date: Date }>,
  guess = 0.1,
): number {
  if (cashflows.length < 2) return 0;

  const PRECISION = 1e-7;
  const MAX_ITERATIONS = 100;
  const firstDate = cashflows[0].date;

  const daysFromStart = (date: Date) =>
    (date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  let rate = guess;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let f = 0;
    let df = 0;
    for (const cf of cashflows) {
      const t = daysFromStart(cf.date) / 365;
      const d = Math.pow(1 + rate, t);
      f += cf.amount / d;
      df -= (t * cf.amount) / (d * (1 + rate));
    }
    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < PRECISION) {
      return newRate * 100; // return as percentage
    }
    rate = newRate;
  }
  return rate * 100;
}
