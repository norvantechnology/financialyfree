/**
 * Yahoo Finance chart helpers.
 *
 * IMPORTANT: Do NOT use `meta.chartPreviousClose` for session day-change.
 * On multi-day ranges that field is the close at the *start of the chart range*
 * (e.g. ~1y ago on range=1y), which produces wildly wrong Day % values.
 */

export type YahooSessionChange = {
  current: number;
  previousClose: number;
  change: number;
  changePct: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Extract positive closes from a Yahoo chart result quote series. */
export function extractYahooCloses(result: any): number[] {
  return (result?.indicators?.quote?.[0]?.close || []).filter(
    (c: any) => typeof c === 'number' && !isNaN(c) && c > 0,
  );
}

/** Extract positive volumes from a Yahoo chart result quote series. */
export function extractYahooVolumes(result: any): number[] {
  return (result?.indicators?.quote?.[0]?.volume || []).filter(
    (v: any) => typeof v === 'number' && !isNaN(v) && v > 0,
  );
}

/**
 * Parse live session price change from Yahoo chart meta + daily closes.
 * Prefers regularMarketChangePercent / fulldayChangePercent, then prior daily close.
 */
export function parseYahooSessionChange(
  meta: any,
  closes: number[] = [],
): YahooSessionChange | null {
  if (!meta || meta.regularMarketPrice === undefined || meta.regularMarketPrice === null) {
    return null;
  }

  const current = round2(Number(meta.regularMarketPrice));
  if (!Number.isFinite(current) || current <= 0) return null;

  const liveChg = meta.regularMarketChangePercent ?? meta.fulldayChangePercent;
  let changePct: number;
  let previousClose: number;

  if (liveChg != null && Number.isFinite(Number(liveChg))) {
    changePct = round2(Number(liveChg));
    previousClose =
      changePct !== -100 ? round2(current / (1 + changePct / 100)) : current;
  } else {
    previousClose = round2(
      Number(
        meta.regularMarketPreviousClose ||
          (closes.length >= 2 ? closes[closes.length - 2] : 0) ||
          current,
      ),
    );
    changePct =
      previousClose > 0 ? round2(((current - previousClose) / previousClose) * 100) : 0;
  }

  return {
    current,
    previousClose,
    change: round2(current - previousClose),
    changePct,
  };
}

/**
 * Ensure the candle series ends with live CMP and a correct prior close so
 * 1D returns computed from closes match Yahoo session %.
 */
export function alignClosesWithSession(
  closes: number[],
  session: YahooSessionChange,
): number[] {
  if (!closes.length) {
    return [session.previousClose, session.current];
  }
  const next = [...closes];
  next[next.length - 1] = session.current;
  if (next.length >= 2) {
    next[next.length - 2] = session.previousClose;
  } else {
    next.unshift(session.previousClose);
  }
  return next;
}
