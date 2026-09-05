'use client';

import React from 'react';

interface StaticSnapshotBannerProps {
  datasetNote?: string;
  sourceNote?: string;
  datasetName?: string;
  sourceNotes?: string;
}

export function StaticSnapshotBanner({
  datasetNote,
  sourceNote,
  datasetName = 'Aureus demo dataset - last modeled 02 Sep 2026',
  sourceNotes = 'Not live market data or investment advice.',
}: StaticSnapshotBannerProps) {
  const displayDataset = datasetNote || datasetName;
  const displaySource = sourceNote || sourceNotes;

  return (
    <div
      style={{
        background: '#FEF9E7',
        border: '1px solid #FDE68A',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '10px 16px',
        fontSize: '12px',
        color: '#78350F',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: 'var(--space-6, 24px)',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#F59E0B',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px', color: '#92400E' }}>
        STATIC SNAPSHOT
      </span>
      <span style={{ color: '#78350F' }}>{displayDataset}</span>
      <span style={{ color: '#D97706' }}>•</span>
      <span style={{ color: '#92400E', opacity: 0.9 }}>{displaySource}</span>
    </div>
  );
}
