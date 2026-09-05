export declare const FLAGS: {
    readonly TRACK_B_ENABLED: "TRACK_B_ENABLED";
    readonly TRACK_B_SCREENER: "TRACK_B_SCREENER";
    readonly TRACK_B_VALUATION: "TRACK_B_VALUATION";
    readonly TRACK_B_PORTFOLIO: "TRACK_B_PORTFOLIO";
    readonly TRACK_B_SPECIAL_SITUATIONS: "TRACK_B_SPECIAL_SITUATIONS";
    readonly TRACK_B_AI_RESEARCH: "TRACK_B_AI_RESEARCH";
};
export type FlagKey = keyof typeof FLAGS;
export type FeatureFlagMap = Record<FlagKey, boolean>;
/** Parse feature flags from environment variables (used server-side) */
export declare function parseFeatureFlags(env: Record<string, string | undefined>): FeatureFlagMap;
//# sourceMappingURL=feature-flags.d.ts.map