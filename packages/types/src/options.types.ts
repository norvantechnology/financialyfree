import { UUID, ISO8601 } from './common.types';

export type BrokerType = 'zerodha' | 'upstox' | 'dhan' | 'angelone' | 'fyers' | 'sandbox';
export type BrokerConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';
export type ExchangeType = 'NSE' | 'BSE' | 'NFO' | 'BFO';
export type OptionType = 'CE' | 'PE';
export type InstrumentSegment = 'INDICES' | 'EQUITY' | 'FUT' | 'OPT';
export type TradeSide = 'BUY' | 'SELL';
export type OiBuildupType = 'Long Buildup' | 'Short Buildup' | 'Short Covering' | 'Long Unwinding';

export interface BrokerConnectionDto {
  id: UUID;
  userId: UUID;
  broker: BrokerType;
  brokerClientId: string;
  status: BrokerConnectionStatus;
  tokenExpiresAt: ISO8601 | null;
  lastConnectedAt: ISO8601 | null;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface BrokerAuthUrlDto {
  broker: BrokerType;
  authUrl: string;
  state: string;
}

export interface BrokerCallbackDto {
  broker: BrokerType;
  code: string;
  state?: string;
  brokerClientId?: string;
}

export interface InstrumentDto {
  id: UUID;
  instrumentToken: string;
  exchange: ExchangeType;
  segment: InstrumentSegment;
  symbol: string;
  name: string;
  expiry?: string | null;
  strike?: number | null;
  optionType?: OptionType | null;
  lotSize: number;
  tickSize: number;
  isActive: boolean;
  updatedAt: ISO8601;
}

export interface LiveTickDto {
  instrumentToken: string;
  symbol: string;
  ltp: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi: number;
  oiChange: number;
  bidPrice?: number;
  bidQty?: number;
  askPrice?: number;
  askQty?: number;
  timestamp: ISO8601;
}

export interface OptionContractDto {
  instrumentToken: string;
  strike: number;
  optionType: OptionType;
  ltp: number;
  change: number;
  changePct: number;
  iv: number | null; // null if solver does not converge
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
  oi: number;
  oiChange: number;
  volume: number;
  buildup: OiBuildupType;
  bidPrice?: number;
  askPrice?: number;
}

export interface OptionChainRowDto {
  strike: number;
  ce: OptionContractDto;
  pe: OptionContractDto;
}

export interface OptionChainDto {
  underlying: string;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  timestamp: ISO8601;
  expiryDates: string[];
  selectedExpiry: string;
  pcr: number;
  volumePcr: number;
  maxPain: number;
  atmStrike: number;
  atmIv: number | null;
  contracts: OptionChainRowDto[];
  source: 'BROKER_LIVE' | 'NSE_FALLBACK' | 'SANDBOX' | 'YAHOO_LIVE' | 'NSE_LIVE';
  vix?: number;
  lotSize?: number;
  futures?: Array<{ expiry: string; ltp: number; lots: string }>;
}

export interface StrategyLegDto {
  id: string;
  instrumentToken: string;
  symbol: string;
  expiry: string;
  strike: number;
  optionType: OptionType | 'FUT';
  side: TradeSide;
  lots: number;
  lotSize: number;
  entryPrice: number;
  currentPrice?: number;
  iv?: number | null;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
}

export interface SavedStrategyDto {
  id: UUID;
  userId: UUID;
  name: string;
  underlying: string;
  legs: StrategyLegDto[];
  notes?: string;
  tags?: string[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface CreateStrategyDto {
  name: string;
  underlying: string;
  legs: StrategyLegDto[];
  notes?: string;
  tags?: string[];
}

export interface PayoffPointDto {
  spotPrice: number;
  expiryPayoff: number;
  targetDatePayoff: number;
}

export interface GreeksSummaryDto {
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
  maxProfit: number | 'Unlimited';
  maxLoss: number | 'Unlimited';
  breakevens: number[];
  riskRewardRatio: number | 'N/A';
  probabilityOfProfit: number; // 0 - 100 percentage
}

export interface WhatIfScenarioDto {
  spotChangePct: number; // e.g. -5 to +5%
  ivChangePoints: number; // e.g. -5 to +5 vol points
  daysForward: number; // e.g. 0 to expiry days
}

export interface OiSnapshotDto {
  id: UUID;
  symbol: string;
  expiry: string;
  strike: number;
  optionType: OptionType;
  oi: number;
  oiChange: number;
  volume: number;
  ltp: number;
  iv: number | null;
  timestamp: ISO8601;
}

export interface SandboxPositionDto {
  id: UUID;
  userId: UUID;
  symbol: string;
  strike: number | null;
  optionType: OptionType | 'FUT';
  expiry: string;
  side: TradeSide;
  quantity: number;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  status: 'OPEN' | 'CLOSED';
  entryAt: ISO8601;
  closedAt?: ISO8601 | null;
}

export interface SandboxOrderDto {
  symbol: string;
  strike?: number;
  optionType?: OptionType | 'FUT';
  expiry: string;
  side: TradeSide;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
}

export interface IvSmilePointDto {
  strike: number;
  iv: number;
  callLtp: number;
  putLtp: number;
  isAtm: boolean;
}

export interface VolSurfaceExpiryDto {
  expiry: string;
  dte: number;
  strikes: { strike: number; iv: number }[];
}

export interface GexStrikeDto {
  strike: number;
  callOi: number;
  putOi: number;
  callGamma: number;
  putGamma: number;
  callGex: number;
  putGex: number;
  netGex: number;
}

export interface GexSummaryDto {
  underlying: string;
  spotPrice: number;
  totalCallGex: number;
  totalPutGex: number;
  netGex: number;
  zeroGammaStrike: number;
  regime: 'POSITIVE_GAMMA' | 'NEGATIVE_GAMMA';
  strikes: GexStrikeDto[];
  timestamp: ISO8601;
}

export interface SandboxPortfolioDto {
  totalCapital: number;
  availableMargin: number;
  deployedMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  positions: SandboxPositionDto[];
}

