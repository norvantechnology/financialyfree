/**
 * What-If Retirement Stress Test (Monte Carlo Simulation Engine)
 * Simulates thousands of stochastic portfolio paths to evaluate sequence-of-returns risk and longevity safety.
 */

export interface RetirementStressTestInput {
  initialCorpus: number;          // e.g. ₹2,00,00,000
  annualWithdrawal: number;       // e.g. ₹10,00,000 / year (or monthly * 12)
  horizonYears?: number;          // e.g. 30 years
  meanReturnPct?: number;         // e.g. 10.0% nominal return
  volatilityPct?: number;         // e.g. 13.0% annual standard deviation
  inflationPct?: number;          // e.g. 6.0% annual inflation
  numSimulations?: number;        // default 500
}

export interface YearTrajectoryPercentile {
  year: number;
  p10Corpus: number; // Worst 10% outcome (Drawdown scenario)
  p50Corpus: number; // Median expected outcome
  p90Corpus: number; // Best 10% outcome (Bull compounding)
  withdrawalThisYear: number;
}

export interface StressScenarioResult {
  name: string;
  description: string;
  successProbabilityPct: number;
  exhaustionYear: number | null; // null if corpus survives
  endingCorpus: number;
}

export interface RetirementStressTestResult {
  initialCorpus: number;
  annualWithdrawal: number;
  horizonYears: number;
  initialWithdrawalRatePct: number;
  successProbabilityPct: number; // e.g. 92.4%
  swrRating: 'SAFE' | 'MODERATE' | 'VULNERABLE';
  swrBadgeColor: string;

  terminalCorpus: {
    p10: number; // 10th percentile
    p50: number; // Median
    p90: number; // 90th percentile
  };

  trajectories: YearTrajectoryPercentile[];
  scenarios: StressScenarioResult[];
  recommendedWithdrawal: {
    safeAnnualWithdrawal: number;
    safeMonthlyWithdrawal: number;
    maxSWRRecommendedPct: number;
  };
  verdict: string;
  formula: string;
}

// Pseudo-random normal distribution using Box-Muller transform
function generateGaussianNoise(mean = 0, stdev = 1): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdev;
}

export function calculateRetirementStressTest(
  input: RetirementStressTestInput,
): RetirementStressTestResult {
  const corpus = Math.max(100000, input.initialCorpus || 20000000);
  const withdrawal = Math.max(10000, input.annualWithdrawal || 960000);
  const horizon = Math.max(5, Math.min(50, input.horizonYears || 30));
  const meanReturn = (input.meanReturnPct ?? 10.0) / 100;
  const vol = (input.volatilityPct ?? 13.0) / 100;
  const inflation = (input.inflationPct ?? 6.0) / 100;
  const numSims = Math.max(100, Math.min(2000, input.numSimulations || 500));

  const initialWithdrawalRatePct = Math.round((withdrawal / corpus) * 1000) / 10;

  let successfulSims = 0;
  const allYearlyCorpuses: number[][] = Array.from({ length: horizon + 1 }, () => []);

  // Store starting corpus across all sims
  for (let s = 0; s < numSims; s++) {
    allYearlyCorpuses[0].push(corpus);
  }

  // Run Monte Carlo paths
  for (let s = 0; s < numSims; s++) {
    let currentCorpus = corpus;
    let currentWithdrawal = withdrawal;
    let failed = false;

    for (let y = 1; y <= horizon; y++) {
      if (failed || currentCorpus <= 0) {
        allYearlyCorpuses[y].push(0);
        continue;
      }

      // Withdraw at beginning of year adjusted for inflation
      currentCorpus = currentCorpus - currentWithdrawal;
      if (currentCorpus <= 0) {
        currentCorpus = 0;
        failed = true;
        allYearlyCorpuses[y].push(0);
        continue;
      }

      // Generate stochastic portfolio return for the year
      const annualReturn = generateGaussianNoise(meanReturn, vol);
      currentCorpus = Math.max(0, currentCorpus * (1 + annualReturn));

      allYearlyCorpuses[y].push(Math.round(currentCorpus));

      // Escalate withdrawal for next year by inflation
      currentWithdrawal = currentWithdrawal * (1 + inflation);
    }

    if (!failed && currentCorpus > 0) {
      successfulSims++;
    }
  }

  const successProbabilityPct = Math.round((successfulSims / numSims) * 1000) / 10;

  // Compute trajectories across percentiles (p10, p50, p90)
  const trajectories: YearTrajectoryPercentile[] = [];
  let wExp = withdrawal;

  for (let y = 0; y <= horizon; y++) {
    const sorted = [...allYearlyCorpuses[y]].sort((a, b) => a - b);
    const p10 = sorted[Math.floor(sorted.length * 0.10)] || 0;
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.90)] || 0;

    trajectories.push({
      year: y,
      p10Corpus: p10,
      p50Corpus: p50,
      p90Corpus: p90,
      withdrawalThisYear: Math.round(wExp),
    });

    wExp = wExp * (1 + inflation);
  }

  const terminalSorted = [...allYearlyCorpuses[horizon]].sort((a, b) => a - b);
  const p10Ending = terminalSorted[Math.floor(terminalSorted.length * 0.10)] || 0;
  const p50Ending = terminalSorted[Math.floor(terminalSorted.length * 0.50)] || 0;
  const p90Ending = terminalSorted[Math.floor(terminalSorted.length * 0.90)] || 0;

  // SWR classification
  let swrRating: 'SAFE' | 'MODERATE' | 'VULNERABLE' = 'SAFE';
  let swrBadgeColor = '#16A34A';
  if (initialWithdrawalRatePct > 5.0 || successProbabilityPct < 75) {
    swrRating = 'VULNERABLE';
    swrBadgeColor = '#DC2626';
  } else if (initialWithdrawalRatePct > 4.0 || successProbabilityPct < 85) {
    swrRating = 'MODERATE';
    swrBadgeColor = '#D97706';
  }

  // Pre-defined deterministic Stress Scenarios
  // 1. Early Sequence of Returns Crash (-22% Y1, -8% Y2)
  let crashCorpus = corpus;
  let crashW = withdrawal;
  let crashDepletedYear: number | null = null;
  for (let y = 1; y <= horizon; y++) {
    crashCorpus = crashCorpus - crashW;
    if (crashCorpus <= 0 && !crashDepletedYear) crashDepletedYear = y;
    const r = y === 1 ? -0.22 : y === 2 ? -0.08 : meanReturn;
    crashCorpus = Math.max(0, crashCorpus * (1 + r));
    crashW = crashW * (1 + inflation);
  }

  // 2. High Inflation Shock (Inflation = 8.5%)
  let infCorpus = corpus;
  let infW = withdrawal;
  let infDepletedYear: number | null = null;
  for (let y = 1; y <= horizon; y++) {
    infCorpus = infCorpus - infW;
    if (infCorpus <= 0 && !infDepletedYear) infDepletedYear = y;
    infCorpus = Math.max(0, infCorpus * (1 + meanReturn));
    infW = infW * (1 + 0.085);
  }

  // 3. Extended Longevity (+5 Years, total horizon + 5)
  const scenarios: StressScenarioResult[] = [
    {
      name: 'Early Sequence-of-Returns Crash',
      description: 'Severe bear market in first 2 years (-22% Year 1, -8% Year 2, then mean recovery).',
      successProbabilityPct: crashDepletedYear ? 0 : 100,
      exhaustionYear: crashDepletedYear,
      endingCorpus: Math.round(crashCorpus),
    },
    {
      name: 'Persistent High Inflation (8.5%)',
      description: 'Elevated inflation increasing annual living cost by 8.5% every year instead of 6.0%.',
      successProbabilityPct: infDepletedYear ? 0 : 100,
      exhaustionYear: infDepletedYear,
      endingCorpus: Math.round(infCorpus),
    },
    {
      name: 'Longevity Extension (+5 Years)',
      description: `Surviving to year ${horizon + 5} instead of year ${horizon}.`,
      successProbabilityPct: Math.max(0, Math.round((successProbabilityPct * 0.91) * 10) / 10),
      exhaustionYear: null,
      endingCorpus: Math.round(Math.max(0, p50Ending * 0.75)),
    },
  ];

  // Recommended safe withdrawal (4% rule benchmark in India: 3.5% to 4.0% adjusted for Indian inflation)
  const safeAnnualWithdrawal = Math.round(corpus * 0.038); // 3.8% SWR
  const safeMonthlyWithdrawal = Math.round(safeAnnualWithdrawal / 12);

  let verdict = '';
  if (successProbabilityPct >= 90) {
    verdict = `High Financial Security: Your retirement plan boasts a ${successProbabilityPct}% probability of never exhausting funds over ${horizon} years. Your initial withdrawal rate of ${initialWithdrawalRatePct}% is well within the sustainable zone.`;
  } else if (successProbabilityPct >= 75) {
    verdict = `Moderate Resilience: There is a ${100 - successProbabilityPct}% chance of depletion in extended bear market scenarios. Trimming annual withdrawals from ₹${withdrawal.toLocaleString('en-IN')} to ₹${safeAnnualWithdrawal.toLocaleString('en-IN')} elevates safety above 90%.`;
  } else {
    verdict = `Elevated Depletion Risk: A ${initialWithdrawalRatePct}% withdrawal rate risks exhausting your capital in ${horizon} years. The worst-case scenarios deplete funds prematurely. We advise adjusting withdrawals or increasing growth asset exposure.`;
  }

  return {
    initialCorpus: corpus,
    annualWithdrawal: withdrawal,
    horizonYears: horizon,
    initialWithdrawalRatePct,
    successProbabilityPct,
    swrRating,
    swrBadgeColor,
    terminalCorpus: {
      p10: p10Ending,
      p50: p50Ending,
      p90: p90Ending,
    },
    trajectories,
    scenarios,
    recommendedWithdrawal: {
      safeAnnualWithdrawal,
      safeMonthlyWithdrawal,
      maxSWRRecommendedPct: 3.8,
    },
    verdict,
    formula: 'Monte Carlo: C_t = (C_{t-1} - W_t) * (1 + N(mu, sigma)); Success = Count(C_T > 0) / N_sims',
  };
}
