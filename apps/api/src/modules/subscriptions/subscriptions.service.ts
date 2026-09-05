import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanEntity,
  SubscriptionEntity,
  EntitlementEntity,
  PaymentOrderEntity,
} from '../../database/entities/subscription.entity';
import { PaymentsService } from '../payments/payments.service';
import {
  PlanDto,
  SubscriptionDto,
  EntitlementDto,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  CreateOrderResponse,
  SkuType,
} from '@ff/types';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(EntitlementEntity)
    private readonly entitlementRepo: Repository<EntitlementEntity>,
    @InjectRepository(PaymentOrderEntity)
    private readonly orderRepo: Repository<PaymentOrderEntity>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  /** Seed standard FinanciallyFree plans per PRD */
  async seedDefaultPlans() {
    const count = await this.planRepo.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding initial subscription plans...');
    const defaultPlans: Partial<PlanEntity>[] = [
      {
        slug: 'diy-masterclass',
        name: 'Techno-Funda DIY Masterclass',
        description:
          'Lifetime access to complete Techno-Funda investing modules, video lessons, chapter quizzes, and completion certificate.',
        price: 14999,
        originalPrice: 24999,
        durationMonths: null, // Lifetime
        skus: ['course_lifetime' as SkuType],
        features: [
          'Full Techno-Funda Video Course (Lifetime Access)',
          'High-Conviction Stock Framework Checklist',
          'Interactive Chapter Quizzes & Assignments',
          'Course Completion Certificate',
          'Community Access & Q&A Forum',
        ],
        isPopular: false,
        isActive: true,
      },
      {
        slug: 'all-access-bundle',
        name: 'Techno-Funda All-Access Bundle',
        description:
          'Flagship investor bundle: Lifetime course access + 1 Year Techno-Funda Tools (Market Mood, Master Tracker, PEAD, Vahan) + 1 Year Weekly Live Webinars.',
        price: 24999,
        originalPrice: 44999,
        durationMonths: 12,
        skus: [
          'course_lifetime' as SkuType,
          'tools_1yr' as SkuType,
          'webinars_1yr' as SkuType,
          'bundle_diy' as SkuType,
        ],
        features: [
          'Everything in Techno-Funda DIY Masterclass (Lifetime)',
          'Market Mood Index & Pro Technical Overlays (1 Year)',
          'Master Tracker + PEAD + Vahan Auto Registrations (1 Year)',
          '52 Weekly Live Interactive Webinars with Mentors (1 Year)',
          'Full Webinar Replay Library with Transcripts',
          'Priority WhatsApp & Email Support',
        ],
        isPopular: true,
        isActive: true,
      },
      {
        slug: 'tools-webinars-annual',
        name: 'Techno-Funda Tools + Webinars Annual',
        description:
          'Annual renewal for active investors: Market Mood Pro, Master Tracker, PEAD, Vahan data aggregator, and weekly live webinars.',
        price: 9999,
        originalPrice: 15999,
        durationMonths: 12,
        skus: ['tools_1yr' as SkuType, 'webinars_1yr' as SkuType],
        features: [
          'Market Mood Index & Trend Reversal Alerts',
          'Master Tracker + PEAD Results Screener',
          'Vahan Vehicle Registration Real-time Trends',
          '52 Weekly Live Interactive Webinar Sessions',
          'Access to Webinar Replay Vault',
        ],
        isPopular: false,
        isActive: true,
      },
    ];

    for (const plan of defaultPlans) {
      const entity = this.planRepo.create(plan);
      await this.planRepo.save(entity);
    }
    this.logger.log('✅ Seeded 3 subscription plans successfully');
  }

  async getPlans(): Promise<PlanDto[]> {
    const plans = await this.planRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
    return plans.map((p) => this.mapPlan(p));
  }

  async getPlanById(id: string): Promise<PlanDto> {
    const plan = await this.planRepo.findOne({ where: { id, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.mapPlan(plan);
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionDto[]> {
    const subs = await this.subscriptionRepo.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    return subs.map((s) => ({
      id: s.id,
      userId: s.userId,
      planId: s.planId,
      plan: s.plan ? this.mapPlan(s.plan) : undefined,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getUserEntitlements(userId: string): Promise<EntitlementDto[]> {
    const entitlements = await this.entitlementRepo.find({
      where: { userId },
      order: { grantedAt: 'DESC' },
    });

    return entitlements.map((e) => ({
      id: e.id,
      userId: e.userId,
      sku: e.sku,
      isLifetime: e.isLifetime,
      expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
      grantedAt: e.grantedAt.toISOString(),
      sourceSubscriptionId: e.sourceSubscriptionId || '',
    }));
  }

  async createCheckoutOrder(userId: string, planId: string): Promise<CreateOrderResponse> {
    const orderResult = await this.paymentsService.createOrder(userId, planId);
    return orderResult;
  }

  async verifyPayment(userId: string, dto: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const { order } = await this.paymentsService.verifyPayment(userId, dto);
    const plan = await this.planRepo.findOne({ where: { id: order.planId } });
    if (!plan) {
      throw new NotFoundException('Associated plan not found');
    }

    // Determine subscription duration
    const now = new Date();
    let expiresAt: Date | null = null;
    if (plan.durationMonths) {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);
    }

    // Create or renew subscription
    let subscription = await this.subscriptionRepo.findOne({
      where: { userId, planId: plan.id, status: 'active' },
    });

    if (!subscription) {
      subscription = this.subscriptionRepo.create({
        userId,
        planId: plan.id,
        status: 'active',
        startedAt: now,
        expiresAt,
      });
    } else {
      // If renewed, extend expiresAt
      if (expiresAt && subscription.expiresAt) {
        const currentExp = new Date(subscription.expiresAt);
        const base = currentExp > now ? currentExp : now;
        base.setMonth(base.getMonth() + plan.durationMonths!);
        subscription.expiresAt = base;
      }
    }
    await this.subscriptionRepo.save(subscription);

    // Grant entitlements for all plan SKUs
    for (const sku of plan.skus) {
      const isLifetimeSku = sku === 'course_lifetime' || plan.durationMonths == null;
      let existingEntitlement = await this.entitlementRepo.findOne({
        where: { userId, sku },
      });

      if (!existingEntitlement) {
        existingEntitlement = this.entitlementRepo.create({
          userId,
          sku,
          isLifetime: isLifetimeSku,
          expiresAt: isLifetimeSku ? null : expiresAt,
          grantedAt: now,
          sourceSubscriptionId: subscription.id,
        });
      } else {
        if (isLifetimeSku) {
          existingEntitlement.isLifetime = true;
          existingEntitlement.expiresAt = null;
        } else if (expiresAt) {
          existingEntitlement.expiresAt = expiresAt;
        }
      }
      await this.entitlementRepo.save(existingEntitlement);
    }

    const allEntitlements = await this.getUserEntitlements(userId);

    return {
      success: true,
      message: 'Payment verified and plan activated successfully!',
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        plan: this.mapPlan(plan),
        status: subscription.status,
        startedAt: subscription.startedAt.toISOString(),
        expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
        createdAt: subscription.createdAt.toISOString(),
      },
      entitlements: allEntitlements,
    };
  }

  async getUserOrders(userId: string) {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      planId: o.planId,
      planName: o.plan ? o.plan.name : (o.metadata?.planName as string) || 'Plan',
      amount: Number(o.amount),
      gstAmount: Number(o.gstAmount),
      totalAmount: Number(o.totalAmount),
      currency: o.currency,
      status: o.status,
      razorpayOrderId: o.razorpayOrderId,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  private mapPlan(p: PlanEntity): PlanDto {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      durationMonths: p.durationMonths,
      skus: p.skus,
      features: p.features,
      isPopular: p.isPopular,
      isActive: p.isActive,
    };
  }
}
