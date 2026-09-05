'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, CreditCard } from 'lucide-react';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Checkout error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base, #F8F6F1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6, 24px)',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #E8E4DC)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
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

        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          PAYMENT GATEWAY NOTICE
        </div>

        <h2
          className="font-serif"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '10px',
          }}
        >
          Unable to Initialize Checkout Order
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          We could not initiate the Razorpay payment session. If your account was debited, our automated reconciliation will activate your plan within 15 minutes.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} /> Retry Checkout
          </button>
          <Link
            href="/pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            <CreditCard size={15} /> View All Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
