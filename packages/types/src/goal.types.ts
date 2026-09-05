import { UUID, ISO8601 } from './common.types';

export type GoalType = 'emergency_fund' | 'retirement' | 'child_education' | 'wealth_creation' | 'custom';
export type RiskBand = 'conservative' | 'balanced' | 'growth';

export interface GoalDto {
  id: UUID;
  userId: UUID;
  type: GoalType;
  name: string;
  targetAmount?: number; // in INR
  targetYear?: number;
  horizonYears: number;
  currentSavings: number;
  riskBand: RiskBand;
  expectedReturnPct: number; // e.g. 12 for 12%
  inflationPct: number;
  isActive: boolean;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface CreateGoalDto {
  type: GoalType;
  name: string;
  targetAmount?: number;
  targetYear?: number;
  horizonYears: number;
  currentSavings: number;
  riskBand: RiskBand;
}

export interface SipRecommendationDto {
  goalId: UUID;
  monthlySip: number; // in INR
  projectedCorpus: number;
  expectedReturnPct: number;
  inflationPct: number;
  horizonYears: number;
  formula: string; // human-readable formula explanation
  assumptions: Record<string, string | number>; // shown to user, never hidden
  calculatedAt: ISO8601;
}

export interface MultiGoalAllocationDto {
  totalMonthlySurplus: number;
  allocations: Array<{
    goalId: UUID;
    goalName: string;
    amount: number;
    percentage: number;
  }>;
}
