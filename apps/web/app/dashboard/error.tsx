'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { SidebarLayout } from '../../components/sidebar-layout';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <SidebarLayout activePath="/dashboard/goals">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-6)',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={26} />
          </div>

          <div className="category-tag" style={{ color: '#DC2626', marginBottom: '8px' }}>
            DASHBOARD FAULT
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            Failed to Load Workspace Data
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            We encountered an unexpected issue rendering this financial dashboard view. Your portfolio holdings and saved goals are not affected.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} /> Retry
            </button>
            <Link
              href="/dashboard/goals"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutDashboard size={15} /> Goals Overview
            </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
