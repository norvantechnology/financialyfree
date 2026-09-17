// ── packages/calc/src/options.calc.ts ──────────────────────────────────
// Production-grade Black-Scholes, Greeks Engine, Implied Volatility Solver,
// Max Pain, PCR, and Multi-Leg Payoff Analytics for Indian F&O Markets.

export type OptionType = 'CE' | 'PE';
export type TradeSide = 'BUY' | 'SELL';

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

// ── Standard Normal PDF and CDF (Abramowitz & Stegun 26.2.17) ──────────

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** Standard normal probability density function: phi(x) */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/** Standard normal cumulative distribution function: Phi(x) */
export function normalCdf(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x);
    return (
      1.0 -
      normalPdf(x) *
        (b1 * t + b2 * Math.pow(t, 2) + b3 * Math.pow(t, 3) + b4 * Math.pow(t, 4) + b5 * Math.pow(t, 5))
    );
  } else {
    return 1.0 - normalCdf(-x);
  }
}

// ── Black-Scholes-Merton Pricing ──────────────────────────────────────

export interface BlackScholesInputs {
  spot: number;
  strike: number;
  timeToExpiryYears: number;
  riskFreeRate: number; // e.g. 0.065 for 6.5%
  volatility: number;   // e.g. 0.15 for 15%
  dividendYield?: number; // e.g. 0.012 for 1.2%, default 0
  optionType: OptionType;
}

export function blackScholesPrice(inputs: BlackScholesInputs): number {
  const { spot, strike, timeToExpiryYears, riskFreeRate, volatility, optionType } = inputs;
  const q = inputs.dividendYield ?? 0;

  if (spot <= 0 || strike <= 0) return 0;

  // At or after expiry: return intrinsic value
  if (timeToExpiryYears <= 0) {
    return optionType === 'CE' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  }

  // Extreme low volatility: return discounted intrinsic
  if (volatility <= 0.00001) {
    const discountedSpot = spot * Math.exp(-q * timeToExpiryYears);
    const discountedStrike = strike * Math.exp(-riskFreeRate * timeToExpiryYears);
    return optionType === 'CE'
      ? Math.max(0, discountedSpot - discountedStrike)
      : Math.max(0, discountedStrike - discountedSpot);
  }

  const sqrtT = Math.sqrt(timeToExpiryYears);
  const d1 =
    (Math.log(spot / strike) + (riskFreeRate - q + 0.5 * volatility * volatility) * timeToExpiryYears) /
    (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;

  const dfSpot = spot * Math.exp(-q * timeToExpiryYears);
  const dfStrike = strike * Math.exp(-riskFreeRate * timeToExpiryYears);

  if (optionType === 'CE') {
    return Math.max(0, dfSpot * normalCdf(d1) - dfStrike * normalCdf(d2));
  } else {
    return Math.max(0, dfStrike * normalCdf(-d2) - dfSpot * normalCdf(-d1));
  }
}

// ── Greeks Calculation (Analytical First & Second Order Derivatives) ───

export interface GreeksResult {
  delta: number;
  gamma: number;
  theta: number; // Daily theta (/365)
  vega: number;  // Per 1% vol change (/100)
  rho: number;   // Per 1% rate change (/100)
}

export function calculateGreeks(inputs: BlackScholesInputs): GreeksResult {
  const { spot, strike, timeToExpiryYears, riskFreeRate, volatility, optionType } = inputs;
  const q = inputs.dividendYield ?? 0;

  if (spot <= 0 || strike <= 0 || timeToExpiryYears <= 0 || volatility <= 0.00001) {
    const isCall = optionType === 'CE';
    let delta = 0;
    if (isCall) {
      delta = spot > strike ? 1 : spot === strike ? 0.5 : 0;
    } else {
      delta = spot < strike ? -1 : spot === strike ? -0.5 : 0;
    }
    return { delta, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(timeToExpiryYears);
  const d1 =
    (Math.log(spot / strike) + (riskFreeRate - q + 0.5 * volatility * volatility) * timeToExpiryYears) /
    (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;

  const expMinusQT = Math.exp(-q * timeToExpiryYears);
  const expMinusRT = Math.exp(-riskFreeRate * timeToExpiryYears);
  const phiD1 = normalPdf(d1);

  // Delta
  const delta = optionType === 'CE' ? expMinusQT * normalCdf(d1) : expMinusQT * (normalCdf(d1) - 1.0);

  // Gamma (identical for Call and Put)
  const gamma = (expMinusQT * phiD1) / (spot * volatility * sqrtT);

  // Theta (in 1 calendar day convention, i.e. divided by 365)
  const term1 = (-spot * volatility * expMinusQT * phiD1) / (2 * sqrtT);
  let annualTheta = 0;
  if (optionType === 'CE') {
    annualTheta = term1 - riskFreeRate * strike * expMinusRT * normalCdf(d2) + q * spot * expMinusQT * normalCdf(d1);
  } else {
    annualTheta = term1 + riskFreeRate * strike * expMinusRT * normalCdf(-d2) - q * spot * expMinusQT * normalCdf(-d1);
  }
  const theta = annualTheta / 365;

  // Vega (per 1 percentage point change in volatility = divided by 100)
  const vega = (spot * expMinusQT * sqrtT * phiD1) / 100;

  // Rho (per 1 percentage point change in interest rate = divided by 100)
  let rho = 0;
  if (optionType === 'CE') {
    rho = (strike * timeToExpiryYears * expMinusRT * normalCdf(d2)) / 100;
  } else {
    rho = (-strike * timeToExpiryYears * expMinusRT * normalCdf(-d2)) / 100;
  }

  return { delta, gamma, theta, vega, rho };
}

// ── Implied Volatility Solver (Newton-Raphson with Bisection Fallback) ──

export interface IvSolverInputs {
  targetPrice: number;
  spot: number;
  strike: number;
  timeToExpiryYears: number;
  riskFreeRate: number;
  optionType: OptionType;
  dividendYield?: number;
  maxIterations?: number;
  tolerance?: number;
}

export function impliedVolatility(inputs: IvSolverInputs): number | null {
  const { targetPrice, spot, strike, timeToExpiryYears, riskFreeRate, optionType } = inputs;
  const q = inputs.dividendYield ?? 0;
  const maxIterations = inputs.maxIterations ?? 100;
  const tolerance = inputs.tolerance ?? 1e-4;

  if (targetPrice <= 0 || spot <= 0 || strike <= 0 || timeToExpiryYears <= 0) {
    return null;
  }

  // Theoretical lower bound check: must exceed discounted intrinsic value
  const dfSpot = spot * Math.exp(-q * timeToExpiryYears);
  const dfStrike = strike * Math.exp(-riskFreeRate * timeToExpiryYears);
  const intrinsic = optionType === 'CE' ? Math.max(0, dfSpot - dfStrike) : Math.max(0, dfStrike - dfSpot);

  if (targetPrice < intrinsic - 0.05) {
    return null; // Violates no-arbitrage boundary
  }

  // Upper bound check: Call cannot exceed spot; Put cannot exceed discounted strike
  if (optionType === 'CE' && targetPrice >= spot) return null;
  if (optionType === 'PE' && targetPrice >= dfStrike) return null;

  // Initial estimate using Brenner-Subrahmanyam approximation
  let sigma = Math.sqrt((2 * Math.PI) / timeToExpiryYears) * (targetPrice / spot);
  if (isNaN(sigma) || sigma < 0.05) sigma = 0.25;
  if (sigma > 2.5) sigma = 1.0;

  // Phase 1: Newton-Raphson
  for (let i = 0; i < 30; i++) {
    const price = blackScholesPrice({
      spot,
      strike,
      timeToExpiryYears,
      riskFreeRate,
      volatility: sigma,
      dividendYield: q,
      optionType,
    });
    const diff = price - targetPrice;
    if (Math.abs(diff) < tolerance) {
      return sigma;
    }

    const greeks = calculateGreeks({
      spot,
      strike,
      timeToExpiryYears,
      riskFreeRate,
      volatility: sigma,
      dividendYield: q,
      optionType,
    });
    // Greeks.vega is per 1% vol, so multiply by 100 to get true derivative dPrice/dSigma
    const vegaSlope = greeks.vega * 100;

    if (vegaSlope < 1e-7 || isNaN(vegaSlope)) {
      break; // Vega too flat, jump to robust bisection
    }

    const step = diff / vegaSlope;
    sigma = sigma - step;

    if (sigma <= 0.001 || sigma > 8.0) {
      break; // Out of bounds, switch to bisection
    }
  }

  // Phase 2: Robust Bisection Fallback
  let low = 0.001;
  let high = 5.0;

  // Expand high bracket if necessary for deep out-of-the-money options
  const highPrice = blackScholesPrice({
    spot,
    strike,
    timeToExpiryYears,
    riskFreeRate,
    volatility: high,
    dividendYield: q,
    optionType,
  });
  if (highPrice < targetPrice) {
    high = 10.0;
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const mid = 0.5 * (low + high);
    const midPrice = blackScholesPrice({
      spot,
      strike,
      timeToExpiryYears,
      riskFreeRate,
      volatility: mid,
      dividendYield: q,
      optionType,
    });
    const diff = midPrice - targetPrice;

    if (Math.abs(diff) < tolerance || (high - low) < 1e-5) {
      return mid;
    }

    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return null; // Non-convergent
}

// ── Max Pain & PCR Engine ─────────────────────────────────────────────

export interface StrikeOiData {
  strike: number;
  callOi: number;
  putOi: number;
}

export function calculateMaxPain(strikesData: StrikeOiData[]): number {
  if (!strikesData || strikesData.length === 0) return 0;

  const strikes = strikesData.map((s) => s.strike).sort((a, b) => a - b);
  let minTotalLoss = Infinity;
  let maxPainStrike = strikes[0];

  for (const candidateSpot of strikes) {
    let totalLoss = 0;

    for (const data of strikesData) {
      // Loss to Call writers if underlying finishes above strike
      if (candidateSpot > data.strike) {
        totalLoss += (candidateSpot - data.strike) * data.callOi;
      }
      // Loss to Put writers if underlying finishes below strike
      if (candidateSpot < data.strike) {
        totalLoss += (data.strike - candidateSpot) * data.putOi;
      }
    }

    if (totalLoss < minTotalLoss) {
      minTotalLoss = totalLoss;
      maxPainStrike = candidateSpot;
    }
  }

  return maxPainStrike;
}

export function calculatePcr(
  contracts: Array<{ callOi: number; putOi: number; callVolume: number; putVolume: number }>,
): { oiPcr: number; volumePcr: number } {
  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;

  for (const c of contracts) {
    totalCallOi += c.callOi || 0;
    totalPutOi += c.putOi || 0;
    totalCallVol += c.callVolume || 0;
    totalPutVol += c.putVolume || 0;
  }

  const oiPcr = totalCallOi > 0 ? parseFloat((totalPutOi / totalCallOi).toFixed(4)) : 0;
  const volumePcr = totalCallVol > 0 ? parseFloat((totalPutVol / totalCallVol).toFixed(4)) : 0;

  return { oiPcr, volumePcr };
}

// ── OI Buildup Classifier ─────────────────────────────────────────────

export function classifyOiBuildup(
  priceChange: number,
  oiChange: number,
): 'Long Buildup' | 'Short Buildup' | 'Short Covering' | 'Long Unwinding' {
  if (priceChange >= 0 && oiChange >= 0) return 'Long Buildup';
  if (priceChange < 0 && oiChange >= 0) return 'Short Buildup';
  if (priceChange >= 0 && oiChange < 0) return 'Short Covering';
  return 'Long Unwinding';
}

// ── Multi-Leg Payoff Engine & Breakeven Solver ─────────────────────────

export interface PayoffCalculationOptions {
  legs: StrategyLegDto[];
  currentSpot: number;
  riskFreeRate?: number;
  targetDaysForward?: number; // 0 for T+0, or target days ahead
  spotRangePct?: number;      // e.g. 0.15 for +/- 15% spot scan
  numPoints?: number;         // resolution of curve
}

export interface PayoffAnalysisResult {
  payoffPoints: PayoffPointDto[];
  greeks: GreeksSummaryDto;
}

export function calculateStrategyPayoff(options: PayoffCalculationOptions): PayoffAnalysisResult {
  const { legs, currentSpot } = options;
  const r = options.riskFreeRate ?? 0.065;
  const targetDays = options.targetDaysForward ?? 0;
  const spotRangePct = options.spotRangePct ?? 0.15;
  const numPoints = options.numPoints ?? 101;

  if (!legs || legs.length === 0 || currentSpot <= 0) {
    return {
      payoffPoints: [],
      greeks: {
        netDelta: 0,
        netGamma: 0,
        netTheta: 0,
        netVega: 0,
        netRho: 0,
        maxProfit: 0,
        maxLoss: 0,
        breakevens: [],
        riskRewardRatio: 'N/A',
        probabilityOfProfit: 50,
      },
    };
  }

  // Determine underlying spot scan domain
  const minSpot = currentSpot * (1 - spotRangePct);
  const maxSpot = currentSpot * (1 + spotRangePct);
  const step = (maxSpot - minSpot) / (numPoints - 1);

  const payoffPoints: PayoffPointDto[] = [];
  let minPayoff = Infinity;
  let maxPayoff = -Infinity;

  for (let i = 0; i < numPoints; i++) {
    const spot = minSpot + i * step;
    let expiryPayoff = 0;
    let targetPayoff = 0;

    for (const leg of legs) {
      const multiplier = leg.side === 'BUY' ? 1 : -1;
      const totalQty = (leg.lots || 1) * (leg.lotSize || 1);
      const entryPrice = leg.entryPrice || 0;

      // 1. At Expiry Payoff
      let intrinsic = 0;
      if (leg.optionType === 'CE') {
        intrinsic = Math.max(0, spot - leg.strike);
      } else if (leg.optionType === 'PE') {
        intrinsic = Math.max(0, leg.strike - spot);
      } else {
        // Future
        intrinsic = spot - leg.strike;
      }
      expiryPayoff += multiplier * totalQty * (intrinsic - entryPrice);

      // 2. Target Date / T+0 Payoff (Re-priced via Black-Scholes using leg's IV)
      const daysToExpiry = Math.max(0.001, 7 - targetDays); // baseline approximation if not explicit
      const tteYears = daysToExpiry / 365;
      const legIv = leg.iv ?? 0.15;

      let revaluedPrice = 0;
      if (leg.optionType === 'CE' || leg.optionType === 'PE') {
        revaluedPrice = blackScholesPrice({
          spot,
          strike: leg.strike,
          timeToExpiryYears: tteYears,
          riskFreeRate: r,
          volatility: legIv,
          optionType: leg.optionType,
        });
      } else {
        revaluedPrice = spot - leg.strike;
      }
      targetPayoff += multiplier * totalQty * (revaluedPrice - entryPrice);
    }

    payoffPoints.push({
      spotPrice: Math.round(spot * 100) / 100,
      expiryPayoff: Math.round(expiryPayoff * 100) / 100,
      targetDatePayoff: Math.round(targetPayoff * 100) / 100,
    });

    if (expiryPayoff < minPayoff) minPayoff = expiryPayoff;
    if (expiryPayoff > maxPayoff) maxPayoff = expiryPayoff;
  }

  // Find Breakevens (zero crossings of the expiry payoff curve)
  const rawBreakevens: number[] = [];
  for (let i = 0; i < payoffPoints.length - 1; i++) {
    const p1 = payoffPoints[i];
    const p2 = payoffPoints[i + 1];

    if (p1.expiryPayoff === 0) {
      rawBreakevens.push(p1.spotPrice);
    } else if ((p1.expiryPayoff < 0 && p2.expiryPayoff > 0) || (p1.expiryPayoff > 0 && p2.expiryPayoff < 0)) {
      const denom = p2.expiryPayoff - p1.expiryPayoff;
      if (Math.abs(denom) > 1e-6) {
        const zeroSpot = p1.spotPrice + (0 - p1.expiryPayoff) * ((p2.spotPrice - p1.spotPrice) / denom);
        rawBreakevens.push(Math.round(zeroSpot * 10) / 10);
      }
    }
  }

  // Deduplicate points within 5 units and sort ascending
  const breakevens: number[] = [];
  for (const be of rawBreakevens) {
    if (!breakevens.some((existing) => Math.abs(existing - be) < 5)) {
      breakevens.push(be);
    }
  }
  breakevens.sort((a, b) => a - b);

  // Check slope at ends to determine if profit/loss is 'Unlimited'
  const leftSlope = payoffPoints[1].expiryPayoff - payoffPoints[0].expiryPayoff;
  const rightSlope =
    payoffPoints[payoffPoints.length - 1].expiryPayoff - payoffPoints[payoffPoints.length - 2].expiryPayoff;

  const isMaxProfitUnlimited = rightSlope > 0.01 || leftSlope < -0.01;
  const isMaxLossUnlimited = rightSlope < -0.01 || leftSlope > 0.01;

  const finalMaxProfit = isMaxProfitUnlimited ? 'Unlimited' : Math.round(maxPayoff);
  const finalMaxLoss = isMaxLossUnlimited ? 'Unlimited' : Math.round(minPayoff);

  // Compute Net Aggregated Greeks
  let netDelta = 0;
  let netGamma = 0;
  let netTheta = 0;
  let netVega = 0;
  let netRho = 0;

  for (const leg of legs) {
    const mult = leg.side === 'BUY' ? 1 : -1;
    const totalQty = (leg.lots || 1) * (leg.lotSize || 1);
    const legIv = leg.iv ?? 0.15;

    if (leg.optionType === 'CE' || leg.optionType === 'PE') {
      const greeks = calculateGreeks({
        spot: currentSpot,
        strike: leg.strike,
        timeToExpiryYears: Math.max(0.001, 7 / 365),
        riskFreeRate: r,
        volatility: legIv,
        optionType: leg.optionType,
      });

      netDelta += mult * totalQty * greeks.delta;
      netGamma += mult * totalQty * greeks.gamma;
      netTheta += mult * totalQty * greeks.theta;
      netVega += mult * totalQty * greeks.vega;
      netRho += mult * totalQty * greeks.rho;
    } else {
      netDelta += mult * totalQty;
    }
  }

  // Probability of Profit (POP) via lognormal distribution
  let pop = 50;
  if (breakevens.length > 0 && legs[0]?.iv) {
    const sigma = legs[0].iv;
    const t = Math.max(0.001, 7 / 365);
    const mu = Math.log(currentSpot) + (r - 0.5 * sigma * sigma) * t;
    const stdDev = sigma * Math.sqrt(t);

    if (breakevens.length === 1) {
      const be = breakevens[0];
      const z = (Math.log(be) - mu) / stdDev;
      // If profitable above breakeven: 1 - N(z), else N(z)
      const profitableAbove = payoffPoints[payoffPoints.length - 1].expiryPayoff > 0;
      pop = profitableAbove ? (1 - normalCdf(z)) * 100 : normalCdf(z) * 100;
    } else if (breakevens.length >= 2) {
      const be1 = Math.min(...breakevens);
      const be2 = Math.max(...breakevens);
      const z1 = (Math.log(be1) - mu) / stdDev;
      const z2 = (Math.log(be2) - mu) / stdDev;
      const insideProb = (normalCdf(z2) - normalCdf(z1)) * 100;
      // Check if center spot is profitable
      const centerIndex = Math.floor(payoffPoints.length / 2);
      const isCenterProfitable = payoffPoints[centerIndex].expiryPayoff > 0;
      pop = isCenterProfitable ? insideProb : 100 - insideProb;
    }
  }

  pop = Math.min(99.9, Math.max(0.1, Math.round(pop * 10) / 10));

  // Risk / Reward Ratio
  let riskRewardRatio: number | 'N/A' = 'N/A';
  if (typeof finalMaxProfit === 'number' && typeof finalMaxLoss === 'number' && Math.abs(finalMaxLoss) > 0) {
    riskRewardRatio = parseFloat((finalMaxProfit / Math.abs(finalMaxLoss)).toFixed(2));
  }

  return {
    payoffPoints,
    greeks: {
      netDelta: Math.round(netDelta * 100) / 100,
      netGamma: Math.round(netGamma * 10000) / 10000,
      netTheta: Math.round(netTheta * 10) / 10,
      netVega: Math.round(netVega * 10) / 10,
      netRho: Math.round(netRho * 10) / 10,
      maxProfit: finalMaxProfit,
      maxLoss: finalMaxLoss,
      breakevens,
      riskRewardRatio,
      probabilityOfProfit: pop,
    },
  };
}

// ── Strategy Templates ────────────────────────────────────────────────

export interface StrategyTemplate {
  name: string;
  category: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatility';
  description: string;
  createLegs: (spot: number, step: number, expiry: string, lotSize: number) => StrategyLegDto[];
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: 'Long Straddle',
    category: 'Volatility',
    description: 'Buy ATM Call + Buy ATM Put. Profits from high volatility breakout in either direction.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'CE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'CE', side: 'BUY', lots: 1, lotSize, entryPrice: 120 },
        { id: '2', instrumentToken: 'PE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'PE', side: 'BUY', lots: 1, lotSize, entryPrice: 110 },
      ];
    },
  },
  {
    name: 'Short Straddle',
    category: 'Neutral',
    description: 'Sell ATM Call + Sell ATM Put. Pure theta decay strategy when range-bound expiry is expected.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'CE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'CE', side: 'SELL', lots: 1, lotSize, entryPrice: 120 },
        { id: '2', instrumentToken: 'PE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'PE', side: 'SELL', lots: 1, lotSize, entryPrice: 110 },
      ];
    },
  },
  {
    name: 'Iron Condor',
    category: 'Neutral',
    description: 'Sell OTM Put Spread + Sell OTM Call Spread. Defined-risk neutral range-bound strategy.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'PE-LONG', symbol: 'NIFTY', expiry, strike: atm - 2 * step, optionType: 'PE', side: 'BUY', lots: 1, lotSize, entryPrice: 15 },
        { id: '2', instrumentToken: 'PE-SHORT', symbol: 'NIFTY', expiry, strike: atm - step, optionType: 'PE', side: 'SELL', lots: 1, lotSize, entryPrice: 45 },
        { id: '3', instrumentToken: 'CE-SHORT', symbol: 'NIFTY', expiry, strike: atm + step, optionType: 'CE', side: 'SELL', lots: 1, lotSize, entryPrice: 50 },
        { id: '4', instrumentToken: 'CE-LONG', symbol: 'NIFTY', expiry, strike: atm + 2 * step, optionType: 'CE', side: 'BUY', lots: 1, lotSize, entryPrice: 18 },
      ];
    },
  },
  {
    name: 'Bull Call Spread',
    category: 'Bullish',
    description: 'Buy ATM Call + Sell OTM Call. Moderately bullish with lowered net debit cost and defined risk.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'CE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'CE', side: 'BUY', lots: 1, lotSize, entryPrice: 130 },
        { id: '2', instrumentToken: 'CE-OTM', symbol: 'NIFTY', expiry, strike: atm + step, optionType: 'CE', side: 'SELL', lots: 1, lotSize, entryPrice: 65 },
      ];
    },
  },
  {
    name: 'Bear Put Spread',
    category: 'Bearish',
    description: 'Buy ATM Put + Sell OTM Put. Defined-risk bearish trade profiting from downward movement.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'PE-ATM', symbol: 'NIFTY', expiry, strike: atm, optionType: 'PE', side: 'BUY', lots: 1, lotSize, entryPrice: 125 },
        { id: '2', instrumentToken: 'PE-OTM', symbol: 'NIFTY', expiry, strike: atm - step, optionType: 'PE', side: 'SELL', lots: 1, lotSize, entryPrice: 60 },
      ];
    },
  },
  {
    name: 'Iron Butterfly',
    category: 'Neutral',
    description: 'Sell ATM Straddle + Buy OTM Wings. High reward-to-risk ratio on low volatility expiries.',
    createLegs: (spot, step, expiry, lotSize) => {
      const atm = Math.round(spot / step) * step;
      return [
        { id: '1', instrumentToken: 'PE-WING', symbol: 'NIFTY', expiry, strike: atm - step, optionType: 'PE', side: 'BUY', lots: 1, lotSize, entryPrice: 40 },
        { id: '2', instrumentToken: 'PE-BODY', symbol: 'NIFTY', expiry, strike: atm, optionType: 'PE', side: 'SELL', lots: 1, lotSize, entryPrice: 110 },
        { id: '3', instrumentToken: 'CE-BODY', symbol: 'NIFTY', expiry, strike: atm, optionType: 'CE', side: 'SELL', lots: 1, lotSize, entryPrice: 120 },
        { id: '4', instrumentToken: 'CE-WING', symbol: 'NIFTY', expiry, strike: atm + step, optionType: 'CE', side: 'BUY', lots: 1, lotSize, entryPrice: 45 },
      ];
    },
  },
];
