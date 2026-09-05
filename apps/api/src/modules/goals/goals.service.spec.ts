import { GoalsService } from './goals.service';
import { Repository } from 'typeorm';
import { GoalEntity } from '../../database/entities/goal.entity';

describe('GoalsService (Sprint 3)', () => {
  let service: GoalsService;
  let mockGoalRepo: Partial<Repository<GoalEntity>>;

  beforeEach(() => {
    mockGoalRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-goal-id' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'mock-goal-id' })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new GoalsService(mockGoalRepo as Repository<GoalEntity>);
  });

  describe('createGoal', () => {
    it('creates goal and computes required SIP and projected corpus using @ff/calc', async () => {
      const result = await service.createGoal('user-1', {
        type: 'retirement',
        name: 'Retirement FIRE',
        targetAmount: 5000000, // ₹50 Lakhs
        horizonYears: 10,
        currentSavings: 500000, // ₹5 Lakhs
        riskBand: 'balanced', // 12%
      });

      expect(result.id).toBe('mock-goal-id');
      expect(result.sipRecommendation.monthlySip).toBeGreaterThan(0);
      expect(result.sipRecommendation.projectedCorpus).toBeGreaterThan(5000000);
      expect(result.sipRecommendation).toBeDefined();
      expect(result.sipRecommendation.formula).toContain('SIP');
      expect(result.sipRecommendation.expectedReturnPct).toBe(12);
    });

    it('applies risk band expected returns correctly', async () => {
      const conservativeGoal = await service.createGoal('user-1', {
        type: 'custom',
        name: 'Safety Vault',
        targetAmount: 1000000,
        horizonYears: 5,
        currentSavings: 0,
        riskBand: 'conservative',
      });
      expect(conservativeGoal.expectedReturnPct).toBe(8.5);

      const growthGoal = await service.createGoal('user-1', {
        type: 'wealth_creation',
        name: 'Aggressive Alpha',
        targetAmount: 2000000,
        horizonYears: 7,
        currentSavings: 0,
        riskBand: 'growth',
      });
      expect(growthGoal.expectedReturnPct).toBe(14.0);
    });
  });

  describe('calculateMultiGoalAllocation', () => {
    it('allocates monthly surplus proportionally based on required SIPs', async () => {
      const mockGoals = [
        {
          id: 'g1',
          name: 'Home Purchase',
          monthlySipRequired: 20000,
          horizonYears: 5,
          isActive: true,
        },
        {
          id: 'g2',
          name: 'Child Education',
          monthlySipRequired: 10000,
          horizonYears: 10,
          isActive: true,
        },
      ] as GoalEntity[];

      (mockGoalRepo.find as jest.Mock).mockResolvedValue(mockGoals);

      const allocation = await service.calculateMultiGoalAllocation('user-1', 15000);

      expect(allocation.totalMonthlySurplus).toBe(15000);
      expect(allocation.allocations).toHaveLength(2);

      // g1 has 20k / 30k = 66.67% ~ ₹10,000
      // g2 has 10k / 30k = 33.33% ~ ₹5,000
      const g1Alloc = allocation.allocations.find((a) => a.goalId === 'g1');
      const g2Alloc = allocation.allocations.find((a) => a.goalId === 'g2');

      expect(g1Alloc?.amount).toBe(10000);
      expect(g2Alloc?.amount).toBe(5000);
    });
  });
});
