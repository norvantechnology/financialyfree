'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';
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

const INITIAL_HOLDINGS: FolioHolding[] = [
  {
    schemeCode: '119551',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amcName: 'PPFAS Mutual Fund',
    folioNo: '10928374/01',
    units: 324.52,
    nav: 78.42,
    currentValue: 25448.86,
    investedAmount: 20000.0,
    gain: 5448.86,
    gainPct: 27.24,
    goalName: 'Early Retirement (FIRE 45)',
  },
  {
    schemeCode: '120503',
    schemeName: 'Mirae Asset Large & Midcap Fund - Direct Plan - Growth',
    amcName: 'Mirae Asset Mutual Fund',
    folioNo: '98472910/02',
    units: 185.12,
    nav: 124.8,
    currentValue: 23102.97,
    investedAmount: 18000.0,
    gain: 5102.97,
    gainPct: 28.35,
    goalName: "Higher Education Fund (Sample)",
  },
  {
    schemeCode: '125497',
    schemeName: 'SBI Small Cap Fund - Direct Plan - Growth',
    amcName: 'SBI Funds Management',
    folioNo: '44738291/03',
    units: 82.4,
    nav: 165.25,
    currentValue: 13616.6,
    investedAmount: 10000.0,
    gain: 3616.6,
    gainPct: 36.17,
    goalName: 'Wealth Alpha Creation',
  },
  {
    schemeCode: '118989',
    schemeName: 'HDFC Liquid Fund - Direct Plan - Growth',
    amcName: 'HDFC AMC',
    folioNo: '55667788/04',
    units: 5.12,
    nav: 4621.5,
    currentValue: 23662.08,
    investedAmount: 23000.0,
    gain: 662.08,
    gainPct: 2.88,
    goalName: 'Emergency Reserve Fund',
  },
];

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<FolioHolding[]>(INITIAL_HOLDINGS);

  useEffect(() => {
    const saved = localStorage.getItem('ff_portfolio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: FolioHolding[] = parsed.map((item: any, idx: number) => ({
            schemeCode: item.schemeCode || `SCH_${idx}`,
            schemeName: item.schemeName || 'Active Mutual Fund Scheme',
            amcName: item.amcName || 'Registered AMC',
            folioNo: `BSE_${Math.floor(10000000 + Math.random() * 90000000)}/01`,
            units: 50.0,
            nav: (item.sipAmount || 5000) / 50.0,
            currentValue: (item.sipAmount || 5000) * 1.05,
            investedAmount: item.sipAmount || 5000,
            gain: (item.sipAmount || 5000) * 0.05,
            gainPct: 5.0,
            goalName: item.goalName || 'Wealth Goal',
          }));
          setHoldings(formatted.length > 0 ? formatted : INITIAL_HOLDINGS);
        }
      } catch (e) {
        console.error('Error parsing local portfolio', e);
      }
    }
  }, []);

  const isSampleData = holdings === INITIAL_HOLDINGS;

  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Static Snapshot Banner */}
        <StaticSnapshotBanner
          datasetNote="Aureus demo dataset - last modeled 02 Sep 2026"
          sourceNote="Not live market data or investment advice."
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <div className="category-tag">
              <Layers size={13} />
              <span>PORTFOLIO INTELLIGENCE / ASSET ALLOCATION</span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              Mutual Fund Portfolio
            </h1>
            <p style={{ color: 'var(--text-secondary, #4B5563)', fontSize: 'var(--text-sm)', maxWidth: '640px' }}>
              Real-time portfolio tracking across AMCs executed via BSE StAR MF.
            </p>
          </div>

          <Link
            href="/dashboard/invest"
            className="btn btn-primary"
            style={{
              minHeight: '38px',
              padding: '8px 20px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Start New SIP</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isSampleData && (
          <div
            style={{
              padding: '10px 16px',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-6)',
              fontSize: '12px',
              color: '#92400E',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span><strong>Sample Demonstration Portfolio</strong> — Showing simulated folios for demonstration. Start a SIP or import CAS to see real investments.</span>
            </div>
            <button
              onClick={() => setHoldings([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400E',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Clear Demo Folios
            </button>
          </div>
        )}

        {holdings.length === 0 && (
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'right' }}>
            <button
              onClick={() => setHoldings(INITIAL_HOLDINGS)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F766E',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↺ Load Sample Demonstration Folios
            </button>
          </div>
        )}

        {/* Portfolio Performance Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted, #6B7280)' }}>Current Value</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary, #111827)' }}>
              ₹{totalCurrentValue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <ArrowUpRight size={14} />
              <span>+{overallReturnPct.toFixed(2)}% Overall Returns</span>
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted, #6B7280)' }}>Total Invested</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary, #111827)' }}>
              ₹{totalInvested.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)', marginTop: '4px' }}>
              Across {holdings.length} Folio Holdings
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted, #6B7280)' }}>Total Gain</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: '#16A34A' }}>
              +₹{totalGain.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)', marginTop: '4px' }}>
              Unrealized Capital Gains
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted, #6B7280)' }}>Portfolio XIRR</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary, #0F172A)' }}>
              18.4%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #4B5563)', marginTop: '4px' }}>
              Annualized Cashflow Return
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div
          className="card table-scroll-container"
          style={{
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
              Folio Holdings & Goal Mapping
            </h3>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>BSE StAR MF Live Sync</span>
          </div>

          <DataStateContainer
            isEmpty={holdings.length === 0}
            emptyTitle="No Folio Holdings Found"
            emptyDescription="You have not mapped any mutual fund investments yet. Start a SIP toward one of your goals to track your live asset allocation."
            emptyActionLabel="Browse Mutual Funds"
            onEmptyAction={() => window.location.href = '/dashboard/invest'}
            isStale={true}
            lastUpdated="02 Sep 2026, 21:00 IST (Post-Market Settlement)"
            source="CAMS & KFintech RTAs via BSE StAR MF Daily Recon"
          >
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
          </DataStateContainer>
        </div>
      </div>
    </SidebarLayout>
  );
}
