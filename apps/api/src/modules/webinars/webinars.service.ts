import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WebinarEntity,
  WebinarRegistrationEntity,
  WebinarStatus,
  WebinarTier,
} from '../../database/entities/webinar.entity';
import {
  WebinarDto,
  WebinarRegistrationDto,
  WebinarAttendanceWebhookDto,
} from '@ff/types';

@Injectable()
export class WebinarsService implements OnModuleInit {
  private readonly logger = new Logger(WebinarsService.name);

  constructor(
    @InjectRepository(WebinarEntity)
    private readonly webinarRepo: Repository<WebinarEntity>,
    @InjectRepository(WebinarRegistrationEntity)
    private readonly regRepo: Repository<WebinarRegistrationEntity>,
  ) {}

  async onModuleInit() {
    await this.seedWebinars();
  }

  async seedWebinars(): Promise<void> {
    const count = await this.webinarRepo.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding initial Techno-Funda webinars...');

    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
    const futureDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    const pastDate1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago

    const webinars = [
      this.webinarRepo.create({
        slug: 'weekly-techno-funda-alpha-breakdown',
        title: 'Weekly Techno-Funda Alpha Breakdown: Stage 2 Breakouts',
        description:
          'Live interactive session breaking down the high-conviction breakout setups from the Nifty 500, evaluating quarterly revenue growth, volume contraction patterns (VCP), and institutional accumulation footprints.',
        topic: 'Weekly Market Analysis & Sector Rotation',
        scheduledAt: futureDate1,
        durationMinutes: 75,
        instructorName: 'Sandeep Kumar (CMT, CFA)',
        instructorBio: 'Founder & Head of Research at FinanciallyFree. 14+ years in institutional equity research.',
        status: WebinarStatus.SCHEDULED,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
        meetingUrl: 'https://meet.financiallyfree.in/room/weekly-techno-funda-alpha-breakdown',
        tierRequired: WebinarTier.FREE,
        maxAttendees: 500,
        linkedCompanies: ['TRENT', 'HAL', 'BEL', 'DIXON'],
      }),
      this.webinarRepo.create({
        slug: 'quarterly-pead-deep-dive',
        title: 'Q1 FY27 Earnings Season: Mastering Post-Earnings Announcement Drift (PEAD)',
        description:
          'Deep dive into institutional earnings surprise screening. Learn how to catch the 48-hour institutional post-earnings drift window and avoid valuation traps in guidance downgrades.',
        topic: 'Quarterly Earnings & PEAD Strategy',
        scheduledAt: futureDate2,
        durationMinutes: 90,
        instructorName: 'Sandeep Kumar (CMT, CFA)',
        instructorBio: 'Founder & Head of Research at FinanciallyFree. 14+ years in institutional equity research.',
        status: WebinarStatus.SCHEDULED,
        thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop',
        meetingUrl: 'https://meet.financiallyfree.in/room/quarterly-pead-deep-dive',
        tierRequired: WebinarTier.PRO,
        maxAttendees: 200,
        linkedCompanies: ['POLYCAB', 'KAYNES', 'SOLARINDS'],
      }),
      this.webinarRepo.create({
        slug: 'mastering-mf-portfolio-construction',
        title: 'Masterclass: Engineering a High-XIRR Goal-Linked Mutual Fund Portfolio',
        description:
          'Recording of our live session covering core-and-satellite asset allocation, rolling return comparisons between Flexicap and Midcap categories, and tax harvesting strategies.',
        topic: 'Mutual Funds & Goal Allocation',
        scheduledAt: pastDate1,
        durationMinutes: 60,
        instructorName: 'Priya Sharma (CFP)',
        instructorBio: 'Lead Wealth Strategist at FinanciallyFree, SEBI Registered Investment Advisor.',
        status: WebinarStatus.COMPLETED,
        thumbnailUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
        meetingUrl: 'https://meet.financiallyfree.in/room/mastering-mf-portfolio-construction',
        replayUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        tierRequired: WebinarTier.FREE,
        maxAttendees: 500,
        linkedCompanies: ['HDFCBANK', 'ICICIBANK', 'INFY'],
      }),
    ];

    await this.webinarRepo.save(webinars);
    this.logger.log('✅ Seeded 3 default webinars (2 scheduled, 1 completed replay).');
  }

  async listWebinars(userId?: string): Promise<WebinarDto[]> {
    const webinars = await this.webinarRepo.find({
      order: { scheduledAt: 'DESC' },
    });

    let userRegistrations: Map<string, WebinarRegistrationEntity> = new Map();
    if (userId) {
      const regs = await this.regRepo.find({ where: { userId } });
      userRegistrations = new Map(regs.map((r) => [r.webinarId, r]));
    }

    return webinars.map((w) => {
      const reg = userRegistrations.get(w.id);
      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        description: w.description,
        topic: w.topic,
        scheduledAt: w.scheduledAt.toISOString(),
        durationMinutes: w.durationMinutes,
        instructorName: w.instructorName,
        instructorBio: w.instructorBio,
        status: w.status,
        thumbnailUrl: w.thumbnailUrl,
        meetingUrl: w.meetingUrl,
        replayUrl: w.replayUrl,
        tierRequired: w.tierRequired,
        maxAttendees: w.maxAttendees,
        linkedCompanies: w.linkedCompanies,
        isRegistered: !!reg,
        userJoinUrl: reg?.joinUrl,
      };
    });
  }

  async getWebinarBySlug(slug: string, userId?: string): Promise<WebinarDto> {
    const webinar = await this.webinarRepo.findOne({ where: { slug } });
    if (!webinar) {
      throw new NotFoundException(`Webinar with slug '${slug}' not found`);
    }

    let reg: WebinarRegistrationEntity | null = null;
    if (userId) {
      reg = await this.regRepo.findOne({
        where: { webinarId: webinar.id, userId },
      });
    }

    return {
      id: webinar.id,
      slug: webinar.slug,
      title: webinar.title,
      description: webinar.description,
      topic: webinar.topic,
      scheduledAt: webinar.scheduledAt.toISOString(),
      durationMinutes: webinar.durationMinutes,
      instructorName: webinar.instructorName,
      instructorBio: webinar.instructorBio,
      status: webinar.status,
      thumbnailUrl: webinar.thumbnailUrl,
      meetingUrl: webinar.meetingUrl,
      replayUrl: webinar.replayUrl,
      tierRequired: webinar.tierRequired,
      maxAttendees: webinar.maxAttendees,
      linkedCompanies: webinar.linkedCompanies,
      isRegistered: !!reg,
      userJoinUrl: reg?.joinUrl,
    };
  }

  async register(
    webinarId: string,
    user: { id: string; email?: string; tier?: string },
  ): Promise<WebinarRegistrationDto> {
    const webinar = await this.webinarRepo.findOne({ where: { id: webinarId } });
    if (!webinar) {
      throw new NotFoundException(`Webinar not found`);
    }

    if (webinar.status === WebinarStatus.CANCELLED) {
      throw new BadRequestException('This webinar has been cancelled.');
    }

    // Entitlement verification
    const userTier = (user.tier || 'FREE').toUpperCase();
    if (webinar.tierRequired === WebinarTier.PRO && userTier === 'FREE') {
      throw new ForbiddenException(
        'This live masterclass is reserved for Pro and Elite members. Please upgrade your plan to register.',
      );
    }
    if (webinar.tierRequired === WebinarTier.ELITE && userTier !== 'ELITE') {
      throw new ForbiddenException(
        'This executive session is exclusively for Elite members. Please upgrade to Elite to register.',
      );
    }

    // Check capacity
    const currentAttendees = await this.regRepo.count({ where: { webinarId } });
    if (currentAttendees >= webinar.maxAttendees) {
      throw new BadRequestException('This webinar has reached maximum capacity.');
    }

    // Check existing registration
    const existing = await this.regRepo.findOne({
      where: { webinarId, userId: user.id },
    });
    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        webinarId: existing.webinarId,
        registeredAt: existing.registeredAt.toISOString(),
        joinUrl: existing.joinUrl,
        attended: existing.attended,
        attendedMinutes: existing.attendedMinutes,
      };
    }

    // Generate personalized simulated join URL
    const joinUrl = `https://live.financiallyfree.in/room/${webinar.slug}?u=${user.id}&token=sim_jwt_${Date.now()}`;

    const reg = this.regRepo.create({
      webinarId,
      userId: user.id,
      joinUrl,
      attended: false,
      attendedMinutes: 0,
    });

    const saved = await this.regRepo.save(reg);
    this.logger.log(`User ${user.id} registered for webinar: ${webinar.title}`);

    return {
      id: saved.id,
      userId: saved.userId,
      webinarId: saved.webinarId,
      registeredAt: saved.registeredAt.toISOString(),
      joinUrl: saved.joinUrl,
      attended: saved.attended,
      attendedMinutes: saved.attendedMinutes,
    };
  }

  async recordAttendanceWebhook(dto: WebinarAttendanceWebhookDto): Promise<{ success: boolean; message: string }> {
    const reg = await this.regRepo.findOne({
      where: { webinarId: dto.webinarId, userId: dto.userId },
    });

    if (!reg) {
      this.logger.warn(`Attendance webhook: No registration found for user ${dto.userId} in webinar ${dto.webinarId}`);
      return { success: false, message: 'Registration not found' };
    }

    reg.attended = true;
    reg.attendedMinutes = Math.max(reg.attendedMinutes, dto.attendedMinutes);
    await this.regRepo.save(reg);

    this.logger.log(`Recorded attendance for user ${dto.userId}: ${dto.attendedMinutes} mins`);
    return { success: true, message: 'Attendance recorded successfully' };
  }
}
