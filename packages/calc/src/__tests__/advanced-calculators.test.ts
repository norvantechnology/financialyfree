import {
  calculatePortfolioRebalancing,
  calculateTaxHarvesting,
  calculateSipVsLumpsum,
  calculateRuleOf72,
  calculateEmergencyFundAdequacy,
  calculateRetirementStressTest,
  calculateBenchmarkXirr,
} from '../index';

describe('Portfolio Rebalancing Alert Engine', () => {
  test('detects equity overweight drift exceeding threshold and recommends SELL', () => {
    const result = calculatePortfolioRebalancing({
      holdings: [
        { schemeName: 'Nifty 50 Index Fund', assetClass: 'equity', currentValue: 800000 },
        { schemeName: 'Corporate Bond Fund', assetClass: 'debt', currentValue: 150000 },
        { schemeName: 'Sovereign Gold Bond', assetClass: 'gold', currentValue: 50000 },
      ],
      targetAllocation: { equity: 70, debt: 25, gold: 5, cash: 0 },
      driftThresholdPct: 5,
    });

    expect(result.totalPortfolioValue).toBe(1000000);
    expect(result.hasDrift).toBe(true);
    expect(result.maxDriftAsset).toBe('equity');
    expect(result.maxDriftPct).toBe(10); // 80% vs 70%

    const equityDrift = result.drifts.find((d) => d.assetClass === 'equity');
    expect(equityDrift?.action).toBe('SELL');
    expect(equityDrift?.recommendedAmount).toBe(100000);

    const debtDrift = result.drifts.find((d) => d.assetClass === 'debt');
    expect(debtDrift?.action).toBe('BUY');
    expect(debtDrift?.recommendedAmount).toBe(100000);
  });

  test('reports no drift when allocations are within safe tolerance', () => {
    const result = calculatePortfolioRebalancing({
      holdings: [
        { schemeName: 'Nifty 50 Index Fund', assetClass: 'equity', currentValue: 710000 },
        { schemeName: 'Corporate Bond Fund', assetClass: 'debt', currentValue: 240000 },
        { schemeName: 'Sovereign Gold Bond', assetClass: 'gold', currentValue: 50000 },
      ],
      targetAllocation: { equity: 70, debt: 25, gold: 5, cash: 0 },
      driftThresholdPct: 5,
    });

    expect(result.hasDrift).toBe(false);
    expect(result.urgency).toBe('none');
    expect(result.rebalanceRecommendations.length).toBe(0);
  });
});

describe('Tax-Loss Harvesting Engine (Budget 2024)', () => {
  test('correctly computes STCG (20%) and LTCG (12.5%) loss offsets and tax savings', () => {
    const today = new Date();
    const fourHundredDaysAgo = new Date(today.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = calculateTaxHarvesting({
      lots: [
        // Lot 1: Long term loss (held > 365 days)
        {
          id: 'lot-1',
          schemeName: 'Small Cap Growth Fund',
          assetType: 'equity',
          purchaseDate: fourHundredDaysAgo,
          units: 1000,
          purchaseNav: 100,
          currentNav: 70, // -30,000 loss
        },
        // Lot 2: Short term loss (held < 365 days)
        {
          id: 'lot-2',
          schemeName: 'Mid Cap Momentum Fund',
          assetType: 'equity',
          purchaseDate: sixtyDaysAgo,
          units: 500,
          purchaseNav: 200,
          currentNav: 160, // -20,000 loss
        },
        // Lot 3: Gain lot
        {
          id: 'lot-3',
          schemeName: 'Large Cap Bluechip Fund',
          assetType: 'equity',
          purchaseDate: fourHundredDaysAgo,
          units: 2000,
          purchaseNav: 100,
          currentNav: 250, // +300,000 gain
        },
      ],
      marginalSlabRatePct: 30,
      realizedStcgThisYear: 20000,
      realizedLtcgThisYear: 50000,
    });

    expect(result.holdingSummary.lossLotsCount).toBe(2);
    expect(result.harvestOpportunities.length).toBe(2);
    expect(result.totalUnrealizedLoss).toBe(50000); // 30k + 20k
    expect(result.totalTaxSavings).toBeGreaterThan(0);
  });
});

describe('SIP vs Lumpsum Comparator', () => {
  test('evaluates compounding and trajectory over 10 years', () => {
    const result = calculateSipVsLumpsum({
      totalCapital: 600000,
      horizonYears: 10,
      expectedAnnualReturnPct: 12,
      marketRegime: 'steady_growth',
    });

    expect(result.totalCapitalInvested).toBe(600000);
    expect(result.horizonYears).toBe(10);
    expect(result.lumpsum.projectedCorpus).toBeGreaterThan(600000);
    expect(result.sip.projectedCorpus).toBeGreaterThan(600000);
    // In steady growth, Lumpsum gets 100% compounding from Day 1, so lumpsum > sip
    expect(result.lumpsum.projectedCorpus).toBeGreaterThan(result.sip.projectedCorpus);
    expect(result.comparison.winner).toBe('Lumpsum');
    expect(result.trajectory.length).toBe(10);
    expect(result.trajectory[9].year).toBe(10);
  });
});

describe('Rule of 72 & Wealth Doubling Lab', () => {
  test('calculates doubling time accurately for 12% return', () => {
    const result = calculateRuleOf72({
      annualReturnPct: 12,
      initialCapital: 1000000,
      inflationPct: 6,
    });

    expect(result.doubling.ruleOf72Years).toBe(6);
    expect(result.doubling.exactYears).toBeCloseTo(6.1, 1);
    expect(result.tripling.ruleOf114Years).toBe(9.5);
    expect(result.inflationAdjusted.realDoublingYears).toBeGreaterThan(result.doubling.exactYears);
    expect(result.benchmarks.length).toBeGreaterThan(0);
    expect(result.milestones.length).toBe(5);
  });
});

describe('Emergency Fund Adequacy Score', () => {
  test('scores safety runway and calculates shortfall bridge plan', () => {
    const result = calculateEmergencyFundAdequacy({
      monthlyMandatoryExpenses: 50000,
      liquidReserves: 150000, // 3 months
      employmentType: 'salaried_stable', // benchmark 6 months
      dependentsCount: 2,
    });

    expect(result.monthsCovered).toBe(3);
    expect(result.targetMonths).toBe(6);
    expect(result.targetCorpus).toBe(300000);
    expect(result.shortfallOrSurplus).toBe(-150000);
    expect(result.shortfallActionPlan.hasShortfall).toBe(true);
    expect(result.shortfallActionPlan.shortfallAmount).toBe(150000);
    expect(result.shortfallActionPlan.monthlySipToBridge6Months).toBe(25000);
    expect(result.statusTier).toBe('INSUFFICIENT');
    expect(result.allocationBuckets.length).toBe(3);
  });

  test('awards OPTIMAL status when reserves meet or exceed target', () => {
    const result = calculateEmergencyFundAdequacy({
      monthlyMandatoryExpenses: 40000,
      liquidReserves: 280000, // 7 months vs 6 months
      employmentType: 'salaried_stable',
    });

    expect(result.statusTier).toBe('OPTIMAL');
    expect(result.adequacyScore).toBeGreaterThanOrEqual(90);
    expect(result.shortfallActionPlan.hasShortfall).toBe(false);
  });
});

describe('What-If Retirement Stress Test (Monte Carlo)', () => {
  test('simulates stochastic paths and evaluates SWR safety', () => {
    const result = calculateRetirementStressTest({
      initialCorpus: 20000000, // 2 Crores
      annualWithdrawal: 800000, // 4% SWR
      horizonYears: 25,
      meanReturnPct: 10,
      volatilityPct: 12,
      inflationPct: 6,
      numSimulations: 200,
    });

    expect(result.initialWithdrawalRatePct).toBe(4.0);
    expect(result.successProbabilityPct).toBeGreaterThan(50);
    expect(result.trajectories.length).toBe(26);
    expect(result.scenarios.length).toBe(3);
    expect(result.recommendedWithdrawal.safeAnnualWithdrawal).toBeGreaterThan(0);
  });
});

describe('Benchmark XIRR vs Nifty 50 TRI Comparator', () => {
  test('calculates portfolio XIRR, benchmark XIRR, and Alpha', () => {
    const result = calculateBenchmarkXirr({
      cashflows: [
        { amount: -200000, date: '2021-01-15' },
        { amount: -200000, date: '2022-01-15' },
        { amount: -200000, date: '2023-01-15' },
      ],
      currentPortfolioValue: 950000, // Profitable performance
    });

    expect(result.totalCapitalInvested).toBe(600000);
    expect(result.portfolioCurrentValue).toBe(950000);
    expect(result.benchmarkSimulatedValue).toBeGreaterThan(600000);
    expect(typeof result.portfolioXirrPct).toBe('number');
    expect(typeof result.benchmarkXirrPct).toBe('number');
    expect(typeof result.alphaPct).toBe('number');
    expect(result.cashflowTimeline.length).toBe(3);
    expect(result.verdict).toBeTruthy();
  });
});
