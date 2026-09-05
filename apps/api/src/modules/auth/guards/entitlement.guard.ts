import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkuType, hasEntitlement } from '@ff/types';
import { EntitlementEntity } from '../../../database/entities/subscription.entity';

export const REQUIRE_SKU_KEY = 'require_sku';
export const RequireSku = (...skus: SkuType[]) => SetMetadata(REQUIRE_SKU_KEY, skus);

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(EntitlementEntity)
    private readonly entitlementRepo: Repository<EntitlementEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredSkus = this.reflector.getAllAndOverride<SkuType[]>(REQUIRE_SKU_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no SKU required, allow access
    if (!requiredSkus || requiredSkus.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin or admin bypass
    if (user?.role === 'admin') {
      return true;
    }

    if (!user || (!user.id && !user.userId)) {
      throw new ForbiddenException('Authentication required to verify active entitlement.');
    }

    const userId = user.id || user.userId;
    const userEntitlements = await this.entitlementRepo.find({
      where: { userId },
    });

    const mappedEntitlements = userEntitlements.map((e) => ({
      id: e.id,
      userId: e.userId,
      sku: e.sku,
      isLifetime: e.isLifetime,
      expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
      grantedAt: e.grantedAt.toISOString(),
      sourceSubscriptionId: e.sourceSubscriptionId || '',
    }));

    const hasAnyRequiredSku = requiredSkus.some((sku) =>
      hasEntitlement(mappedEntitlements, sku),
    );

    if (!hasAnyRequiredSku) {
      throw new ForbiddenException(
        `Access requires one of the following active entitlements: ${requiredSkus.join(
          ', ',
        )}. Please upgrade your plan or enroll in the course.`,
      );
    }

    return true;
  }
}
