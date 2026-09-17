'use client';

import React from 'react';
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      {/* ── Persistent Sandbox Warning Banner (Section 2E requirement) ── */}
      {isSandbox && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>SANDBOX MODE ACTIVE:</strong> Virtual paper trading with real live market tick execution. No real
              capital at risk.
            </span>
          </div>
          <button
            onClick={onToggleSandbox}
            className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded transition-colors"
          >
            Switch to Live
          </button>
        </div>
      )}

      {/* ── Top Header Controls & Ticker Bar ── */}
      <header className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Module Identity + Symbol Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white tracking-tight">Options Lab</h1>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                      F&O Pro
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">Indian NSE/BSE Options & Strategy Suite</p>
                </div>
              </div>

              {/* Symbol Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedSymbol}
                  onChange={(e) => onSymbolChange(e.target.value)}
                  className="appearance-none bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-semibold text-sm rounded-lg pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  {POPULAR_UNDERLYINGS.map((sym) => (
                    <option key={sym} value={sym}>
                      {sym}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Expiry Selector Dropdown */}
              {expiryDates.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedExpiry}
                    onChange={(e) => onExpiryChange(e.target.value)}
                    className="appearance-none bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  >
                    {expiryDates.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Right: Live Spot Ticker, Status Dot, Broker CTA */}
            <div className="flex items-center gap-4">
              {/* Real-time Spot Quote */}
              <div className="flex items-baseline gap-2 bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-1">
                <span className="text-xs font-mono text-neutral-400">{selectedSymbol} Spot</span>
                <span className="text-sm font-bold font-mono text-white">
                  ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-medium font-mono flex items-center ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {spotChange.toFixed(2)} ({isPositive ? '+' : ''}
                  {spotChangePct.toFixed(2)}%)
                </span>
              </div>

              {/* Connection Status Heartbeat Dot */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/60 border border-neutral-700/50 rounded-full text-xs">
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 text-[11px] font-medium">Live ({latencyMs}ms)</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-[11px] font-medium">Reconnecting</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-neutral-500" />
                    <span className="text-neutral-400 text-[11px]">Market Closed</span>
                  </>
                )}
              </div>

              {/* Broker Connect / Mode Button */}
              <button
                onClick={onOpenBrokerModal}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  connectedBroker
                    ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/40'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {connectedBroker ? `Connected: ${connectedBroker}` : 'Connect Broker'}
              </button>

              {/* Global Live <-> Sandbox Toggle Button */}
              <button
                onClick={onToggleSandbox}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isSandbox
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {isSandbox ? 'Sandbox' : 'Go Sandbox'}
              </button>
            </div>
          </div>

          {/* ── Key Metrics Ribbon: Spot, PCR, Max Pain, ATM IV ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-neutral-800/60 text-xs">
            <div className="bg-neutral-850/50 border border-neutral-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-0.5">PCR (Put / Call)</div>
              <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                {pcr.toFixed(2)}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    pcr > 1.2
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : pcr < 0.8
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {pcr > 1.2 ? 'Bullish' : pcr < 0.8 ? 'Bearish' : 'Neutral'}
                </span>
              </div>
            </div>

            <div className="bg-neutral-850/50 border border-neutral-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-0.5">Max Pain Strike</div>
              <div className="text-base font-bold font-mono text-amber-400">
                ₹{maxPain.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-neutral-850/50 border border-neutral-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-0.5">ATM Implied Vol (IV)</div>
              <div className="text-base font-bold font-mono text-white">
                {atmIv !== null ? `${atmIv.toFixed(1)}%` : 'Calculating...'}
              </div>
            </div>

            <div className="bg-neutral-850/50 border border-neutral-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-0.5">Execution Status</div>
              <div className="text-base font-bold font-mono text-neutral-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isSandbox ? 'Paper Fills' : 'Analytics Only'}
              </div>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          <nav className="flex items-center gap-1 mt-3 border-b border-neutral-800 -mb-px overflow-x-auto no-scrollbar">
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Tab Content Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">{children}</main>
    </div>
  );
};
