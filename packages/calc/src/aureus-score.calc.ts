// ── packages/calc/src/aureus-score.calc.ts ───────────────────────────────────
// Aureus Score (0–100): Composite Indian Equity Quality Score.
// Evaluates 4 fundamental pillars:
//   1. ROCE (30% weight) - Operational Capital Efficiency
//   2. Debt-to-Equity (25% weight) - Financial Solvency & Leverage
//   3. Promoter Holding % (25% weight) - Alignment & Skin in the game
//   4. Promoter Pledge % (20% weight) - Governance & Distress Risk
//
// Ground rule on honesty:
// Never inject fake numbers. If < 3 inputs exist, return INSUFFICIENT_DATA.
// When pledge % is not published in public exchange feeds, compute normalized
// partial score across the 3 available pillars, flag isPartial: true, and list missing items.

export interface AureusScoreInput {
  symbol?: string;
  companyName?: string;
  roce?: number | null; // e.g. 24.5 for 24.5%
  debtToEquity?: number | null; // e.g. 0.35
  promoterHoldingPercent?: number | null; // e.g. 62.4 for 62.4%
  pledgePercent?: number | null; // e.g. 0.0 for 0%
  institutionalHoldingPercent?: number | null; // Optional: used for widely held institutions with 0% promoter
}

export type AureusTier =
  | 'EXCEPTIONAL'
  | 'STRONG'
  | 'MODERATE'
  | 'CAUTION'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_DATA';

export type SubScoreStatus =
  | 'OPTIMAL'
  | 'HEALTHY'
  | 'MODERATE'
  | 'WEAK'
  | 'CRITICAL'
  | 'DATA_UNAVAILABLE';

export interface AureusSubScore {
  metric: 'roce' | 'debtToEquity' | 'promoterHolding' | 'pledge';
  label: string;
  rawValue: number | null;
  displayValue: string;
  score: number | null; // 0 - 100
  weight: number; // Effective weight % used in calculation
  baseWeight: number; // Default base weight (30, 25, 25, 20)
  contribution: number | null; // score * (weight / 100)
  status: SubScoreStatus;
  notes: string;
}

export interface AureusScoreResult {
  symbol?: string;
  companyName?: string;
  score: number | null; // 0 - 100
  tier: AureusTier;
  tierLabel: string;
  tierColor: string;
  summary: string;
  isPartial: boolean;
  missingComponents: string[];
  subScores: {
    roce: AureusSubScore;
    debtToEquity: AureusSubScore;
    promoterHolding: AureusSubScore;
    pledge: AureusSubScore;
  };
  totalWeightAvailable: number;
  methodologyNotice: string;
  computedAt: string;
}

/**
 * Calculates the ROCE pillar sub-score (0-100).
 * Thresholds calibrated for Indian manufacturing, IT, retail, and capital goods.
 */
export function calculateRoceSubScore(roce: number | null | undefined): {
  score: number | null;
  status: SubScoreStatus;
  notes: string;
  displayValue: string;
} {
  if (roce === null || roce === undefined || isNaN(roce)) {
    return {
      score: null,
      status: 'DATA_UNAVAILABLE',
      notes: 'ROCE not disclosed in recent filings or financial statements.',
      displayValue: 'N/A',
    };
  }

  const r = Math.round(roce * 100) / 100;
  const displayValue = `${r.toFixed(1)}%`;

  if (r >= 25) {
    return {
      score: 100,
      status: 'OPTIMAL',
      notes: 'Superior capital compounding (>25% ROCE).',
      displayValue,
    };
  }
  if (r >= 20) {
    const s = Math.round(85 + ((r - 20) / 5) * 15);
    return {
      score: s,
      status: 'HEALTHY',
      notes: 'Strong capital efficiency (20–25% ROCE).',
      displayValue,
    };
  }
  if (r >= 15) {
    const s = Math.round(70 + ((r - 15) / 5) * 15);
    return {
      score: s,
      status: 'HEALTHY',
      notes: 'Healthy returns exceeding cost of capital (15–20% ROCE).',
      displayValue,
    };
  }
  if (r >= 10) {
    const s = Math.round(50 + ((r - 10) / 5) * 20);
    return {
      score: s,
      status: 'MODERATE',
      notes: 'Acceptable return matching average cost of capital (10–15% ROCE).',
      displayValue,
    };
  }
  if (r >= 0) {
    const s = Math.round((r / 10) * 50);
    return {
      score: Math.max(0, s),
      status: 'WEAK',
      notes: 'Sub-par capital efficiency below cost of capital (<10% ROCE).',
      displayValue,
    };
  }
  return {
    score: 0,
    status: 'CRITICAL',
    notes: 'Negative operating return (value destroying).',
    displayValue,
  };
}

/**
 * Calculates the Debt-to-Equity pillar sub-score (0-100). Lower is better.
 */
export function calculateDebtToEquitySubScore(de: number | null | undefined): {
  score: number | null;
  status: SubScoreStatus;
  notes: string;
  displayValue: string;
} {
  if (de === null || de === undefined || isNaN(de)) {
    return {
      score: null,
      status: 'DATA_UNAVAILABLE',
      notes: 'Debt-to-Equity ratio not available.',
      displayValue: 'N/A',
    };
  }

  const d = Math.max(0, Math.round(de * 100) / 100);
  const displayValue = `${d.toFixed(2)}x`;

  if (d <= 0.1) {
    return {
      score: 100,
      status: 'OPTIMAL',
      notes: 'Virtually debt-free balance sheet (D/E ≤ 0.1x).',
      displayValue,
    };
  }
  if (d <= 0.5) {
    const s = Math.round(100 - ((d - 0.1) / 0.4) * 15);
    return {
      score: s,
      status: 'HEALTHY',
      notes: 'Prudent conservative leverage (D/E 0.1x–0.5x).',
      displayValue,
    };
  }
  if (d <= 1.0) {
    const s = Math.round(85 - ((d - 0.5) / 0.5) * 20);
    return {
      score: s,
      status: 'MODERATE',
      notes: 'Manageable leverage within comfort boundary (D/E 0.5x–1.0x).',
      displayValue,
    };
  }
  if (d <= 1.5) {
    const s = Math.round(65 - ((d - 1.0) / 0.5) * 25);
    return {
      score: s,
      status: 'WEAK',
      notes: 'Elevated debt requiring monitoring (D/E 1.0x–1.5x).',
      displayValue,
    };
  }
  if (d <= 2.0) {
    const s = Math.round(40 - ((d - 1.5) / 0.5) * 20);
    return {
      score: s,
      status: 'CRITICAL',
      notes: 'High debt burden; interest coverage vulnerability (D/E 1.5x–2.0x).',
      displayValue,
    };
  }
  const s = Math.max(0, Math.round(20 - (d - 2.0) * 10));
  return {
    score: s,
    status: 'CRITICAL',
    notes: 'Severe leverage distress risk (D/E > 2.0x).',
    displayValue,
  };
}

/**
 * Calculates Promoter Holding pillar sub-score (0-100).
 * Handles professionally managed entities where promoter is 0% but institutional is high.
 */
export function calculatePromoterHoldingSubScore(
  promoter: number | null | undefined,
  institutional?: number | null | undefined,
): {
  score: number | null;
  status: SubScoreStatus;
  notes: string;
  displayValue: string;
} {
  if (promoter === null || promoter === undefined || isNaN(promoter)) {
    return {
      score: null,
      status: 'DATA_UNAVAILABLE',
      notes: 'Promoter shareholding % not available.',
      displayValue: 'N/A',
    };
  }

  const p = Math.round(promoter * 100) / 100;
  const displayValue = `${p.toFixed(1)}%`;

  // Professionally managed exception (e.g., ICICI Bank, HDFC, L&T, ITC)
  if (p === 0 && institutional && institutional >= 50) {
    const inst = Math.round(institutional * 100) / 100;
    return {
      score: 85,
      status: 'HEALTHY',
      notes: `Professionally managed board (0% promoter, ${inst.toFixed(1)}% institutional holding).`,
      displayValue: `0% (${inst.toFixed(1)}% Inst)`,
    };
  }

  if (p >= 65) {
    return {
      score: 100,
      status: 'OPTIMAL',
      notes: 'Exceptional promoter commitment & skin in the game (≥65%).',
      displayValue,
    };
  }
  if (p >= 50) {
    const s = Math.round(85 + ((p - 50) / 15) * 15);
    return {
      score: s,
      status: 'HEALTHY',
      notes: 'Majority promoter holding ensuring stability (50–65%).',
      displayValue,
    };
  }
  if (p >= 35) {
    const s = Math.round(65 + ((p - 35) / 15) * 20);
    return {
      score: s,
      status: 'MODERATE',
      notes: 'Decent promoter presence (35–50%).',
      displayValue,
    };
  }
  if (p >= 25) {
    const s = Math.round(40 + ((p - 25) / 10) * 25);
    return {
      score: s,
      status: 'WEAK',
      notes: 'Low promoter stake; takeover or dilution vulnerability (25–35%).',
      displayValue,
    };
  }
  const s = Math.max(10, Math.round((p / 25) * 40));
  return {
    score: s,
    status: 'CRITICAL',
    notes: 'Very low promoter ownership (<25%).',
    displayValue,
  };
}

/**
 * Calculates Promoter Pledge pillar sub-score (0-100). Lower is better.
 */
export function calculatePledgeSubScore(pledge: number | null | undefined): {
  score: number | null;
  status: SubScoreStatus;
  notes: string;
  displayValue: string;
} {
  if (pledge === null || pledge === undefined || isNaN(pledge)) {
    return {
      score: null,
      status: 'DATA_UNAVAILABLE',
      notes:
        'Pledge % not disclosed in public master feed (XBRL statutory filing required).',
      displayValue: 'Not Disclosed',
    };
  }

  const pl = Math.max(0, Math.round(pledge * 100) / 100);
  const displayValue = `${pl.toFixed(1)}%`;

  if (pl === 0) {
    return {
      score: 100,
      status: 'OPTIMAL',
      notes: 'Pristine governance: zero promoter shares encumbered (0% pledge).',
      displayValue,
    };
  }
  if (pl <= 5) {
    const s = Math.round(85 - (pl / 5) * 15);
    return {
      score: s,
      status: 'HEALTHY',
      notes: 'Negligible pledge risk (≤5%).',
      displayValue,
    };
  }
  if (pl <= 15) {
    const s = Math.round(60 - ((pl - 5) / 10) * 25);
    return {
      score: s,
      status: 'MODERATE',
      notes: 'Moderate pledge; warrants monitoring for collateral calls (5–15%).',
      displayValue,
    };
  }
  if (pl <= 30) {
    const s = Math.round(25 - ((pl - 15) / 15) * 25);
    return {
      score: s,
      status: 'WEAK',
      notes: 'High encumbrance risk (15–30% of promoter stake pledged).',
      displayValue,
    };
  }
  return {
    score: 0,
    status: 'CRITICAL',
    notes: 'Severe governance & forced-liquidation hazard (>30% pledged).',
    displayValue,
  };
}

/**
 * Computes the 0–100 Aureus Composite Stock Quality Score.
 */
export function calculateAureusScore(input: AureusScoreInput): AureusScoreResult {
  const BASE_WEIGHTS = {
    roce: 30,
    debtToEquity: 25,
    promoterHolding: 25,
    pledge: 20,
  };

  const roceRes = calculateRoceSubScore(input.roce);
  const deRes = calculateDebtToEquitySubScore(input.debtToEquity);
  const phRes = calculatePromoterHoldingSubScore(
    input.promoterHoldingPercent,
    input.institutionalHoldingPercent,
  );
  const pledgeRes = calculatePledgeSubScore(input.pledgePercent);

  const availableWeights: Record<string, number> = {};
  const missingComponents: string[] = [];

  if (roceRes.score !== null) {
    availableWeights.roce = BASE_WEIGHTS.roce;
  } else {
    missingComponents.push('ROCE');
  }

  if (deRes.score !== null) {
    availableWeights.debtToEquity = BASE_WEIGHTS.debtToEquity;
  } else {
    missingComponents.push('Debt-to-Equity');
  }

  if (phRes.score !== null) {
    availableWeights.promoterHolding = BASE_WEIGHTS.promoterHolding;
  } else {
    missingComponents.push('Promoter Holding');
  }

  if (pledgeRes.score !== null) {
    availableWeights.pledge = BASE_WEIGHTS.pledge;
  } else {
    missingComponents.push('Promoter Pledge %');
  }

  const availableCount = Object.keys(availableWeights).length;
  const totalWeightAvailable = Object.values(availableWeights).reduce((a, b) => a + b, 0);

  // If fewer than 3 inputs are available, mark INSUFFICIENT_DATA honestly
  if (availableCount < 3 || totalWeightAvailable === 0) {
    return {
      symbol: input.symbol,
      companyName: input.companyName,
      score: null,
      tier: 'INSUFFICIENT_DATA',
      tierLabel: 'Insufficient Data',
      tierColor: '#94A3B8', // slate-400
      summary: `Insufficient fundamental metrics available (${availableCount}/4 pillars). Minimum 3 pillars required for a credible score.`,
      isPartial: true,
      missingComponents,
      subScores: {
        roce: {
          metric: 'roce',
          label: 'Capital Efficiency (ROCE)',
          rawValue: input.roce ?? null,
          displayValue: roceRes.displayValue,
          score: roceRes.score,
          weight: 0,
          baseWeight: BASE_WEIGHTS.roce,
          contribution: null,
          status: roceRes.status,
          notes: roceRes.notes,
        },
        debtToEquity: {
          metric: 'debtToEquity',
          label: 'Solvency (Debt/Equity)',
          rawValue: input.debtToEquity ?? null,
          displayValue: deRes.displayValue,
          score: deRes.score,
          weight: 0,
          baseWeight: BASE_WEIGHTS.debtToEquity,
          contribution: null,
          status: deRes.status,
          notes: deRes.notes,
        },
        promoterHolding: {
          metric: 'promoterHolding',
          label: 'Promoter Skin in Game',
          rawValue: input.promoterHoldingPercent ?? null,
          displayValue: phRes.displayValue,
          score: phRes.score,
          weight: 0,
          baseWeight: BASE_WEIGHTS.promoterHolding,
          contribution: null,
          status: phRes.status,
          notes: phRes.notes,
        },
        pledge: {
          metric: 'pledge',
          label: 'Governance (Pledge %)',
          rawValue: input.pledgePercent ?? null,
          displayValue: pledgeRes.displayValue,
          score: pledgeRes.score,
          weight: 0,
          baseWeight: BASE_WEIGHTS.pledge,
          contribution: null,
          status: pledgeRes.status,
          notes: pledgeRes.notes,
        },
      },
      totalWeightAvailable,
      methodologyNotice:
        'Aureus Score requires at least 3 verified quality pillars (ROCE, D/E, Shareholding, Pledge).',
      computedAt: new Date().toISOString(),
    };
  }

  // Calculate normalized weights (summing to 100%)
  const normalizedWeights: Record<string, number> = {
    roce: availableWeights.roce ? Math.round((availableWeights.roce / totalWeightAvailable) * 1000) / 10 : 0,
    debtToEquity: availableWeights.debtToEquity
      ? Math.round((availableWeights.debtToEquity / totalWeightAvailable) * 1000) / 10
      : 0,
    promoterHolding: availableWeights.promoterHolding
      ? Math.round((availableWeights.promoterHolding / totalWeightAvailable) * 1000) / 10
      : 0,
    pledge: availableWeights.pledge
      ? Math.round((availableWeights.pledge / totalWeightAvailable) * 1000) / 10
      : 0,
  };

  const roceContrib =
    roceRes.score !== null ? (roceRes.score * normalizedWeights.roce) / 100 : null;
  const deContrib =
    deRes.score !== null ? (deRes.score * normalizedWeights.debtToEquity) / 100 : null;
  const phContrib =
    phRes.score !== null ? (phRes.score * normalizedWeights.promoterHolding) / 100 : null;
  const pledgeContrib =
    pledgeRes.score !== null ? (pledgeRes.score * normalizedWeights.pledge) / 100 : null;

  const rawComposite =
    (roceContrib ?? 0) + (deContrib ?? 0) + (phContrib ?? 0) + (pledgeContrib ?? 0);
  const finalScore = Math.min(100, Math.max(0, Math.round(rawComposite * 10) / 10));

  let tier: AureusTier;
  let tierLabel: string;
  let tierColor: string;
  let summary: string;

  if (finalScore >= 80) {
    tier = 'EXCEPTIONAL';
    tierLabel = 'Grade AAA — Exceptional Quality';
    tierColor = '#10B981'; // emerald-500
    summary = 'Outstanding fundamentals: robust capital compounding, pristine balance sheet, and strong promoter alignment.';
  } else if (finalScore >= 65) {
    tier = 'STRONG';
    tierLabel = 'Grade AA — High Quality';
    tierColor = '#06B6D4'; // cyan-500
    summary = 'Well-rounded financial profile with solid capital returns and disciplined balance sheet leverage.';
  } else if (finalScore >= 50) {
    tier = 'MODERATE';
    tierLabel = 'Grade A- — Moderate Quality';
    tierColor = '#F59E0B'; // amber-500
    summary = 'Acceptable baseline fundamentals with average return metrics or moderate debt obligations.';
  } else if (finalScore >= 35) {
    tier = 'CAUTION';
    tierLabel = 'Grade B — Elevated Risk';
    tierColor = '#F97316'; // orange-500
    summary = 'Notable vulnerabilities detected in capital efficiency, leverage levels, or promoter structure.';
  } else {
    tier = 'HIGH_RISK';
    tierLabel = 'Grade C — Distressed Quality';
    tierColor = '#EF4444'; // red-500
    summary = 'High-risk quality profile: weak/negative returns or severe financial leverage.';
  }

  const isPartial = missingComponents.length > 0;
  const methodologyNotice = isPartial
    ? `Normalized partial score (${totalWeightAvailable}% baseline coverage). Missing: ${missingComponents.join(', ')}. Weights re-scaled to 100%.`
    : 'Full composite quality score across all 4 verified pillars (100% coverage).';

  return {
    symbol: input.symbol,
    companyName: input.companyName,
    score: finalScore,
    tier,
    tierLabel,
    tierColor,
    summary,
    isPartial,
    missingComponents,
    subScores: {
      roce: {
        metric: 'roce',
        label: 'Capital Efficiency (ROCE)',
        rawValue: input.roce ?? null,
        displayValue: roceRes.displayValue,
        score: roceRes.score,
        weight: normalizedWeights.roce,
        baseWeight: BASE_WEIGHTS.roce,
        contribution: roceContrib !== null ? Math.round(roceContrib * 10) / 10 : null,
        status: roceRes.status,
        notes: roceRes.notes,
      },
      debtToEquity: {
        metric: 'debtToEquity',
        label: 'Solvency (Debt/Equity)',
        rawValue: input.debtToEquity ?? null,
        displayValue: deRes.displayValue,
        score: deRes.score,
        weight: normalizedWeights.debtToEquity,
        baseWeight: BASE_WEIGHTS.debtToEquity,
        contribution: deContrib !== null ? Math.round(deContrib * 10) / 10 : null,
        status: deRes.status,
        notes: deRes.notes,
      },
      promoterHolding: {
        metric: 'promoterHolding',
        label: 'Promoter Skin in Game',
        rawValue: input.promoterHoldingPercent ?? null,
        displayValue: phRes.displayValue,
        score: phRes.score,
        weight: normalizedWeights.promoterHolding,
        baseWeight: BASE_WEIGHTS.promoterHolding,
        contribution: phContrib !== null ? Math.round(phContrib * 10) / 10 : null,
        status: phRes.status,
        notes: phRes.notes,
      },
      pledge: {
        metric: 'pledge',
        label: 'Governance (Pledge %)',
        rawValue: input.pledgePercent ?? null,
        displayValue: pledgeRes.displayValue,
        score: pledgeRes.score,
        weight: normalizedWeights.pledge,
        baseWeight: BASE_WEIGHTS.pledge,
        contribution: pledgeContrib !== null ? Math.round(pledgeContrib * 10) / 10 : null,
        status: pledgeRes.status,
        notes: pledgeRes.notes,
      },
    },
    totalWeightAvailable,
    methodologyNotice,
    computedAt: new Date().toISOString(),
  };
}
