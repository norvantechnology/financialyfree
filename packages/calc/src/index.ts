// ── packages/calc/src/index.ts ─────────────────────────────────────────
// Central calculation library (Section 43).
// All functions are pure, unit-tested, versioned, and auditable.

export * from './goal.calc';
export * from './fire.calc';
export * from './financial.calc';
export * from './market-mood.calc';
export * from './rebalance.calc';
export * from './tax-harvest.calc';
export * from './sip-vs-lumpsum.calc';
export * from './rule-of-72.calc';
export * from './emergency-fund.calc';
export * from './retirement-stress-test.calc';
export * from './benchmark-xirr.calc';
export * from './aureus-score.calc';
export * from './sector-rotation.calc';

export const CALC_ENGINE_VERSION = '2.0.0';
