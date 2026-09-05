import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IRazorpayProvider,
  RazorpayCreateOrderParams,
  RazorpayOrderResult,
  RazorpayVerifySignatureParams,
  RazorpayPaymentResult,
} from './razorpay.interface';

@Injectable()
export class RazorpayMockProvider implements IRazorpayProvider {
  private readonly logger = new Logger(RazorpayMockProvider.name);
  private readonly mockKeyId = 'rzp_test_MOCK_KEY_ID_FF';
  private readonly mockKeySecret = 'MOCK_KEY_SECRET_FOR_TESTING_12345';

  constructor() {
    this.logger.log('✨ Initialized RazorpayMockProvider (simulated payments enabled)');
  }

  getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || this.mockKeyId;
  }

  private getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || this.mockKeySecret;
  }

  async createOrder(params: RazorpayCreateOrderParams): Promise<RazorpayOrderResult> {
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.logger.log(`[Mock Razorpay] Created order ${mockOrderId} for ₹${params.amount / 100}`);
    return {
      id: mockOrderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      status: 'created',
    };
  }

  verifyPaymentSignature(params: RazorpayVerifySignatureParams): boolean {
    // In mock mode: if signature is 'mock_signature_success' or starts with 'sim_', accept directly
    if (
      params.signature === 'mock_signature_success' ||
      params.signature.startsWith('sim_') ||
      params.orderId.startsWith('order_mock_')
    ) {
      this.logger.log(`[Mock Razorpay] Verified simulated signature for ${params.orderId}`);
      return true;
    }

    // Standard HMAC verification
    const secret = this.getKeySecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');

    return expectedSignature === params.signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (signature === 'mock_webhook_signature') return true;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.getKeySecret();
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPaymentResult> {
    return {
      id: paymentId,
      orderId: 'order_mock_ref',
      amount: 1499900,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      email: 'mock_investor@financiallyfree.local',
    };
  }
}
