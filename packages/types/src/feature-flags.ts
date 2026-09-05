// ── Feature flags shared between web and api ──────────────────────────────

export const FLAGS = {
  TRACK_B_ENABLED: 'TRACK_B_ENABLED',
  TRACK_B_SCREENER: 'TRACK_B_SCREENER',
  TRACK_B_VALUATION: 'TRACK_B_VALUATION',
  TRACK_B_PORTFOLIO: 'TRACK_B_PORTFOLIO',
  TRACK_B_SPECIAL_SITUATIONS: 'TRACK_B_SPECIAL_SITUATIONS',
  TRACK_B_AI_RESEARCH: 'TRACK_B_AI_RESEARCH',
} as const;

export type FlagKey = keyof typeof FLAGS;

export type FeatureFlagMap = Record<FlagKey, boolean>;

/** Parse feature flags from environment variables (used server-side) */
export function parseFeatureFlags(env: Record<string, string | undefined>): FeatureFlagMap {
  return {
    TRACK_B_ENABLED: env['FEATURE_TRACK_B_ENABLED'] === 'true',
    TRACK_B_SCREENER: env['FEATURE_TRACK_B_SCREENER'] === 'true',
    TRACK_B_VALUATION: env['FEATURE_TRACK_B_VALUATION'] === 'true',
    TRACK_B_PORTFOLIO: env['FEATURE_TRACK_B_PORTFOLIO'] === 'true',
    TRACK_B_SPECIAL_SITUATIONS: env['FEATURE_TRACK_B_SPECIAL_SITUATIONS'] === 'true',
    TRACK_B_AI_RESEARCH: env['FEATURE_TRACK_B_AI_RESEARCH'] === 'true',
  };
}
