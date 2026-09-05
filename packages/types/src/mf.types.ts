import { UUID, ISO8601 } from './common.types';

export interface MutualFundDto {
  id: UUID;
  schemeCode: string; // AMFI scheme code
  schemeName: string;
  amcName: string;
  category: string; // e.g. Equity - Large Cap
  subCategory: string;
  navCurrent: number;
  navDate: ISO8601;
  expenseRatio: number;
  exitLoad: string;
  fundManagerName?: string;
  inceptionDate?: ISO8601;
  aum?: number;
  returns1yr?: number;
  returns3yr?: number;
  returns5yr?: number;
  riskLevel?: 'low' | 'moderate' | 'moderately_high' | 'high' | 'very_high';
}

export type OrderType = 'lumpsum' | 'sip' | 'stp' | 'swp' | 'switch' | 'redemption';
export type OrderStatus = 'pending' | 'submitted' | 'allotted' | 'rejected' | 'cancelled';

export interface MfOrderDto {
  id: UUID;
  userId: UUID;
  schemeCode: string;
  orderType: OrderType;
  amount?: number;
  units?: number;
  status: OrderStatus;
  bseOrderNo?: string; // BSE StAR MF order reference
  placedAt: ISO8601;
  settledAt?: ISO8601;
  nav?: number;
  unitsAllotted?: number;
}

export interface SipMandateDto {
  id: UUID;
  userId: UUID;
  schemeCode: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  startDate: ISO8601;
  endDate?: ISO8601;
  status: 'active' | 'paused' | 'cancelled';
  nextInstallmentDate?: ISO8601;
  bseMandateId?: string;
}

export interface FolioDto {
  id: UUID;
  userId: UUID;
  folioNumber: string;
  amcName: string;
  schemeName: string;
  schemeCode: string;
  units: number;
  navCurrent: number;
  currentValue: number;
  investedAmount: number;
  gain: number;
  gainPct: number;
  lastUpdated: ISO8601;
}

export interface CreateSipOrderRequest {
  schemeCode: string;
  amount: number;
  sipDayOfMonth: number;
  goalId?: UUID;
}
