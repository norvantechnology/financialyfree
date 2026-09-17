import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
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
            backgroundColor: '#F3F4F6',
            color: '#1E293B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <Compass size={28} />
        </div>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#64748B',
            marginBottom: '8px',
          }}
        >
          404  Record Not Found
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '12px',
            lineHeight: 1.25,
          }}
        >
          Page or Analysis Unavailable
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          The resource, stock terminal record, or module you requested does not exist or has been moved. Verify the URL or return to your investment dashboard.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Link
            href="/dashboard/goals"
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
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
          >
            Go to Goals Dashboard <ArrowRight size={16} />
          </Link>

          <Link
            href="/"
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
            <ArrowLeft size={16} /> Return to Homepage
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
          <ShieldAlert size={13} />
          <span>GoalCompass</span>
        </div>
      </div>
    </div>
  );
}
