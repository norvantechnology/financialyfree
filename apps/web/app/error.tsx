'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Shield } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base, #F8F6F1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6, 24px)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #E8E4DC)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          padding: '40px 36px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#DC2626',
            marginBottom: '8px',
          }}
        >
          500 — Application Runtime Error
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '12px',
            lineHeight: 1.25,
          }}
        >
          An Unexpected Error Occurred
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          The platform encountered an issue processing this request. Our system monitoring has logged this incident. Your account assets and calculation data remain safe.
        </p>

        {error?.digest && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '8px 12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#64748B',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            Incident Reference: {error.digest}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <RotateCcw size={16} /> Try Again
          </button>

          <Link
            href="/dashboard/goals"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              padding: '11px 20px',
              borderRadius: '9999px',
              border: '1px solid #E2E8F0',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#94A3B8',
          }}
        >
          <Shield size={13} />
          <span>Statutory Compliance: AMFI ARN-350272</span>
        </div>
      </div>
    </div>
  );
}
