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
export class RazorpayLiveProvider implements IRazorpayProvider {
  private readonly logger = new Logger(RazorpayLiveProvider.name);
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!this.keyId || !this.keySecret) {
      this.logger.warn('⚠️ Razorpay live credentials not provided. Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET');
    }
  }

  getKeyId(): string {
    return this.keyId;
  }

  async createOrder(params: RazorpayCreateOrderParams): Promise<RazorpayOrderResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay createOrder failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as RazorpayOrderResult;
    return data;
  }

  verifyPaymentSignature(params: RazorpayVerifySignatureParams): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');
    return expectedSignature === params.signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPaymentResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      throw new Error(`Razorpay fetchPayment failed: ${response.status}`);
    }

    return (await response.json()) as RazorpayPaymentResult;
  }
}
