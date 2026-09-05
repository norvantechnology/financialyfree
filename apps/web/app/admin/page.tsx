'use client';

import React, { useState } from 'react';
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
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
            background: toast.type === 'success' ? '#065f46' : '#1e293b',
            color: '#fff',
            border: `1px solid ${toast.type === 'success' ? '#34d399' : '#38bdf8'}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-primary-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            <ShieldCheck size={14} />
            <span>Platform Governance & Compliance Portal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800 }}>
            Executive Admin Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Real-time distributor operations (ARN-350272), BSE StAR MF transaction volume, data quality telemetry, and manual KYC exceptions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-card)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Card 1: Users */}
        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--color-primary-400)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '2px' }}>1,420</div>
          <div style={{ fontSize: '11px', color: 'var(--color-success-400)', fontWeight: 600 }}>+18.4% new signups this month</div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Paid Subscribers (ARR)</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '2px' }}>385 Active</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>₹57.7 Lakhs Annualized Run-Rate</div>
        </div>

        {/* Card 3: Monthly SIP Volume */}
        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Committed Monthly SIP</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              <IndianRupee size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '2px' }}>₹48.5 Lakhs</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>890 Goal Portfolios linked</div>
        </div>

        {/* Card 4: KYC Funnel */}
        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>KYC Completion Rate</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '2px' }}>91.9%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>285 Verified • 18 Pending</div>
        </div>
      </div>

      {/* Data Quality Telemetry & Health Panel */}
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-success-400)',
                boxShadow: '0 0 10px var(--color-success-400)',
              }}
            />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
              System Health & Data Quality Telemetry (Score: 98.4%)
            </h2>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
            }}
          >
            STATUS: ALL SERVICES OPERATIONAL
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Check 1 */}
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <Database size={16} color="var(--color-primary-400)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>PostgreSQL Connection Pool</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active connections: 4/20. Latency: 1.2ms. All migrations 001–008 active.
            </div>
          </div>

          {/* Check 2 */}
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <HardDrive size={16} color="#a855f7" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Redis Cache (ecoo-redis:6379)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Hit ratio: 94.2%. MMI & NAV cache TTL functioning smoothly.
            </div>
          </div>

          {/* Check 3 */}
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <Zap size={16} color="#22c55e" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>BSE StAR MF Gateway</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Mock adapter connected. 0 order dispatch errors. Client UCC auto-mandate active.
            </div>
          </div>

          {/* Check 4 */}
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <Activity size={16} color="#eab308" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>AMFI Daily NAV Integrity</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              0 stale feeds. All 8 mutual fund schemes updated post market close.
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Officer: KYC Review Queue */}
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '2px' }}>
              Pending KYC Verification Queue (Compliance Fallback)
            </h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Manual approval queue for profiles requiring secondary identity or penny-drop confirmation.
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {kycQueue.filter((q) => q.status === 'pending').length} Action Required
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Investor Name</th>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>PAN Number</th>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>DigiLocker Aadhaar</th>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Penny Drop Status</th>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Submitted</th>
                <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {kycQueue.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    {item.name}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--color-primary-400)' }}>
                    {item.pan}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-success-400)' }}>
                    {item.aadhaarStatus}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: item.bankStatus.includes('Failed') ? 'var(--color-danger-400)' : 'var(--text-secondary)' }}>
                    {item.bankStatus}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {item.submittedAt}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    {item.status === 'verified' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--color-success-400)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Verified ({item.ucc})
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--color-danger-400)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                        }}
                      >
                        <XCircle size={14} />
                        Rejected
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          onClick={() => handleReview(item.id, 'APPROVE')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: 'var(--color-success-400)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Approve & Issue UCC
                        </button>
                        <button
                          onClick={() => handleReview(item.id, 'REJECT')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--color-danger-400)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
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
  );
}
