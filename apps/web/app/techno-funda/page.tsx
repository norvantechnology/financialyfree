'use client';

import React, { useState } from 'react';
import {
  Gauge,
  TrendingUp,
  BarChart3,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Truck,
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';

export default function TechnoFundaPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'mmi' | 'pead' | 'vahan'>('mmi');
  const [peadFilter, setPeadFilter] = useState<'all' | 'high_surprise' | 'recent'>('all');

  // Market Mood State (68: Greed)
  const mmiScore = 68;
  const mmiAngle = (mmiScore / 100) * 180 - 90; // -90 deg to +90 deg

  const mmiComponents = [
    { label: 'Market Breadth (% > 50 EMA)', value: 74, status: 'Strong Bullish' },
    { label: 'Volatility / India VIX Sub-Score', value: 62, status: 'Low Fear (13.4)' },
    { label: 'Trend Positioning (Nifty vs 200 EMA)', value: 71, status: 'Above 200 EMA (+6.2%)' },
    { label: 'Institutional Liquidity (FII/DII)', value: 65, status: 'Net Inflow (+₹2,140 Cr)' },
  ];

  // PEAD Data
  const peadStocks = [
    {
      symbol: 'TRENT',
      name: 'Trent Limited',
      daysAgo: 4,
      surprise: 28.7,
      yoyRev: 53.4,
      yoyPat: 126.2,
      drift20d: 8.3,
      stage: 'Stage 2 VCP Breakout',
    },
    {
      symbol: 'KAYNES',
      name: 'Kaynes Technology India Ltd',
      daysAgo: 11,
      surprise: 22.3,
      yoyRev: 48.0,
      yoyPat: 94.2,
      drift20d: 11.3,
      stage: 'High-Tight Flag',
    },
    {
      symbol: 'DIXON',
      name: 'Dixon Technologies Ltd',
      daysAgo: 8,
      surprise: 18.1,
      yoyRev: 42.1,
      yoyPat: 88.5,
      drift20d: 11.0,
      stage: 'Base-on-Base Consolidation',
    },
    {
      symbol: 'HAL',
      name: 'Hindustan Aeronautics Ltd',
      daysAgo: 20,
      surprise: 16.7,
      yoyRev: 24.3,
      yoyPat: 52.0,
      drift20d: 10.6,
      stage: 'Pocket Pivot Retest',
    },
    {
      symbol: 'POLYCAB',
      name: 'Polycab India Ltd',
      daysAgo: 15,
      surprise: 14.9,
      yoyRev: 28.5,
      yoyPat: 45.1,
      drift20d: 7.7,
      stage: 'Cup-with-Handle Base',
    },
  ];

  const filteredPead = peadStocks.filter((s) => {
    if (peadFilter === 'high_surprise') return s.surprise > 20;
    if (peadFilter === 'recent') return s.daysAgo <= 7;
    return true;
  });

  // Vahan Data
  const vahanCategories = [
    {
      code: '2W',
      title: 'Two-Wheelers (2W)',
      volume: '14,28,500 units',
      yoy: '+14.2%',
      positive: true,
      takeaway: 'Rural income recovery and festival inventory build driving demand.',
      oems: ['Hero MotoCorp', 'Bajaj Auto', 'TVS Motor', 'Eicher Motors'],
    },
    {
      code: 'PV',
      title: 'Passenger Vehicles (PV / SUVs)',
      volume: '3,45,200 units',
      yoy: '+8.6%',
      positive: true,
      takeaway: 'Premium SUV segment continues to gain market share over entry hatchbacks.',
      oems: ['Maruti Suzuki', 'Hyundai India', 'Tata Motors', 'M&M'],
    },
    {
      code: 'CV',
      title: 'Commercial Vehicles (CV)',
      volume: '88,400 units',
      yoy: '+4.1%',
      positive: true,
      takeaway: 'Stable mining and infrastructure logistics offset monsoon construction lull.',
      oems: ['Tata Motors', 'Ashok Leyland', 'VECV (Eicher)'],
    },
    {
      code: 'Tractor',
      title: 'Agricultural Tractors',
      volume: '69,800 units',
      yoy: '+11.8%',
      positive: true,
      takeaway: 'Abundant spatial monsoon coverage improving Kharif sowing sentiments.',
      oems: ['Mahindra Tractors', 'Escorts Kubota', 'TAFE'],
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
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
          <TrendingUp size={14} />
          <span>Institutional Research & Execution Framework</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
          {t.nav.tools} & Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Systematic institutional indicators blending technical breadth, earnings surprises (PEAD), and real-economy Vahan motor vehicle registration feeds.
        </p>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <button
          onClick={() => setActiveTab('mmi')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mmi' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'mmi' ? 'var(--color-primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Gauge size={16} />
          <span>Market Mood Index (MMI)</span>
        </button>

        <button
          onClick={() => setActiveTab('pead')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pead' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'pead' ? 'var(--color-primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BarChart3 size={16} />
          <span>PEAD Earnings Screener</span>
        </button>

        <button
          onClick={() => setActiveTab('vahan')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'vahan' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'vahan' ? 'var(--color-primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Truck size={16} />
          <span>Vahan Auto Tracker</span>
        </button>
      </div>

      {/* TAB 1: MARKET MOOD INDEX */}
      {activeTab === 'mmi' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* Gauge Card */}
            <div
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Current Sentiment Oscillator
              </div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>
                Market Mood: <span style={{ color: 'var(--color-success-400)' }}>Greed (68 / 100)</span>
              </h2>

              {/* Semicircular Visual Gauge */}
              <div style={{ position: 'relative', width: '260px', height: '140px', overflow: 'hidden', margin: 'var(--space-4) 0' }}>
                <svg width="260" height="140" viewBox="0 0 260 140">
                  <path
                    d="M 20 130 A 110 110 0 0 1 240 130"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  {/* Color Arc Segments */}
                  <path
                    d="M 20 130 A 110 110 0 0 1 65 52"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                  />
                  <path
                    d="M 65 52 A 110 110 0 0 1 110 24"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="20"
                  />
                  <path
                    d="M 110 24 A 110 110 0 0 1 150 24"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="20"
                  />
                  <path
                    d="M 150 24 A 110 110 0 0 1 195 52"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                  />
                  <path
                    d="M 195 52 A 110 110 0 0 1 240 130"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="20"
                  />

                  {/* Needle */}
                  <g transform={`rotate(${mmiAngle} 130 130)`}>
                    <line x1="130" y1="130" x2="130" y2="35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="130" cy="130" r="8" fill="#ffffff" />
                  </g>
                </svg>
              </div>

              {/* Zones legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <span>Extreme Fear (0-30)</span>
                <span>Fear (30-50)</span>
                <span>Neutral (50-65)</span>
                <span style={{ color: 'var(--color-success-400)', fontWeight: 700 }}>Greed (65-80)</span>
                <span>Extreme Greed (80-100)</span>
              </div>
            </div>

            {/* Sub-Components Breakdown */}
            <div
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                  Underlying 4-Factor Breath Metrics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {mmiComponents.map((c, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.status} ({c.value}/100)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${c.value}%`,
                            height: '100%',
                            background: c.value > 65 ? 'var(--color-success-400)' : 'var(--color-primary-400)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable takeaway */}
              <div
                style={{
                  marginTop: 'var(--space-6)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--color-success-400)' }}>Actionable Guidance: </strong>
                Market breadth remains supportive with 74% of stocks above their 50-day EMA. Rather than initiating aggressive extended entries, maintain trailing stops on existing Stage 2 compounders.
              </div>
            </div>
          </div>

          {/* Citation badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} />
              <span>Data Source: NSE / BSE India Indices & Institutional Cash Flow Feed</span>
            </div>
            <span>Recomputed daily at 04:30 PM IST • Formula v1.4</span>
          </div>
        </div>
      )}

      {/* TAB 2: PEAD EARNINGS SCREENER */}
      {activeTab === 'pead' && (
        <div>
          {/* Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '2px' }}>
                Post-Earnings Announcement Drift (PEAD) Screener
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Tracks stocks beating consensus EPS by &gt;10% with institutional accumulation footprints over the 20-to-60 day post-results drift window.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setPeadFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: peadFilter === 'all' ? 'var(--color-primary-500)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All Setups ({peadStocks.length})
              </button>
              <button
                onClick={() => setPeadFilter('high_surprise')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: peadFilter === 'high_surprise' ? 'var(--color-primary-500)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Top Surprise (&gt;20%)
              </button>
              <button
                onClick={() => setPeadFilter('recent')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: peadFilter === 'recent' ? 'var(--color-primary-500)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Recent (&le; 7 Days)
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
              marginBottom: 'var(--space-6)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Ticker / Company</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Result Recency</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>EPS Surprise</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>YoY Revenue</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>YoY PAT</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>20D Drift</th>
                  <th style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Techno Pattern</th>
                </tr>
              </thead>
              <tbody>
                {filteredPead.map((s) => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary-400)', fontSize: 'var(--text-sm)' }}>
                          {s.symbol}
                        </span>
                        <ArrowUpRight size={12} color="var(--text-muted)" />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.name}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {s.daysAgo} days ago
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--color-success-400)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                        }}
                      >
                        +{s.surprise}%
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      +{s.yoyRev}%
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success-400)' }}>
                      +{s.yoyPat}%
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                      +{s.drift20d}%
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {s.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Citation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} />
              <span>Source: NSE / BSE Quarterly Corporate Financial Filings</span>
            </div>
            <span>Institutional Drift Model v2.1</span>
          </div>
        </div>
      )}

      {/* TAB 3: VAHAN AUTO TRACKER */}
      {activeTab === 'vahan' && (
        <div>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '2px' }}>
              Vahan Auto Registration Macro Indicator
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Monthly vehicle registrations directly from the Ministry of Road Transport & Highways (MoRTH) Vahan portal — a reliable, high-frequency proxy for Indian economic activity and consumer confidence.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {vahanCategories.map((c) => (
              <div
                key={c.code}
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {c.code} Segment
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--color-success-400)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                      }}
                    >
                      {c.yoy} YoY
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '4px' }}>
                    {c.title}
                  </h3>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                    {c.volume}
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                    {c.takeaway}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Key Listed Manufacturers:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {c.oems.map((o) => (
                      <span
                        key={o}
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Citation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} />
              <span>Source: VAHAN Dashboard, Ministry of Road Transport & Highways, Govt. of India (parivahan.gov.in)</span>
            </div>
            <span>Updated monthly</span>
          </div>
        </div>
      )}

      {/* Mandatory SEBI & AMFI Disclaimer Footer */}
      <div
        style={{
          marginTop: 'var(--space-10)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
        }}
      >
        <ShieldCheck size={20} color="var(--color-primary-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Regulatory Disclosure & Disclaimer: </strong>
          All indicators, calculators, and analytical tools provided on this platform (including the Market Mood Index, PEAD screener, and Vahan tracker) are developed strictly for self-directed research, education, and analytical simulation. FinanciallyFree is an AMFI-registered Mutual Fund Distributor (ARN-350272) and is NOT a SEBI-registered Research Analyst or Investment Adviser. None of the content herein constitutes an offer, solicitation, or recommendation to buy or sell any security. Mutual fund investments are subject to market risks; read all scheme related documents carefully.
        </div>
      </div>
    </div>
  );
}
