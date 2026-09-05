import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IRazorpayProvider,
  RAZORPAY_PROVIDER,
} from './providers/razorpay.interface';
import {
  PaymentOrderEntity,
  PaymentEntity,
  PlanEntity,
} from '../../database/entities/subscription.entity';
import { VerifyPaymentRequest } from '@ff/types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(RAZORPAY_PROVIDER)
    private readonly razorpayProvider: IRazorpayProvider,
    @InjectRepository(PaymentOrderEntity)
    private readonly orderRepo: Repository<PaymentOrderEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
  ) {}

  getKeyId(): string {
    return this.razorpayProvider.getKeyId();
  }

  async createOrder(userId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId, isActive: true } });
    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Standard 18% GST calculation in India
    const baseAmount = Number(plan.price);
    const gstRate = 0.18;
    const gstAmount = Math.round(baseAmount * gstRate * 100) / 100;
    const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    const receipt = `rcpt_${Date.now().toString(36)}`;
    const rzpOrder = await this.razorpayProvider.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        planId,
        planSlug: plan.slug,
      },
    });

    const order = this.orderRepo.create({
      userId,
      planId: plan.id,
      amount: baseAmount,
      gstAmount,
      totalAmount,
      currency: 'INR',
      status: 'created',
      razorpayOrderId: rzpOrder.id,
      metadata: { receipt, planSlug: plan.slug, planName: plan.name },
    });

    await this.orderRepo.save(order);

    return {
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.razorpayProvider.getKeyId(),
      plan: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        originalPrice: plan.originalPrice ? Number(plan.originalPrice) : undefined,
        durationMonths: plan.durationMonths,
        skus: plan.skus,
        features: plan.features,
        isActive: plan.isActive,
      },
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentRequest) {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId },
      relations: ['plan'],
    });

    if (!order) {
      throw new NotFoundException('Payment order not found');
    }

    if (order.status === 'paid') {
      this.logger.warn(`Order ${order.id} already marked as paid`);
      return { order, alreadyPaid: true };
    }

    const isValid = this.razorpayProvider.verifyPaymentSignature({
      orderId: dto.razorpayOrderId,
      paymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });

    if (!isValid) {
      order.status = 'failed';
      await this.orderRepo.save(order);
      throw new BadRequestException('Invalid payment signature verification failed');
    }

    // Save payment record
    const payment = this.paymentRepo.create({
      orderId: order.id,
      razorpayPaymentId: dto.razorpayPaymentId,
      amount: order.totalAmount,
      currency: order.currency,
      status: 'captured',
      verifiedAt: new Date(),
    });
    await this.paymentRepo.save(payment);

    // Update order status
    order.status = 'paid';
    order.razorpayPaymentId = dto.razorpayPaymentId;
    await this.orderRepo.save(order);

    return { order, alreadyPaid: false };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return this.razorpayProvider.verifyWebhookSignature(rawBody, signature);
  }

  async getOrderById(orderId: string) {
    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['plan'],
    });
  }
}
