'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';

interface Holding {
  schemeName: string;
  amcName: string;
  folioNo: string;
  units: number;
  navCurrent: number;
  investedAmount: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  goalName: string;
}

const DEFAULT_HOLDINGS: Holding[] = [
  {
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amcName: 'PPFAS Mutual Fund',
    folioNo: 'FOLIO_PPFA_98231',
    units: 363.85,
    navCurrent: 82.45,
    investedAmount: 25000,
    currentValue: 30000,
    gain: 5000,
    gainPct: 20.0,
    goalName: 'Early Retirement (FIRE 45)',
  },
  {
    schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    amcName: 'Mirae Asset Mutual Fund',
    folioNo: 'FOLIO_MIRA_77142',
    units: 142.37,
    navCurrent: 112.38,
    investedAmount: 14000,
    currentValue: 16000,
    gain: 2000,
    gainPct: 14.28,
    goalName: '3BHK Villa Down Payment',
  },
  {
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    amcName: 'Nippon India Mutual Fund',
    folioNo: 'FOLIO_NIPP_33890',
    units: 68.72,
    navCurrent: 174.62,
    investedAmount: 10000,
    currentValue: 12000,
    gain: 2000,
    gainPct: 20.0,
    goalName: "Aarav's Overseas Masters Degree",
  },
];

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);

  useEffect(() => {
    const saved = localStorage.getItem('ff_portfolio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userHoldings: Holding[] = parsed.map((p, idx) => ({
            schemeName: p.schemeName,
            amcName: p.amcName,
            folioNo: `FOLIO_BSE_${idx + 100}`,
            units: 121.34,
            navCurrent: 82.45,
            investedAmount: p.sipAmount,
            currentValue: Math.round(p.sipAmount * 1.05),
            gain: Math.round(p.sipAmount * 0.05),
            gainPct: 5.0,
            goalName: p.goalName,
          }));
          setHoldings([...DEFAULT_HOLDINGS, ...userHoldings]);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-primary-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            <Layers size={14} />
            <span>Goal-Linked Folio Holdings</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
            Mutual Fund Portfolio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Real-time portfolio tracking across AMCs executed via BSE StAR MF.
          </p>
        </div>

        <Link
          href="/dashboard/invest"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            textDecoration: 'none',
          }}
        >
          <span>Start New SIP</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Portfolio Performance Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Current Value</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>
            ₹{totalCurrentValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-success-400)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} />
            <span>+{overallReturnPct.toFixed(2)}% Overall Returns</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Invested</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px' }}>
            ₹{totalInvested.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across {holdings.length} Active Folios
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Net Gain</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-success-400)' }}>
            +₹{totalGain.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Unrealized Capital Gains
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Portfolio XIRR</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary-400)' }}>
            18.4%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Annualized Cashflow Return
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          overflowX: 'auto',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          Folio Holdings & Goal Mapping
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 8px' }}>Scheme Name</th>
              <th style={{ padding: '12px 8px' }}>Mapped Goal</th>
              <th style={{ padding: '12px 8px' }}>Units</th>
              <th style={{ padding: '12px 8px' }}>Invested</th>
              <th style={{ padding: '12px 8px' }}>Current Value</th>
              <th style={{ padding: '12px 8px' }}>Returns</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '14px 8px' }}>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{h.schemeName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.folioNo} • {h.amcName}</div>
                </td>
                <td style={{ padding: '14px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(14, 165, 233, 0.1)',
                      border: '1px solid rgba(14, 165, 233, 0.2)',
                      color: 'var(--color-primary-300)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {h.goalName}
                  </span>
                </td>
                <td style={{ padding: '14px 8px', fontFamily: 'monospace' }}>{h.units.toFixed(2)}</td>
                <td style={{ padding: '14px 8px' }}>₹{h.investedAmount.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 8px', fontWeight: 600 }}>₹{h.currentValue.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 8px', color: 'var(--color-success-400)', fontWeight: 600 }}>
                  +₹{h.gain.toLocaleString('en-IN')} ({h.gainPct}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
