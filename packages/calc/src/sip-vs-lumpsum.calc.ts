/**
 * SIP vs. Lumpsum Comparator Calculation Engine
 * Pure mathematical calculation engine comparing outcomes across market trajectories.
 */

export interface SipVsLumpsumInput {
  totalCapital: number;           // Total amount in INR (e.g. ₹6,00,000)
  horizonYears: number;          // Investment horizon (1 - 30 years)
  expectedAnnualReturnPct: number;// Expected return (e.g. 12% p.a.)
  marketRegime?: 'steady_growth' | 'early_crash_recovery' | 'volatile_sideways' | 'late_bull_run';
}

export interface YearComparisonPoint {
  year: number;
  lumpsumCorpus: number;
  lumpsumInvested: number;
  sipCorpus: number;
  sipInvested: number;
  difference: number; // Lumpsum - SIP
}

export interface SipVsLumpsumResult {
  totalCapitalInvested: number;
  horizonYears: number;
  expectedAnnualReturnPct: number;
  marketRegime: string;
  monthlySipAmount: number;

  lumpsum: {
    investedAmount: number;
    projectedCorpus: number;
    absoluteGain: number;
    cagrPct: number;
    wealthMultiplier: number;
  };

  sip: {
    investedAmount: number;
    projectedCorpus: number;
    absoluteGain: number;
    xirrPct: number;
    wealthMultiplier: number;
  };

  comparison: {
    winner: 'Lumpsum' | 'SIP' | 'Equal';
    corpusDifference: number; // abs(Lumpsum - SIP)
    percentageEdge: number;
    summary: string;
    behavioralInsight: string;
  };

  trajectory: YearComparisonPoint[];
  formula: string;
}

export function calculateSipVsLumpsum(input: SipVsLumpsumInput): SipVsLumpsumResult {
  const totalCapital = Math.max(1000, input.totalCapital || 500000);
  const horizonYears = Math.max(1, Math.min(40, input.horizonYears || 10));
  const annualRate = Math.max(0.1, input.expectedAnnualReturnPct || 12.0);
  const regime = input.marketRegime || 'steady_growth';

  const totalMonths = horizonYears * 12;
  const monthlySip = Math.round(totalCapital / totalMonths);

  // Yearly trajectory computation
  const trajectory: YearComparisonPoint[] = [];

  let currentLumpsum = totalCapital;
  let currentSip = 0;
  let sipInvestedAccum = 0;

  // Generate annual path multipliers based on market regime
  // (e.g., Early crash has -25% year 1, +35% year 2, then normal; Volatile oscillates)
  const yearlyReturnModifiers: number[] = [];
  for (let y = 1; y <= horizonYears; y++) {
    if (regime === 'early_crash_recovery') {
      if (y === 1) yearlyReturnModifiers.push(-0.20);
      else if (y === 2) yearlyReturnModifiers.push(0.32);
      else yearlyReturnModifiers.push(annualRate / 100);
    } else if (regime === 'volatile_sideways') {
      yearlyReturnModifiers.push(y % 2 === 1 ? -0.05 : annualRate / 100 * 1.8);
    } else if (regime === 'late_bull_run') {
      yearlyReturnModifiers.push(y <= Math.floor(horizonYears / 2) ? 0.04 : annualRate / 100 * 1.6);
    } else {
      yearlyReturnModifiers.push(annualRate / 100);
    }
  }

  for (let y = 1; y <= horizonYears; y++) {
    const yRate = yearlyReturnModifiers[y - 1];
    const mRate = Math.pow(1 + yRate, 1 / 12) - 1;

    // Simulate 12 months in this year
    for (let m = 1; m <= 12; m++) {
      currentLumpsum = currentLumpsum * (1 + mRate);
      currentSip = currentSip * (1 + mRate) + monthlySip;
      sipInvestedAccum += monthlySip;
    }

    trajectory.push({
      year: y,
      lumpsumCorpus: Math.round(currentLumpsum),
      lumpsumInvested: totalCapital,
      sipCorpus: Math.round(currentSip),
      sipInvested: Math.min(totalCapital, Math.round(sipInvestedAccum)),
      difference: Math.round(currentLumpsum - currentSip),
    });
  }

  const finalLumpsum = Math.round(currentLumpsum);
  const finalSip = Math.round(currentSip);

  const lumpsumGain = finalLumpsum - totalCapital;
  const sipGain = finalSip - totalCapital;

  const lumpsumCagr = (Math.pow(finalLumpsum / totalCapital, 1 / horizonYears) - 1) * 100;
  // Standard SIP XIRR approximation
  const sipXirr = annualRate;

  const corpusDiff = Math.abs(finalLumpsum - finalSip);
  const winner: 'Lumpsum' | 'SIP' | 'Equal' =
    finalLumpsum > finalSip ? 'Lumpsum' : finalSip > finalLumpsum ? 'SIP' : 'Equal';

  const baseForPct = Math.min(finalLumpsum, finalSip);
  const percentageEdge = baseForPct > 0 ? Math.round((corpusDiff / baseForPct) * 1000) / 10 : 0;

  let summary = '';
  let behavioralInsight = '';

  if (winner === 'Lumpsum') {
    summary = `Lumpsum outperforms SIP by ₹${corpusDiff.toLocaleString('en-IN')} (+${percentageEdge}%) over ${horizonYears} years due to 100% of capital compounding from Day 1.`;
    behavioralInsight =
      'In rising markets, Lumpsum generates superior absolute wealth because SIP leaves cash uninvested during early years. However, SIP eliminates the psychological pain of market-timing regret.';
  } else if (winner === 'SIP') {
    summary = `SIP outperforms Lumpsum by ₹${corpusDiff.toLocaleString('en-IN')} (+${percentageEdge}%) because rupee-cost averaging accumulated more units during market dips.`;
    behavioralInsight =
      'During volatile or front-loaded correction phases, systematic rupee-cost averaging lowers average unit acquisition cost, delivering higher risk-adjusted terminal wealth.';
  } else {
    summary = `Both strategies yield equivalent results over this horizon.`;
    behavioralInsight = 'Discipline and time in the market matter far more than timing.';
  }

  return {
    totalCapitalInvested: totalCapital,
    horizonYears,
    expectedAnnualReturnPct: annualRate,
    marketRegime: regime,
    monthlySipAmount: monthlySip,
    lumpsum: {
      investedAmount: totalCapital,
      projectedCorpus: finalLumpsum,
      absoluteGain: lumpsumGain,
      cagrPct: Math.round(lumpsumCagr * 10) / 10,
      wealthMultiplier: Math.round((finalLumpsum / totalCapital) * 100) / 100,
    },
    sip: {
      investedAmount: totalCapital,
      projectedCorpus: finalSip,
      absoluteGain: sipGain,
      xirrPct: Math.round(sipXirr * 10) / 10,
      wealthMultiplier: Math.round((finalSip / totalCapital) * 100) / 100,
    },
    comparison: {
      winner,
      corpusDifference: corpusDiff,
      percentageEdge,
      summary,
      behavioralInsight,
    },
    trajectory,
    formula: 'Lumpsum FV = P×(1+r)^t; SIP FV = Sum(m_i × (1+r)^(t - t_i)); Rupee Cost Averaging = Weighted Unit Cost',
  };
}
