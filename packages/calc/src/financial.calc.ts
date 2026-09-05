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

export function calculateBuybackReturn(
  investedAmount: number,
  currentPrice: number,
  buybackPrice: number,
  totalBuybackShares: number,
  totalSharesOutstanding: number,
  expectedAcceptanceRatioPct: number,
): { expectedProfit: number; expectedReturnPct: number; eligibleShares: number; acceptedShares: number } {
  const eligibleShares = Math.floor(investedAmount / currentPrice);
  const buybackRatio = totalBuybackShares / totalSharesOutstanding;
  const acceptanceRatio = Math.min(expectedAcceptanceRatioPct / 100, buybackRatio);
  const acceptedShares = Math.floor(eligibleShares * acceptanceRatio);
  const remainingShares = eligibleShares - acceptedShares;

  const proceedsFromBuyback = acceptedShares * buybackPrice;
  const remainingValue = remainingShares * currentPrice;
  const totalProceeds = proceedsFromBuyback + remainingValue;
  const expectedProfit = totalProceeds - investedAmount;
  const expectedReturnPct = (expectedProfit / investedAmount) * 100;

  return {
    expectedProfit,
    expectedReturnPct,
    eligibleShares,
    acceptedShares,
  };
}
