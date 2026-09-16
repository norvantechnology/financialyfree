'use client';

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/auth-client';

type IndexRow = {
  symbol: string;
  name?: string;
  current: number;
  changePct?: number;
};

const PREFERRED: Array<{ label: string; match: (s: string) => boolean }> = [
  {
    label: 'NIFTY 50',
    match: (s) => /\bNIFTY\s*50\b/.test(s) || s === 'NIFTY' || s === '^NSEI',
  },
  {
    label: 'SENSEX',
    match: (s) => /\bSENSEX\b/.test(s) || s.includes('BSESN') || s.includes('BSE SENSEX'),
  },
  {
    label: 'NIFTY BANK',
    match: (s) => /\bBANK\b/.test(s) && /\bNIFTY\b/.test(s),
  },
  {
    label: 'INDIA VIX',
    match: (s) => /\bVIX\b/.test(s),
  },
];

function pickDistinct(list: IndexRow[]): IndexRow[] {
  const used = new Set<number>();
  const out: IndexRow[] = [];

  for (const pref of PREFERRED) {
    const idx = list.findIndex((row, i) => {
      if (used.has(i)) return false;
      const key = `${row.symbol || ''} ${row.name || ''}`.toUpperCase();
      return pref.match(key);
    });
    if (idx >= 0) {
      used.add(idx);
      out.push({ ...list[idx], symbol: pref.label });
    }
    if (out.length >= 3) break;
  }

  // Fill remaining slots with unused rows (no duplicates by symbol label)
  for (let i = 0; i < list.length && out.length < 3; i++) {
    if (used.has(i)) continue;
    const label = (list[i].symbol || list[i].name || `Index ${i + 1}`).toUpperCase();
    if (out.some((r) => (r.symbol || '').toUpperCase() === label)) continue;
    used.add(i);
    out.push(list[i]);
  }

  return out;
}

export function IndicesRibbon() {
  const [rows, setRows] = useState<IndexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/v1/techno-funda/indices`, {
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error('indices failed');
        const data = await res.json();
        const list: IndexRow[] = Array.isArray(data?.indices) ? data.indices : [];
        const picked = pickDistinct(list);
        if (!cancelled) {
          setRows(picked);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mkt-indices" aria-busy="true" aria-label="Loading market indices">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mkt-index-chip">
            <div className="mkt-skeleton" style={{ width: '40%', marginBottom: 8 }} />
            <div className="mkt-skeleton" style={{ width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error || rows.length === 0) {
    return (
      <p className="mkt-delayed-note" role="status">
        Live indices temporarily unavailable. Quotes are delayed when connected.
      </p>
    );
  }

  return (
    <>
      <div className="mkt-indices" aria-label="Delayed market indices">
        {rows.map((idx, i) => {
          const pct = typeof idx.changePct === 'number' ? idx.changePct : 0;
          const up = pct >= 0;
          return (
            <div key={`${idx.symbol}-${i}`} className="mkt-index-chip">
              <div className="name">{idx.symbol || idx.name}</div>
              <div className="val tabular">
                {Number(idx.current).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className={`chg tabular ${up ? 'up' : 'down'}`} aria-label={up ? 'Up' : 'Down'}>
                {up ? '+' : ''}
                {pct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
      <p className="mkt-delayed-note">
        Delayed exchange quotes for educational display (not for real-time order execution).
      </p>
    </>
  );
}
