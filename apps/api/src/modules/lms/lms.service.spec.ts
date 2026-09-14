import { LmsService } from './lms.service';
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('LMS & Entitlement Enforcement (Sprint 5)', () => {
  let service: LmsService;
  let mockLessonRepo: Partial<Repository<any>>;
  let mockQuizRepo: Partial<Repository<any>>;
  let mockSubmissionRepo: Partial<Repository<any>>;
  let mockCertRepo: Partial<Repository<any>>;
  let mockEntitlementRepo: Partial<Repository<any>>;
  let mockSystemConfigService: { isAllAccessFreeNow: jest.Mock };

  beforeEach(() => {
    mockLessonRepo = {
      findOne: jest.fn(),
    };
    mockQuizRepo = {
      findOne: jest.fn(),
    };
    mockSubmissionRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    mockCertRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    mockEntitlementRepo = {
      find: jest.fn(),
    };
    mockSystemConfigService = {
      isAllAccessFreeNow: jest.fn().mockReturnValue(false),
    };

    service = new LmsService(
      {} as any,
      {} as any,
      mockLessonRepo as any,
      mockQuizRepo as any,
      {} as any,
      mockSubmissionRepo as any,
      mockCertRepo as any,
      mockEntitlementRepo as any,
      mockSystemConfigService as any,
    );
  });

  describe('getLessonContent - Entitlement Enforcement', () => {
    it('allows access to free preview lesson without entitlement', async () => {
      mockLessonRepo.findOne = jest.fn().mockResolvedValue({
        id: 'l1',
        title: 'Free Intro',
        isPreview: true,
        videoPlaybackUrl: 'https://example.com/preview.mp4',
      });

      const lesson = await service.getLessonContent('user-1', 'techno-funda', 'l1');
      expect(lesson.title).toBe('Free Intro');
      expect(lesson.isPreview).toBe(true);
    });

    it('denies access (403 Forbidden) to premium lesson if user lacks entitlement', async () => {
      mockLessonRepo.findOne = jest.fn().mockResolvedValue({
        id: 'l2',
        title: 'Stage Analysis Deep Dive',
        isPreview: false,
        module: { course: { requiredSku: 'course_lifetime' } },
      });

      // User has no entitlements
      mockEntitlementRepo.find = jest.fn().mockResolvedValue([]);

      await expect(service.getLessonContent('user-1', 'techno-funda', 'l2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('grants access to premium lesson if user has course_lifetime entitlement', async () => {
      mockLessonRepo.findOne = jest.fn().mockResolvedValue({
        id: 'l2',
        title: 'Stage Analysis Deep Dive',
        isPreview: false,
        videoPlaybackUrl: 'https://example.com/premium.mp4',
        module: { course: { requiredSku: 'course_lifetime' } },
      });

      // User has active lifetime entitlement
      mockEntitlementRepo.find = jest.fn().mockResolvedValue([
        {
          id: 'e1',
          userId: 'user-1',
          sku: 'course_lifetime',
          isLifetime: true,
          expiresAt: null,
          grantedAt: new Date(),
        },
      ]);

      const lesson = await service.getLessonContent('user-1', 'techno-funda', 'l2');
      expect(lesson.title).toBe('Stage Analysis Deep Dive');
      expect(lesson.videoPlaybackUrl).toBe('https://example.com/premium.mp4');
    });

    it('allows access to premium lesson when platform is in FREE access mode', async () => {
      mockSystemConfigService.isAllAccessFreeNow.mockReturnValue(true);
      mockLessonRepo.findOne = jest.fn().mockResolvedValue({
        id: 'l3',
        title: 'Institutional Screener Masterclass',
        isPreview: false,
        videoPlaybackUrl: 'https://example.com/free-access.mp4',
        module: { course: { requiredSku: 'course_lifetime' } },
      });
      mockEntitlementRepo.find = jest.fn().mockResolvedValue([]);

      const lesson = await service.getLessonContent('user-guest', 'techno-funda', 'l3');
      expect(lesson.title).toBe('Institutional Screener Masterclass');
      expect(lesson.videoPlaybackUrl).toBe('https://example.com/free-access.mp4');
    });
  });

  describe('submitQuiz & Certification', () => {
    it('calculates score and awards certificate when passing score achieved', async () => {
      mockQuizRepo.findOne = jest.fn().mockResolvedValue({
        id: 'q1',
        courseId: 'c1',
        title: 'Masterclass Exam',
        passingScorePct: 70,
        questions: [
          { id: 'q1', correctOptionIndex: 1 },
          { id: 'q2', correctOptionIndex: 2 },
          { id: 'q3', correctOptionIndex: 0 },
        ],
      });

      // Answer all correctly -> 100%
      const result = await service.submitQuiz('user-1', 'q1', {
        q1: 1,
        q2: 2,
        q3: 0,
      });

      expect(result.scorePct).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.certificateEligible).toBe(true);
      expect(mockCertRepo.save).toHaveBeenCalled();
    });

    it('fails quiz when score is below passing score', async () => {
      mockQuizRepo.findOne = jest.fn().mockResolvedValue({
        id: 'q1',
        courseId: 'c1',
        title: 'Masterclass Exam',
        passingScorePct: 70,
        questions: [
          { id: 'q1', correctOptionIndex: 1 },
          { id: 'q2', correctOptionIndex: 2 },
          { id: 'q3', correctOptionIndex: 0 },
        ],
      });

      // Answer only 1 right -> 33%
      const result = await service.submitQuiz('user-1', 'q1', {
        q1: 1,
        q2: 0,
        q3: 1,
      });

      expect(result.scorePct).toBe(33);
      expect(result.passed).toBe(false);
      expect(result.certificateEligible).toBe(false);
    });
  });
});
