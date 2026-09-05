"use strict";
// ── Feature flags shared between web and api ──────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLAGS = void 0;
exports.parseFeatureFlags = parseFeatureFlags;
exports.FLAGS = {
    TRACK_B_ENABLED: 'TRACK_B_ENABLED',
    TRACK_B_SCREENER: 'TRACK_B_SCREENER',
    TRACK_B_VALUATION: 'TRACK_B_VALUATION',
    TRACK_B_PORTFOLIO: 'TRACK_B_PORTFOLIO',
    TRACK_B_SPECIAL_SITUATIONS: 'TRACK_B_SPECIAL_SITUATIONS',
    TRACK_B_AI_RESEARCH: 'TRACK_B_AI_RESEARCH',
};
/** Parse feature flags from environment variables (used server-side) */
function parseFeatureFlags(env) {
    return {
        TRACK_B_ENABLED: env['FEATURE_TRACK_B_ENABLED'] === 'true',
        TRACK_B_SCREENER: env['FEATURE_TRACK_B_SCREENER'] === 'true',
        TRACK_B_VALUATION: env['FEATURE_TRACK_B_VALUATION'] === 'true',
        TRACK_B_PORTFOLIO: env['FEATURE_TRACK_B_PORTFOLIO'] === 'true',
        TRACK_B_SPECIAL_SITUATIONS: env['FEATURE_TRACK_B_SPECIAL_SITUATIONS'] === 'true',
        TRACK_B_AI_RESEARCH: env['FEATURE_TRACK_B_AI_RESEARCH'] === 'true',
    };
}
//# sourceMappingURL=feature-flags.js.map