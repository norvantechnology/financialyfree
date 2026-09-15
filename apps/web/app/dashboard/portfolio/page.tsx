'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { DataStateContainer } from '../../../components/data-state-view';

interface FolioHolding {
  schemeCode: string;
  schemeName: string;
  amcName: string;
  folioNo: string;
  units: number;
  nav: number;
  currentValue: number;
  investedAmount: number;
  gain: number;
  gainPct: number;
  goalName: string;
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<FolioHolding[]>([]);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const loadPortfolio = async () => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token && typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
        if (match) token = match[1];
      }

      const res = await fetch(`${apiUrl}/api/v1/mutual-funds/portfolio`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.holdings) && data.holdings.length > 0) {
          const mapped: FolioHolding[] = data.holdings.map((h: any) => ({
            schemeCode: h.schemeCode,
            schemeName: h.schemeName,
            amcName: h.amcName,
            folioNo: h.folioNumber,
            units: Number(h.units),
            nav: Number(h.navCurrent),
            currentValue: Number(h.currentValue),
            investedAmount: Number(h.investedAmount),
            gain: Number(h.gain),
            gainPct: Number(h.gainPct),
            goalName: h.goalName || 'Wealth Alpha & Compounding',
          }));
          setHoldings(mapped);
          setIsLiveFeed(true);
          setFetchError(null);
          setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
          return;
        }
      }
      setHoldings([]);
      setIsLiveFeed(false);
    } catch (err: any) {
      console.warn('Portfolio live fetch error', err);
      setHoldings([]);
      setIsLiveFeed(false);
      setFetchError(err.message || 'Service unreachable');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : null;
  const hasHoldings = holdings.length > 0;

  return (
    <SidebarLayout>
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Live AMFI NAV / Status Banner */}
        {fetchError ? (
          <div
            id="portfolio-amfi-sync-notice"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#D97706" />
              <span>
                <strong>Portfolio Update:</strong> Latest NAVs are refreshing. Showing portfolio value calculated at {lastSyncTime}.
              </span>
            </div>
            <button
              onClick={loadPortfolio}
              disabled={isSyncing}
              className="btn btn-outline"
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                minHeight: '30px',
                borderColor: '#D97706',
                color: '#92400E',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Retry AMFI Sync'}</span>
            </button>
          </div>
        ) : isLiveFeed ? (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
            }}
          >
            <span>
              <strong>AMFI NAV Feed:</strong> Portfolio valuations computed dynamically against official AMFI daily NAV file.
            </span>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Sync Active</span>
          </div>
        ) : null}

        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}
            >
              Mutual Fund Portfolio
            </h1>
            <p style={{ color: 'var(--text-secondary, #4B5563)', fontSize: 'var(--text-sm)', maxWidth: '640px', margin: 0 }}>
              Real-time portfolio tracking across mutual fund AMCs.
            </p>
          </div>

          <Link
            href="/dashboard/invest"
            className="btn btn-primary btn-mobile-full"
            style={{
              minHeight: '38px',
              padding: '8px 20px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <span>Start New SIP</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Portfolio Performance Summary Cards  Compact 2x2 on Mobile */}
        <div className="kpi-grid-mobile-2col">
          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6B7280)' }}>Current Value</span>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary, #111827)' }}>
              {hasHoldings ? `₹${totalCurrentValue.toLocaleString('en-IN')}` : '₹0'}
            </div>
            <div style={{ fontSize: '11px', color: hasHoldings && overallReturnPct !== null ? (overallReturnPct >= 0 ? '#16A34A' : '#DC2626') : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              {hasHoldings && overallReturnPct !== null ? (
                <><ArrowUpRight size={13} /><span>{overallReturnPct >= 0 ? '+' : ''}{overallReturnPct.toFixed(1)}% Returns</span></>
              ) : (
                <span>No transactions yet</span>
              )}
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6B7280)' }}>Total Invested</span>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary, #111827)' }}>
              ₹{totalInvested.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)' }}>
              {holdings.length} Folios
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6B7280)' }}>Total Gain</span>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, margin: '2px 0', color: hasHoldings ? (totalGain >= 0 ? '#16A34A' : '#DC2626') : '#9CA3AF' }}>
              {hasHoldings ? `${totalGain >= 0 ? '+' : ''}₹${totalGain.toLocaleString('en-IN')}` : '₹0'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)' }}>
              Capital Gains
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6B7280)' }}>Portfolio XIRR</span>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, margin: '2px 0', color: hasHoldings ? 'var(--color-primary, #0F172A)' : '#9CA3AF' }}>
              {hasHoldings ? '-' : '-'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)' }}>
              {hasHoldings ? 'Annualized (SIP calc pending)' : 'No transactions yet'}
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div
          className="card"
          style={{
            padding: 'clamp(14px, 3vw, 24px)',
            marginBottom: 'clamp(16px, 3vw, 32px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
              Folio Holdings & Goal Mapping
            </h3>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Live Portfolio Sync</span>
          </div>

          <DataStateContainer
            isEmpty={holdings.length === 0}
            emptyTitle="No Folio Holdings Found"
            emptyDescription="You have not mapped any mutual fund investments yet. Start a SIP toward one of your goals to track your live asset allocation."
            emptyActionLabel="Browse Mutual Funds"
            onEmptyAction={() => window.location.href = '/dashboard/invest'}
            isStale={lastSyncTime ? false : true}
            lastUpdated={lastSyncTime || undefined}
            source="CAMS & KFintech RTAs Daily Recon"
          >
            <div className="table-scroll-container" style={{ border: 'none' }}>
              <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, #E8E4DC)', color: '#6B7280', fontSize: '12px' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Scheme Name</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mapped Goal</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Units</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Invested</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Current Value</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F0ECE3' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{h.schemeName}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{h.folioNo} • {h.amcName}</div>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            background: '#F4F1EA',
                            border: '1px solid #E8E4DC',
                            color: '#374151',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {h.goalName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: '#111827' }}>{h.units.toFixed(2)}</td>
                      <td style={{ padding: '14px 8px', color: '#374151' }}>₹{h.investedAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px 8px', fontWeight: 600, color: '#111827' }}>₹{h.currentValue.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px 8px', color: '#16A34A', fontWeight: 600 }}>
                        +₹{h.gain.toLocaleString('en-IN')} ({h.gainPct}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataStateContainer>
        </div>
      </div>
    </SidebarLayout>
  );
}
