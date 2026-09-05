import { UUID, ISO8601 } from './common.types';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type SkuType = 'course_lifetime' | 'tools_1yr' | 'webinars_1yr' | 'bundle_diy' | 'track_b_pro';

export interface PlanDto {
  id: UUID;
  name: string;
  description: string;
  price: number; // in INR
  originalPrice?: number;
  skus: SkuType[];
  isActive: boolean;
}

export interface SubscriptionDto {
  id: UUID;
  userId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  startedAt: ISO8601;
  expiresAt?: ISO8601; // null for lifetime
  createdAt: ISO8601;
}

export interface EntitlementDto {
  id: UUID;
  userId: UUID;
  sku: SkuType;
  isLifetime: boolean;
  expiresAt?: ISO8601;
  grantedAt: ISO8601;
  sourceSubscriptionId: UUID;
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
