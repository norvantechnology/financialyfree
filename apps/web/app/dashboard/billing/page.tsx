'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';
import { getStoredAccessToken } from '../../../lib/auth-client';

export default function BillingPage() {
  const [activeSub, setActiveSub] = useState<{
    planSlug: string;
    planName: string;
    active: boolean;
    activatedAt: string;
    skus: string[];
  } | null>(null);

  const [invoices, setInvoices] = useState<{
    id: string;
    invoiceNumber: string;
    planName: string;
    planSlug: string;
    amount: number;
    gstAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    paidAt: string;
  }[]>([]);

  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    async function loadBilling() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = getStoredAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiUrl}/api/v1/subscriptions/my`, { headers });
        if (res.ok) {
          const subs = await res.json();
          if (Array.isArray(subs) && subs.length > 0) {
            const active = subs.find((s: any) => s.status === 'active') || subs[0];
            setActiveSub({
              planSlug: active.plan?.slug || 'active-plan',
              planName: active.plan?.name || 'Subscribed Plan',
              active: active.status === 'active',
              activatedAt: active.startedAt ? new Date(active.startedAt).toLocaleDateString('en-IN') : 'Active',
              skus: active.plan?.skus || ['course_lifetime'],
            });
          }
        }
      } catch (err) {
        console.warn('Billing live fetch fallback', err);
      }
      const saved = localStorage.getItem('ff_active_sub');
      if (saved) {
        try {
          setActiveSub(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }

    async function loadInvoices() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = getStoredAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiUrl}/api/v1/subscriptions/invoices`, { headers });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setInvoices(list);
          }
        }
      } catch (err) {
        console.warn('Invoice fetch failed', err);
      } finally {
        setInvoicesLoading(false);
      }
    }

    loadBilling();
    loadInvoices();
  }, []);

  return (
    <SidebarLayout activePath="/dashboard/billing">
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Entitlement Gateway"
          sourceNotes="Real-time access rights, recurring subscription management, and statutory GST tax invoices."
        />

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="category-tag">ACCOUNT & LICENSES</div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginBottom: '8px',
            }}
          >
            Billing & Entitlements
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Manage your subscription tier, unlocked modules, and institutional tools permissions.
          </p>
        </div>

        {/* Current Active Plan Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(14px, 3.5vw, 32px)',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div>
              <span className="category-tag">
                CURRENT ACTIVE SUBSCRIPTION
              </span>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {activeSub ? activeSub.planName : 'Free Goal Planner'}
              </h2>
            </div>
            <div
              className="badge-muted"
              style={{
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} />
              <span>Active</span>
            </div>
          </div>

          {/* Entitlements Chips */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Active SKU Permissions
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span
                className="badge-muted"
                style={{
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                }}
              >
                <ShieldCheck size={14} />
                Goal Engine & SIP Allocation (Free Lifetime)
              </span>

              {activeSub?.skus?.includes('course_lifetime') && (
                <span
                  className="badge-muted"
                  style={{
                    background: '#F5F3FF',
                    color: '#5B21B6',
                    border: '1px solid #DDD6FE',
                  }}
                >
                  <ShieldCheck size={14} />
                  Techno-Funda DIY Masterclass (Lifetime)
                </span>
              )}

              {activeSub?.skus?.includes('tools_1yr') && (
                <span
                  className="badge-muted"
                  style={{
                    background: '#FFFBEB',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <Clock size={14} />
                  Techno-Funda Tools & PEAD (1 Year)
                </span>
              )}
            </div>
          </div>

          {!activeSub && (
            <div
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Ready to upgrade to the Techno-Funda Masterclass or institutional research tools?
              </span>
              <Link
                href="/pricing"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
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
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(14px, 3.5vw, 24px)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            Order & Invoice History
          </h3>
          <div className="table-scroll-container" style={{ border: 'none' }}>
            <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Payment Method</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoicesLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading invoice history from database...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F0ECE1' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                      {new Date(inv.paidAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{inv.planName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 400 }}>
                        {inv.invoiceNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        incl. GST ₹{Number(inv.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{inv.paymentMethod}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge-muted" style={{ background: '#ECFDF5', color: '#065F46' }}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No invoice history yet. Invoices are generated upon successful payment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
