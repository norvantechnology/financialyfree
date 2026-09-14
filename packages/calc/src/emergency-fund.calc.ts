/**
 * Emergency Fund Adequacy Score Engine
 * Pure mathematical scoring engine evaluating months of emergency runway and liquid buffers.
 */

export type EmploymentType =
  | 'salaried_stable'
  | 'salaried_volatile'
  | 'self_employed_freelance'
  | 'single_earner_family';

export interface EmergencyFundInput {
  monthlyMandatoryExpenses: number; // e.g. ₹60,000 (rent, EMI, food, bills)
  liquidReserves: number;           // e.g. ₹2,40,000 (savings account + liquid MF + sweep FD)
  employmentType?: EmploymentType;
  dependentsCount?: number;
}

export interface LiquidAllocationBucket {
  bucketName: string;
  recommendedPct: number;
  recommendedAmount: number;
  currentAmount?: number;
  suitableInstruments: string;
  liquiditySpeed: string;
}

export interface EmergencyFundResult {
  monthlyMandatoryExpenses: number;
  currentLiquidReserves: number;
  monthsCovered: number;
  targetMonths: number;
  targetCorpus: number;
  shortfallOrSurplus: number;
  adequacyScore: number; // 0 to 100
  statusTier: 'VULNERABLE' | 'INSUFFICIENT' | 'MODERATE' | 'OPTIMAL' | 'OVER_ALLOCATED';
  statusLabel: string;
  statusColor: string;
  shortfallActionPlan: {
    hasShortfall: boolean;
    shortfallAmount: number;
    monthlySipToBridge6Months: number;
    monthlySipToBridge12Months: number;
  };
  allocationBuckets: LiquidAllocationBucket[];
  advisoryInsight: string;
  formula: string;
}

const TARGET_MONTHS_BY_EMPLOYMENT: Record<EmploymentType, number> = {
  salaried_stable: 6,
  salaried_volatile: 8,
  single_earner_family: 9,
  self_employed_freelance: 12,
};

export function calculateEmergencyFundAdequacy(input: EmergencyFundInput): EmergencyFundResult {
  const expenses = Math.max(1000, input.monthlyMandatoryExpenses || 50000);
  const liquid = Math.max(0, input.liquidReserves || 0);
  const empType = input.employmentType || 'salaried_stable';
  const dependents = Math.max(0, input.dependentsCount || 0);

  // Compute target months
  let baseTarget = TARGET_MONTHS_BY_EMPLOYMENT[empType] || 6;
  if (dependents > 2) {
    baseTarget += Math.min(3, dependents - 2);
  }
  const targetMonths = baseTarget;

  const monthsCovered = Math.round((liquid / expenses) * 10) / 10;
  const targetCorpus = Math.round(targetMonths * expenses);
  const shortfallOrSurplus = Math.round(liquid - targetCorpus);

  // Adequacy Score (0 to 100)
  let adequacyScore = 0;
  if (monthsCovered >= targetMonths) {
    if (monthsCovered <= targetMonths * 2) {
      adequacyScore = 90 + Math.min(10, Math.round(((monthsCovered - targetMonths) / targetMonths) * 10));
    } else {
      // Slight deduction for excessive cash drag (>2x target)
      adequacyScore = 92;
    }
  } else {
    adequacyScore = Math.min(88, Math.round((monthsCovered / targetMonths) * 90));
  }

  // Determine tier
  let statusTier: EmergencyFundResult['statusTier'] = 'MODERATE';
  let statusLabel = 'Moderate Runway';
  let statusColor = '#D97706';

  if (monthsCovered < 2) {
    statusTier = 'VULNERABLE';
    statusLabel = 'Critical Shortfall';
    statusColor = '#DC2626';
  } else if (monthsCovered < targetMonths * 0.6) {
    statusTier = 'INSUFFICIENT';
    statusLabel = 'Below Safety Benchmark';
    statusColor = '#EA580C';
  } else if (monthsCovered < targetMonths) {
    statusTier = 'MODERATE';
    statusLabel = 'Acceptable / Accumulating';
    statusColor = '#D97706';
  } else if (monthsCovered <= targetMonths * 1.5) {
    statusTier = 'OPTIMAL';
    statusLabel = 'Fortress Emergency Buffer';
    statusColor = '#16A34A';
  } else {
    statusTier = 'OVER_ALLOCATED';
    statusLabel = 'Cash Drag (Over-Allocated)';
    statusColor = '#2563EB';
  }

  const hasShortfall = shortfallOrSurplus < 0;
  const absShortfall = Math.abs(Math.min(0, shortfallOrSurplus));

  const monthlySipToBridge6Months = Math.round(absShortfall / 6);
  const monthlySipToBridge12Months = Math.round(absShortfall / 12);

  // 3-tier liquid allocation strategy (Section 43)
  const allocationBuckets: LiquidAllocationBucket[] = [
    {
      bucketName: 'Tier 1: Immediate Cash (1 Month)',
      recommendedPct: Math.round((1 / targetMonths) * 100),
      recommendedAmount: Math.round(expenses * 1),
      suitableInstruments: 'Savings Bank Account + UPI Linked Sweep Account',
      liquiditySpeed: 'Instant (0 seconds)',
    },
    {
      bucketName: 'Tier 2: Quick-Access Liquidity (2-3 Months)',
      recommendedPct: Math.round((2 / targetMonths) * 100),
      recommendedAmount: Math.round(expenses * 2),
      suitableInstruments: 'Instant-Redemption Liquid Mutual Funds (₹50k/day instant NEFT/IMPS)',
      liquiditySpeed: 'Within 30 minutes',
    },
    {
      bucketName: 'Tier 3: Core Reserve Buffer (Remaining Months)',
      recommendedPct: Math.max(10, 100 - Math.round((3 / targetMonths) * 100)),
      recommendedAmount: Math.max(0, targetCorpus - expenses * 3),
      suitableInstruments: 'Ultra Short Duration Funds, Arbitrage Mutual Funds, Short-term Sweep FDs',
      liquiditySpeed: 'T+1 business day',
    },
  ];

  let advisoryInsight = '';
  if (statusTier === 'VULNERABLE') {
    advisoryInsight = `Your safety net covers only ${monthsCovered} months of survival expenses. Prioritize allocating ₹${monthlySipToBridge6Months.toLocaleString('en-IN')}/month to an Instant Liquid Fund before committing further capital to aggressive equities.`;
  } else if (statusTier === 'INSUFFICIENT' || statusTier === 'MODERATE') {
    advisoryInsight = `You have built ${monthsCovered} months of runway against your ${targetMonths}-month safety benchmark. Closing the ₹${absShortfall.toLocaleString('en-IN')} gap via a ₹${monthlySipToBridge12Months.toLocaleString('en-IN')}/mo liquid SIP will safeguard you against unplanned emergencies.`;
  } else if (statusTier === 'OPTIMAL') {
    advisoryInsight = `Excellent safety buffer! You have ${monthsCovered} months of mandatory expenses safeguarded. Your emergency corpus is fully funded to absorb medical contingencies, job breaks, or unexpected family expenses.`;
  } else {
    advisoryInsight = `You have ${monthsCovered} months in liquid cash, exceeding your ${targetMonths}-month benchmark. Excess cash yields low post-tax real returns; consider sweeping surplus above ₹${targetCorpus.toLocaleString('en-IN')} into equity SIPs or short-term debt funds.`;
  }

  return {
    monthlyMandatoryExpenses: expenses,
    currentLiquidReserves: liquid,
    monthsCovered,
    targetMonths,
    targetCorpus,
    shortfallOrSurplus,
    adequacyScore,
    statusTier,
    statusLabel,
    statusColor,
    shortfallActionPlan: {
      hasShortfall,
      shortfallAmount: absShortfall,
      monthlySipToBridge6Months,
      monthlySipToBridge12Months,
    },
    allocationBuckets,
    advisoryInsight,
    formula: 'MonthsCovered = LiquidReserves / MonthlyExpenses; AdequacyScore = min(100, (MonthsCovered / TargetMonths) * 90); TargetMonths = BaseByEmployment + DependentsOffset',
  };
}
