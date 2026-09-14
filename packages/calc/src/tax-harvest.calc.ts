/**
 * Tax-Loss Harvesting Calculator Engine (Indian Income Tax Rules - Budget 2024 / FY 2024-25 / AY 2025-26)
 *
 * Rules:
 * - Equity Mutual Funds / Equities:
 *   - STCG (<= 365 days): 20% (Section 111A, revised from 15% in Budget 2024)
 *   - LTCG (> 365 days): 12.5% above ₹1,25,000 annual exemption limit (Section 112A, revised from 10% above ₹1L)
 * - Debt Mutual Funds:
 *   - Post April 1, 2023: Taxed at investor's marginal slab rate (Section 50AA)
 * - Set-off Provisions (Section 70):
 *   - Short-Term Capital Loss (STCL) can offset BOTH STCG and LTCG.
 *   - Long-Term Capital Loss (LTCL) can offset ONLY LTCG.
 */

export interface TaxLotHolding {
  id: string;
  schemeName: string;
  folioNumber?: string;
  assetType: 'equity' | 'debt';
  purchaseDate: string; // ISO date string YYYY-MM-DD
  units: number;
  purchaseNav: number;
  currentNav: number;
  purchaseAmount?: number;
  currentValue?: number;
}

export interface HarvestOpportunity {
  lotId: string;
  schemeName: string;
  assetType: 'equity' | 'debt';
  purchaseDate: string;
  daysHeld: number;
  term: 'STCG' | 'LTCG';
  units: number;
  investedAmount: number;
  currentValue: number;
  unrealizedLoss: number;
  applicableTaxRatePct: number;
  potentialTaxSavings: number;
  recommendation: string;
}

export interface TaxHarvestResult {
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedGain: number;
  totalUnrealizedLoss: number;
  stcgGains: number;
  stcgLosses: number;
  ltcgGains: number;
  ltcgLosses: number;
  annualLtcgExemptionLimit: number; // ₹1,25,000
  taxableLtcgBeforeHarvest: number;
  estimatedTaxBeforeHarvest: number;
  stclUsedToOffsetStcg: number;
  stclUsedToOffsetLtcg: number;
  ltclUsedToOffsetLtcg: number;
  taxableLtcgAfterHarvest: number;
  estimatedTaxAfterHarvest: number;
  totalTaxSavings: number;
  harvestOpportunities: HarvestOpportunity[];
  holdingSummary: {
    gainLotsCount: number;
    lossLotsCount: number;
    harvestableLossesCount: number;
  };
  disclaimer: string;
}

export interface TaxHarvestInput {
  lots: TaxLotHolding[];
  marginalSlabRatePct?: number; // default 30% for high earners
  realizedStcgThisYear?: number;
  realizedLtcgThisYear?: number;
}

export function calculateTaxHarvesting(input: TaxHarvestInput): TaxHarvestResult {
  const lots = input.lots || [];
  const slabRate = input.marginalSlabRatePct ?? 30;
  const realizedStcg = Math.max(0, input.realizedStcgThisYear || 0);
  const realizedLtcg = Math.max(0, input.realizedLtcgThisYear || 0);

  const ANNUAL_LTCG_EXEMPTION = 125000; // ₹1.25 Lakh (Budget 2024 Section 112A)
  const EQUITY_STCG_RATE = 20.0;        // 20%
  const EQUITY_LTCG_RATE = 12.5;        // 12.5%

  const today = new Date();

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalUnrealizedGain = 0;
  let totalUnrealizedLoss = 0;

  let stcgGains = realizedStcg;
  let stcgLosses = 0;
  let ltcgGains = realizedLtcg;
  let ltcgLosses = 0;

  let gainLotsCount = 0;
  let lossLotsCount = 0;

  const harvestOpportunities: HarvestOpportunity[] = [];

  for (const lot of lots) {
    const pAmount = lot.purchaseAmount ?? lot.units * lot.purchaseNav;
    const cAmount = lot.currentValue ?? lot.units * lot.currentNav;
    const diff = cAmount - pAmount;

    totalInvested += pAmount;
    totalCurrentValue += cAmount;

    // Calculate days held
    const pDate = new Date(lot.purchaseDate);
    const diffTime = Math.max(0, today.getTime() - pDate.getTime());
    const daysHeld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isLongTerm = lot.assetType === 'equity' ? daysHeld > 365 : daysHeld > 1095;
    const term: 'STCG' | 'LTCG' = isLongTerm ? 'LTCG' : 'STCG';

    const applicableTaxRatePct =
      lot.assetType === 'debt'
        ? slabRate
        : isLongTerm
        ? EQUITY_LTCG_RATE
        : EQUITY_STCG_RATE;

    if (diff >= 0) {
      gainLotsCount++;
      totalUnrealizedGain += diff;
      if (term === 'STCG') stcgGains += diff;
      else ltcgGains += diff;
    } else {
      lossLotsCount++;
      const absLoss = Math.abs(diff);
      totalUnrealizedLoss += absLoss;

      if (term === 'STCG') {
        stcgLosses += absLoss;
      } else {
        ltcgLosses += absLoss;
      }

      // Each loss-making lot is a candidate for harvesting
      const potentialSavings = Math.round((absLoss * applicableTaxRatePct) / 100);
      const isEquity = lot.assetType === 'equity';

      harvestOpportunities.push({
        lotId: lot.id,
        schemeName: lot.schemeName,
        assetType: lot.assetType,
        purchaseDate: lot.purchaseDate,
        daysHeld,
        term,
        units: Math.round(lot.units * 1000) / 1000,
        investedAmount: Math.round(pAmount),
        currentValue: Math.round(cAmount),
        unrealizedLoss: Math.round(absLoss),
        applicableTaxRatePct,
        potentialTaxSavings: potentialSavings,
        recommendation: isEquity
          ? `Harvest ₹${Math.round(absLoss).toLocaleString('en-IN')} ${term} loss by redeeming before March 31. Reinvest in comparable broad-market fund to maintain market exposure.`
          : `Harvest ₹${Math.round(absLoss).toLocaleString('en-IN')} loss to offset slab-taxable debt gains.`,
      });
    }
  }

  // Calculate tax before harvesting
  const taxableLtcgBefore = Math.max(0, ltcgGains - ANNUAL_LTCG_EXEMPTION);
  const taxBefore = Math.round(
    (stcgGains * (EQUITY_STCG_RATE / 100)) +
    (taxableLtcgBefore * (EQUITY_LTCG_RATE / 100))
  );

  // Set-off simulation:
  // 1. STCL offsets STCG first
  const stclUsedToOffsetStcg = Math.min(stcgLosses, stcgGains);
  const remainingStcg = stcgGains - stclUsedToOffsetStcg;
  const remainingStcl = stcgLosses - stclUsedToOffsetStcg;

  // 2. LTCL offsets LTCG
  const ltclUsedToOffsetLtcg = Math.min(ltcgLosses, ltcgGains);
  let remainingLtcg = ltcgGains - ltclUsedToOffsetLtcg;

  // 3. Remaining STCL can also offset LTCG
  const stclUsedToOffsetLtcg = Math.min(remainingStcl, remainingLtcg);
  remainingLtcg = remainingLtcg - stclUsedToOffsetLtcg;

  // 4. Exemption applies to remaining LTCG
  const taxableLtcgAfter = Math.max(0, remainingLtcg - ANNUAL_LTCG_EXEMPTION);
  const taxAfter = Math.round(
    (remainingStcg * (EQUITY_STCG_RATE / 100)) +
    (taxableLtcgAfter * (EQUITY_LTCG_RATE / 100))
  );

  const totalTaxSavings = Math.max(0, taxBefore - taxAfter);

  return {
    totalInvested: Math.round(totalInvested),
    totalCurrentValue: Math.round(totalCurrentValue),
    totalUnrealizedGain: Math.round(totalUnrealizedGain),
    totalUnrealizedLoss: Math.round(totalUnrealizedLoss),
    stcgGains: Math.round(stcgGains),
    stcgLosses: Math.round(stcgLosses),
    ltcgGains: Math.round(ltcgGains),
    ltcgLosses: Math.round(ltcgLosses),
    annualLtcgExemptionLimit: ANNUAL_LTCG_EXEMPTION,
    taxableLtcgBeforeHarvest: Math.round(taxableLtcgBefore),
    estimatedTaxBeforeHarvest: taxBefore,
    stclUsedToOffsetStcg: Math.round(stclUsedToOffsetStcg),
    stclUsedToOffsetLtcg: Math.round(stclUsedToOffsetLtcg),
    ltclUsedToOffsetLtcg: Math.round(ltclUsedToOffsetLtcg),
    taxableLtcgAfterHarvest: Math.round(taxableLtcgAfter),
    estimatedTaxAfterHarvest: taxAfter,
    totalTaxSavings,
    harvestOpportunities: harvestOpportunities.sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings),
    holdingSummary: {
      gainLotsCount,
      lossLotsCount,
      harvestableLossesCount: harvestOpportunities.length,
    },
    disclaimer:
      'Calculations adhere to Section 111A & 112A of the Indian Income Tax Act (Budget 2024 revision). Capital losses must be reported in ITR filed within the due date to be eligible for carry-forward up to 8 assessment years.',
  };
}
