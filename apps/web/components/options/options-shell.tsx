'use client';

import React from 'react';
import '../../styles/options-lab.css';
import {
  TrendingUp,
  Activity,
  Layers,
  Sliders,
  ShieldAlert,
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
      {/* ── Persistent Sandbox Warning Banner ── */}
      {isSandbox && (
        <div className="opt-sandbox-banner">
          <div className="opt-sandbox-banner-left">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>SANDBOX MODE ACTIVE:</strong> Virtual paper trading with real live market tick execution. No real capital at risk.
            </span>
          </div>
          <button
            onClick={onToggleSandbox}
            className="opt-sandbox-switch-btn"
          >
            Switch to Live
          </button>
        </div>
      )}

      {/* ── Top Header Controls & Ticker Bar ── */}
      <header className="opt-header">
        <div className="opt-header-inner">
          <div className="opt-header-top-row">
            {/* Left: Module Identity + Symbol Selector */}
            <div className="opt-brand-group">
              <div className="opt-brand-icon">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="opt-brand-title">
                  Options Lab <span className="opt-brand-badge">F&O Pro</span>
                </div>
                <p className="opt-brand-subtitle">Indian NSE/BSE Options & Strategy Suite</p>
              </div>

              {/* Symbol Selector Dropdown */}
              <div style={{ position: 'relative' }}>
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
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              {/* Expiry Selector Dropdown */}
              {expiryDates.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedExpiry}
                    onChange={(e) => onExpiryChange(e.target.value)}
                    className="opt-select-dropdown"
                    style={{ paddingRight: '1.75rem', fontSize: '0.75rem' }}
                  >
                    {expiryDates.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-400" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              )}
            </div>

            {/* Right: Live Spot Ticker, Status Dot, Broker CTA */}
            <div className="opt-selectors-row" style={{ marginLeft: 'auto' }}>
              {/* Real-time Spot Quote */}
              <div className="opt-ticker-chip" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>{selectedSymbol} Spot</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                  ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

              {/* Connection Status Heartbeat Dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px', fontSize: '0.6875rem' }}>
                <span className={`opt-status-dot ${connectionStatus === 'reconnecting' ? 'reconnecting' : ''}`} />
                <span style={{ color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                  {connectionStatus === 'connected' ? `Live (${latencyMs}ms)` : 'Reconnecting'}
                </span>
              </div>

              {/* Broker Connect / Mode Button */}
              <button
                onClick={onOpenBrokerModal}
                className="opt-broker-btn"
                style={{
                  background: connectedBroker ? 'rgba(16, 185, 129, 0.15)' : '#f59e0b',
                  color: connectedBroker ? '#34d399' : '#020617',
                  borderColor: connectedBroker ? 'rgba(16, 185, 129, 0.3)' : '#f59e0b',
                  fontWeight: 700,
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                {connectedBroker ? `Broker: ${connectedBroker.toUpperCase()}` : 'Connect Broker'}
              </button>

              {/* Global Live <-> Sandbox Toggle Button */}
              <button
                onClick={onToggleSandbox}
                className={`opt-btn-pill ${isSandbox ? 'active' : ''}`}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
              >
                {isSandbox ? 'Sandbox Active' : 'Switch Sandbox'}
              </button>
            </div>
          </div>

          {/* ── Key Metrics Ribbon: Spot, PCR, Max Pain, ATM IV ── */}
          <div className="opt-ticker-grid">
            <div className="opt-ticker-chip">
              <div className="opt-ticker-chip-label">PCR (Put / Call)</div>
              <div className="opt-ticker-chip-val">
                {pcr.toFixed(2)}
                <span
                  style={{
                    fontSize: '0.625rem',
                    padding: '0.1rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontWeight: 700,
                    background: pcr > 1.2 ? 'rgba(16, 185, 129, 0.15)' : pcr < 0.8 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: pcr > 1.2 ? '#34d399' : pcr < 0.8 ? '#fb7185' : '#cbd5e1',
                  }}
                >
                  {pcr > 1.2 ? 'Bullish' : pcr < 0.8 ? 'Bearish' : 'Neutral'}
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
                {atmIv !== null ? `${atmIv.toFixed(1)}%` : 'Calculating...'}
              </div>
            </div>

            <div className="opt-ticker-chip">
              <div className="opt-ticker-chip-label">Execution Status</div>
              <div className="opt-ticker-chip-val" style={{ fontSize: '0.8125rem' }}>
                <span className="opt-status-dot" style={{ display: 'inline-block' }} />
                {isSandbox ? 'Paper Fills (Real-Time)' : 'Analytics Only'}
              </div>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          <nav className="opt-tabs-nav">
            {[
              { id: 'chain', label: 'Option Chain', icon: Layers },
              { id: 'strategy', label: 'Strategy Builder & Payoff', icon: Sliders },
              { id: 'oi', label: 'OI Tracker & Max Pain', icon: TrendingUp },
              { id: 'iv', label: 'IV Smile & Surface', icon: Sparkles },
              { id: 'sandbox', label: 'Sandbox Positions', icon: Clock },
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
      </header>

      {/* ── Tab Content Container ── */}
      <main className="opt-content-area">{children}</main>
    </div>
  );
};
