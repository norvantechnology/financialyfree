'use client';

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/auth-client';

type IndexRow = {
  symbol: string;
  name?: string;
  current: number;
  changePct?: number;
};

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
        const prefer = ['NIFTY 50', 'SENSEX', 'NIFTY BANK', 'INDIA VIX'];
        const picked = prefer
          .map((sym) => list.find((i) => (i.symbol || i.name || '').toUpperCase().includes(sym.split(' ')[0])))
          .filter(Boolean) as IndexRow[];
        if (!cancelled) {
          setRows(picked.length ? picked.slice(0, 4) : list.slice(0, 4));
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
        {[0, 1, 2, 3].map((i) => (
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
        {rows.map((idx) => {
          const pct = typeof idx.changePct === 'number' ? idx.changePct : 0;
          const up = pct >= 0;
          return (
            <div key={idx.symbol} className="mkt-index-chip">
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
        Delayed exchange quotes for research display — not for real-time trading. See platform
        delayed-data notice.
      </p>
    </>
  );
}
