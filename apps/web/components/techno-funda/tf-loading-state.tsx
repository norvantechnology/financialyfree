'use client';

import React from 'react';

type TfLoadingVariant = 'panel' | 'cards' | 'table' | 'compact';

interface TfLoadingStateProps {
  title?: string;
  subtitle?: string;
  variant?: TfLoadingVariant;
  rows?: number;
}

/**
 * Shared Techno-Funda loading state - skeleton + linear progress.
 * Use when a tab/feed is fetching and has no cached data yet.
 */
export function TfLoadingState({
  title = 'Loading live market data...',
  subtitle = 'Fetching exchange and market feeds. This usually takes a few seconds.',
  variant = 'panel',
  rows = 4,
}: TfLoadingStateProps) {
  return (
    <div className="tf-loading-shell animate-fade-in" role="status" aria-live="polite" aria-busy="true">
      <div className="tf-loading-header">
        <div className="tf-loading-pulse-dot" aria-hidden />
        <div>
          <h3 className="tf-loading-title">{title}</h3>
          <p className="tf-loading-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="tf-linear-loader tf-linear-loader-wide" aria-hidden>
        <div className="tf-linear-loader-bar" />
      </div>

      {variant === 'cards' && (
        <div className="tf-loading-cards">
          {Array.from({ length: Math.max(3, rows) }).map((_, i) => (
            <div key={i} className="tf-loading-card">
              <div className="skeleton" style={{ height: 12, width: '42%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 28, width: '68%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 10, width: '88%' }} />
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="tf-loading-table">
          <div className="skeleton" style={{ height: 36, width: '100%', marginBottom: 8 }} />
          {Array.from({ length: Math.max(5, rows) }).map((_, i) => (
            <div key={i} className="tf-loading-table-row">
              <div className="skeleton" style={{ height: 14, width: '18%' }} />
              <div className="skeleton" style={{ height: 14, width: '32%' }} />
              <div className="skeleton" style={{ height: 14, width: '14%' }} />
              <div className="skeleton" style={{ height: 14, width: '14%' }} />
            </div>
          ))}
        </div>
      )}

      {(variant === 'panel' || variant === 'compact') && (
        <div className="tf-loading-panel-blocks">
          {Array.from({ length: variant === 'compact' ? 2 : Math.max(3, rows) }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: variant === 'compact' ? 48 : 64, width: '100%' }} />
          ))}
        </div>
      )}

      <p className="tf-loading-hint">Tip: switch tabs freely - each feed loads on demand and stays cached.</p>
    </div>
  );
}
