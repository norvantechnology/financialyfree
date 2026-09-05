import { UUID, ISO8601 } from './common.types';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type SkuType = 'course_lifetime' | 'tools_1yr' | 'webinars_1yr' | 'bundle_diy' | 'track_b_pro';
export interface PlanDto {
    id: UUID;
    name: string;
    description: string;
    price: number;
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
    expiresAt?: ISO8601;
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
export declare function hasEntitlement(entitlements: EntitlementDto[], sku: SkuType): boolean;
//# sourceMappingURL=subscription.types.d.ts.map