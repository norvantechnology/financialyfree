import { calculateFIRE, calculateFIRENumber } from '../fire.calc';

describe('calculateFIRENumber', () => {
  test('Standard 4% SWR with ₹10L annual expenses → FIRE number is ₹2.5Cr', () => {
    const fireNumber = calculateFIRENumber(1_000_000, 4);
    expect(fireNumber).toBe(25_000_000);
  });

  test('Higher SWR → lower FIRE number', () => {
    const conservative = calculateFIRENumber(1_000_000, 3);
    const aggressive = calculateFIRENumber(1_000_000, 5);
    expect(conservative).toBeGreaterThan(aggressive);
  });
});

describe('calculateFIRE', () => {
  const baseInput = {
    currentAge: 30,
    retirementAge: 50,
    currentInvestments: 1_000_000,
    monthlyInvestment: 30_000,
    annualStepUpPct: 10,
    currentMonthlyExpenses: 50_000,
    expectedReturnPct: 12,
    postRetirementReturnPct: 7,
    inflationPct: 6,
    safeWithdrawalRatePct: 4,
  };

  test('Returns correct structure', () => {
    const result = calculateFIRE(baseInput);
    expect(result).toHaveProperty('fireNumber');
    expect(result).toHaveProperty('currentCorpus');
    expect(result).toHaveProperty('progressPct');
    expect(result).toHaveProperty('projectedCorpusAtRetirement');
    expect(result).toHaveProperty('yearlyBreakdown');
    expect(result.yearlyBreakdown.length).toBe(20);
  });

  test('Progress % is between 0 and 100', () => {
    const result = calculateFIRE(baseInput);
    expect(result.progressPct).toBeGreaterThanOrEqual(0);
    expect(result.progressPct).toBeLessThanOrEqual(100);
  });

  test('Larger current investments → higher progress %', () => {
    const low = calculateFIRE({ ...baseInput, currentInvestments: 0 });
    const high = calculateFIRE({ ...baseInput, currentInvestments: 5_000_000 });
    expect(high.progressPct).toBeGreaterThan(low.progressPct);
  });

  test('FIRE year matches retirement age', () => {
    const result = calculateFIRE(baseInput);
    expect(result.yearsToFire).toBe(20);
    expect(result.fireYear).toBe(new Date().getFullYear() + 20);
  });

  test('Monthly expenses at retirement are inflation-adjusted', () => {
    const result = calculateFIRE(baseInput);
    // 6% inflation over 20 years: 50K * (1.06)^20 ≈ 1.6L+
    expect(result.monthlyExpensesAtRetirement).toBeGreaterThan(100_000);
  });

  test('Formula is returned and non-empty', () => {
    const result = calculateFIRE(baseInput);
    expect(result.formula.length).toBeGreaterThan(20);
  });
});
