export interface RazorpayCreateOrderParams {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
}

export interface RazorpayVerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayPaymentResult {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'authorized';
  method: string;
  email?: string;
  contact?: string;
}

export interface IRazorpayProvider {
  createOrder(params: RazorpayCreateOrderParams): Promise<RazorpayOrderResult>;
  verifyPaymentSignature(params: RazorpayVerifySignatureParams): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  fetchPayment(paymentId: string): Promise<RazorpayPaymentResult>;
  getKeyId(): string;
}

export const RAZORPAY_PROVIDER = 'RAZORPAY_PROVIDER';
