import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemConfigService } from './system-config.service';
import { SystemSettingEntity } from '../../database/entities/system-setting.entity';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: getRepositoryToken(SystemSettingEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
  });

  it('should default to FREE mode if record is missing in DB', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const result = await service.getAccessMode();
    expect(result.mode).toBe('FREE');
    expect(result.isAllAccessFree).toBe(true);
    expect(service.isAllAccessFreeNow()).toBe(true);
  });

  it('should return SUBSCRIPTION mode if saved as SUBSCRIPTION in DB', async () => {
    mockRepo.findOne.mockResolvedValue({
      key: 'SUBSCRIPTION_ACCESS_MODE',
      value: 'SUBSCRIPTION',
      updatedAt: new Date('2026-09-09T18:00:00Z'),
    });

    const result = await service.getAccessMode();
    expect(result.mode).toBe('SUBSCRIPTION');
    expect(result.isAllAccessFree).toBe(false);
    expect(service.isAllAccessFreeNow()).toBe(false);
  });

  it('should toggle to SUBSCRIPTION and save to DB', async () => {
    mockRepo.findOne.mockResolvedValue({
      key: 'SUBSCRIPTION_ACCESS_MODE',
      value: 'FREE',
      updatedAt: new Date(),
    });

    const updated = await service.setAccessMode('SUBSCRIPTION');
    expect(updated.mode).toBe('SUBSCRIPTION');
    expect(updated.isAllAccessFree).toBe(false);
    expect(service.isAllAccessFreeNow()).toBe(false);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should toggle back to FREE and save to DB', async () => {
    mockRepo.findOne.mockResolvedValue({
      key: 'SUBSCRIPTION_ACCESS_MODE',
      value: 'SUBSCRIPTION',
      updatedAt: new Date(),
    });

    const updated = await service.setAccessMode('FREE');
    expect(updated.mode).toBe('FREE');
    expect(updated.isAllAccessFree).toBe(true);
    expect(service.isAllAccessFreeNow()).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
