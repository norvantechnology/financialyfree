'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PLANS } from '../../lib/marketing/site';

type Focus = 'goals' | 'research' | 'academy' | 'all';

export function PlanRecommender() {
  const [focus, setFocus] = useState<Focus>('goals');

  const recommendation = useMemo(() => {
    if (focus === 'goals') return PLANS[0];
    if (focus === 'research') return PLANS[1];
    if (focus === 'academy') return PLANS[2];
    return PLANS[3];
  }, [focus]);

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
              className="mkt-tab"
              onClick={() => setFocus(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <p style={{ marginTop: 16, color: 'var(--mkt-muted)' }}>
        Suggested: <strong style={{ color: 'var(--mkt-ink)' }}>{recommendation.name}</strong> —{' '}
        {recommendation.description}
      </p>
      <Link href={recommendation.href} className="mkt-btn mkt-btn-primary">
        Continue with {recommendation.name}
      </Link>
    </div>
  );
}
