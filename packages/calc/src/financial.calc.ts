/**
 * Financial ratio calculation engine (Track B / Section 43).
 * Used by both backend ratio recalculation jobs and frontend valuation module.
 * All formulas cite their inputs explicitly for auditability.
 */

export function calculatePE(price: number, eps: number): number | null {
  if (!eps || eps <= 0) return null;
  return price / eps;
}

export function calculatePB(price: number, bookValuePerShare: number): number | null {
  if (!bookValuePerShare || bookValuePerShare <= 0) return null;
  return price / bookValuePerShare;
}

export function calculateROE(pat: number, shareholderEquity: number): number | null {
  if (!shareholderEquity || shareholderEquity === 0) return null;
  return (pat / shareholderEquity) * 100;
}

export function calculateROCE(ebit: number, capitalEmployed: number): number | null {
  if (!capitalEmployed || capitalEmployed === 0) return null;
  return (ebit / capitalEmployed) * 100;
}

export function calculateROA(pat: number, totalAssets: number): number | null {
  if (!totalAssets || totalAssets === 0) return null;
  return (pat / totalAssets) * 100;
}

export function calculateDebtEquity(totalDebt: number, shareholderEquity: number): number | null {
  if (!shareholderEquity || shareholderEquity === 0) return null;
  return totalDebt / shareholderEquity;
}

export function calculateEV(
  marketCap: number,
  totalDebt: number,
  cash: number,
  minorityInterest = 0,
): number {
  return marketCap + totalDebt - cash + minorityInterest;
}

export function calculateEVEBITDA(ev: number, ebitda: number): number | null {
  if (!ebitda || ebitda <= 0) return null;
  return ev / ebitda;
}

export function calculateFCF(cfo: number, capex: number): number {
  return cfo - capex;
}

export function calculateNetDebtEBITDA(
  totalDebt: number,
  cash: number,
  ebitda: number,
): number | null {
  if (!ebitda || ebitda === 0) return null;
  return (totalDebt - cash) / ebitda;
}

export function calculateInterestCoverage(ebit: number, interestExpense: number): number | null {
  if (!interestExpense || interestExpense === 0) return null;
  return ebit / interestExpense;
}

export interface DCFInput {
  fcfProjections: number[]; // Free cash flows for each year
  wacc: number; // e.g. 10 for 10%
  terminalGrowthRate: number; // e.g. 4 for 4%
  netDebt: number; // total debt - cash
  sharesOutstanding: number;
}

export interface DCFResult {
  intrinsicValuePerShare: number;
  pvOfFCFs: number;
  terminalValue: number;
  pvOfTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  formula: string;
}

/**
 * DCF Valuation.
 * Terminal Value = Last FCF × (1 + g) / (WACC - g)
 * EV = PV(FCFs) + PV(Terminal Value)
 * Equity Value = EV - Net Debt
 * Price/Share = Equity Value / Shares Outstanding
 */
export function calculateDCF(input: DCFInput): DCFResult {
  const { fcfProjections, wacc, terminalGrowthRate, netDebt, sharesOutstanding } = input;

  const waccDecimal = wacc / 100;
  const gDecimal = terminalGrowthRate / 100;

  // PV of projected FCFs
  let pvOfFCFs = 0;
  for (let i = 0; i < fcfProjections.length; i++) {
    pvOfFCFs += fcfProjections[i] / Math.pow(1 + waccDecimal, i + 1);
  }

  // Terminal value (Gordon Growth Model)
  if (waccDecimal <= gDecimal) {
    return {
      intrinsicValuePerShare: NaN,
      pvOfFCFs,
      terminalValue: NaN,
      pvOfTerminalValue: NaN,
      enterpriseValue: NaN,
      equityValue: NaN,
      formula: 'Error: WACC must exceed terminal growth rate (g).',
    };
  }

  const lastFCF = fcfProjections[fcfProjections.length - 1];
  const terminalValue = (lastFCF * (1 + gDecimal)) / (waccDecimal - gDecimal);
  const pvOfTerminalValue = terminalValue / Math.pow(1 + waccDecimal, fcfProjections.length);

  const enterpriseValue = pvOfFCFs + pvOfTerminalValue;
  const equityValue = enterpriseValue - netDebt;
  const intrinsicValuePerShare = equityValue / sharesOutstanding;

  return {
    intrinsicValuePerShare,
    pvOfFCFs,
    terminalValue,
    pvOfTerminalValue,
    enterpriseValue,
    equityValue,
    formula:
      'DCF: EV = Σ FCFt/(1+WACC)^t + [FCFn×(1+g)/(WACC-g)]/(1+WACC)^n. Equity Value = EV - NetDebt. Price/Share = Equity/Shares.',
  };
}

export function calculateBuybackPremium(currentPrice: number, buybackPrice: number): number | null {
  if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice) || isNaN(buybackPrice)) {
    return null;
  }
  return ((buybackPrice - currentPrice) / currentPrice) * 100;
}

export function calculateBuybackReturn(
  investedAmount: number,
  currentPrice: number,
  buybackPrice: number,
  totalBuybackShares: number = 0,
  totalSharesOutstanding: number = 0,
  expectedAcceptanceRatioPct: number = 100,
): {
  eligibleShares: number;
  acceptedShares: number;
  expectedProceeds: number;
  expectedProfit: number;
  expectedReturnPct: number;
} {
  if (!investedAmount || investedAmount <= 0 || !currentPrice || currentPrice <= 0) {
    return {
      eligibleShares: 0,
      acceptedShares: 0,
      expectedProceeds: 0,
      expectedProfit: 0,
      expectedReturnPct: 0,
    };
  }

  const eligibleShares = Math.floor(investedAmount / currentPrice);
  
  let acceptanceRatio: number;
  if (totalSharesOutstanding && totalSharesOutstanding > 0 && totalBuybackShares > 0) {
    const buybackRatio = totalBuybackShares / totalSharesOutstanding;
    acceptanceRatio = Math.min(expectedAcceptanceRatioPct / 100, buybackRatio);
  } else {
    acceptanceRatio = Math.max(0, Math.min(1, expectedAcceptanceRatioPct / 100));
  }

  const acceptedShares = Math.floor(eligibleShares * acceptanceRatio);
  const remainingShares = eligibleShares - acceptedShares;

  const proceedsFromBuyback = acceptedShares * buybackPrice;
  const remainingValue = remainingShares * currentPrice;
  const totalProceeds = proceedsFromBuyback + remainingValue;
  const expectedProfit = totalProceeds - investedAmount;
  const expectedReturnPct = investedAmount > 0 ? (expectedProfit / investedAmount) * 100 : 0;

  return {
    eligibleShares,
    acceptedShares,
    expectedProceeds: totalProceeds,
    expectedProfit,
    expectedReturnPct,
  };
}

export function calculateEVSales(ev: number, sales: number): number | null {
  if (!sales || sales <= 0) return null;
  return ev / sales;
}

export function calculatePEG(pe: number, earningsGrowthPct: number): number | null {
  if (!earningsGrowthPct || earningsGrowthPct <= 0) return null;
  if (pe == null) return null;
  return pe / earningsGrowthPct;
}

export interface ReverseDCFInput {
  currentPrice: number;
  sharesOutstanding: number;
  netDebt: number;
  wacc: number; // e.g. 10 for 10%
  terminalGrowthRate: number; // e.g. 4 for 4%
  projectionYears: number; // e.g. 5
  lastFCF: number; // most recent FCF (₹ Cr)
}

export interface ReverseDCFResult {
  impliedGrowthRate: number; // The growth rate (%) the market is pricing in
  impliedEquityValue: number;
  formula: string;
}

/**
 * Reverse DCF: Given current market price, solve for the implied FCF growth rate.
 * Uses binary search to find the growth rate g such that
 * DCF(fcf growing at g% for N years, terminal at terminalGrowth) = market equity value.
 */
export function calculateReverseDCF(input: ReverseDCFInput): ReverseDCFResult {
  const { currentPrice, sharesOutstanding, netDebt, wacc, terminalGrowthRate, projectionYears, lastFCF } = input;

  const marketEquityValue = currentPrice * sharesOutstanding;
  const targetEV = marketEquityValue + netDebt;
  const waccDecimal = wacc / 100;
  const gTerminal = terminalGrowthRate / 100;

  if (waccDecimal <= gTerminal || lastFCF <= 0) {
    return {
      impliedGrowthRate: NaN,
      impliedEquityValue: marketEquityValue,
      formula: 'Error: WACC must exceed terminal growth rate and last FCF must be positive.',
    };
  }

  // Binary search for implied growth rate
  let lo = -50; // -50%
  let hi = 100; // +100%
  let mid = 0;

  for (let iter = 0; iter < 200; iter++) {
    mid = (lo + hi) / 2;
    const gDecimal = mid / 100;

    // Project FCFs at this growth rate
    let pvFCFs = 0;
    let fcf = lastFCF;
    for (let y = 1; y <= projectionYears; y++) {
      fcf = fcf * (1 + gDecimal);
      pvFCFs += fcf / Math.pow(1 + waccDecimal, y);
    }

    // Terminal value
    const tv = (fcf * (1 + gTerminal)) / (waccDecimal - gTerminal);
    const pvTV = tv / Math.pow(1 + waccDecimal, projectionYears);
    const ev = pvFCFs + pvTV;

    if (Math.abs(ev - targetEV) < 0.01) break;
    if (ev < targetEV) lo = mid;
    else hi = mid;
  }

  return {
    impliedGrowthRate: Math.round(mid * 100) / 100,
    impliedEquityValue: marketEquityValue,
    formula: 'Reverse DCF: Binary search for g such that DCF(FCFs growing at g%, terminal at gT) = Market Cap + Net Debt.',
  };
}

export interface ScenarioInput {
  probability: number; // 0-100
  intrinsicValue: number;
  label: string;
}

export interface ScenarioBlendResult {
  weightedValue: number;
  scenarios: Array<{ label: string; probability: number; intrinsicValue: number; contribution: number }>;
  formula: string;
}

/**
 * Scenario blend: probability-weighted average of multiple intrinsic value estimates.
 */
export function calculateScenarioBlend(scenarios: ScenarioInput[]): ScenarioBlendResult {
  const totalProb = scenarios.reduce((s, sc) => s + sc.probability, 0);
  if (totalProb === 0) {
    return { weightedValue: 0, scenarios: [], formula: 'No scenarios provided.' };
  }

  const results = scenarios.map((sc) => ({
    label: sc.label,
    probability: sc.probability,
    intrinsicValue: sc.intrinsicValue,
    contribution: (sc.probability / totalProb) * sc.intrinsicValue,
  }));

  const weightedValue = results.reduce((s, r) => s + r.contribution, 0);

  return {
    weightedValue,
    scenarios: results,
    formula: 'Weighted Value = Σ (Probability_i / ΣProbabilities) × IntrinsicValue_i',
  };
}

export interface GrahamValuationResult {
  grahamNumber: number | null;
  ncavPerShare: number | null;
  formula: string;
}

export function calculateGrahamValuation(
  eps: number,
  bvps: number,
  currentAssets?: number,
  totalLiabilities?: number,
  sharesOutstanding?: number,
): GrahamValuationResult {
  const grahamNumber = eps > 0 && bvps > 0 ? Math.round(Math.sqrt(22.5 * eps * bvps) * 100) / 100 : null;
  let ncavPerShare: number | null = null;
  if (currentAssets != null && totalLiabilities != null && sharesOutstanding && sharesOutstanding > 0) {
    ncavPerShare = Math.round(((currentAssets - totalLiabilities) / sharesOutstanding) * 100) / 100;
  }
  return {
    grahamNumber,
    ncavPerShare,
    formula: 'Graham Number = √(22.5 × EPS × BVPS). NCAV = (Current Assets - Total Liabilities) / Shares.',
  };
}

export interface PeterLynchResult {
  fairValue: number | null;
  currentPEG: number | null;
  verdict: string;
  formula: string;
}

export function calculatePeterLynchFairValue(
  price: number,
  eps: number,
  growthRatePct: number,
): PeterLynchResult {
  if (eps <= 0 || growthRatePct <= 0) {
    return { fairValue: null, currentPEG: null, verdict: 'Requires positive EPS and growth rate', formula: '' };
  }
  const fairValue = Math.round(eps * growthRatePct * 100) / 100;
  const pe = price / eps;
  const currentPEG = Math.round((pe / growthRatePct) * 100) / 100;
  let verdict = 'Fair Value Zone (PEG ≈ 1.0)';
  if (currentPEG < 0.8) verdict = 'Undervalued per Peter Lynch (PEG < 0.8)';
  else if (currentPEG > 1.5) verdict = 'Overvalued per Peter Lynch (PEG > 1.5)';

  return {
    fairValue,
    currentPEG,
    verdict,
    formula: 'Peter Lynch Fair Value = EPS × Expected Growth Rate (Implies PEG = 1.0).',
  };
}

export interface DDMResult {
  intrinsicValue: number | null;
  dividendYield: number;
  formula: string;
}

export function calculateDividendDiscountModel(
  currentDividend: number,
  dividendGrowthRatePct: number,
  requiredReturnPct: number,
  price?: number,
): DDMResult {
  const dividendYield = price && price > 0 ? (currentDividend / price) * 100 : 0;
  if (requiredReturnPct <= dividendGrowthRatePct) {
    return {
      intrinsicValue: null,
      dividendYield: Math.round(dividendYield * 100) / 100,
      formula: 'Error: Required return (r) must exceed dividend growth rate (g).',
    };
  }
  const d1 = currentDividend * (1 + dividendGrowthRatePct / 100);
  const intrinsicValue = d1 / ((requiredReturnPct - dividendGrowthRatePct) / 100);

  return {
    intrinsicValue: Math.round(intrinsicValue * 100) / 100,
    dividendYield: Math.round(dividendYield * 100) / 100,
    formula: 'Gordon Growth Model: P₀ = D₁ / (r - g) = D₀ × (1 + g) / (r - g)',
  };
}

export interface AssetValuationResult {
  bookValuePerShare: number;
  liquidationValuePerShare: number;
  formula: string;
}

export function calculateAssetBasedValuation(
  totalAssets: number,
  totalLiabilities: number,
  sharesOutstanding: number,
  liquidationDiscountPct = 20,
): AssetValuationResult {
  if (sharesOutstanding <= 0) {
    return {
      bookValuePerShare: 0,
      liquidationValuePerShare: 0,
      formula: 'Error: Shares outstanding must be greater than 0.',
    };
  }
  const netAssets = Math.max(0, totalAssets - totalLiabilities);
  const bookValuePerShare = netAssets / sharesOutstanding;
  const liquidatedAssets = totalAssets * (1 - liquidationDiscountPct / 100);
  const liquidationEquity = Math.max(0, liquidatedAssets - totalLiabilities);
  const liquidationValuePerShare = liquidationEquity / sharesOutstanding;

  return {
    bookValuePerShare: Math.round(bookValuePerShare * 100) / 100,
    liquidationValuePerShare: Math.round(liquidationValuePerShare * 100) / 100,
    formula: 'Book Value = (Total Assets - Total Liabilities) / Shares. Liquidation Value applies haircut to assets.',
  };
}

export interface ResidualIncomeResult {
  intrinsicValue: number | null;
  residualIncomeYear1: number;
  formula: string;
}

export function calculateResidualIncome(
  bookValuePerShare: number,
  roePct: number,
  costOfEquityPct: number,
  terminalGrowthPct: number,
): ResidualIncomeResult {
  const riYear1 = bookValuePerShare * ((roePct - costOfEquityPct) / 100);
  if (costOfEquityPct <= terminalGrowthPct || bookValuePerShare <= 0) {
    return {
      intrinsicValue: null,
      residualIncomeYear1: Math.round(riYear1 * 100) / 100,
      formula: 'Error: Cost of equity (r) must exceed terminal growth rate (g), and BVPS must be > 0.',
    };
  }
  const pvResidualIncome = riYear1 / ((costOfEquityPct - terminalGrowthPct) / 100);
  const intrinsicValue = bookValuePerShare + pvResidualIncome;

  return {
    intrinsicValue: Math.round(intrinsicValue * 100) / 100,
    residualIncomeYear1: Math.round(riYear1 * 100) / 100,
    formula: 'Residual Income Model: V₀ = BVPS₀ + (ROE - r) × BVPS₀ / (r - g)',
  };
}

export interface HistoricalMultipleRangeResult {
  highFairValue: number;
  medianFairValue: number;
  lowFairValue: number;
  formula: string;
}

export function calculateHistoricalMultipleRange(
  metricValue: number,
  multipleHigh: number,
  multipleMedian: number,
  multipleLow: number,
): HistoricalMultipleRangeResult {
  if (metricValue <= 0) {
    return {
      highFairValue: 0,
      medianFairValue: 0,
      lowFairValue: 0,
      formula: 'Error: Metric value (EPS or EBITDA) must be positive.',
    };
  }
  return {
    highFairValue: Math.round(metricValue * multipleHigh * 100) / 100,
    medianFairValue: Math.round(metricValue * multipleMedian * 100) / 100,
    lowFairValue: Math.round(metricValue * multipleLow * 100) / 100,
    formula: 'Historical Band: Fair Value = Current Metric × Historical Multiple (High / Median / Low).',
  };
}

export interface PeadRuleBasedInput {
  actualEps: number;
  expectedEps: number;
  priceAtResult: number;
  price20dPost?: number;
  price60dPost?: number;
  yoyPatPct?: number;
  baselinePatGrowth?: number;
}

export interface PeadRuleBasedOutput {
  surprisePct: number;
  sueScore: number;
  drift20d?: number;
  drift60d?: number;
  isHighConviction: boolean;
  methodology: string;
}

/**
 * PEAD rule-based surprise and drift metrics per PRD Section 69.3.
 * Evaluates surprise against baseline/run-rate and tracks 20d/60d post-earnings drift.
 */
export function calculatePeadMetrics(input: PeadRuleBasedInput): PeadRuleBasedOutput {
  const { actualEps, expectedEps, priceAtResult, price20dPost, price60dPost, yoyPatPct, baselinePatGrowth } = input;
  const surprisePct = expectedEps > 0 ? Math.round(((actualEps - expectedEps) / expectedEps) * 10000) / 100 : 0;
  const drift20d =
    price20dPost !== undefined && priceAtResult > 0
      ? Math.round(((price20dPost - priceAtResult) / priceAtResult) * 10000) / 100
      : undefined;
  const drift60d =
    price60dPost !== undefined && priceAtResult > 0
      ? Math.round(((price60dPost - priceAtResult) / priceAtResult) * 10000) / 100
      : undefined;

  const baseline = baselinePatGrowth ?? 15.0;
  const patGrowth = yoyPatPct ?? surprisePct;
  const sueScore = Math.round(((patGrowth - baseline) / 10) * 100) / 100;

  return {
    surprisePct,
    sueScore,
    drift20d,
    drift60d,
    isHighConviction: surprisePct >= 10 && (drift20d === undefined || drift20d > 0),
    methodology: 'Rule-based earnings surprise proxy (YoY PAT Run-Rate vs Baseline) per PRD Section 69.3',
  };
}

/**
 * Truncates an RSS feed or corporate disclosure description to a short permitted excerpt
 * (approx 25-30 words with an ellipsis) per PRD Section 22 and copyright fair-practice compliance.
 * Strips HTML tags, decodes standard HTML entities, trims whitespace, and ensures word-boundary truncation.
 */
export function truncatePermittedExcerpt(text: string | null | undefined, maxWords: number = 28): string {
  if (!text) return '';
  const clean = String(text)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';

  const words = clean.split(' ');
  if (words.length <= maxWords) {
    return clean;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}
