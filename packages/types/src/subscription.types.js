"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasEntitlement = hasEntitlement;
/** Check if user has access to a specific SKU */
function hasEntitlement(entitlements, sku) {
    const now = new Date();
    return entitlements.some((e) => e.sku === sku &&
        (e.isLifetime || (e.expiresAt != null && new Date(e.expiresAt) > now)));
}
//# sourceMappingURL=subscription.types.js.map