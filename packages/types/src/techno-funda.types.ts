import { UUID, ISO8601 } from './common.types';

// ── Market Mood ──────────────────────────────────────────────────────────
export type MoodLabel = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

export interface MarketMoodDto {
  score: number; // 0–100
  label: MoodLabel;
  components: {
    breadth: number;
    vix: number;
    maPositioning: number;
    fiiDiiFlow: number;
  };
  methodology: string;
  dataSource: string;
  lastUpdated: ISO8601;
  version: string; // formula version for reproducibility
}

// ── Master Tracker ───────────────────────────────────────────────────────
export interface MasterTrackerItemDto {
  id: UUID;
  symbol: string;
  companyName: string;
  sector: string;
  roce: number;
  revenueGrowth3yr: number;
  debtEquity: number;
  qualityScore: number; // composite
  addedAt: ISO8601;
  lastReviewedAt: ISO8601;
  methodology: string; // must be shown in UI per Section 72
}

// ── PEAD Tool ────────────────────────────────────────────────────────────
export interface PeadEventDto {
  id: UUID;
  symbol: string;
  companyName: string;
  resultDate: ISO8601;
  actualEps?: number;
  expectedEps?: number;
  surprisePct?: number;
  yoyRevenuePct?: number;
  yoyPatPct?: number;
  priceAtResult: number;
  price20dPost?: number;
  price60dPost?: number;
  drift20d?: number; // %
  drift60d?: number; // %
  dailyRet?: number; // %
  currentPe?: number;
  forwardPe?: number;
  currentPrice?: number;
  price20dAgo?: number;
  sma50?: number;
  stage?: string;
  methodology: string;
}

// ── Vahan Dashboard ──────────────────────────────────────────────────────
export type VehicleCategory = '2W' | '3W' | 'PV' | 'CV' | 'Tractor' | 'Other';

export interface VahanDataPointDto {
  id: UUID;
  month: string; // YYYY-MM
  category: VehicleCategory;
  manufacturer?: string;
  state?: string;
  registrations: number;
  momChange?: number; // %
  yoyChange?: number; // %
  dataSource: 'VAHAN / Government of India (parivahan.gov.in)';
  retrievedAt: ISO8601;
}
