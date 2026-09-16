import {
  alignClosesWithSession,
  parseYahooSessionChange,
} from './yahoo-quote.util';

describe('yahoo-quote.util session change', () => {
  it('prefers regularMarketChangePercent over chartPreviousClose', () => {
    const meta = {
      regularMarketPrice: 1643,
      regularMarketChangePercent: -1.024,
      chartPreviousClose: 1091.6, // range-start trap (~1y)
    };
    const session = parseYahooSessionChange(meta, [1679.8, 1660, 1643]);
    expect(session).not.toBeNull();
    expect(session!.changePct).toBe(-1.02);
    // Old broken formula would be ~+50%
    const broken =
      Math.round(((1643 - 1091.6) / 1091.6) * 10000) / 100;
    expect(Math.abs(broken)).toBeGreaterThan(40);
    expect(Math.abs(session!.changePct)).toBeLessThan(5);
  });

  it('falls back to prior daily close when live % missing', () => {
    const meta = { regularMarketPrice: 100 };
    const session = parseYahooSessionChange(meta, [90, 95, 100]);
    expect(session!.changePct).toBeCloseTo(5.26, 1);
    expect(session!.previousClose).toBe(95);
  });

  it('aligns candle series so 1D return matches session %', () => {
    const session = parseYahooSessionChange(
      { regularMarketPrice: 23217.6, regularMarketChangePercent: 0.428 },
      [23398.1, 23118.6, 23200],
    )!;
    const aligned = alignClosesWithSession([23398.1, 23118.6, 23200], session);
    const ret =
      ((aligned[aligned.length - 1] - aligned[aligned.length - 2]) /
        aligned[aligned.length - 2]) *
      100;
    expect(ret).toBeCloseTo(session.changePct, 1);
  });
});
