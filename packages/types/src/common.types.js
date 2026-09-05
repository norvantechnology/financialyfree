"use strict";
// ── Common utility types ────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatINR = formatINR;
/** Formats a number in Indian lakh/crore style */
function formatINR(amount) {
    if (amount >= 1e7)
        return `₹${(amount / 1e7).toFixed(2)} Cr`;
    if (amount >= 1e5)
        return `₹${(amount / 1e5).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}
//# sourceMappingURL=common.types.js.map