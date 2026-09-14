import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalEntity } from '../../database/entities/goal.entity';
import {
  CreateGoalDto,
  GoalDto,
  SipRecommendationDto,
  MultiGoalAllocationDto,
  RiskBand,
} from '@ff/types';
import {
  calculateSIPRequired,
  calculateCorpusProjection,
} from '@ff/calc';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(GoalEntity)
    private readonly goalRepo: Repository<GoalEntity>,
  ) {}

  private getExpectedReturnForRisk(risk: RiskBand): number {
    switch (risk) {
      case 'conservative':
        return 8.5;
      case 'growth':
        return 14.0;
      case 'balanced':
      default:
        return 12.0;
    }
  }

  async createGoal(userId: string, dto: CreateGoalDto): Promise<GoalDto & { sipRecommendation: SipRecommendationDto }> {
    const expectedReturnPct = this.getExpectedReturnForRisk(dto.riskBand);
    const inflationPct = 6.0;

    let targetCorpus = dto.targetAmount || 0;
    if (targetCorpus <= 0) {
      // Default estimation if not provided: 10 Lakhs * horizon factor
      targetCorpus = 1000000;
    }

    const sipCalc = calculateSIPRequired({
      targetCorpus,
      horizonYears: dto.horizonYears,
      expectedReturnPct,
      currentSavings: dto.currentSavings || 0,
    });

    const goal = this.goalRepo.create({
      userId,
      type: dto.type,
      name: dto.name,
      targetAmount: targetCorpus,
      targetYear: dto.targetYear,
      horizonYears: dto.horizonYears,
      currentSavings: dto.currentSavings || 0,
      riskBand: dto.riskBand,
      expectedReturnPct,
      inflationPct,
      monthlySipRequired: sipCalc.monthlySip,
      projectedCorpus: sipCalc.projectedCorpus,
      assumptions: sipCalc.assumptions,
      isActive: true,
    });

    const saved = await this.goalRepo.save(goal);

    const sipRecommendation: SipRecommendationDto = {
      goalId: saved.id,
      monthlySip: sipCalc.monthlySip,
      projectedCorpus: sipCalc.projectedCorpus,
      expectedReturnPct,
      inflationPct,
      horizonYears: saved.horizonYears,
      formula: sipCalc.formula,
      assumptions: sipCalc.assumptions,
      calculatedAt: new Date().toISOString(),
    };

    return {
      ...this.mapGoal(saved),
      sipRecommendation,
    };
  }

  async getGoals(userId: string): Promise<GoalDto[]> {
    const goals = await this.goalRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return goals.map((g) => this.mapGoal(g));
  }

  async getGoalById(userId: string, goalId: string): Promise<GoalDto & { sipRecommendation: SipRecommendationDto }> {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId, userId, isActive: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    const sipRecommendation: SipRecommendationDto = {
      goalId: goal.id,
      monthlySip: Number(goal.monthlySipRequired),
      projectedCorpus: Number(goal.projectedCorpus),
      expectedReturnPct: Number(goal.expectedReturnPct),
      inflationPct: Number(goal.inflationPct),
      horizonYears: goal.horizonYears,
      formula: 'SIP = (TargetCorpus - CurrentSavings*(1+r)^n) * r / ((1+r)^n - 1)',
      assumptions: (goal.assumptions as Record<string, string | number>) || {},
      calculatedAt: goal.updatedAt.toISOString(),
    };

    return {
      ...this.mapGoal(goal),
      sipRecommendation,
    };
  }

  async updateGoal(userId: string, goalId: string, dto: Partial<CreateGoalDto>): Promise<GoalDto> {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId, userId, isActive: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    if (dto.name) goal.name = dto.name;
    if (dto.targetAmount !== undefined) goal.targetAmount = dto.targetAmount;
    if (dto.horizonYears !== undefined) goal.horizonYears = dto.horizonYears;
    if (dto.currentSavings !== undefined) goal.currentSavings = dto.currentSavings;
    if (dto.riskBand) {
      goal.riskBand = dto.riskBand;
      goal.expectedReturnPct = this.getExpectedReturnForRisk(dto.riskBand);
    }

    const sipCalc = calculateSIPRequired({
      targetCorpus: Number(goal.targetAmount),
      horizonYears: goal.horizonYears,
      expectedReturnPct: Number(goal.expectedReturnPct),
      currentSavings: Number(goal.currentSavings),
    });

    goal.monthlySipRequired = sipCalc.monthlySip;
    goal.projectedCorpus = sipCalc.projectedCorpus;
    goal.assumptions = sipCalc.assumptions;

    const updated = await this.goalRepo.save(goal);
    return this.mapGoal(updated);
  }

  async deleteGoal(userId: string, goalId: string): Promise<{ success: boolean }> {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId, userId, isActive: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    goal.isActive = false;
    await this.goalRepo.save(goal);
    return { success: true };
  }

  async calculateMultiGoalAllocation(
    userId: string,
    totalMonthlySurplus: number,
  ): Promise<MultiGoalAllocationDto> {
    const goals = await this.goalRepo.find({
      where: { userId, isActive: true },
      order: { horizonYears: 'ASC' },
    });

    if (goals.length === 0) {
      return {
        totalMonthlySurplus,
        allocations: [],
      };
    }

    const totalRequiredSip = goals.reduce((sum, g) => sum + Number(g.monthlySipRequired), 0);

    const allocations = goals.map((g) => {
      const required = Number(g.monthlySipRequired);
      let allocatedAmount = 0;
      let percentage = 0;

      if (totalRequiredSip > 0) {
        const ratio = required / totalRequiredSip;
        allocatedAmount = Math.round(totalMonthlySurplus * ratio);
        percentage = Math.round(ratio * 100);
      } else {
        const equalRatio = 1 / goals.length;
        allocatedAmount = Math.round(totalMonthlySurplus * equalRatio);
        percentage = Math.round(equalRatio * 100);
      }

      return {
        goalId: g.id,
        goalName: g.name,
        amount: allocatedAmount,
        percentage,
      };
    });

    return {
      totalMonthlySurplus,
      allocations,
    };
  }

  async getGoalProjection(userId: string, goalId: string, annualStepUpPct = 10) {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId, userId, isActive: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    return calculateCorpusProjection({
      monthlySip: Number(goal.monthlySipRequired),
      currentSavings: Number(goal.currentSavings),
      horizonYears: goal.horizonYears,
      expectedReturnPct: Number(goal.expectedReturnPct),
      annualStepUpPct,
    });
  }

  private mapGoal(g: GoalEntity): GoalDto {
    return {
      id: g.id,
      userId: g.userId,
      type: g.type,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      targetYear: g.targetYear || undefined,
      horizonYears: g.horizonYears,
      currentSavings: Number(g.currentSavings),
      riskBand: g.riskBand,
      expectedReturnPct: Number(g.expectedReturnPct),
      inflationPct: Number(g.inflationPct),
      isActive: g.isActive,
      createdAt: (g.createdAt ? new Date(g.createdAt) : new Date()).toISOString(),
      updatedAt: (g.updatedAt ? new Date(g.updatedAt) : new Date()).toISOString(),
    };
  }
}
