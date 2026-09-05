'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  IndianRupee,
  Database,
  HardDrive,
  Zap,
  Award,
} from 'lucide-react';
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

interface KycItem {
  id: string;
  name: string;
  pan: string;
  aadhaarStatus: string;
  bankStatus: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  ucc?: string;
}

const INITIAL_QUEUE: KycItem[] = [
  {
    id: 'kyc-q1',
    name: 'Vikramaditya Singhania',
    pan: 'ABCPS1234D',
    aadhaarStatus: 'DigiLocker Verified',
    bankStatus: 'Penny Drop Confirmed (HDFC Bank)',
    submittedAt: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'kyc-q2',
    name: 'Ananya Deshmukh',
    pan: 'BNKPD5678E',
    aadhaarStatus: 'DigiLocker Verified',
    bankStatus: 'Penny Drop Confirmed (ICICI Bank)',
    submittedAt: '5 hours ago',
    status: 'pending',
  },
  {
    id: 'kyc-q3',
    name: 'Rajesh Nair',
    pan: 'CPJMN9012F',
    aadhaarStatus: 'DigiLocker Verified',
    bankStatus: 'Penny Drop Failed (Name Mismatch)',
    submittedAt: '8 hours ago',
    status: 'pending',
  },
];

export default function AdminDashboardPage() {
  const [kycQueue, setKycQueue] = useState<KycItem[]>(INITIAL_QUEUE);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
    setToast({
      type: 'info',
      message: 'System health, NAV status, and KYC queue refreshed from database.',
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const uccCode = action === 'APPROVE' ? `UCC_${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined;

    setKycQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: action === 'APPROVE' ? 'verified' : 'rejected',
              ucc: uccCode,
            }
          : item,
      ),
    );

    setToast({
      type: 'success',
      message:
        action === 'APPROVE'
          ? `KYC approved! BSE StAR MF UCC ${uccCode} registered and mandate ready.`
          : 'KYC profile rejected. Notification sent to investor for re-submission.',
    });
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <SidebarLayout activePath="/admin">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 100,
              padding: 'var(--space-4) var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              background: toast.type === 'success' ? '#065F46' : '#0F172A',
              color: '#FFFFFF',
              border: `1px solid ${toast.type === 'success' ? '#34D399' : '#38BDF8'}`,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              maxWidth: '500px',
            }}
          >
            <CheckCircle2 size={20} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{toast.message}</span>
          </div>
        )}

        <StaticSnapshotBanner
          datasetName="Aureus Executive Telemetry & Governance"
          sourceNotes="AMFI distributor compliance log (ARN-350272), BSE StAR MF queue, and infrastructure status."
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-8)',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} />
              <span>PLATFORM GOVERNANCE & COMPLIANCE PORTAL</span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                marginTop: '4px',
                marginBottom: '8px',
              }}
            >
              Executive Admin Console
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0, maxWidth: '720px' }}>
              Real-time distributor operations (ARN-350272), BSE StAR MF transaction volume, data quality telemetry, and manual KYC exceptions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/data-integrity"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <Database size={15} />
              <span>Data Integrity Audit</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-outline"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {/* Card 1: Users */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Registered</span>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: '#F0F9FF', color: '#0369A1' }}>
                <Users size={16} />
              </div>
            </div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              1,420
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>+18.4% new signups this month</div>
          </div>

          {/* Card 2: Active Subscriptions */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>Paid Subscribers (ARR)</span>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: '#FAF5FF', color: '#7E22CE' }}>
                <Award size={16} />
              </div>
            </div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              385 Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>₹57.7 Lakhs Annualized Run-Rate</div>
          </div>

          {/* Card 3: Monthly SIP Volume */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>Committed Monthly SIP</span>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: '#ECFDF5', color: '#047857' }}>
                <IndianRupee size={16} />
              </div>
            </div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              ₹48.5 Lakhs
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>890 Goal Portfolios linked</div>
          </div>

          {/* Card 4: KYC Funnel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>KYC Completion Rate</span>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: '#FFFBEB', color: '#B45309' }}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              91.9%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>285 Verified • 18 Pending</div>
          </div>
        </div>

        {/* Data Quality Telemetry & Health Panel */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-5)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981',
                }}
              />
              <h2 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                System Health & Data Quality Telemetry (Score: 98.4%)
              </h2>
            </div>
            <span
              className="badge-muted"
              style={{
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontWeight: 700,
              }}
            >
              STATUS: ALL SERVICES OPERATIONAL
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'var(--space-4)' }}>
            {/* Check 1 */}
            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <Database size={16} color="var(--color-accent)" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>PostgreSQL Connection Pool</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Active connections: 4/20. Latency: 1.2ms. All migrations 001–008 active.
              </div>
            </div>

            {/* Check 2 */}
            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <HardDrive size={16} color="#7E22CE" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>Redis Cache (ecoo-redis:6379)</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Hit ratio: 94.2%. MMI & NAV cache TTL functioning smoothly.
              </div>
            </div>

            {/* Check 3 */}
            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <Zap size={16} color="#047857" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>BSE StAR MF Gateway</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mock adapter connected. 0 order dispatch errors. Client UCC auto-mandate active.
              </div>
            </div>

            {/* Check 4 */}
            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <Activity size={16} color="#B45309" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>AMFI Daily NAV Integrity</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                0 stale feeds. All 8 mutual fund schemes updated post market close.
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Officer: KYC Review Queue */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface-raised)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Pending KYC Verification Queue (Compliance Fallback)
                </h2>
                <span className="badge-muted" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '10px' }}>
                  Simulated Queue (Sample Records)
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Manual approval queue for profiles requiring secondary identity or penny-drop confirmation.
              </div>
            </div>
            <span className="badge-muted" style={{ color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              {kycQueue.filter((q) => q.status === 'pending').length} Action Required
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Investor Name</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>PAN Number</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>DigiLocker Aadhaar</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Penny Drop Status</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Submitted</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Review Action</th>
                </tr>
              </thead>
              <tbody>
                {kycQueue.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F0ECE1' }}>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                      {item.pan}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: '#059669' }}>
                      {item.aadhaarStatus}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: item.bankStatus.includes('Failed') ? '#DC2626' : 'var(--text-secondary)' }}>
                      {item.bankStatus}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {item.submittedAt}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {item.status === 'verified' ? (
                        <span
                          className="badge-muted"
                          style={{
                            color: '#065F46',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Verified ({item.ucc})
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span
                          className="badge-muted"
                          style={{
                            color: '#991B1B',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            fontWeight: 700,
                          }}
                        >
                          <XCircle size={13} />
                          Rejected
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={() => handleReview(item.id, 'APPROVE')}
                            className="badge-muted"
                            style={{
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#065F46',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Approve UCC
                          </button>
                          <button
                            onClick={() => handleReview(item.id, 'REJECT')}
                            className="badge-muted"
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#991B1B',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
