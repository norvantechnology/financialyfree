import { calculateSIPRequired, calculateCorpusProjection, calculateCAGR, calculateXIRR } from '../goal.calc';

describe('calculateSIPRequired', () => {
  test('Emergency Fund: ₹6L in 1 year at 6% — should be ~₹48,500/mo', () => {
    const result = calculateSIPRequired({
      targetCorpus: 600_000,
      horizonYears: 1,
      expectedReturnPct: 6,
      currentSavings: 0,
    });
    expect(result.monthlySip).toBeGreaterThan(48_000);
    expect(result.monthlySip).toBeLessThan(50_000);
  });

  test('Retirement: ₹5Cr in 25 years at 12% — SIP should be reasonable', () => {
    const result = calculateSIPRequired({
      targetCorpus: 50_000_000,
      horizonYears: 25,
      expectedReturnPct: 12,
      currentSavings: 0,
    });
    expect(result.monthlySip).toBeGreaterThan(10_000);
    expect(result.monthlySip).toBeLessThan(100_000);
  });

  test('Current savings reduce the required SIP', () => {
    const withoutSavings = calculateSIPRequired({
      targetCorpus: 10_000_000,
      horizonYears: 10,
      expectedReturnPct: 12,
      currentSavings: 0,
    });
    const withSavings = calculateSIPRequired({
      targetCorpus: 10_000_000,
      horizonYears: 10,
      expectedReturnPct: 12,
      currentSavings: 500_000,
    });
    expect(withSavings.monthlySip).toBeLessThan(withoutSavings.monthlySip);
  });

  test('Result includes formula and assumptions', () => {
    const result = calculateSIPRequired({
      targetCorpus: 1_000_000,
      horizonYears: 5,
      expectedReturnPct: 10,
      currentSavings: 0,
    });
    expect(result.formula).toBeTruthy();
    expect(result.assumptions.monthlyRate).toBeCloseTo(0.1 / 12, 6);
  });

  test('SIP rounds up to nearest rupee', () => {
    const result = calculateSIPRequired({
      targetCorpus: 1_234_567,
      horizonYears: 3,
      expectedReturnPct: 8,
      currentSavings: 0,
    });
    expect(Number.isInteger(result.monthlySip)).toBe(true);
  });
});

describe('calculateCorpusProjection', () => {
  test('With 0% step-up and 12% returns, ₹10K/mo for 10Y projects corpus correctly', () => {
    const result = calculateCorpusProjection({
      monthlySip: 10_000,
      currentSavings: 0,
      horizonYears: 10,
      expectedReturnPct: 12,
      annualStepUpPct: 0,
    });
    // ₹10K/mo for 10Y at 12% ≈ ₹23L (2.3M)
    expect(result.projectedCorpus).toBeGreaterThan(2_000_000); // > ₹20L
    expect(result.projectedCorpus).toBeLessThan(3_000_000);    // < ₹30L
    expect(result.yearlyBreakdown.length).toBe(10);
  });

  test('Step-up increases projected corpus vs no step-up', () => {
    const base = calculateCorpusProjection({
      monthlySip: 10_000,
      currentSavings: 0,
      horizonYears: 10,
      expectedReturnPct: 12,
      annualStepUpPct: 0,
    });
    const withStepUp = calculateCorpusProjection({
      monthlySip: 10_000,
      currentSavings: 0,
      horizonYears: 10,
      expectedReturnPct: 12,
      annualStepUpPct: 10,
    });
    expect(withStepUp.projectedCorpus).toBeGreaterThan(base.projectedCorpus);
  });

  test('Total gains = projectedCorpus - totalInvested', () => {
    const result = calculateCorpusProjection({
      monthlySip: 5_000,
      currentSavings: 100_000,
      horizonYears: 5,
      expectedReturnPct: 10,
      annualStepUpPct: 0,
    });
    expect(result.totalGains).toBeCloseTo(result.projectedCorpus - result.totalInvested, 0);
  });
});

describe('calculateCAGR', () => {
  test('Known: ₹100 → ₹200 in 10 years = 7.18% CAGR', () => {
    const cagr = calculateCAGR(100, 200, 10);
    expect(cagr).toBeCloseTo(7.177, 2);
  });

  test('Returns 0 if startValue is 0', () => {
    expect(calculateCAGR(0, 100, 5)).toBe(0);
  });

  test('Returns 0 if years is 0', () => {
    expect(calculateCAGR(100, 200, 0)).toBe(0);
  });
});

describe('calculateXIRR', () => {
  test('Single investment and redemption — XIRR should match expected', () => {
    const cashflows = [
      { amount: -100_000, date: new Date('2024-01-01') },
      { amount: 120_000, date: new Date('2025-01-01') },
    ];
    const xirr = calculateXIRR(cashflows);
    expect(xirr).toBeCloseTo(20, 0); // ~20% return in 1 year
  });

  test('Returns 0 for insufficient cashflows', () => {
    expect(calculateXIRR([{ amount: -100, date: new Date() }])).toBe(0);
  });
});
