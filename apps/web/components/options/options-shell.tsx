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

const TABS: Array<{ id: OptionsTab; label: string; short: string; icon: typeof Sliders }> = [
  { id: 'strategy', label: 'Strategy Builder', short: 'Strategy', icon: Sliders },
  { id: 'sandbox', label: 'Simulator', short: 'Sim', icon: Clock },
  { id: 'chain', label: 'Option Chain', short: 'Chain', icon: Layers },
  { id: 'oi', label: 'OI Tracker', short: 'OI', icon: TrendingUp },
  { id: 'iv', label: 'IV Smile', short: 'IV', icon: Sparkles },
];

function formatExpiryLabel(exp: string): string {
  try {
    const [y, m, d] = exp.split('-').map(Number);
    if (!y || !m || !d) return exp;
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.max(0, Math.round((target.getTime() - nowDate.getTime()) / 86400000));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${target.getDate()} ${months[target.getMonth()]} (${diffDays}d)`;
  } catch {
    return exp;
  }
}

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
  const atmStrike = spotPrice > 0 ? Math.round(spotPrice / 50) * 50 : 0;
  const showMetrics = activeTab !== 'strategy';
  const brokerConnected = Boolean(connectedBroker && connectedBroker !== 'sandbox');

  return (
    <div className="opt-root">
      <header className="opt-header">
        <div className="opt-header-inner">
          {/* Row 1: brand + live + actions */}
          <div className="opt-header-top-row">
            <div className="opt-brand-group">
              <div className="opt-brand-icon" aria-hidden>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="opt-brand-title">
                Options Lab
                <span className="opt-brand-badge">F&O</span>
              </div>
            </div>

            <div className="opt-selectors-row opt-header-actions">
              {activeTab !== 'strategy' && (
                <>
                  <div className="opt-select-wrap">
                    <select
                      value={selectedSymbol}
                      onChange={(e) => onSymbolChange(e.target.value)}
                      className="opt-select-dropdown"
                      aria-label="Underlying"
                    >
                      {POPULAR_UNDERLYINGS.map((sym) => (
                        <option key={sym} value={sym}>
                          {sym}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="opt-select-chevron w-3.5 h-3.5" />
                  </div>

                  {expiryDates.length > 0 && (
                    <div className="opt-select-wrap">
                      <select
                        value={selectedExpiry}
                        onChange={(e) => onExpiryChange(e.target.value)}
                        className="opt-select-dropdown"
                        aria-label="Expiry"
                      >
                        {expiryDates.map((exp) => (
                          <option key={exp} value={exp}>
                            {formatExpiryLabel(exp)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="opt-select-chevron w-3.5 h-3.5" />
                    </div>
                  )}
                </>
              )}

              <div className="opt-live-pill">
                <span
                  className={`opt-status-dot ${
                    connectionStatus === 'reconnecting'
                      ? 'reconnecting'
                      : connectionStatus === 'closed'
                        ? 'closed'
                        : ''
                  }`}
                />
                <span className="opt-live-meta">
                  {connectionStatus === 'connected'
                    ? `${latencyMs}ms`
                    : connectionStatus === 'reconnecting'
                      ? 'delayed'
                      : 'offline'}
                </span>
                <span className="opt-live-spot">
                  {selectedSymbol}{' '}
                  {spotPrice > 0
                    ? `₹${spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </span>
                {spotPrice > 0 && (
                  <span className={`opt-live-chg ${isPositive ? 'opt-text-green' : 'opt-text-red'}`}>
                    {isPositive ? '+' : ''}
                    {spotChange.toFixed(2)} ({isPositive ? '+' : ''}
                    {spotChangePct.toFixed(2)}%)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleSandbox}
                className={`opt-btn-pill ${isSandbox ? 'active' : ''}`}
                title="Toggle Paper Trading / Live Broker Mode"
              >
                {isSandbox ? 'Paper' : 'Live'}
              </button>

              <button
                type="button"
                onClick={onOpenBrokerModal}
                className={`opt-btn-broker ${brokerConnected ? 'connected' : ''}`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="opt-broker-label">
                  {brokerConnected ? connectedBroker!.toUpperCase() : 'Broker'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: always-visible scrollable tabs */}
          <nav className="opt-tabs-nav" aria-label="Options Lab sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`opt-tab-btn ${isActive ? 'active' : ''}`}
                  title={tab.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="opt-tab-label-full">{tab.label}</span>
                  <span className="opt-tab-label-short">{tab.short}</span>
                </button>
              );
            })}
          </nav>

          {/* Row 3: compact metrics — skip on Strategy */}
          {showMetrics && (
            <div className="opt-ticker-grid">
              <div className="opt-ticker-chip">
                <div className="opt-ticker-chip-label">ATM</div>
                <div className="opt-ticker-chip-val">
                  {atmStrike > 0 ? `₹${atmStrike.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>
              <div className="opt-ticker-chip">
                <div className="opt-ticker-chip-label">PCR</div>
                <div className="opt-ticker-chip-val">
                  {pcr.toFixed(2)}
                  <span
                    className={`opt-chip-badge ${
                      pcr > 1.15 ? 'bull' : pcr < 0.85 ? 'bear' : 'neutral'
                    }`}
                  >
                    {pcr > 1.15 ? 'Bull' : pcr < 0.85 ? 'Bear' : 'Flat'}
                  </span>
                </div>
              </div>
              <div className="opt-ticker-chip">
                <div className="opt-ticker-chip-label">Max Pain</div>
                <div className="opt-ticker-chip-val opt-text-gold">
                  {maxPain > 0 ? `₹${maxPain.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>
              <div className="opt-ticker-chip">
                <div className="opt-ticker-chip-label">ATM IV</div>
                <div className="opt-ticker-chip-val opt-text-sky">
                  {atmIv != null ? `${atmIv.toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="opt-content-area">{children}</main>

      {/* Mobile sticky bottom tab bar */}
      <nav className="opt-mobile-tabbar" aria-label="Options Lab mobile navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`opt-mobile-tab ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
