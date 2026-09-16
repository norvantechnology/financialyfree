'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Item = { id: string; title: string; body: string };

export function TrackBTabsClient({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const current = items.find((i) => i.id === active) || items[0];

  return (
    <div>
      <div className="mkt-tabs" role="tablist" aria-label="Research desk previews">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="mkt-tab"
            aria-selected={active === item.id}
            onClick={() => setActive(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="mkt-card" role="tabpanel">
        <h3 className="mkt-serif" style={{ marginTop: 0 }}>
          {current.title}
        </h3>
        <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.55 }}>{current.body}</p>
        <Link href={`/techno-funda?tab=${current.id}`} className="mkt-btn mkt-btn-outline-dark">
          Open in Research Suite
        </Link>
      </div>
    </div>
  );
}
