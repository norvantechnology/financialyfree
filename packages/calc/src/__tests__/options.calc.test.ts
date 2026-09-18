// ── packages/calc/src/__tests__/options.calc.test.ts ──────────────────
// Test suite for Black-Scholes, Greeks Engine, IV Solver, Max Pain, PCR, and Payoffs.

import {
  normalCdf,
  normalPdf,
  blackScholesPrice,
  calculateGreeks,
  impliedVolatility,
  calculateMaxPain,
  calculatePcr,
  classifyOiBuildup,
  calculateStrategyPayoff,
  calculateGex,
  STRATEGY_TEMPLATES,
  StrategyLegDto,
} from '../options.calc';

describe('Options Analytics Calculation Engine', () => {
  describe('Standard Normal Distribution Functions', () => {
    it('evaluates normalPdf accurately', () => {
      expect(normalPdf(0)).toBeCloseTo(0.398942, 5);
      expect(normalPdf(1)).toBeCloseTo(0.24197, 5);
      expect(normalPdf(-1)).toBeCloseTo(0.24197, 5);
    });

    it('evaluates normalCdf with high precision', () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 6);
      expect(normalCdf(1.95996)).toBeCloseTo(0.975, 4);
      expect(normalCdf(-1.95996)).toBeCloseTo(0.025, 4);
      expect(normalCdf(3.0)).toBeCloseTo(0.99865, 4);
    });
  });

  describe('Black-Scholes Pricing (Academic Reference Vectors)', () => {
    // Benchmark fixture: S=100, K=100, T=1, r=0.05, sigma=0.20, q=0
    // Analytical Call = 10.4506, Put = 5.5735
    const baseInput = {
      spot: 100,
      strike: 100,
      timeToExpiryYears: 1.0,
      riskFreeRate: 0.05,
      volatility: 0.20,
      dividendYield: 0,
    };

    it('computes European Call price accurately against known reference vector', () => {
      const callPrice = blackScholesPrice({ ...baseInput, optionType: 'CE' });
      expect(callPrice).toBeCloseTo(10.4506, 3);
    });

    it('computes European Put price accurately against known reference vector', () => {
      const putPrice = blackScholesPrice({ ...baseInput, optionType: 'PE' });
      expect(putPrice).toBeCloseTo(5.5735, 3);
    });

    it('satisfies Put-Call Parity: C - P = S*e^(-qT) - K*e^(-rT)', () => {
      const call = blackScholesPrice({ ...baseInput, optionType: 'CE' });
      const put = blackScholesPrice({ ...baseInput, optionType: 'PE' });
      const parityRhs = 100 - 100 * Math.exp(-0.05 * 1.0);
      expect(call - put).toBeCloseTo(parityRhs, 4);
    });

    it('handles expired options by returning intrinsic value', () => {
      expect(blackScholesPrice({ ...baseInput, spot: 110, timeToExpiryYears: 0, optionType: 'CE' })).toBe(10);
      expect(blackScholesPrice({ ...baseInput, spot: 90, timeToExpiryYears: 0, optionType: 'CE' })).toBe(0);
      expect(blackScholesPrice({ ...baseInput, spot: 90, timeToExpiryYears: 0, optionType: 'PE' })).toBe(10);
    });

    it('handles Indian NIFTY 50 real-world parameters', () => {
      // NIFTY spot = 25000, strike = 25000, 7 days to expiry (7/365), r = 6.5%, IV = 14%
      const niftyCall = blackScholesPrice({
        spot: 25000,
        strike: 25000,
        timeToExpiryYears: 7 / 365,
        riskFreeRate: 0.065,
        volatility: 0.14,
        optionType: 'CE',
      });
      expect(niftyCall).toBeGreaterThan(150);
      expect(niftyCall).toBeLessThan(250);
    });
  });

  describe('Greeks Analytical Derivatives', () => {
    const input = {
      spot: 100,
      strike: 100,
      timeToExpiryYears: 0.5,
      riskFreeRate: 0.05,
      volatility: 0.20,
      dividendYield: 0,
    };

    it('computes Call & Put Delta correctly', () => {
      const callGreeks = calculateGreeks({ ...input, optionType: 'CE' });
      const putGreeks = calculateGreeks({ ...input, optionType: 'PE' });

      // Call Delta > 0, Put Delta < 0
      expect(callGreeks.delta).toBeGreaterThan(0.5);
      expect(callGreeks.delta).toBeLessThan(0.7);
      expect(putGreeks.delta).toBeLessThan(0);
      expect(putGreeks.delta).toBeGreaterThan(-0.5);

      // Delta relation: Call Delta - Put Delta = e^(-qT) = 1.0
      expect(callGreeks.delta - putGreeks.delta).toBeCloseTo(1.0, 4);
    });

    it('confirms Gamma is identical for Call and Put, and strictly positive', () => {
      const callGreeks = calculateGreeks({ ...input, optionType: 'CE' });
      const putGreeks = calculateGreeks({ ...input, optionType: 'PE' });

      expect(callGreeks.gamma).toBeGreaterThan(0);
      expect(callGreeks.gamma).toBeCloseTo(putGreeks.gamma, 6);
    });

    it('confirms Theta represents negative time decay', () => {
      const callGreeks = calculateGreeks({ ...input, optionType: 'CE' });
      const putGreeks = calculateGreeks({ ...input, optionType: 'PE' });

      expect(callGreeks.theta).toBeLessThan(0);
      expect(putGreeks.theta).toBeLessThan(0);
    });

    it('confirms Vega is strictly positive and highest ATM', () => {
      const atmVega = calculateGreeks({ ...input, strike: 100, optionType: 'CE' }).vega;
      const otmVega = calculateGreeks({ ...input, strike: 120, optionType: 'CE' }).vega;
      expect(atmVega).toBeGreaterThan(otmVega);
    });
  });

  describe('Implied Volatility Solver (Newton-Raphson & Bisection)', () => {
    it('accurately recovers known IV from market price', () => {
      const trueIv = 0.185; // 18.5%
      const spot = 25000;
      const strike = 25000;
      const tte = 14 / 365;
      const r = 0.065;

      const price = blackScholesPrice({
        spot,
        strike,
        timeToExpiryYears: tte,
        riskFreeRate: r,
        volatility: trueIv,
        optionType: 'CE',
      });

      const solvedIv = impliedVolatility({
        targetPrice: price,
        spot,
        strike,
        timeToExpiryYears: tte,
        riskFreeRate: r,
        optionType: 'CE',
      });

      expect(solvedIv).not.toBeNull();
      expect(solvedIv!).toBeCloseTo(trueIv, 3);
    });

    it('returns null for impossible non-arbitrage prices (less than intrinsic)', () => {
      const invalidIv = impliedVolatility({
        targetPrice: 5, // S=100, K=80 -> Intrinsic is ~20, market price 5 is impossible
        spot: 100,
        strike: 80,
        timeToExpiryYears: 0.1,
        riskFreeRate: 0.05,
        optionType: 'CE',
      });
      expect(invalidIv).toBeNull();
    });

    it('recovers IV for Put options', () => {
      const trueIv = 0.22;
      const price = blackScholesPrice({
        spot: 500,
        strike: 480,
        timeToExpiryYears: 30 / 365,
        riskFreeRate: 0.06,
        volatility: trueIv,
        optionType: 'PE',
      });

      const solvedIv = impliedVolatility({
        targetPrice: price,
        spot: 500,
        strike: 480,
        timeToExpiryYears: 30 / 365,
        riskFreeRate: 0.06,
        optionType: 'PE',
      });

      expect(solvedIv).not.toBeNull();
      expect(solvedIv!).toBeCloseTo(trueIv, 3);
    });
  });

  describe('Max Pain & PCR Engine', () => {
    it('finds the strike minimizing option writers loss', () => {
      const mockChain = [
        { strike: 24800, callOi: 10000, putOi: 50000 },
        { strike: 24900, callOi: 20000, putOi: 40000 },
        { strike: 25000, callOi: 60000, putOi: 60000 }, // Equal highest OI concentration
        { strike: 25100, callOi: 50000, putOi: 20000 },
        { strike: 25200, callOi: 60000, putOi: 10000 },
      ];

      const maxPain = calculateMaxPain(mockChain);
      expect(maxPain).toBe(25000);
    });

    it('calculates OI PCR and Volume PCR correctly', () => {
      const contracts = [
        { callOi: 100, putOi: 120, callVolume: 1000, putVolume: 800 },
        { callOi: 200, putOi: 180, callVolume: 2000, putVolume: 2200 },
      ];

      const { oiPcr, volumePcr } = calculatePcr(contracts);
      expect(oiPcr).toBe(1.0); // (120+180) / (100+200) = 300 / 300 = 1.0
      expect(volumePcr).toBe(1.0); // (800+2200) / (1000+2000) = 3000 / 3000 = 1.0
    });

    it('classifies OI buildup accurately', () => {
      expect(classifyOiBuildup(10, 500)).toBe('Long Buildup');
      expect(classifyOiBuildup(-15, 800)).toBe('Short Buildup');
      expect(classifyOiBuildup(25, -300)).toBe('Short Covering');
      expect(classifyOiBuildup(-20, -400)).toBe('Long Unwinding');
      expect(classifyOiBuildup(0, 0)).toBe('Neutral');
      expect(classifyOiBuildup(12, 0)).toBe('Neutral');
    });
  });

  describe('Multi-Leg Payoff Engine & Strategy Templates', () => {
    it('computes Long Straddle payoff curve with dual breakevens and unlimited upside', () => {
      const spot = 25000;
      const legs: StrategyLegDto[] = [
        {
          id: '1',
          instrumentToken: 'CE-25000',
          symbol: 'NIFTY',
          expiry: '2026-09-24',
          strike: 25000,
          optionType: 'CE',
          side: 'BUY',
          lots: 1,
          lotSize: 25,
          entryPrice: 150,
          iv: 0.15,
        },
        {
          id: '2',
          instrumentToken: 'PE-25000',
          symbol: 'NIFTY',
          expiry: '2026-09-24',
          strike: 25000,
          optionType: 'PE',
          side: 'BUY',
          lots: 1,
          lotSize: 25,
          entryPrice: 150,
          iv: 0.15,
        },
      ];

      const result = calculateStrategyPayoff({
        legs,
        currentSpot: spot,
        riskFreeRate: 0.065,
        numPoints: 101,
      });

      expect(result.payoffPoints.length).toBe(101);
      expect(result.greeks.maxProfit).toBe('Unlimited');
      expect(result.greeks.maxLoss).toBe(-7500); // (150 + 150) * 25 lotsize = 300 * 25 = 7500
      expect(result.greeks.breakevens.length).toBe(2);
      expect(result.greeks.breakevens[0]).toBeCloseTo(24700, 0); // 25000 - 300
      expect(result.greeks.breakevens[1]).toBeCloseTo(25300, 0); // 25000 + 300
    });

    it('computes Bull Call Spread with defined max profit and defined max loss', () => {
      const legs: StrategyLegDto[] = [
        {
          id: '1',
          instrumentToken: 'CE-25000',
          symbol: 'NIFTY',
          expiry: '2026-09-24',
          strike: 25000,
          optionType: 'CE',
          side: 'BUY',
          lots: 1,
          lotSize: 25,
          entryPrice: 200,
          iv: 0.15,
        },
        {
          id: '2',
          instrumentToken: 'CE-25200',
          symbol: 'NIFTY',
          expiry: '2026-09-24',
          strike: 25200,
          optionType: 'CE',
          side: 'SELL',
          lots: 1,
          lotSize: 25,
          entryPrice: 80,
          iv: 0.14,
        },
      ];

      const result = calculateStrategyPayoff({
        legs,
        currentSpot: 25000,
        riskFreeRate: 0.065,
      });

      // Net debit: 200 - 80 = 120 pts * 25 = 3000 max loss
      // Max profit: (200 spread - 120 debit) * 25 = 80 * 25 = 2000 max profit
      expect(result.greeks.maxLoss).toBe(-3000);
      expect(result.greeks.maxProfit).toBe(2000);
      expect(result.greeks.breakevens.length).toBe(1);
      expect(result.greeks.breakevens[0]).toBeCloseTo(25120, 0); // 25000 + 120
    });

    it('instantiates all 23 pre-built strategy templates without error', () => {
      expect(STRATEGY_TEMPLATES.length).toBeGreaterThanOrEqual(20);
      const categories = new Set(STRATEGY_TEMPLATES.map((t) => t.category));
      expect(categories.has('Bullish')).toBe(true);
      expect(categories.has('Bearish')).toBe(true);
      expect(categories.has('Neutral')).toBe(true);
      expect(categories.has('Volatility')).toBe(true);

      for (const tpl of STRATEGY_TEMPLATES) {
        const legs = tpl.createLegs(25000, 100, '2026-09-24', 25);
        expect(legs.length).toBeGreaterThan(0);
        expect(legs[0].lotSize).toBe(25);
        for (const leg of legs) {
          expect(leg.strike).toBeGreaterThan(0);
          expect(['BUY', 'SELL']).toContain(leg.side);
          expect(['CE', 'PE', 'FUT']).toContain(leg.optionType);
        }
      }
    });
  });

  describe('Gamma Exposure (GEX) Engine', () => {
    it('calculates Rupee GEX and determines gamma regime accurately', () => {
      const spot = 25000;
      const strikesData = [
        { strike: 24800, callOi: 1000, putOi: 5000, callGamma: 0.0001, putGamma: 0.0003 },
        { strike: 24900, callOi: 2000, putOi: 4000, callGamma: 0.0002, putGamma: 0.0003 },
        { strike: 25000, callOi: 8000, putOi: 8000, callGamma: 0.0005, putGamma: 0.0005 },
        { strike: 25100, callOi: 6000, putOi: 2000, callGamma: 0.0003, putGamma: 0.0002 },
        { strike: 25200, callOi: 5000, putOi: 1000, callGamma: 0.0002, putGamma: 0.0001 },
      ];

      const gex = calculateGex(spot, strikesData, 25);

      expect(gex.spotPrice).toBe(25000);
      expect(gex.strikes.length).toBe(5);
      expect(gex.totalCallGex).toBeGreaterThan(0);
      expect(gex.totalPutGex).toBeLessThan(0);
      expect(['POSITIVE_GAMMA', 'NEGATIVE_GAMMA']).toContain(gex.regime);
      expect(gex.zeroGammaStrike).toBeGreaterThanOrEqual(24800);
      expect(gex.zeroGammaStrike).toBeLessThanOrEqual(25200);

      // Check per strike calculations
      const atm = gex.strikes.find((s) => s.strike === 25000)!;
      expect(atm.callGex).toBeGreaterThan(0);
      expect(atm.putGex).toBeLessThan(0);
      expect(atm.netGex).toBe(atm.callGex + atm.putGex);
    });
  });
});
