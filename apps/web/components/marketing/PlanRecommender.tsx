'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PLANS } from '../../lib/marketing/site';

type Focus = 'goals' | 'research' | 'academy' | 'all';

const FOCUS_TO_PLAN: Record<Focus, (typeof PLANS)[number]> = {
  goals: PLANS[0],
  research: PLANS[1],
  academy: PLANS[2],
  all: PLANS[3],
};

export function PlanRecommender() {
  const [focus, setFocus] = useState<Focus>('goals');

  const recommendation = useMemo(() => FOCUS_TO_PLAN[focus], [focus]);

  return (
    <div className="mkt-card">
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="mkt-label" style={{ marginBottom: 12 }}>
          What do you need most right now?
        </legend>
        <div className="mkt-tabs" role="radiogroup" aria-label="Plan focus">
          {(
            [
              ['goals', 'Goal planning'],
              ['research', 'Research tools'],
              ['academy', 'Research + Academy'],
              ['all', 'Everything + community'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={focus === id}
              aria-selected={focus === id}
              className="mkt-tab"
              onClick={() => setFocus(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mkt-text-muted" style={{ marginTop: 16 }} key={recommendation.id}>
        Suggested: <strong>{recommendation.name}</strong>: {recommendation.description}
      </p>
      <Link href={recommendation.href} className="mkt-btn mkt-btn-primary">
        Get {recommendation.name}
      </Link>
    </div>
  );
}
