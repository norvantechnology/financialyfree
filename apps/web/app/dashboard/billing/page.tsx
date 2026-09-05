'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function BillingPage() {
  const [activeSub, setActiveSub] = useState<{
    planSlug: string;
    planName: string;
    active: boolean;
    activatedAt: string;
    skus: string[];
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ff_active_sub');
    if (saved) {
      try {
        setActiveSub(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: 'var(--space-10) auto', padding: '0 var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Billing & Subscription Entitlements
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Manage your plan, check your unlocked courses & institutional tools entitlements.
        </p>
      </div>

      {/* Current Active Plan Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Active Plan
            </span>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginTop: '4px' }}>
              {activeSub ? activeSub.planName : 'Free Goal Planner'}
            </h2>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--color-success-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} />
            <span>Active</span>
          </div>
        </div>

        {/* Entitlements Chips */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Granted Entitlements (SKUs)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                color: 'var(--color-primary-300)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={14} />
              Goal Engine & SIP Allocation (Free Lifetime)
            </span>

            {activeSub?.skus?.includes('course_lifetime') && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  color: 'var(--color-secondary-400)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} />
                Techno-Funda DIY Masterclass (Lifetime)
              </span>
            )}

            {activeSub?.skus?.includes('tools_1yr') && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  color: 'var(--color-warning-400)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                <Clock size={14} />
                Techno-Funda Tools & PEAD (1 Year)
              </span>
            )}

            {activeSub?.skus?.includes('webinars_1yr') && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: 'var(--color-info-400)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                <Clock size={14} />
                Weekly Live Webinars & Replays (1 Year)
              </span>
            )}
          </div>
        </div>

        {!activeSub && (
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Ready to upgrade to the Techno-Funda Masterclass or institutional research tools?
            </span>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                color: '#ffffff',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Explore Plans</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          Order & Invoice History
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 8px' }}>Date</th>
              <th style={{ padding: '12px 8px' }}>Plan</th>
              <th style={{ padding: '12px 8px' }}>Amount</th>
              <th style={{ padding: '12px 8px' }}>Payment Method</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeSub ? (
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                  {new Date(activeSub.activatedAt).toLocaleDateString('en-IN')}
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>{activeSub.planName}</td>
                <td style={{ padding: '12px 8px' }}>₹{activeSub.planSlug === 'all-access-bundle' ? '29,498.82' : '17,698.82'}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Razorpay (UPI)</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ color: 'var(--color-success-400)', fontWeight: 600 }}>Paid</span>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No previous transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
