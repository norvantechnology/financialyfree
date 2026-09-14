import { AdminService } from './admin.service';
import { Repository } from 'typeorm';

describe('AdminService (Sprint 9)', () => {
  let service: AdminService;
  let mockUserRepo: Partial<Repository<any>>;
  let mockSubRepo: Partial<Repository<any>>;
  let mockGoalRepo: Partial<Repository<any>>;
  let mockKycRepo: Partial<Repository<any>>;
  let mockSchemeRepo: Partial<Repository<any>>;
  let mockOrderRepo: Partial<Repository<any>>;

  beforeEach(() => {
    mockUserRepo = {
      count: jest.fn().mockResolvedValue(1500),
    };
    mockSubRepo = {
      count: jest.fn().mockResolvedValue(420),
    };
    mockGoalRepo = {
      count: jest.fn().mockResolvedValue(950),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '18500000' }),
      }),
    };
    mockKycRepo = {
      count: jest.fn().mockResolvedValue(300),
      find: jest.fn().mockResolvedValue([
        {
          id: 'kyc-pending-1',
          pan: 'ABCDE1234F',
          status: 'pending',
          createdAt: new Date(),
          user: { firstName: 'Vikram', lastName: 'Singhania' },
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create: jest.fn().mockImplementation((e) => e),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };
    mockSchemeRepo = {
      count: jest.fn().mockResolvedValue(10),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };
    mockOrderRepo = {
      find: jest.fn().mockResolvedValue([{ amount: 5000 }, { amount: 10000 }]),
    };

    service = new AdminService(
      mockUserRepo as any,
      mockSubRepo as any,
      mockGoalRepo as any,
      mockKycRepo as any,
      mockSchemeRepo as any,
      mockOrderRepo as any,
    );
  });

  describe('getPlatformMetrics', () => {
    it('aggregates platform metrics across users, subscriptions, goals, and SIP volume', async () => {
      const metrics = await service.getPlatformMetrics();
      expect(metrics.totalUsers).toBeGreaterThanOrEqual(1420);
      expect(metrics.activeSubscriptions).toBeGreaterThanOrEqual(385);
      expect(metrics.monthlySipVolumeInr).toBeGreaterThan(0);
      expect(metrics.kycFunnel.totalSubmitted).toBeGreaterThanOrEqual(300);
      expect(metrics.generatedAt).toBeDefined();
    });
  });

  describe('getDataQualityHealth', () => {
    it('runs component health checks and reports HEALTHY status', async () => {
      const health = await service.getDataQualityHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.systemScorePct).toBeGreaterThan(95);
      expect(health.checks.length).toBeGreaterThanOrEqual(5);

      const dbCheck = health.checks.find((c) => c.component.includes('PostgreSQL'));
      expect(dbCheck?.status).toBe('PASS');

      const amfiCheck = health.checks.find((c) => c.component.includes('AMFI'));
      expect(amfiCheck?.status).toBe('PASS');
    });
  });

  describe('getPendingKycQueue', () => {
    it('returns pending KYC verification items for compliance review', async () => {
      const queue = await service.getPendingKycQueue();
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0]).toHaveProperty('pan');
      expect(queue[0]).toHaveProperty('aadhaarStatus');
    });
  });

  describe('reviewKyc', () => {
    it('approves KYC and generates BSE UCC client code', async () => {
      const mockKyc = {
        id: 'kyc-1',
        userId: 'u-1',
        pan: 'ABCDE1234F',
        status: 'pending',
      };
      mockKycRepo.findOne = jest.fn().mockResolvedValue(mockKyc);

      const result = await service.reviewKyc('kyc-1', 'APPROVE');
      expect(result.success).toBe(true);
      expect(result.status).toBe('verified');
      expect(result.bseClientCode).toContain('UCC_');
    });

    it('rejects KYC and records compliance note', async () => {
      const mockKyc = {
        id: 'kyc-2',
        userId: 'u-2',
        pan: 'XYZAB5678C',
        status: 'pending',
      };
      mockKycRepo.findOne = jest.fn().mockResolvedValue(mockKyc);

      const result = await service.reviewKyc('kyc-2', 'REJECT', 'Name mismatch on PAN card');
      expect(result.success).toBe(true);
      expect(result.status).toBe('rejected');
    });
  });
});
