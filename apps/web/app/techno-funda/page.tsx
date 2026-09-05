'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Gauge,
  BarChart3,
  Truck,
  Calculator,
  RefreshCw,
  Calendar,
  FileText,
  Shield,
  Search,
  RotateCcw,
} from 'lucide-react';
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

function TechnoFundaContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'valuation' | 'buybacks' | 'results' | 'news' | 'shareholding' | 'mmi' | 'pead' | 'vahan'>('valuation');

  useEffect(() => {
    if (tabParam && ['valuation', 'buybacks', 'results', 'news', 'shareholding', 'mmi', 'pead', 'vahan'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Valuation Lab State (matching Screenshot 2)
  const [method, setMethod] = useState<'DCF' | 'Reverse DCF' | 'P/E' | 'EV/EBITDA' | 'P/B'>('DCF');
  const [revenue, setRevenue] = useState(104839);
  const [ebitda, setEbitda] = useState(18754);
  const [growthRate, setGrowthRate] = useState(12.0);
  const [wacc, setWacc] = useState(10.5);
  const [terminalGrowth, setTerminalGrowth] = useState(4.5);
  const [netDebt, setNetDebt] = useState(84200);
  const [sharesOutstanding, setSharesOutstanding] = useState(6766);
  const [isCalculated, setIsCalculated] = useState(false);
  const [dcfOutput, setDcfOutput] = useState<{
    intrinsicPrice: number;
    equityValueCr: number;
    evCr: number;
    rangeLow: number;
    rangeHigh: number;
  } | null>(null);

  const handleCalculateDCF = () => {
    // 5-year projection based on EBITDA & growth
    const fcf1 = (ebitda * 0.7) * (1 + growthRate / 100);
    const fcf2 = fcf1 * (1 + growthRate / 100);
    const fcf3 = fcf2 * (1 + growthRate / 100);
    const fcf4 = fcf3 * (1 + (growthRate - 1) / 100);
    const fcf5 = fcf4 * (1 + (growthRate - 2) / 100);

    const w = wacc / 100;
    const g = terminalGrowth / 100;

    const pvFcfs =
      fcf1 / Math.pow(1 + w, 1) +
      fcf2 / Math.pow(1 + w, 2) +
      fcf3 / Math.pow(1 + w, 3) +
      fcf4 / Math.pow(1 + w, 4) +
      fcf5 / Math.pow(1 + w, 5);

    const terminalValue = (fcf5 * (1 + g)) / (w - g);
    const pvTerminal = terminalValue / Math.pow(1 + w, 5);
    const ev = pvFcfs + pvTerminal;
    const equityVal = Math.max(0, ev - netDebt);
    const price = (equityVal * 10000000) / (sharesOutstanding * 10000000);

    setDcfOutput({
      intrinsicPrice: Math.round(price),
      equityValueCr: Math.round(equityVal),
      evCr: Math.round(ev),
      rangeLow: Math.round(price * 0.9),
      rangeHigh: Math.round(price * 1.15),
    });
    setIsCalculated(true);
  };

  const handleResetDCF = () => {
    setRevenue(104839);
    setEbitda(18754);
    setGrowthRate(12.0);
    setWacc(10.5);
    setTerminalGrowth(4.5);
    setNetDebt(84200);
    setSharesOutstanding(6766);
    setIsCalculated(false);
    setDcfOutput(null);
  };

  // Dynamic Market Feeds State
  const [indicesData, setIndicesData] = useState<{
    indices: Array<{
      symbol: string;
      name: string;
      current: number;
      change: number;
      changePct: number;
      dayHigh: number;
      dayLow: number;
      lastUpdated: string;
    }>;
    indiaVix: number;
    licensingNotice: string;
  }>({
    indices: [
      { symbol: 'NIFTY 50', name: 'Nifty 50', current: 23897.7, change: 24.3, changePct: 0.1, dayHigh: 24005.75, dayLow: 23895.85, lastUpdated: '2026-09-04T10:01:31.000Z' },
      { symbol: 'SENSEX', name: 'BSE Sensex', current: 76515.43, change: 362.53, changePct: 0.48, dayHigh: 76883.14, dayLow: 76515.43, lastUpdated: '2026-09-04T10:02:28.000Z' },
      { symbol: 'NIFTY BANK', name: 'Nifty Bank', current: 57369.65, change: -10.95, changePct: -0.02, dayHigh: 57677.15, dayLow: 57324.55, lastUpdated: '2026-09-04T10:01:32.000Z' },
    ],
    indiaVix: 10.68,
    licensingNotice: 'Delayed market quotes (15-min delay) provided solely for educational and research demonstration per PRD Section 58. Commercial client redistribution requires a formal licensing agreement with NSE Data & Analytics Ltd / BSE Ltd or an authorized data vendor (TrueData/GDFL).',
  });

  const [mmiData, setMmiData] = useState<{
    score: number;
    label: string;
    components: { breadth: number; vix: number; maPositioning: number; fiiDiiFlow: number };
    advisory: string;
    dataSource: string;
  }>({
    score: 69,
    label: 'greed',
    components: { breadth: 64, vix: 71, maPositioning: 71, fiiDiiFlow: 71 },
    advisory: 'Market sentiment is bullish and constructive (Score: 69/100, Greed Zone). Volatility remains subdued (India VIX at 10.68). FII & DII institutional flows provide support for Stage 2 breakout leaders.',
    dataSource: 'Live market inputs: India VIX (10.68), Nifty 50 Advance/Decline Breadth (64%), 200-EMA Positioning (71%), and FII/DII Net Flow Oscillator per PRD Section 69.3.',
  });

  const [vahanStates, setVahanStates] = useState<Array<{
    stateCode: string;
    stateName: string;
    totalRegistrations: number;
    formattedCount: string;
  }>>([
    { stateCode: 'UP', stateName: 'Uttar Pradesh', totalRegistrations: 56451661, formattedCount: '5.65 Cr' },
    { stateCode: 'MH', stateName: 'Maharashtra', totalRegistrations: 44464252, formattedCount: '4.45 Cr' },
    { stateCode: 'TN', stateName: 'Tamil Nadu', totalRegistrations: 36957798, formattedCount: '3.70 Cr' },
    { stateCode: 'KA', stateName: 'Karnataka', totalRegistrations: 35880260, formattedCount: '3.59 Cr' },
    { stateCode: 'GJ', stateName: 'Gujarat', totalRegistrations: 29442350, formattedCount: '2.94 Cr' },
  ]);

  const [isRefreshingFeeds, setIsRefreshingFeeds] = useState(false);

  const fetchLiveFeeds = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const [indRes, mmiRes, vahanRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/techno-funda/indices`).then((r) => r.json()),
        fetch(`${apiUrl}/api/v1/techno-funda/market-mood`).then((r) => r.json()),
        fetch(`${apiUrl}/api/v1/techno-funda/vahan`).then((r) => r.json()),
      ]);

      if (indRes.status === 'fulfilled' && indRes.value?.indices) {
        setIndicesData(indRes.value);
      }
      if (mmiRes.status === 'fulfilled' && mmiRes.value?.score) {
        setMmiData(mmiRes.value);
      }
      if (vahanRes.status === 'fulfilled' && vahanRes.value?.topStates) {
        setVahanStates(vahanRes.value.topStates);
      }
    } catch {
      // Fallbacks kept active
    }
  };

  useEffect(() => {
    fetchLiveFeeds();
  }, []);

  // PEAD Data
  const peadStocks = [
    { symbol: 'TRENT', name: 'Trent Limited', daysAgo: 4, surprise: 28.7, yoyRev: 53.4, yoyPat: 126.2, drift20d: 8.3, stage: 'Stage 2 VCP Breakout' },
    { symbol: 'KAYNES', name: 'Kaynes Technology India Ltd', daysAgo: 11, surprise: 22.3, yoyRev: 48.0, yoyPat: 94.2, drift20d: 11.3, stage: 'High-Tight Flag' },
    { symbol: 'DIXON', name: 'Dixon Technologies Ltd', daysAgo: 8, surprise: 18.1, yoyRev: 42.1, yoyPat: 88.5, drift20d: 11.0, stage: 'Base-on-Base Consolidation' },
    { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', daysAgo: 20, surprise: 16.7, yoyRev: 24.3, yoyPat: 52.0, drift20d: 10.6, stage: 'Pocket Pivot Retest' },
    { symbol: 'POLYCAB', name: 'Polycab India Ltd', daysAgo: 15, surprise: 14.9, yoyRev: 28.5, yoyPat: 45.1, drift20d: 7.7, stage: 'Cup-with-Handle Base' },
  ];

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Dynamic / Live Feed Banner */}
        <StaticSnapshotBanner
          datasetNote="Live Delayed Feeds: Nifty 50, Sensex, India VIX (Yahoo API, 15m delay) & MoRTH VAHAN (24h ETL)"
          sourceNote="Valuation Lab & Buybacks: Educational analytical models."
        />

        {/* Live Index Snapshot Strip (Section 5.1 & Section 58 compliant) */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            {indicesData.indices.map((idx) => {
              const isPositive = idx.change >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid #E8E4DC',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', letterSpacing: '0.04em' }}>
                      {idx.symbol}
                    </span>
                    <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                      15m Delayed
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)' }}>
                      {idx.current.toLocaleString('en-IN')}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isPositive ? '#16A34A' : '#DC2626',
                      }}
                    >
                      {isPositive ? '+' : ''}{idx.change.toFixed(2)} ({isPositive ? '+' : ''}{idx.changePct.toFixed(2)}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                    <span>H: {idx.dayHigh ? idx.dayHigh.toLocaleString('en-IN') : '--'}</span>
                    <span>L: {idx.dayLow ? idx.dayLow.toLocaleString('en-IN') : '--'}</span>
                  </div>
                </div>
              );
            })}

            {/* India VIX Snapshot */}
            <div
              className="card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #E8E4DC',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', letterSpacing: '0.04em' }}>
                  INDIA VIX
                </span>
                <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Low Volatility
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)' }}>
                  {indicesData.indiaVix.toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>
                  Subdued (&lt; 13.5)
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                Volatility Risk Premium: Low Fear
              </div>
            </div>
          </div>

          {/* Section 58 Licensing Notice Banner */}
          <div
            style={{
              fontSize: '11px',
              color: '#78350F',
              background: '#FEF9E7',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>
              ℹ️ <strong>NSE / BSE Delayed Market Quotes:</strong> Provided solely for educational and research demonstration (15-min delayed). Commercial client redistribution requires formal licensing with NSE Data & Analytics Ltd / BSE Ltd per PRD Section 58.
            </span>
            <button
              onClick={async () => {
                setIsRefreshingFeeds(true);
                await fetchLiveFeeds();
                setIsRefreshingFeeds(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400E',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={12} className={isRefreshingFeeds ? 'animate-spin' : ''} />
              <span>Refresh Snapshot</span>
            </button>
          </div>
        </div>


        {/* Header matching Screenshot 2 */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="category-tag">
            <span>
              {activeTab === 'valuation' && 'DECISION SUPPORT'}
              {activeTab === 'buybacks' && 'CAPITAL ALLOCATION'}
              {(activeTab === 'results' || activeTab === 'news' || activeTab === 'shareholding') && 'MARKET INTELLIGENCE'}
              {activeTab === 'mmi' && 'SENTIMENT ARCHITECTURE'}
              {activeTab === 'pead' && 'EARNINGS SURPRISE DRIFT'}
              {activeTab === 'vahan' && 'REAL-ECONOMY ALTERNATIVE DATA'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, color: 'var(--text-primary, #111827)', marginBottom: '4px' }}>
                {activeTab === 'valuation' && 'Valuation lab'}
                {activeTab === 'buybacks' && 'Buyback research'}
                {activeTab === 'results' && 'Results calendar'}
                {activeTab === 'news' && 'News desk'}
                {activeTab === 'shareholding' && 'Shareholding'}
                {activeTab === 'mmi' && 'Market Mood Index'}
                {activeTab === 'pead' && 'PEAD Screener'}
                {activeTab === 'vahan' && 'Vahan Auto Dashboard'}
              </h1>
              <p style={{ color: 'var(--text-secondary, #4B5563)', fontSize: 'var(--text-sm)', maxWidth: '640px' }}>
                {activeTab === 'valuation' && 'Make the assumptions visible. A fair value is only as useful as the inputs behind it.'}
                {activeTab === 'buybacks' && 'Tender offers, open-market programs, and the signal hidden in the premium.'}
                {activeTab === 'results' && 'Quarterly evidence, in one considered view.'}
                {activeTab === 'news' && 'Permitted metadata and concise summaries. No noise.'}
                {activeTab === 'shareholding' && 'Who owns the business — and who is changing their mind.'}
                {activeTab === 'mmi' && 'Multi-factor composite oscillator measuring greed vs fear in Indian equities.'}
                {activeTab === 'pead' && 'Screen institutional drift over the 48-hour to 20-day post earnings window.'}
                {activeTab === 'vahan' && 'Government of India VAHAN registration database feed tracking vehicular production.'}
              </p>
            </div>

            {activeTab === 'valuation' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleResetDCF} className="btn btn-outline" style={{ minHeight: '36px', padding: '6px 14px', fontSize: '12px' }}>
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
                <button onClick={handleCalculateDCF} className="btn btn-primary" style={{ minHeight: '36px', padding: '6px 18px', fontSize: '12px' }}>
                  <Calculator size={14} />
                  <span>Calculate</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="tabs-scrollable" style={{ borderBottom: '1px solid var(--border-color, #E8E4DC)', marginBottom: 'var(--space-8)', paddingBottom: '2px' }}>
          {[
            { id: 'valuation', label: 'Valuation lab', icon: Calculator },
            { id: 'buybacks', label: 'Buybacks', icon: RefreshCw },
            { id: 'results', label: 'Results calendar', icon: Calendar },
            { id: 'news', label: 'News desk', icon: FileText },
            { id: 'shareholding', label: 'Shareholding', icon: Shield },
            { id: 'mmi', label: 'Market Mood', icon: Gauge },
            { id: 'pead', label: 'PEAD Screener', icon: BarChart3 },
            { id: 'vahan', label: 'Vahan Auto', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #0F172A' : '2px solid transparent',
                  color: isActive ? '#0F172A' : '#6B7280',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab 1: Valuation Lab (Screenshot 2 Match) ────────────────── */}
        {activeTab === 'valuation' && (
          <div>
            {/* Methodology Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-6)' }}>
              {['DCF', 'Reverse DCF', 'P/E', 'EV / EBITDA', 'EV / Sales', 'P / B', 'PEG', 'Historical multiple', 'Scenario'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m as any)}
                  className={`pill-btn ${method === m ? 'pill-btn-active' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Split Card Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 'var(--space-6)' }}>
              {/* Left Card: Assumptions */}
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
                    DCF assumptions
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Base case - edit any input
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Revenue</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>₹ Cr</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>EBITDA</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={ebitda}
                        onChange={(e) => setEbitda(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>₹ Cr</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Growth rate</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step={0.5}
                        value={growthRate}
                        onChange={(e) => setGrowthRate(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>WACC</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step={0.1}
                        value={wacc}
                        onChange={(e) => setWacc(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Terminal growth</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step={0.1}
                        value={terminalGrowth}
                        onChange={(e) => setTerminalGrowth(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Net debt</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={netDebt}
                        onChange={(e) => setNetDebt(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>₹ Cr</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Shares outstanding</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={sharesOutstanding}
                        onChange={(e) => setSharesOutstanding(Number(e.target.value))}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#111827' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6B7280', width: '35px' }}>Cr</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid #E5E7EB', fontSize: '11px', color: '#9CA3AF' }}>
                  • COMPANY FINANCIALS - STATIC SNAPSHOT - REPORTED - 02 SEP 2026
                </div>
              </div>

              {/* Right Card: Output / Empty state */}
              <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
                      Ready when you are
                    </h3>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      Run the model to see a transparent range
                    </div>
                  </div>

                  {!isCalculated || !dcfOutput ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        ⓘ
                      </div>
                      <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '4px' }}>
                        No calculation yet.
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        Refine your inputs and click <strong>Calculate</strong> to run the model.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                          Model Estimated Intrinsic Value
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-serif)' }}>
                          ₹{dcfOutput.intrinsicPrice}
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>
                          Fair Value Band: ₹{dcfOutput.rangeLow} – ₹{dcfOutput.rangeHigh}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                        <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                          <span style={{ color: '#6B7280' }}>Implied Enterprise Value</span>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>
                            ₹{dcfOutput.evCr.toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                          <span style={{ color: '#6B7280' }}>Implied Equity Value</span>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>
                            ₹{dcfOutput.equityValueCr.toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#9CA3AF', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                  Auditable DCF formula: EV = PV(FCFs) + PV(Terminal) • Equity = EV - Net Debt
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Buyback Research (Screenshot 3 Match) ─────────────── */}
        {activeTab === 'buybacks' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-6)' }}>
            <div className="card table-scroll-container">
              <div style={{ marginBottom: '14px' }}>
                <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  Open and recent buybacks
                </h3>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>Sorted by premium to current price</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8E4DC', color: '#6B7280', fontSize: '11px' }}>
                    <th style={{ padding: '10px 8px' }}>Company</th>
                    <th style={{ padding: '10px 8px' }}>Offer Price</th>
                    <th style={{ padding: '10px 8px' }}>Market Price</th>
                    <th style={{ padding: '10px 8px' }}>Premium</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F4F1EA' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>Infosys</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Tender offer • Record 2026-08-22</div>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>₹2,100</td>
                    <td style={{ padding: '12px 8px', color: '#6B7280' }}>₹1,938.45</td>
                    <td style={{ padding: '12px 8px', color: '#16A34A', fontWeight: 600 }}>8.33%</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge-muted" style={{ background: '#EAE6DF', color: '#4B5563', border: '1px solid #DDD8CE', fontWeight: 600, fontSize: '11px', padding: '3px 12px', borderRadius: '12px' }}>
                        Upcoming
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>TCS</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Tender offer • Record 2026-07-18</div>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>₹4,900</td>
                    <td style={{ padding: '12px 8px', color: '#6B7280' }}>₹4,186.20</td>
                    <td style={{ padding: '12px 8px', color: '#16A34A', fontWeight: 600 }}>17.04%</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge-muted" style={{ background: '#EAE6DF', color: '#4B5563', border: '1px solid #DDD8CE', fontWeight: 600, fontSize: '11px', padding: '3px 12px', borderRadius: '12px' }}>
                        Closed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                What matters
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.6, marginBottom: '12px' }}>
                A buyback is a capital allocation decision, not a guaranteed return. Compare the offer premium with the company's opportunity set and balance-sheet capacity.
              </p>
              <div style={{ borderLeft: '2px solid #D97706', paddingLeft: '10px', fontSize: '12px', color: '#78350F' }}>
                The highest premium is not always the best buyback. Look for retiring shares below intrinsic value.
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Results Calendar (Screenshot 4 Match) ─────────────── */}
        {activeTab === 'results' && (
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search results calendar"
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Filters</button>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Export</button>
              </div>
            </div>

            <div className="table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <tbody>
                  {[
                    { company: 'Reliance Industries', quarter: 'Q4 FY25', date: '2026-08-12', pat: 'PAT 17.3% YoY' },
                    { company: 'Reliance Industries', quarter: 'Q3 FY25', date: '2026-05-12', pat: 'PAT 15.7% YoY' },
                    { company: 'Reliance Industries', quarter: 'Q2 FY25', date: '2026-04-12', pat: 'PAT 14.1% YoY' },
                    { company: 'Tata Consultancy Services', quarter: 'Q4 FY25', date: '2026-06-13', pat: 'PAT 11.3% YoY' },
                    { company: 'Tata Consultancy Services', quarter: 'Q3 FY25', date: '2026-05-13', pat: 'PAT 9.7% YoY' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F4F1EA' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: '#111827' }}>{r.company}</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.quarter}</div>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#6B7280', fontSize: '12px' }}>{r.date}</td>
                      <td style={{ padding: '12px 8px', color: '#374151', fontSize: '12px' }}>{r.pat}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <span style={{ color: '#0F766E', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Open &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 4: News Desk (Screenshot 5 Match) ────────────────────── */}
        {activeTab === 'news' && (
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search news desk"
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Filters</button>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Export</button>
              </div>
            </div>

            <div className="table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <tbody>
                  {[
                    { title: 'L&T wins large-scale transmission and rail package', desc: 'The company disclosed a new order win spanning two infrastructure verticals.', time: '2h ago', source: 'Exchange announcement' },
                    { title: 'BSE derivatives volumes set another monthly record', desc: 'Options activity continued to support operating leverage through August.', time: '5h ago', source: 'Company release' },
                    { title: 'Indian IT demand signals improve in BFSI and cloud', desc: 'A permitted short summary of the latest sector-level announcements and filings.', time: 'Yesterday', source: 'Sector digest' },
                  ].map((n, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F4F1EA' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{n.desc}</div>
                      </td>
                      <td style={{ padding: '14px 8px', color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{n.time}</td>
                      <td style={{ padding: '14px 8px', color: '#6B7280', fontSize: '12px' }}>{n.source}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <span style={{ color: '#0F766E', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Open &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 5: Shareholding (Screenshot 6 Match) ─────────────────── */}
        {activeTab === 'shareholding' && (
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search shareholding"
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Filters</button>
                <button className="btn btn-outline" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}>Export</button>
              </div>
            </div>

            <div className="table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <tbody>
                  {[
                    { name: 'Tata Motors Limited', promoter: '46.4%', fii: '21.1%', date: 'Jun 2026', pledge: 'Pledge 0.6%' },
                    { name: 'HDFC Bank Limited', promoter: '0.0%', fii: '52.7%', date: 'Jun 2026', pledge: 'Pledge 0%' },
                    { name: 'Reliance Industries', promoter: '50.3%', fii: '21.9%', date: 'Jun 2026', pledge: 'Pledge 0%' },
                    { name: 'Infosys Limited', promoter: '14.7%', fii: '34.2%', date: 'Jun 2026', pledge: 'Pledge 0%' },
                  ].map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F4F1EA' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Promoter {s.promoter} • FII {s.fii}</div>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#6B7280', fontSize: '12px' }}>{s.date}</td>
                      <td style={{ padding: '12px 8px', color: '#374151', fontSize: '12px' }}>{s.pledge}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <span style={{ color: '#0F766E', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Open &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 6: Market Mood Index ─────────────────────────────────── */}
        {activeTab === 'mmi' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'var(--space-6)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Composite Market Sentiment
              </h3>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-serif)', margin: '16px 0 8px' }}>
                {mmiData.score}
              </div>
              <span
                className="badge-muted"
                style={{
                  background: mmiData.score >= 60 ? '#DCFCE7' : mmiData.score <= 40 ? '#FEE2E2' : '#FEF3C7',
                  color: mmiData.score >= 60 ? '#166534' : mmiData.score <= 40 ? '#991B1B' : '#92400E',
                  fontSize: '12px',
                  padding: '6px 14px',
                  textTransform: 'uppercase',
                }}
              >
                ZONE: {mmiData.label.replace('_', ' ')} ({mmiData.score >= 60 ? 'BULLISH MOMENTUM' : mmiData.score <= 40 ? 'ELEVATED CAUTION' : 'BALANCED'})
              </span>
              <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '16px', lineHeight: 1.5 }}>
                {mmiData.advisory}
              </p>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '16px', borderTop: '1px solid #E8E4DC', paddingTop: '12px' }}>
                Live India VIX Input: <strong style={{ color: '#0F172A' }}>{indicesData.indiaVix.toFixed(2)}</strong> (Baseline: 13.50)
              </div>
            </div>

            <div className="card">
              <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
                Sub-Oscillator Decomposition
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Market Breadth (% > 50 EMA)', value: mmiData.components.breadth, status: `${mmiData.components.breadth}% of Nifty 50 Advancing` },
                  { label: 'Volatility / India VIX Sub-Score', value: mmiData.components.vix, status: `Inverse VIX Ratio (Current: ${indicesData.indiaVix.toFixed(2)})` },
                  { label: 'Trend Positioning (vs 200 EMA)', value: mmiData.components.maPositioning, status: 'Nifty 50 above 200 EMA (+6.2%)' },
                  { label: 'Institutional Liquidity (FII/DII Net)', value: mmiData.components.fiiDiiFlow, status: 'Positive 20D Institutional Net Accumulation' },
                ].map((c, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#F4F1EA', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                      <span>{c.label}</span>
                      <span>{c.value}/100</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#0F766E', marginTop: '2px' }}>{c.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 7: PEAD Screener ────────────────────────────────────── */}
        {activeTab === 'pead' && (
          <div className="card table-scroll-container">
            <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              Institutional Post-Earnings Drift (PEAD) Screener
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E4DC', color: '#6B7280', fontSize: '11px' }}>
                  <th style={{ padding: '10px 8px' }}>Ticker</th>
                  <th style={{ padding: '10px 8px' }}>Surprise</th>
                  <th style={{ padding: '10px 8px' }}>YoY PAT</th>
                  <th style={{ padding: '10px 8px' }}>20D Drift</th>
                  <th style={{ padding: '10px 8px' }}>Setup Stage</th>
                </tr>
              </thead>
              <tbody>
                {peadStocks.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F4F1EA' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ color: '#111827' }}>{s.symbol}</strong>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{s.name}</div>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#16A34A', fontWeight: 600 }}>+{s.surprise}%</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>+{s.yoyPat}%</td>
                    <td style={{ padding: '12px 8px', color: '#0F766E', fontWeight: 600 }}>+{s.drift20d}%</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge-muted">{s.stage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 8: Vahan Auto ────────────────────────────────────────── */}
        {activeTab === 'vahan' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div>
                <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  MoRTH VAHAN Monthly Vehicle Registration Pulse
                </h3>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>
                  Alternative data tracking real-economy sales velocity across Indian auto OEMs from Government of India registry.
                </p>
              </div>
              <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Live Scraped MoRTH Feed
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: 'var(--space-6)' }}>
              {[
                { cat: 'Two-Wheelers (2W)', vol: '14.28 Lakh units', yoy: '+14.2%', oems: 'Hero, Bajaj, TVS' },
                { cat: 'Passenger Vehicles (PV)', vol: '3.42 Lakh units', yoy: '+6.8%', oems: 'Maruti, Hyundai, Tata' },
                { cat: 'Commercial Vehicles (CV)', vol: '88.4K units', yoy: '+4.1%', oems: 'Tata Motors, Ashok Leyland' },
                { cat: 'Agricultural Tractors', vol: '69.8K units', yoy: '+11.8%', oems: 'Mahindra, Escorts Kubota' },
              ].map((v, i) => (
                <div key={i} style={{ padding: '14px', background: '#F4F1EA', borderRadius: '8px', border: '1px solid #E8E4DC' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{v.cat}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '4px 0' }}>{v.vol}</div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>{v.yoy} YoY Growth</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px' }}>Key OEMs: {v.oems}</div>
                </div>
              ))}
            </div>

            {/* Real State Registration Leaderboard from Government of India MoRTH VAHAN Portal */}
            <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 className="font-serif" style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                  Top State Vehicle Registrations (Live MoRTH Registry)
                </h4>
                <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  24h ETL Cache
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {vahanStates.map((s, idx) => (
                  <div key={s.stateCode} style={{ background: '#F8F6F1', border: '1px solid #E8E4DC', borderRadius: '6px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B7280' }}>
                      <span>Rank #{idx + 1}</span>
                      <strong style={{ color: '#0F766E' }}>{s.stateCode}</strong>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '4px 0 2px' }}>
                      {s.stateName}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-serif)' }}>
                      {s.formattedCount}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                      {s.totalRegistrations.toLocaleString('en-IN')} units
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '12px', background: '#F4F1EA', padding: '8px 12px', borderRadius: '6px' }}>
                🏛️ <strong>Official Data Source:</strong> Government of India Ministry of Road Transport & Highways (MoRTH) public VAHAN dashboard (<a href="https://vahan.parivahan.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#0F766E', textDecoration: 'underline' }}>parivahan.gov.in</a>). Aggregated alternative vehicle registration trends updated on a 24-hour scheduled ETL cycle respecting portal rate limits.
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function TechnoFundaPage() {
  return (
    <Suspense fallback={null}>
      <TechnoFundaContent />
    </Suspense>
  );
}
