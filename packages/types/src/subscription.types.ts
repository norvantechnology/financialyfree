import { UUID, ISO8601 } from './common.types';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type SkuType = 'course_lifetime' | 'tools_1yr' | 'webinars_1yr' | 'bundle_diy' | 'track_b_pro';
export type PaymentOrderStatus = 'created' | 'attempted' | 'paid' | 'failed';

export interface PlanDto {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  price: number; // in INR (excl or incl GST)
  originalPrice?: number;
  durationMonths?: number | null; // null = lifetime
  skus: SkuType[];
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface SubscriptionDto {
  id: UUID;
  userId: UUID;
  planId: UUID;
  plan?: PlanDto;
  status: SubscriptionStatus;
  startedAt: ISO8601;
  expiresAt?: ISO8601 | null; // null for lifetime
  createdAt: ISO8601;
}

export interface EntitlementDto {
  id: UUID;
  userId: UUID;
  sku: SkuType;
  isLifetime: boolean;
  expiresAt?: ISO8601 | null;
  grantedAt: ISO8601;
  sourceSubscriptionId: UUID;
}

export interface OrderDto {
  id: UUID;
  userId: UUID;
  planId: UUID;
  planName: string;
  amount: number; // in paise or rupees (standardized to INR rupees for DTO)
  gstAmount: number;
  totalAmount: number;
  currency: string;
  status: PaymentOrderStatus;
  razorpayOrderId: string;
  createdAt: ISO8601;
}

export interface CreateOrderRequest {
  planId: UUID;
}

export interface CreateOrderResponse {
  orderId: UUID;
  razorpayOrderId: string;
  amount: number; // in paise for Razorpay SDK
  currency: string;
  keyId: string;
  plan: PlanDto;
}

export interface VerifyPaymentRequest {
  orderId: UUID;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription: SubscriptionDto;
  entitlements: EntitlementDto[];
}

/** Check if user has access to a specific SKU */
export function hasEntitlement(entitlements: EntitlementDto[], sku: SkuType): boolean {
  const now = new Date();
  return entitlements.some(
    (e) =>
      e.sku === sku &&
      (e.isLifetime || (e.expiresAt != null && new Date(e.expiresAt) > now)),
  );
}

