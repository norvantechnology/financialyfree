/**
 * FIRE (Financial Independence, Retire Early) Calculator
 * Section 15 of PRD.
 * All outputs must be reproducible from inputs alone.
 */

export interface FireInput {
  currentAge: number;
  retirementAge: number;
  currentInvestments: number; // INR
  monthlyInvestment: number; // INR
  annualStepUpPct: number; // e.g. 10
  currentMonthlyExpenses: number; // INR
  expectedReturnPct: number; // pre-retirement (e.g. 12)
  postRetirementReturnPct: number; // e.g. 7
  inflationPct: number; // e.g. 6
  safeWithdrawalRatePct: number; // e.g. 4
  otherMonthlyIncome?: number; // pension, rental etc.
}

export interface FireResult {
  fireNumber: number; // Target corpus in INR
  currentCorpus: number; // Current investments
  progressPct: number; // 0–100
  projectedCorpusAtRetirement: number;
  fireYear: number; // Calendar year when FIRE is achieved
  yearsToFire: number;
  monthlyExpensesAtRetirement: number; // inflation-adjusted
  monthlyWithdrawableAmount: number;
  shortfallOrSurplus: number;
  yearlyBreakdown: FireYearlyBreakdown[];
  formula: string;
}

export interface FireYearlyBreakdown {
  year: number;
  age: number;
  corpus: number;
  invested: number;
  monthlyExpense: number; // inflation-adjusted
}

export function calculateFIRENumber(
  annualExpenses: number,
  safeWithdrawalRatePct: number,
): number {
  return annualExpenses / (safeWithdrawalRatePct / 100);
}

export function calculateFIRE(input: FireInput): FireResult {
  const {
    currentAge,
    retirementAge,
    currentInvestments,
    monthlyInvestment,
    annualStepUpPct,
    currentMonthlyExpenses,
    expectedReturnPct,
    inflationPct,
    safeWithdrawalRatePct,
    otherMonthlyIncome = 0,
  } = input;

  const yearsToRetirement = retirementAge - currentAge;
  const monthlyRate = expectedReturnPct / 100 / 12;
  const yearlyBreakdown: FireYearlyBreakdown[] = [];

  let corpus = currentInvestments;
  let currentMonthlyInv = monthlyInvestment;
  let totalInvested = currentInvestments;

  for (let year = 1; year <= yearsToRetirement; year++) {
    for (let month = 1; month <= 12; month++) {
      corpus = corpus * (1 + monthlyRate) + currentMonthlyInv;
      totalInvested += currentMonthlyInv;
    }
    const inflationFactor = Math.pow(1 + inflationPct / 100, year);
    yearlyBreakdown.push({
      year: new Date().getFullYear() + year,
      age: currentAge + year,
      corpus: Math.round(corpus),
      invested: Math.round(totalInvested),
      monthlyExpense: Math.round(currentMonthlyExpenses * inflationFactor),
    });
    currentMonthlyInv = currentMonthlyInv * (1 + annualStepUpPct / 100);
  }

  // Inflation-adjusted expenses at retirement
  const inflationAtRetirement = Math.pow(1 + inflationPct / 100, yearsToRetirement);
  const monthlyExpensesAtRetirement = currentMonthlyExpenses * inflationAtRetirement;
  const netMonthlyExpenses = Math.max(0, monthlyExpensesAtRetirement - otherMonthlyIncome);
  const annualExpensesAtRetirement = netMonthlyExpenses * 12;

  const fireNumber = calculateFIRENumber(annualExpensesAtRetirement, safeWithdrawalRatePct);
  const progressPct = Math.min(100, (currentInvestments / fireNumber) * 100);
  const projectedCorpusAtRetirement = corpus;
  const shortfallOrSurplus = projectedCorpusAtRetirement - fireNumber;
  const monthlyWithdrawable = (projectedCorpusAtRetirement * (safeWithdrawalRatePct / 100)) / 12;

  return {
    fireNumber: Math.round(fireNumber),
    currentCorpus: currentInvestments,
    progressPct: Math.round(progressPct * 10) / 10,
    projectedCorpusAtRetirement: Math.round(projectedCorpusAtRetirement),
    fireYear: new Date().getFullYear() + yearsToRetirement,
    yearsToFire: yearsToRetirement,
    monthlyExpensesAtRetirement: Math.round(monthlyExpensesAtRetirement),
    monthlyWithdrawableAmount: Math.round(monthlyWithdrawable),
    shortfallOrSurplus: Math.round(shortfallOrSurplus),
    yearlyBreakdown,
    formula:
      'FIRE Number = Annual Expenses at Retirement / Safe Withdrawal Rate. Expenses adjusted for inflation. Corpus projected using FV of annuity with annual step-up.',
  };
}
