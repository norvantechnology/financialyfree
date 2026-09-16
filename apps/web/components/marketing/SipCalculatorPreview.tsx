'use client';

import React, { useMemo, useState } from 'react';
import { calculateSIPRequired } from '@ff/calc';
import Link from 'next/link';

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function SipCalculatorPreview() {
  const [target, setTarget] = useState(1_00_00_000);
  const [years, setYears] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [savings, setSavings] = useState(2_00_000);

  const result = useMemo(
    () =>
      calculateSIPRequired({
        targetCorpus: target,
        horizonYears: years,
        expectedReturnPct: returnPct,
        currentSavings: savings,
      }),
    [target, years, returnPct, savings],
  );

  return (
    <div className="mkt-card">
      <div className="mkt-kicker">Interactive preview</div>
      <h3 className="mkt-serif mkt-card-title" style={{ marginTop: 0, fontSize: '1.35rem' }}>
        SIP required for your goal
      </h3>
      <p className="mkt-text-muted" style={{ marginTop: 0, lineHeight: 1.5 }}>
        Powered by the same <code>@ff/calc</code> engine used in the Goal Planner — illustrative only,
        not advice.
      </p>

      <div className="mkt-grid-2">
        <div className="mkt-field">
          <label className="mkt-label" htmlFor="sip-target">
            Target corpus (₹)
          </label>
          <input
            id="sip-target"
            className="mkt-input"
            type="number"
            min={100000}
            step={100000}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
          />
        </div>
        <div className="mkt-field">
          <label className="mkt-label" htmlFor="sip-years">
            Horizon (years)
          </label>
          <input
            id="sip-years"
            className="mkt-input"
            type="number"
            min={1}
            max={40}
            value={years}
            onChange={(e) => setYears(Number(e.target.value) || 1)}
          />
        </div>
        <div className="mkt-field">
          <label className="mkt-label" htmlFor="sip-return">
            Expected return (% p.a.)
          </label>
          <input
            id="sip-return"
            className="mkt-input"
            type="number"
            min={1}
            max={20}
            step={0.5}
            value={returnPct}
            onChange={(e) => setReturnPct(Number(e.target.value) || 1)}
          />
        </div>
        <div className="mkt-field">
          <label className="mkt-label" htmlFor="sip-savings">
            Current savings (₹)
          </label>
          <input
            id="sip-savings"
            className="mkt-input"
            type="number"
            min={0}
            step={10000}
            value={savings}
            onChange={(e) => setSavings(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mkt-sip-result">
        <div>
          <div className="label">Monthly SIP</div>
          <div className="tabular mkt-serif sip-val">{formatINR(result.monthlySip)}</div>
        </div>
        <div>
          <div className="label">Projected corpus</div>
          <div className="tabular corpus-val">{formatINR(result.projectedCorpus)}</div>
        </div>
        <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary">
          Open full Goal Planner
        </Link>
      </div>
    </div>
  );
}
