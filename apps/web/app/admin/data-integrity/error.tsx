'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SidebarLayout } from '../../../components/sidebar-layout';

export default function DataIntegrityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Data Integrity Diagnostics Error:', error);
  }, [error]);

  return (
    <SidebarLayout activePath="/admin">
      <div
        style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '32px 24px',
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Unable to Load Data Integrity Registry
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.6 }}>
          Could not communicate with the backend diagnostics service or PostgreSQL table{' '}
          <code>data_source_health</code>. Please verify the API server is running.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
          <Link
            href="/admin"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Back to Admin Console
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
