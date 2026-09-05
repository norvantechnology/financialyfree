import { UUID, ISO8601 } from './common.types';
export type GoalType = 'emergency_fund' | 'retirement' | 'child_education' | 'wealth_creation' | 'custom';
export type RiskBand = 'conservative' | 'balanced' | 'growth';
export interface GoalDto {
    id: UUID;
    userId: UUID;
    type: GoalType;
    name: string;
    targetAmount?: number;
    targetYear?: number;
    horizonYears: number;
    currentSavings: number;
    riskBand: RiskBand;
    expectedReturnPct: number;
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
    monthlySip: number;
    projectedCorpus: number;
    expectedReturnPct: number;
    inflationPct: number;
    horizonYears: number;
    formula: string;
    assumptions: Record<string, string | number>;
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
//# sourceMappingURL=goal.types.d.ts.map