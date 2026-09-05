import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseEntity,
  CourseModuleEntity,
  LessonEntity,
  QuizEntity,
  UserLessonProgressEntity,
  QuizSubmissionEntity,
  CertificateEntity,
} from '../../database/entities/lms.entity';
import { EntitlementEntity } from '../../database/entities/subscription.entity';
import {
  CourseDto,
  CourseModuleDto,
  LessonDto,
  QuizDto,
  QuizResultDto,
  CertificateDto,
  hasEntitlement,
  SkuType,
} from '@ff/types';

@Injectable()
export class LmsService implements OnModuleInit {
  private readonly logger = new Logger(LmsService.name);

  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(CourseModuleEntity)
    private readonly moduleRepo: Repository<CourseModuleEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(QuizEntity)
    private readonly quizRepo: Repository<QuizEntity>,
    @InjectRepository(UserLessonProgressEntity)
    private readonly progressRepo: Repository<UserLessonProgressEntity>,
    @InjectRepository(QuizSubmissionEntity)
    private readonly submissionRepo: Repository<QuizSubmissionEntity>,
    @InjectRepository(CertificateEntity)
    private readonly certRepo: Repository<CertificateEntity>,
    @InjectRepository(EntitlementEntity)
    private readonly entitlementRepo: Repository<EntitlementEntity>,
  ) {}

  async onModuleInit() {
    await this.seedCourseCurriculum();
  }

  async seedCourseCurriculum() {
    const count = await this.courseRepo.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding Techno-Funda DIY Masterclass curriculum...');
    const course = this.courseRepo.create({
      slug: 'techno-funda-masterclass',
      title: 'Techno-Funda DIY Masterclass',
      description:
        'A comprehensive institutional framework blending fundamental moats, earnings momentum (PEAD), and technical stage analysis.',
      thumbnailUrl: '/thumbnails/techno-funda.jpg',
      totalDuration: 180,
      lessonCount: 5,
      level: 'All Levels',
      requiredSku: 'course_lifetime',
      isPublished: true,
      order: 1,
    });
    const savedCourse = await this.courseRepo.save(course);

    // Module 1: Foundational Frameworks
    const mod1 = await this.moduleRepo.save(
      this.moduleRepo.create({
        courseId: savedCourse.id,
        title: 'Module 1: Fundamental Moats & Earnings Quality',
        description: 'Screening for high-ROCE compounders and promoter integrity.',
        order: 1,
      }),
    );

    await this.lessonRepo.save([
      this.lessonRepo.create({
        moduleId: mod1.id,
        courseId: savedCourse.id,
        title: '1.1 Introduction to Techno-Funda Architecture',
        type: 'video',
        duration: 15,
        order: 1,
        isPreview: true, // Free Preview
        videoId: 'mock_vid_intro_01',
        videoPlaybackUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        textContent:
          'Welcome to the course. Learn why fundamental screening without technical timing leaves capital stranded.',
      }),
      this.lessonRepo.create({
        moduleId: mod1.id,
        courseId: savedCourse.id,
        title: '1.2 Decoding the Three Financial Statements for Alpha',
        type: 'video',
        duration: 25,
        order: 2,
        isPreview: false,
        videoId: 'mock_vid_fin_02',
        videoPlaybackUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        textContent: 'Operating cash flows vs Net profit, working capital cycles, and debt traps.',
      }),
    ]);

    // Module 2: Technical Momentum & Setups
    const mod2 = await this.moduleRepo.save(
      this.moduleRepo.create({
        courseId: savedCourse.id,
        title: 'Module 2: Technical Timing, Stage Analysis & VCP',
        description: 'Precision entries using 50/200 EMA and volume contractions.',
        order: 2,
      }),
    );

    await this.lessonRepo.save([
      this.lessonRepo.create({
        moduleId: mod2.id,
        courseId: savedCourse.id,
        title: '2.1 Stan Weinstein Stage Analysis in Indian Equities',
        type: 'video',
        duration: 30,
        order: 1,
        isPreview: false,
        videoId: 'mock_vid_tech_03',
        videoPlaybackUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        textContent: 'Identifying Stage 2 markups before retail investors catch on.',
      }),
      this.lessonRepo.create({
        moduleId: mod2.id,
        courseId: savedCourse.id,
        title: '2.2 Volume Contraction Patterns (VCP) & Pivot Breakouts',
        type: 'video',
        duration: 35,
        order: 2,
        isPreview: false,
        videoId: 'mock_vid_vcp_04',
        videoPlaybackUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        textContent: 'Rules for progressive dry-up in volume before institutional surges.',
      }),
    ]);

    // Module 3: Risk Management & Final Certification
    const mod3 = await this.moduleRepo.save(
      this.moduleRepo.create({
        courseId: savedCourse.id,
        title: 'Module 3: Portfolio Sizing & Certification Quiz',
        description: 'Position sizing, stop-loss discipline, and masterclass examination.',
        order: 3,
      }),
    );

    await this.lessonRepo.save([
      this.lessonRepo.create({
        moduleId: mod3.id,
        courseId: savedCourse.id,
        title: '3.1 Position Sizing & Downside Capital Preservation',
        type: 'video',
        duration: 20,
        order: 1,
        isPreview: false,
        videoId: 'mock_vid_risk_05',
        videoPlaybackUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        textContent: 'Never risk more than 1% of total portfolio capital on any single setup.',
      }),
    ]);

    // Create Final Quiz
    await this.quizRepo.save(
      this.quizRepo.create({
        courseId: savedCourse.id,
        title: 'Techno-Funda Masterclass Certification Exam',
        passingScorePct: 70,
        questions: [
          {
            id: 'q1',
            question: 'What is the primary characteristic of a Stage 2 breakout?',
            options: [
              'Price trading below falling 200 EMA with heavy volume',
              'Price breaking out above resistance with 200 EMA turning upward on expanding volume',
              'Sideways price action with declining revenue',
              'High P/E ratio without earnings growth',
            ],
            correctOptionIndex: 1,
            explanation:
              'A valid Stage 2 markup requires price above an ascending 200-day moving average accompanied by institutional volume.',
          },
          {
            id: 'q2',
            question: 'In Techno-Funda investing, what does PEAD stand for?',
            options: [
              'Price Earnings Asset Depreciation',
              'Post Earnings Announcement Drift',
              'Portfolio Equity Allocation Dividend',
              'Public Equity Appreciation Dividend',
            ],
            correctOptionIndex: 1,
            explanation:
              'PEAD (Post Earnings Announcement Drift) is the tendency of a stock to drift in the direction of an earnings surprise for quarters following the announcement.',
          },
          {
            id: 'q3',
            question: 'What is the maximum portfolio risk recommended on a single position?',
            options: ['1% to 2% of total portfolio equity', '15% of portfolio equity', '50% of portfolio equity', 'No stop loss needed'],
            correctOptionIndex: 0,
            explanation: 'Professional risk management dictates risking no more than 1–2% of total capital per trade.',
          },
        ],
      }),
    );

    this.logger.log('✅ Seeded Techno-Funda DIY Masterclass with 3 modules and certification quiz');
  }

  async getCourses(): Promise<CourseDto[]> {
    const courses = await this.courseRepo.find({
      where: { isPublished: true },
      order: { order: 'ASC' },
    });
    return courses.map((c) => this.mapCourse(c));
  }

  async getCourseBySlug(slug: string): Promise<CourseDto & { modules: CourseModuleDto[] }> {
    const course = await this.courseRepo.findOne({
      where: { slug, isPublished: true },
      relations: ['modules', 'modules.lessons'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const sortedModules = (course.modules || [])
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        id: m.id,
        courseId: m.courseId,
        title: m.title,
        order: m.order,
        lessons: (m.lessons || [])
          .sort((a, b) => a.order - b.order)
          .map((l) => ({
            id: l.id,
            moduleId: l.moduleId,
            title: l.title,
            type: l.type,
            duration: l.duration,
            order: l.order,
            isPreview: l.isPreview,
          })),
      }));

    return {
      ...this.mapCourse(course),
      modules: sortedModules,
    };
  }

  async getLessonContent(userId: string, _courseSlug: string, lessonId: string): Promise<LessonDto> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Free previews are open to all authenticated users
    if (!lesson.isPreview) {
      // Check user entitlements
      const entitlements = await this.entitlementRepo.find({ where: { userId } });
      const requiredSku = (lesson.module?.course?.requiredSku || 'course_lifetime') as SkuType;

      const hasAccess = hasEntitlement(
        entitlements.map((e) => ({
          id: e.id,
          userId: e.userId,
          sku: e.sku,
          isLifetime: e.isLifetime,
          expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
          grantedAt: e.grantedAt.toISOString(),
          sourceSubscriptionId: e.sourceSubscriptionId || '',
        })),
        requiredSku,
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          'You need an active subscription or lifetime membership to access this lesson. Please enroll in a plan.',
        );
      }
    }

    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      type: lesson.type,
      duration: lesson.duration,
      order: lesson.order,
      isPreview: lesson.isPreview,
      videoPlaybackUrl: lesson.videoPlaybackUrl,
    };
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<{ completed: boolean }> {
    let progress = await this.progressRepo.findOne({ where: { userId, lessonId } });
    if (!progress) {
      progress = this.progressRepo.create({
        userId,
        lessonId,
        isCompleted: true,
        watchedSeconds: 900,
        completedAt: new Date(),
      });
    } else {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
    await this.progressRepo.save(progress);
    return { completed: true };
  }

  async getCourseQuiz(courseSlug: string): Promise<QuizDto> {
    const course = await this.courseRepo.findOne({ where: { slug: courseSlug } });
    if (!course) throw new NotFoundException('Course not found');

    const quiz = await this.quizRepo.findOne({ where: { courseId: course.id } });
    if (!quiz) throw new NotFoundException('Quiz not found for this course');

    return {
      id: quiz.id,
      courseId: quiz.courseId,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      })),
    };
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    answers: Record<string, number>,
  ): Promise<QuizResultDto> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    }

    const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePct >= quiz.passingScorePct;

    const submission = this.submissionRepo.create({
      userId,
      quizId,
      scorePct,
      passed,
      answers,
    });
    await this.submissionRepo.save(submission);

    // If passed, issue certificate automatically if not already issued
    let certificateEligible = false;
    if (passed) {
      certificateEligible = true;
      let cert = await this.certRepo.findOne({ where: { userId, courseId: quiz.courseId } });
      if (!cert) {
        const certNumber = `CERT_FF_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 900 + 100)}`;
        cert = this.certRepo.create({
          userId,
          courseId: quiz.courseId,
          certificateNumber: certNumber,
          certificateUrl: `/certificates/${certNumber}.pdf`,
          issuedAt: new Date(),
        });
        await this.certRepo.save(cert);
      }
    }

    return {
      quizId,
      scorePct,
      passed,
      totalQuestions,
      correctCount,
      certificateEligible,
    };
  }

  async getCertificate(userId: string, courseSlug: string): Promise<CertificateDto | null> {
    const course = await this.courseRepo.findOne({ where: { slug: courseSlug } });
    if (!course) throw new NotFoundException('Course not found');

    const cert = await this.certRepo.findOne({
      where: { userId, courseId: course.id },
      relations: ['user', 'course'],
    });
    if (!cert) return null;

    return {
      id: cert.id,
      userId: cert.userId,
      courseId: cert.courseId,
      courseTitle: course.title,
      userName: `${cert.user?.firstName || 'Investor'} ${cert.user?.lastName || ''}`.trim(),
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt.toISOString(),
      certificateUrl: cert.certificateUrl || '',
    };
  }

  private mapCourse(c: CourseEntity): CourseDto {
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      totalDuration: c.totalDuration,
      lessonCount: c.lessonCount,
      level: c.level,
      requiredSku: c.requiredSku,
      isPublished: c.isPublished,
      createdAt: (c.createdAt ? new Date(c.createdAt) : new Date()).toISOString(),
    };
  }
}
