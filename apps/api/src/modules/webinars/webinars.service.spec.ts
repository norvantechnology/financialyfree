import { WebinarsService } from './webinars.service';
import { WebinarStatus, WebinarTier } from '../../database/entities/webinar.entity';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('WebinarsService (Sprint 6)', () => {
  let service: WebinarsService;
  let mockWebinarRepo: Partial<Repository<any>>;
  let mockRegRepo: Partial<Repository<any>>;

  beforeEach(() => {
    mockWebinarRepo = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    mockRegRepo = {
      count: jest.fn().mockResolvedValue(10),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 'reg-uuid-123',
        registeredAt: new Date(),
      })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    service = new WebinarsService(
      mockWebinarRepo as any,
      mockRegRepo as any,
    );
  });

  describe('listWebinars', () => {
    it('returns formatted webinars list with registration status', async () => {
      mockWebinarRepo.find = jest.fn().mockResolvedValue([
        {
          id: 'w-1',
          slug: 'sample-webinar',
          title: 'Sample Webinar',
          description: 'Desc',
          scheduledAt: new Date('2026-10-01T10:00:00Z'),
          durationMinutes: 60,
          instructorName: 'Sandeep Kumar',
          status: WebinarStatus.SCHEDULED,
          tierRequired: WebinarTier.FREE,
          maxAttendees: 500,
          linkedCompanies: ['TRENT'],
        },
      ]);

      const list = await service.listWebinars('user-1');
      expect(list).toHaveLength(1);
      expect(list[0].slug).toBe('sample-webinar');
      expect(list[0].isRegistered).toBe(false);
    });

    it('throws NotFoundException when slug does not exist', async () => {
      mockWebinarRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.getWebinarBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('register', () => {
    it('allows a free user to register for a FREE webinar', async () => {
      mockWebinarRepo.findOne = jest.fn().mockResolvedValue({
        id: 'w-free',
        slug: 'free-intro',
        title: 'Free Intro',
        status: WebinarStatus.SCHEDULED,
        tierRequired: WebinarTier.FREE,
        maxAttendees: 500,
      });

      mockRegRepo.findOne = jest.fn().mockResolvedValue(null);

      const reg = await service.register('w-free', {
        id: 'user-free-1',
        tier: 'FREE',
      });

      expect(reg.userId).toBe('user-free-1');
      expect(reg.webinarId).toBe('w-free');
      expect(reg.joinUrl).toContain('live.financiallyfree.in');
    });

    it('blocks a FREE user from registering for a PRO webinar (403 Forbidden)', async () => {
      mockWebinarRepo.findOne = jest.fn().mockResolvedValue({
        id: 'w-pro',
        slug: 'pro-masterclass',
        title: 'Pro Masterclass',
        status: WebinarStatus.SCHEDULED,
        tierRequired: WebinarTier.PRO,
        maxAttendees: 100,
      });

      await expect(
        service.register('w-pro', { id: 'user-free-1', tier: 'FREE' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a PRO user to register for a PRO webinar', async () => {
      mockWebinarRepo.findOne = jest.fn().mockResolvedValue({
        id: 'w-pro',
        slug: 'pro-masterclass',
        title: 'Pro Masterclass',
        status: WebinarStatus.SCHEDULED,
        tierRequired: WebinarTier.PRO,
        maxAttendees: 100,
      });

      mockRegRepo.findOne = jest.fn().mockResolvedValue(null);

      const reg = await service.register('w-pro', {
        id: 'user-pro-1',
        tier: 'PRO',
      });

      expect(reg.userId).toBe('user-pro-1');
      expect(reg.webinarId).toBe('w-pro');
      expect(reg.joinUrl).toContain('pro-masterclass');
    });

    it('rejects registration if maximum capacity is reached', async () => {
      mockWebinarRepo.findOne = jest.fn().mockResolvedValue({
        id: 'w-full',
        slug: 'full-room',
        title: 'Full Room',
        status: WebinarStatus.SCHEDULED,
        tierRequired: WebinarTier.FREE,
        maxAttendees: 50,
      });

      mockRegRepo.count = jest.fn().mockResolvedValue(50); // Already full

      await expect(
        service.register('w-full', { id: 'user-1', tier: 'FREE' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordAttendanceWebhook', () => {
    it('records attendance minutes for existing registrant', async () => {
      const mockReg = {
        id: 'reg-1',
        webinarId: 'w-1',
        userId: 'u-1',
        attended: false,
        attendedMinutes: 0,
      };

      mockRegRepo.findOne = jest.fn().mockResolvedValue(mockReg);

      const result = await service.recordAttendanceWebhook({
        webinarId: 'w-1',
        userId: 'u-1',
        attendedMinutes: 55,
      });

      expect(result.success).toBe(true);
      expect(mockReg.attended).toBe(true);
      expect(mockReg.attendedMinutes).toBe(55);
    });
  });
});
