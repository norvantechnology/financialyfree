'use client';

import React from 'react';
import '../../styles/options-lab.css';
import {
  TrendingUp,
  Activity,
  Layers,
  Sliders,
  ChevronDown,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export type OptionsTab = 'chain' | 'strategy' | 'oi' | 'iv' | 'sandbox';

interface OptionsShellProps {
  activeTab: OptionsTab;
  onTabChange: (tab: OptionsTab) => void;
  selectedSymbol: string;
  onSymbolChange: (sym: string) => void;
  selectedExpiry: string;
  onExpiryChange: (exp: string) => void;
  expiryDates: string[];
  isSandbox: boolean;
  onToggleSandbox: () => void;
  connectionStatus: 'connected' | 'reconnecting' | 'closed';
  latencyMs: number;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  pcr: number;
  maxPain: number;
  atmIv: number | null;
  onOpenBrokerModal: () => void;
  connectedBroker?: string | null;
  children: React.ReactNode;
}

export const POPULAR_UNDERLYINGS = [
  'NIFTY',
  'BANKNIFTY',
  'FINNIFTY',
  'SENSEX',
  'RELIANCE',
  'HDFCBANK',
  'ICICIBANK',
  'INFY',
  'TCS',
  'SBIN',
];

export const OptionsShell: React.FC<OptionsShellProps> = ({
  activeTab,
  onTabChange,
  selectedSymbol,
  onSymbolChange,
  selectedExpiry,
  onExpiryChange,
  expiryDates,
  isSandbox,
  onToggleSandbox,
  connectionStatus,
  latencyMs,
  spotPrice,
  spotChange,
  spotChangePct,
  pcr,
  maxPain,
  atmIv,
  onOpenBrokerModal,
  connectedBroker,
  children,
}) => {
  const isPositive = spotChange >= 0;

  return (
    <div className="opt-root">
      {/* ── Top Header Controls & Ticker Bar ── */}
      <header className="opt-header">
        <div className="opt-header-inner">
          {activeTab === 'strategy' ? (
            /* Streamlined Single-Line Header for Flagship Strategy Builder (StockMojo Layout) */
            <div className="opt-header-top-row" style={{ alignItems: 'center' }}>
              <div className="opt-brand-group">
                <div className="opt-brand-icon">
                  <Activity className="w-5 h-5 text-teal-700" />
                </div>
                <div className="opt-brand-title" style={{ fontSize: '1.25rem' }}>
                  Options Lab
                  <span className="opt-brand-badge">F&O Suite</span>
                </div>

                {/* Integrated Navigation Tabs */}
                <nav className="opt-tabs-nav" style={{ margin: 0, padding: 0, border: 'none' }}>
                  {[
                    { id: 'strategy', label: 'Strategy Builder', icon: Sliders },
                    { id: 'sandbox', label: 'Simulator', icon: Clock },
                    { id: 'chain', label: 'Option Chain', icon: Layers },
                    { id: 'oi', label: 'OI Tracker & Max Pain', icon: TrendingUp },
                    { id: 'iv', label: 'IV Smile & Surface', icon: Sparkles },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as OptionsTab)}
                        className={`opt-tab-btn ${isActive ? 'active' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right: Mode Toggle & Broker Connect */}
              <div className="opt-selectors-row" style={{ marginLeft: 'auto' }}>
                <button
                  onClick={onToggleSandbox}
                  className={`opt-btn-pill ${isSandbox ? 'active' : ''}`}
                  style={{ padding: '0.45rem 0.875rem', borderRadius: '0.5rem' }}
                  title="Toggle Paper Trading / Live Broker Mode"
                >
                  {isSandbox ? 'Paper Mode' : 'Live Broker Mode'}
                </button>

                <button
                  onClick={onOpenBrokerModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.875rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: connectedBroker && connectedBroker !== 'sandbox' ? '#F0FDF4' : '#FFFFFF',
                    color: connectedBroker && connectedBroker !== 'sandbox' ? '#166534' : '#0F172A',
                    border: connectedBroker && connectedBroker !== 'sandbox' ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <Zap className="w-3.5 h-3.5 text-teal-600" />
                  {connectedBroker && connectedBroker !== 'sandbox'
                    ? `Broker: ${connectedBroker.toUpperCase()}`
                    : 'Connect Broker'}
                </button>
              </div>
            </div>
          ) : (
            /* Standard Full Header for Other Tabs (Option Chain, OI Tracker, IV Surface, Sandbox) */
            <>
              <div className="opt-header-top-row">
                <div className="opt-brand-group">
                  <div className="opt-brand-icon">
                    <Activity className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <div className="opt-brand-title">
                      Options Lab
                      <span className="opt-brand-badge">F&O Analytics</span>
                    </div>
                    <p className="opt-brand-subtitle">
                      Indian NSE / BSE Options Chain & Multi-Leg Strategy Suite
                    </p>
                  </div>

                  {/* Symbol Selector Dropdown */}
                  <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => onSymbolChange(e.target.value)}
                      className="opt-select-dropdown"
                      style={{ paddingRight: '2rem' }}
                    >
                      {POPULAR_UNDERLYINGS.map((sym) => (
                        <option key={sym} value={sym}>
                          {sym}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="w-4 h-4 text-slate-500"
                      style={{
                        position: 'absolute',
                        right: '0.625rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Expiry Selector Dropdown */}
                  {expiryDates.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedExpiry}
                        onChange={(e) => onExpiryChange(e.target.value)}
                        className="opt-select-dropdown"
                        style={{ paddingRight: '1.875rem', fontSize: '0.8125rem' }}
                      >
                        {expiryDates.map((exp) => {
                          let label = exp;
                          try {
                            const target = new Date(exp);
                            const now = new Date();
                            const diffDays = Math.max(0, Math.round((target.getTime() - now.getTime()) / 86400000));
                            const day = target.getDate();
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            label = `${day} ${months[target.getMonth()]} (${diffDays}d)`;
                          } catch {}
                          return (
                            <option key={exp} value={exp}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        className="w-3.5 h-3.5 text-slate-500"
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right: Real-Time Live Quote & Actions */}
                <div className="opt-selectors-row" style={{ marginLeft: 'auto' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.45rem 0.875rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span
                      className={`opt-status-dot ${connectionStatus === 'reconnecting' ? 'reconnecting' : ''}`}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                      {connectionStatus === 'connected' ? `Live (${latencyMs}ms)` : 'Syncing...'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      {selectedSymbol} Spot
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'monospace',
                      }}
                    >
                      ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className={isPositive ? 'opt-text-green' : 'opt-text-red'}
                      style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}
                    >
                      {isPositive ? '+' : ''}
                      {spotChange.toFixed(2)} ({isPositive ? '+' : ''}
                      {spotChangePct.toFixed(2)}%)
                    </span>
                  </div>

                  <button
                    onClick={onToggleSandbox}
                    className={`opt-btn-pill ${isSandbox ? 'active' : ''}`}
                    style={{ padding: '0.45rem 0.875rem', borderRadius: '0.5rem' }}
                    title="Toggle Paper Trading / Live Broker Mode"
                  >
                    {isSandbox ? 'Paper Mode' : 'Live Broker Mode'}
                  </button>

                  <button
                    onClick={onOpenBrokerModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.875rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: connectedBroker && connectedBroker !== 'sandbox' ? '#F0FDF4' : '#FFFFFF',
                      color: connectedBroker && connectedBroker !== 'sandbox' ? '#166534' : '#0F172A',
                      border: connectedBroker && connectedBroker !== 'sandbox' ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 text-teal-600" />
                    {connectedBroker && connectedBroker !== 'sandbox'
                      ? `Broker: ${connectedBroker.toUpperCase()}`
                      : 'Connect Broker'}
                  </button>
                </div>
              </div>

              {/* ── Key Metrics Ribbon (Clean 4-Card Overview) ── */}
              <div className="opt-ticker-grid">
                <div className="opt-ticker-chip">
                  <div className="opt-ticker-chip-label">ATM Strike</div>
                  <div className="opt-ticker-chip-val">
                    ₹{Math.round(spotPrice / 50) * 50}
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: '#64748B',
                        fontWeight: 600,
                        fontFamily: 'sans-serif',
                      }}
                    >
                      Spot: ₹{spotPrice.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </div>

                <div className="opt-ticker-chip">
                  <div className="opt-ticker-chip-label">Put / Call Ratio (PCR)</div>
                  <div className="opt-ticker-chip-val">
                    {pcr.toFixed(2)}
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        fontFamily: 'sans-serif',
                        background:
                          pcr > 1.15
                            ? '#DCFCE7'
                            : pcr < 0.85
                            ? '#FEE2E2'
                            : '#F1F5F9',
                        color:
                          pcr > 1.15
                            ? '#166534'
                            : pcr < 0.85
                            ? '#991B1B'
                            : '#334155',
                      }}
                    >
                      {pcr > 1.15 ? 'Bullish' : pcr < 0.85 ? 'Bearish' : 'Neutral'}
                    </span>
                  </div>
                </div>

                <div className="opt-ticker-chip">
                  <div className="opt-ticker-chip-label">Max Pain Strike</div>
                  <div className="opt-ticker-chip-val opt-text-gold">
                    ₹{maxPain.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="opt-ticker-chip">
                  <div className="opt-ticker-chip-label">ATM Implied Vol (IV)</div>
                  <div className="opt-ticker-chip-val opt-text-sky">
                    {atmIv !== null ? `${atmIv.toFixed(1)}%` : '13.8%'}
                  </div>
                </div>
              </div>

              {/* ── Navigation Tabs ── */}
              <nav className="opt-tabs-nav">
                {[
                  { id: 'strategy', label: 'Strategy Builder', icon: Sliders },
                  { id: 'sandbox', label: 'Simulator', icon: Clock },
                  { id: 'chain', label: 'Option Chain', icon: Layers },
                  { id: 'oi', label: 'OI Tracker & Max Pain', icon: TrendingUp },
                  { id: 'iv', label: 'IV Smile & Surface', icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id as OptionsTab)}
                      className={`opt-tab-btn ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </div>
      </header>

      {/* ── Main Tab Content Container ── */}
      <main className="opt-content-area">{children}</main>
    </div>
  );
};
