'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../../styles/options-lab.css';
import dynamic from 'next/dynamic';
import {
  X,
  CheckCircle2,
  Play,
  Undo2,
  Save,
  Library,
  Sliders,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import {
  OptionChainDto,
  StrategyLegDto,
  LiveTickDto,
  TradeSide,
  OptionType,
} from '@ff/types';
import {
  calculateStrategyPayoff,
  STRATEGY_TEMPLATES,
} from '@ff/calc';
import { io, Socket } from 'socket.io-client';
import { SidebarLayout } from '../../components/sidebar-layout';
import { OptionsShell, OptionsTab, POPULAR_UNDERLYINGS } from '../../components/options/options-shell';
import { BrokerConnectModal } from '../../components/options/broker-connect-modal';
import { SaveStrategyModal } from '../../components/options/save-strategy-modal';
import { SavedStrategiesModal } from '../../components/options/saved-strategies-modal';
import { OiTrackerView } from '../../components/options/oi-tracker-view';
import { IvSurfaceView } from '../../components/options/iv-surface-view';
import { SandboxPortfolioView } from '../../components/options/sandbox-portfolio-view';
import { StockMojoChainLadder } from '../../components/options/stockmojo-chain-ladder';
import { OptionChainTable } from '../../components/options/option-chain-table';
import { NiftyCandlestickChart } from '../../components/options/nifty-candlestick-chart';
import { thinChartDataZoom } from '../../components/options/echarts-data-zoom';
import {
  PanelResizeHandle,
  usePersistedLayoutNumber,
} from '../../components/options/panel-resize-handle';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ReadyStrategyItem {
  id: string;
  name: string;
  desc: string;
}

const READY_STRATEGIES: Record<'Neutral' | 'Bullish' | 'Bearish' | 'Other', ReadyStrategyItem[]> = {
  Neutral: [
    { id: 'short_straddle', name: 'Short Straddle', desc: 'Sell ATM CE + PE' },
    { id: 'short_strangle', name: 'Short Strangle', desc: 'Sell OTM CE + PE' },
    { id: 'short_iron_condor', name: 'Short Iron Condor', desc: 'Protected range credit spread' },
    { id: 'short_iron_butterfly', name: 'Short Iron Butterfly', desc: 'ATM straddle with outer wings' },
    { id: 'batman', name: 'Batman', desc: 'Double peak credit structure' },
    { id: 'jade_lizard', name: 'Jade Lizard', desc: 'Short put + bear call spread' },
    { id: 'reverse_jade_lizard', name: 'Reverse Jade Lizard', desc: 'Short call + bull put spread' },
    { id: 'double_plateau', name: 'Double Plateau', desc: 'Multi-strike twin peak range' },
  ],
  Bullish: [
    { id: 'long_call', name: 'Long Call', desc: 'Buy ATM Call (Unlimited upside)' },
    { id: 'bull_call_spread', name: 'Bull Call Spread', desc: 'Buy ATM Call + Sell OTM Call' },
    { id: 'bull_put_spread', name: 'Bull Put Spread', desc: 'Sell ATM Put + Buy OTM Put' },
    { id: 'short_put', name: 'Short Put', desc: 'Sell OTM Put (Income harvesting)' },
    { id: 'call_ratio_spread', name: 'Call Ratio Spread', desc: 'Buy 1 Call + Sell 2 OTM Calls' },
    { id: 'synthetic_long', name: 'Synthetic Long', desc: 'Buy Call + Sell Put' },
    { id: 'covered_call', name: 'Covered Call', desc: 'Long spot + Sell OTM Call' },
    { id: 'protective_put', name: 'Protective Put', desc: 'Long spot + Buy OTM Put' },
  ],
  Bearish: [
    { id: 'long_put', name: 'Long Put', desc: 'Buy ATM Put (Direct downside)' },
    { id: 'bear_put_spread', name: 'Bear Put Spread', desc: 'Buy ATM Put + Sell OTM Put' },
    { id: 'bear_call_spread', name: 'Bear Call Spread', desc: 'Sell ATM Call + Buy OTM Call' },
    { id: 'short_call', name: 'Short Call', desc: 'Sell OTM Call (Premium harvesting)' },
    { id: 'put_ratio_spread', name: 'Put Ratio Spread', desc: 'Buy 1 Put + Sell 2 OTM Puts' },
    { id: 'synthetic_short', name: 'Synthetic Short', desc: 'Sell Call + Buy Put' },
    { id: 'bear_condor', name: 'Bear Condor', desc: 'Directional debit condor' },
    { id: 'short_call_spread', name: 'Short Call Spread', desc: 'Credit call spread' },
  ],
  Other: [
    { id: 'long_straddle', name: 'Long Straddle', desc: 'Buy ATM Call + Buy ATM Put' },
    { id: 'long_strangle', name: 'Long Strangle', desc: 'Buy OTM Call + Buy OTM Put' },
    { id: 'reverse_iron_condor', name: 'Reverse Iron Condor', desc: 'Volatility breakout wings' },
    { id: 'box_spread', name: 'Box Spread', desc: 'Risk-free interest arbitrage' },
    { id: 'calendar_spread', name: 'Calendar Spread', desc: 'Time-decay horizontal spread' },
    { id: 'gut_strangle', name: 'Gut Strangle', desc: 'ITM Long straddle variation' },
    { id: 'double_calendar', name: 'Double Calendar', desc: 'Multi-strike volatility play' },
    { id: 'iron_butterfly', name: 'Long Iron Butterfly', desc: 'Winged debit butterfly' },
  ],
};

const StrategyPayoffPreviewSvg: React.FC<{ name: string }> = ({ name }) => {
  const norm = name.toLowerCase();

  // Baseline at y=32. Profit (y < 32): Green, Loss (y > 32): Red
  if (norm.includes('short straddle')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="32.5,32 50,12 67.5,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,46 32.5,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="67.5,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 46 L 32.5 32 L 50 12 L 67.5 32 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('short strangle')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="26,32 38,14 62,14 74,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,46 26,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="74,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 46 L 26 32 L 38 14 L 62 14 L 74 32 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('condor')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="34,32 42,16 58,16 66,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,42 24,42 34,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="66,32 76,42 88,42 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 42 L 24 42 L 42 16 L 58 16 L 76 42 L 88 42" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('butterfly')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="36,32 50,13 64,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,42 26,42 36,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="64,32 74,42 88,42 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 42 L 26 42 L 50 13 L 74 42 L 88 42" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('batman')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="22,32 32,15 42,24 50,26 58,24 68,15 78,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,46 22,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="78,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 46 L 32 15 L 42 24 L 50 26 L 58 24 L 68 15 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('reverse jade lizard')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="12,32 12,18 64,18 76,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="76,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 18 L 64 18 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('jade lizard')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="24,32 36,18 88,18 88,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,46 24,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 46 L 36 18 L 88 18" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('double plateau')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="22,32 26,18 40,18 44,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="56,32 60,18 74,18 78,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,46 22,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="44,32 46,46 54,46 56,32" fill="rgba(244, 63, 94, 0.15)" />
        <polygon points="78,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 46 L 26 18 L 40 18 L 46 46 L 54 46 L 60 18 L 74 18 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('call spread') || norm.includes('bull') || norm.includes('long call')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="45,32 65,16 88,16 88,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="12,44 28,44 45,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 44 L 28 44 L 65 16 L 88 16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (norm.includes('bear') || norm.includes('put spread') || norm.includes('long put') || norm.includes('short call')) {
    return (
      <svg viewBox="0 0 100 50" fill="none">
        <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="12,32 12,16 35,16 55,32" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="55,32 72,44 88,44 88,32" fill="rgba(244, 63, 94, 0.15)" />
        <path d="M 12 16 L 35 16 L 72 44 L 88 44" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 50" fill="none">
      <line x1="10" y1="32" x2="90" y2="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
      <polygon points="35,32 50,14 65,32" fill="rgba(16, 185, 129, 0.2)" />
      <polygon points="12,46 35,32 12,32" fill="rgba(244, 63, 94, 0.15)" />
      <polygon points="65,32 88,46 88,32" fill="rgba(244, 63, 94, 0.15)" />
      <path d="M 12 46 L 50 14 L 88 46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function OptionsLabPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>('strategy');
  const [visitedTabs, setVisitedTabs] = useState<Set<OptionsTab>>(() => new Set(['strategy']));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);
  const [symbol, setSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);
  const [connectedBroker, setConnectedBroker] = useState<string | null>(null);
  const [chainData, setChainData] = useState<OptionChainDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'closed'>('closed');
  const [latencyMs, setLatencyMs] = useState(0);
  const chainDataRef = useRef<OptionChainDto | null>(null);
  const chainFetchGenRef = useRef(0);
  const chainInFlightRef = useRef(false);
  const payoffChartRef = useRef<any>(null);
  const workspaceSplitRef = useRef<HTMLDivElement | null>(null);
  const analyticsBodyRef = useRef<HTMLDivElement | null>(null);
  const [chartPanelHeight, setChartPanelHeight] = useState(380);

  useEffect(() => {
    chainDataRef.current = chainData;
  }, [chainData]);

  // Clear stale chain when underlying changes so we don't mix symbols
  useEffect(() => {
    chainFetchGenRef.current += 1;
    setChainData(null);
    chainDataRef.current = null;
    setSelectedExpiry('');
    setIsLoading(true);
    setIsRefreshing(false);
  }, [symbol]);

  // Split-Screen & Analytics Workspace States
  const [isChainCollapsed, setIsChainCollapsed] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'payoff' | 'ready_made' | 'strategy_chart' | 'nifty_chart'>('payoff');
  const [readyCategory, setReadyCategory] = useState<'Neutral' | 'Bullish' | 'Bearish' | 'Other'>('Neutral');
  const [positionsSubTab, setPositionsSubTab] = useState<'positions' | 'greeks'>('positions');
  const [multiplier, setMultiplier] = useState(1);
  const [enabledLegIds, setEnabledLegIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState('');
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = useState(false);
  const [isPositionsCollapsed, setIsPositionsCollapsed] = useState(false);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(true);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [chainWidth, setChainWidth] = usePersistedLayoutNumber('chainWidth', 360, 260, 560);
  /** Chart vs positions split (default ~58/42). Keep both panels usable. */
  const [analyticsFlex, setAnalyticsFlex] = usePersistedLayoutNumber('analyticsFlex', 58, 35, 75);
  const [chainMobileHeight, setChainMobileHeight] = usePersistedLayoutNumber(
    'chainMobileHeight',
    360,
    200,
    640,
  );

  const isChartTab =
    analyticsTab === 'nifty_chart' || analyticsTab === 'strategy_chart';

  const WORKSPACE_DEFAULT_FLEX = 58;
  const WORKSPACE_CHART_FOCUS = 70;
  const WORKSPACE_POS_FOCUS = 40;

  /** Give chart more room but keep positions table visible */
  const expandAnalyticsPanel = useCallback(() => {
    setIsAnalyticsCollapsed(false);
    setIsPositionsCollapsed(false);
    setAnalyticsFlex(WORKSPACE_CHART_FOCUS);
    setIsGuideCollapsed(true);
    setIsChartFullscreen(false);
  }, [setAnalyticsFlex]);

  /** Give positions more room but keep payoff/chart visible */
  const expandPositionsPanel = useCallback(() => {
    setIsAnalyticsCollapsed(false);
    setIsPositionsCollapsed(false);
    setAnalyticsFlex(WORKSPACE_POS_FOCUS);
    setIsChartFullscreen(false);
  }, [setAnalyticsFlex]);

  const balanceWorkspace = useCallback(() => {
    setIsAnalyticsCollapsed(false);
    setIsPositionsCollapsed(false);
    setAnalyticsFlex(WORKSPACE_DEFAULT_FLEX);
    setIsChartFullscreen(false);
  }, [setAnalyticsFlex]);

  const enterChartFullscreen = useCallback(() => {
    setIsAnalyticsCollapsed(false);
    setIsPositionsCollapsed(true);
    setAnalyticsFlex(75);
    setIsGuideCollapsed(true);
    setIsChartFullscreen(true);
    if (!isChartTab) setAnalyticsTab('nifty_chart');
  }, [isChartTab, setAnalyticsFlex]);

  const isChartPriority =
    !isAnalyticsCollapsed && !isPositionsCollapsed && !isChartFullscreen && analyticsFlex >= 65;
  const isPositionsPriority =
    !isAnalyticsCollapsed && !isPositionsCollapsed && !isChartFullscreen && analyticsFlex <= 45;
  const isBalancedSplit =
    !isAnalyticsCollapsed && !isPositionsCollapsed && !isChartFullscreen && !isChartPriority && !isPositionsPriority;

  // Keep chart height in sync with analytics panel size
  useEffect(() => {
    const el = analyticsBodyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height;
      if (typeof h === 'number' && h > 100) {
        setChartPanelHeight(Math.floor(h));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isAnalyticsCollapsed, analyticsTab, isChartFullscreen]);

  // Resize payoff / chart when split changes so ECharts stays correct
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        payoffChartRef.current?.getEchartsInstance?.()?.resize?.();
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => window.clearTimeout(t);
  }, [analyticsFlex, isAnalyticsCollapsed, isPositionsCollapsed, analyticsTab, isChartFullscreen, chartPanelHeight]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const apply = () => setIsDesktopLayout(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!isChartFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsChartFullscreen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isChartFullscreen]);

  useEffect(() => {
    if (isChartTab) setIsGuideCollapsed(true);
  }, [isChartTab]);

  // Strategy Builder State
  const [strategyLegs, setStrategyLegs] = useState<StrategyLegDto[]>([]);

  // What-If Scenario State
  const [showPayoffSettings, setShowPayoffSettings] = useState(false);
  const [spotShiftPct, setSpotShiftPct] = useState(0);
  const [ivShiftPoints, setIvShiftPoints] = useState(0);
  const [daysForward, setDaysForward] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Live Market Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const timeStr = d.toLocaleTimeString('en-IN', { hour12: true });
      setCurrentTime(`${day} ${month}, ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Option Chain — first paint shows loading; polls patch live data without blanking the table
  const fetchChain = useCallback(async (opts?: { silent?: boolean; fresh?: boolean }) => {
    const prev = chainDataRef.current;
    const hasExisting = Boolean(prev?.contracts?.length);
    const prevExpiry = (prev?.selectedExpiry || '').slice(0, 10);
    const wantExpiry = (selectedExpiry || '').slice(0, 10);
    const expiryMismatch =
      Boolean(wantExpiry) && Boolean(prevExpiry) && wantExpiry !== prevExpiry;
    // Keep rows only when same expiry; never leave previous-expiry strikes on screen
    const silent =
      Boolean(opts?.silent) && hasExisting && !expiryMismatch && !opts?.fresh;
    const started = performance.now();

    // Never cancel a slow NSE request every poll — skip overlapping silent polls instead
    if (opts?.silent && chainInFlightRef.current) return;

    const gen = ++chainFetchGenRef.current;
    chainInFlightRef.current = true;

    try {
      if (!silent) {
        setIsLoading(true);
        if (expiryMismatch) {
          setChainData((c) =>
            c
              ? {
                  ...c,
                  contracts: [],
                  selectedExpiry: wantExpiry || c.selectedExpiry,
                  pcr: 0,
                  maxPain: 0,
                  atmIv: null,
                }
              : c,
          );
          if (chainDataRef.current) {
            chainDataRef.current = {
              ...chainDataRef.current,
              contracts: [],
              selectedExpiry: wantExpiry || chainDataRef.current.selectedExpiry,
            };
          }
        }
      } else {
        setIsRefreshing(true);
      }

      // Public NSE chain is shared — only attach JWT when a real broker is connected
      // (avoids per-user broker lookup latency on every poll).
      const headers: Record<string, string> = {};
      if (connectedBroker && connectedBroker !== 'sandbox') {
        const { getStoredAccessToken } = await import('../../lib/auth-client');
        const token = getStoredAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const qs = new URLSearchParams();
      if (selectedExpiry) qs.set('expiry', selectedExpiry);
      if (connectedBroker && connectedBroker !== 'sandbox') {
        qs.set('broker', connectedBroker);
      }
      if (opts?.fresh || expiryMismatch) qs.set('fresh', '1');
      const q = qs.toString();
      const url = `/api/v1/options/chain/${symbol}${q ? `?${q}` : ''}`;
      const res = await fetch(url, {
        headers: Object.keys(headers).length ? headers : undefined,
        cache: 'no-store',
      });
      if (gen !== chainFetchGenRef.current) return;

      if (res.ok) {
        const json = await res.json();
        if (gen !== chainFetchGenRef.current) return;
        if (json.data) {
          const incoming = json.data;
          const incomingExpiry = String(incoming.selectedExpiry || '').slice(0, 10);
          // Ignore late responses for a different expiry than currently selected
          if (wantExpiry && incomingExpiry && wantExpiry !== incomingExpiry) {
            return;
          }
          setChainData(incoming);
          chainDataRef.current = incoming;
          const nextExpiry = incoming.selectedExpiry as string | undefined;
          const expiryList: string[] = incoming.expiryDates || [];
          if (nextExpiry && (!selectedExpiry || !expiryList.includes(selectedExpiry))) {
            setSelectedExpiry(nextExpiry);
          }
          const source = incoming.source as string | undefined;
          const hasContracts = (incoming.contracts?.length || 0) > 0;
          const isExchangeLive =
            (source === 'NSE_LIVE' || source === 'BROKER_LIVE' || source === 'NSE_CACHED') &&
            hasContracts;
          setConnectionStatus(
            isExchangeLive
              ? 'connected'
              : incoming.spotPrice > 0
                ? 'reconnecting'
                : 'closed',
          );
          setLatencyMs(Math.round(performance.now() - started));
        }
      } else if (!hasExisting || expiryMismatch) {
        setConnectionStatus('closed');
        setLatencyMs(0);
      }
    } catch {
      if (gen === chainFetchGenRef.current && (!chainDataRef.current || expiryMismatch)) {
        setConnectionStatus('closed');
        setLatencyMs(0);
      }
    } finally {
      if (gen === chainFetchGenRef.current) {
        chainInFlightRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [symbol, selectedExpiry, connectedBroker]);

  // Initial load + live poll. 12s interval is enough with 5s server hot-cache;
  // 100k users share one upstream scrape via Nest coalesce + edge proxy cache.
  useEffect(() => {
    void fetchChain({ silent: false, fresh: Boolean(selectedExpiry) });
    const interval = setInterval(() => {
      void fetchChain({ silent: true });
    }, 12000);
    return () => {
      clearInterval(interval);
      chainFetchGenRef.current += 1;
      chainInFlightRef.current = false;
    };
  }, [fetchChain]);

  // Real-time WebSocket connection to /options namespace
  useEffect(() => {
    // Only attempt WebSocket on client when API URL is explicitly configured
    // and avoid localhost sockets on non-localhost domains to prevent 404 polling errors
    const apiUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || typeof window === 'undefined') return;

    if (window.location.hostname !== 'localhost' && apiUrl.includes('localhost')) {
      return;
    }

    const socket = io(`${apiUrl}/options`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 2,
      timeout: 4000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('subscribe_chain', { underlying: symbol });
    });

    socket.on('connect_error', () => {
      // Disconnect cleanly and let the 5-second polling fallback handle data
      socket.disconnect();
    });

    socket.on('connection_ack', () => {
      setConnectionStatus('connected');
    });

    socket.on('tick', (tick: LiveTickDto) => {
      setLatencyMs(0);
      setChainData((prev) => {
        if (!prev) return prev;
        const updatedContracts = prev.contracts.map((row) => {
          if (row.ce.instrumentToken === tick.instrumentToken) {
            return {
              ...row,
              ce: {
                ...row.ce,
                ltp: tick.ltp,
                oi: tick.oi || row.ce.oi,
                oiChange: tick.oiChange || row.ce.oiChange,
                volume: tick.volume || row.ce.volume,
              },
            };
          }
          if (row.pe.instrumentToken === tick.instrumentToken) {
            return {
              ...row,
              pe: {
                ...row.pe,
                ltp: tick.ltp,
                oi: tick.oi || row.pe.oi,
                oiChange: tick.oiChange || row.pe.oiChange,
                volume: tick.volume || row.pe.volume,
              },
            };
          }
          return row;
        });
        return { ...prev, contracts: updatedContracts };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [symbol]);

  // Synchronize enabledLegIds when strategy legs change
  useEffect(() => {
    setEnabledLegIds((prev) => {
      const next = new Set(prev);
      strategyLegs.forEach((l) => {
        if (!next.has(l.id)) next.add(l.id);
      });
      return next;
    });
  }, [strategyLegs]);

  // Derived Spot & ATM Strike
  const spot = chainData?.spotPrice || 0;
  const atmStrike = chainData?.atmStrike || Math.round(spot / 50) * 50;
  const spotChange = chainData?.spotChange || 0;
  const spotChangePct = chainData?.spotChangePct || 0;
  const vix = chainData?.vix ?? null;
  const futures = chainData?.futures || [];
  const lotSize = chainData?.lotSize || 50;

  // Chart/payoff use quantized market inputs so 12s polls don't redraw for tiny ticks
  const [chartSpot, setChartSpot] = useState(0);
  const [chartAtmIv, setChartAtmIv] = useState(0);
  useEffect(() => {
    const rawSpot = chainData?.spotPrice || 0;
    if (rawSpot > 0) {
      setChartSpot((prev) => {
        if (!prev) return Math.round(rawSpot);
        if (Math.abs(rawSpot - prev) < 20) return prev;
        return Math.round(rawSpot);
      });
    }
    const rawIv = chainData?.atmIv;
    if (rawIv != null && rawIv > 0) {
      setChartAtmIv((prev) => {
        if (!prev) return Math.round(rawIv * 10) / 10;
        if (Math.abs(rawIv - prev) < 0.4) return prev;
        return Math.round(rawIv * 10) / 10;
      });
    }
  }, [chainData?.spotPrice, chainData?.atmIv]);

  // Sync live LTPs into positions for P&L display — keep entryPrice (payoff curve) stable
  useEffect(() => {
    if (!chainData?.contracts?.length) return;
    setStrategyLegs((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((leg) => {
        const row = chainData.contracts.find((c) => c.strike === leg.strike);
        const side = leg.optionType === 'CE' ? row?.ce : row?.pe;
        const ltp = side?.ltp ?? 0;
        if (ltp > 0 && Math.abs((leg.currentPrice ?? 0) - ltp) >= 0.05) {
          changed = true;
          return { ...leg, currentPrice: ltp };
        }
        return leg;
      });
      return changed ? next : prev;
    });
  }, [chainData?.timestamp, chainData?.contracts]);

  // Strategy Payoff Calculation Engine — depends on structure/entry, not live LTP ticks
  const activeEnabledLegs = useMemo(() => {
    return strategyLegs.filter((l) => enabledLegIds.has(l.id));
  }, [strategyLegs, enabledLegIds]);

  const payoffLegsSignature = useMemo(
    () =>
      activeEnabledLegs
        .map(
          (l) =>
            `${l.id}|${l.side}|${l.optionType}|${l.strike}|${l.lots}|${l.lotSize}|${l.entryPrice}|${l.iv ?? ''}`,
        )
        .join(';'),
    [activeEnabledLegs],
  );

  const payoffResult = useMemo(() => {
    const currentSpot = ((chartSpot || spot) || 0) * (1 + spotShiftPct / 100);
    if (!currentSpot || activeEnabledLegs.length === 0) {
      return calculateStrategyPayoff({
        legs: [],
        currentSpot: currentSpot || 1,
        targetDaysForward: daysForward,
        spotRangePct: 0.12,
        numPoints: 2,
      });
    }

    // Entry-priced legs only — ignore live currentPrice so polls don't reshape the curve
    const shiftedLegs = activeEnabledLegs.map((l) => ({
      ...l,
      currentPrice: l.entryPrice,
      iv: l.iv != null ? Math.max(0.01, l.iv + ivShiftPoints / 100) : null,
    }));

    return calculateStrategyPayoff({
      legs: shiftedLegs as any,
      currentSpot,
      targetDaysForward: daysForward,
      spotRangePct: 0.12,
      numPoints: 61,
    });
    // payoffLegsSignature captures structural changes; activeEnabledLegs read intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoffLegsSignature, chartSpot, spotShiftPct, ivShiftPoints, daysForward]);

  // ECharts Option — stable unless strategy/settings/spot bucket changes
  const payoffChartOption = useMemo(() => {
    const currentSpot = chartSpot || spot || 0;
    const atmIv = chartAtmIv || chainData?.atmIv || 0;
    const tteYears = Math.max(1 / 365, (4 + daysForward) / 365);
    const oneSd =
      currentSpot > 0 && atmIv > 0
        ? currentSpot * (atmIv / 100) * Math.sqrt(tteYears)
        : currentSpot * 0.02;
    const roundSpot = Math.round(currentSpot);

    const baseGrid = { left: 52, right: 28, bottom: 28, top: 36, containLabel: true };
    const baseAnim = { animation: false, animationDurationUpdate: 0 };
    const baseZoom = thinChartDataZoom({ accent: 'teal', bottom: 4, filterMode: 'none' });

    // Baseline chart when no legs are active
    if (!payoffResult.payoffPoints || payoffResult.payoffPoints.length === 0) {
      const minX = Math.round(currentSpot - 2.5 * oneSd);
      const maxX = Math.round(currentSpot + 2.5 * oneSd);

      return {
        ...baseAnim,
        backgroundColor: '#FFFFFF',
        grid: baseGrid,
        dataZoom: baseZoom,
        toolbox: { show: false },
        xAxis: {
          type: 'value',
          min: minX,
          max: maxX,
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: {
            color: '#64748B',
            fontSize: 10,
            formatter: (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`,
          },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          min: -15000,
          max: 15000,
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: {
            color: '#64748B',
            formatter: (v: number) => `₹${v.toLocaleString('en-IN')}`,
            fontSize: 10,
          },
        },
        series: [
          {
            name: 'Zero Baseline',
            type: 'line',
            showSymbol: false,
            data: [
              [minX, 0],
              [maxX, 0],
            ],
            lineStyle: { width: 1.5, color: '#94A3B8', type: 'dashed' },
            markLine: {
              silent: true,
              symbol: 'none',
              animation: false,
              data: [
                {
                  xAxis: roundSpot,
                  lineStyle: { color: '#0F172A', type: 'solid', width: 2 },
                  label: {
                    formatter: `Spot ${roundSpot.toLocaleString('en-IN')}`,
                    position: 'insideEndTop',
                    color: '#0F172A',
                    fontSize: 10,
                    fontWeight: 700,
                  },
                },
              ],
            },
          },
        ],
      };
    }

    const expiryData = payoffResult.payoffPoints.map((p) => [
      Math.round(p.spotPrice),
      Math.round(p.expiryPayoff),
    ]);
    const targetData = payoffResult.payoffPoints.map((p) => [
      Math.round(p.spotPrice),
      Math.round(p.targetDatePayoff),
    ]);
    const minSpot = Math.round(
      payoffResult.payoffPoints[0]?.spotPrice || currentSpot - 2 * oneSd,
    );
    const maxSpot = Math.round(
      payoffResult.payoffPoints[payoffResult.payoffPoints.length - 1]?.spotPrice ||
        currentSpot + 2 * oneSd,
    );

    const beLines = payoffResult.greeks.breakevens.map((b, i) => ({
      xAxis: Math.round(b),
      lineStyle: { color: '#D97706', type: 'dotted' as const, width: 1.5 },
      label: {
        formatter: `BE ${Math.round(b).toLocaleString('en-IN')}`,
        position: i % 2 === 0 ? 'insideStartBottom' : 'insideEndBottom',
        color: '#B45309',
        fontSize: 9,
        fontWeight: 700,
        distance: 4,
      },
    }));

    return {
      ...baseAnim,
      backgroundColor: '#FFFFFF',
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].value ? params[0].value[0] : params[0].name;
          let html = `<div style="font-family: monospace; font-size: 11px; padding: 4px;"><strong>Spot: ₹${Number(s).toLocaleString('en-IN')}</strong><br/>`;
          params.forEach((p) => {
            const val = Array.isArray(p.value) ? p.value[1] : p.value;
            const color = val >= 0 ? '#10B981' : '#F43F5E';
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong style="color:${color}">₹${Math.round(val).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['At Expiry', `T+${daysForward}`],
        textStyle: { color: '#64748B', fontSize: 11 },
        top: 4,
        left: 'center',
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: baseGrid,
      dataZoom: baseZoom,
      toolbox: { show: false },
      xAxis: {
        type: 'value',
        min: minSpot,
        max: maxSpot,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        position: 'left',
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: {
          color: '#64748B',
          formatter: (v: number) => `₹${v.toLocaleString('en-IN')}`,
          fontSize: 10,
        },
      },
      series: [
        {
          name: 'At Expiry',
          type: 'line',
          data: expiryData,
          smooth: 0.15,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#0F766E' },
          markLine: {
            silent: true,
            symbol: 'none',
            animation: false,
            data: [
              { yAxis: 0, lineStyle: { color: '#94A3B8', type: 'dashed' }, label: { show: false } },
              {
                xAxis: roundSpot,
                lineStyle: { color: '#0F172A', type: 'solid', width: 2 },
                label: {
                  formatter: `Spot ${roundSpot.toLocaleString('en-IN')}`,
                  position: 'insideEndTop',
                  color: '#0F172A',
                  fontSize: 10,
                  fontWeight: 700,
                },
              },
              {
                xAxis: Math.round(currentSpot - 2 * oneSd),
                lineStyle: { color: '#CBD5E1', type: 'dashed' },
                label: {
                  formatter: '-2σ',
                  position: 'insideStartTop',
                  color: '#94A3B8',
                  fontSize: 9,
                },
              },
              {
                xAxis: Math.round(currentSpot + 2 * oneSd),
                lineStyle: { color: '#CBD5E1', type: 'dashed' },
                label: {
                  formatter: '+2σ',
                  position: 'insideEndTop',
                  color: '#94A3B8',
                  fontSize: 9,
                },
              },
              ...beLines,
            ],
          },
        },
        {
          name: `T+${daysForward}`,
          type: 'line',
          data: targetData,
          smooth: 0.15,
          showSymbol: false,
          lineStyle: { width: 2, color: '#2563EB', type: 'dashed' },
        },
      ],
    };
  }, [payoffResult, chartSpot, chartAtmIv, daysForward, spot]);

  const zoomPayoffChart = useCallback((factor: number) => {
    const inst = payoffChartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const opt = inst.getOption() as any;
    const dz = opt?.dataZoom?.[0];
    const start = typeof dz?.start === 'number' ? dz.start : 0;
    const end = typeof dz?.end === 'number' ? dz.end : 100;
    const center = (start + end) / 2;
    const span = Math.max(8, (end - start) * factor);
    let nextStart = center - span / 2;
    let nextEnd = center + span / 2;
    if (nextStart < 0) {
      nextEnd = Math.min(100, nextEnd - nextStart);
      nextStart = 0;
    }
    if (nextEnd > 100) {
      nextStart = Math.max(0, nextStart - (nextEnd - 100));
      nextEnd = 100;
    }
    inst.dispatchAction({ type: 'dataZoom', start: nextStart, end: nextEnd });
  }, []);

  const resetPayoffZoom = useCallback(() => {
    const inst = payoffChartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    inst.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
  }, []);

  // Resize payoff chart when returning to the tab (avoids blank / clipped first paint)
  useEffect(() => {
    if (analyticsTab !== 'payoff') return;
    const t = window.setTimeout(() => {
      try {
        payoffChartRef.current?.getEchartsInstance?.()?.resize?.();
      } catch {
        /* ignore */
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [analyticsTab]);

  // Strategy Template Application
  const applyTemplate = (tplName: string) => {
    const spotVal = chainData?.spotPrice;
    if (!spotVal) {
      setNotification('Waiting for live market feed to initialize...');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    let step = 50;
    let symLotSize = 50;

    if (symbol === 'BANKNIFTY') {
      step = 100;
      symLotSize = 15;
    } else if (symbol === 'FINNIFTY') {
      step = 50;
      symLotSize = 40;
    } else if (symbol === 'SENSEX') {
      step = 100;
      symLotSize = 10;
    }

    const expiryToUse =
      selectedExpiry || chainData.selectedExpiry || chainData.expiryDates[0] || '';
    if (!expiryToUse) {
      setNotification('Wait for live expiry list before loading a template.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const atm = Math.round(spotVal / step) * step;

    let baseLegs: StrategyLegDto[] = [];

    // Check built-in templates first
    const tpl = STRATEGY_TEMPLATES.find(
      (t) =>
        t.name.toLowerCase() === tplName.toLowerCase() ||
        (tplName.toLowerCase() === 'short iron condor' && t.name === 'Iron Condor') ||
        (tplName.toLowerCase() === 'short iron butterfly' && t.name === 'Iron Butterfly'),
    );

    if (tpl) {
      baseLegs = tpl.createLegs(spotVal, step, expiryToUse, symLotSize);
    } else if (tplName === 'Batman') {
      baseLegs = [
        { id: '1', instrumentToken: 'PE-WING', symbol, expiry: expiryToUse, strike: atm - 2 * step, optionType: 'PE', side: 'BUY', lots: 1, lotSize: symLotSize, entryPrice: 20 },
        { id: '2', instrumentToken: 'PE-BODY', symbol, expiry: expiryToUse, strike: atm - step, optionType: 'PE', side: 'SELL', lots: 2, lotSize: symLotSize, entryPrice: 65 },
        { id: '3', instrumentToken: 'CE-BODY', symbol, expiry: expiryToUse, strike: atm + step, optionType: 'CE', side: 'SELL', lots: 2, lotSize: symLotSize, entryPrice: 70 },
        { id: '4', instrumentToken: 'CE-WING', symbol, expiry: expiryToUse, strike: atm + 2 * step, optionType: 'CE', side: 'BUY', lots: 1, lotSize: symLotSize, entryPrice: 22 },
      ];
    } else if (tplName === 'Reverse Jade Lizard') {
      baseLegs = [
        { id: '1', instrumentToken: 'CE-SHORT', symbol, expiry: expiryToUse, strike: atm + step, optionType: 'CE', side: 'SELL', lots: 1, lotSize: symLotSize, entryPrice: 55 },
        { id: '2', instrumentToken: 'PE-SHORT', symbol, expiry: expiryToUse, strike: atm - step, optionType: 'PE', side: 'SELL', lots: 1, lotSize: symLotSize, entryPrice: 50 },
        { id: '3', instrumentToken: 'PE-LONG', symbol, expiry: expiryToUse, strike: atm - 2 * step, optionType: 'PE', side: 'BUY', lots: 1, lotSize: symLotSize, entryPrice: 20 },
      ];
    } else if (tplName === 'Double Plateau') {
      baseLegs = [
        { id: '1', instrumentToken: 'PE-L1', symbol, expiry: expiryToUse, strike: atm - 3 * step, optionType: 'PE', side: 'BUY', lots: 1, lotSize: symLotSize, entryPrice: 12 },
        { id: '2', instrumentToken: 'PE-S1', symbol, expiry: expiryToUse, strike: atm - 2 * step, optionType: 'PE', side: 'SELL', lots: 1, lotSize: symLotSize, entryPrice: 35 },
        { id: '3', instrumentToken: 'CE-S1', symbol, expiry: expiryToUse, strike: atm + 2 * step, optionType: 'CE', side: 'SELL', lots: 1, lotSize: symLotSize, entryPrice: 40 },
        { id: '4', instrumentToken: 'CE-L1', symbol, expiry: expiryToUse, strike: atm + 3 * step, optionType: 'CE', side: 'BUY', lots: 1, lotSize: symLotSize, entryPrice: 15 },
      ];
    }

    if (baseLegs.length > 0) {
      // Enrich with live contract LTPs only — drop legs without a real quote (no fake premiums)
      const legs: StrategyLegDto[] = [];
      for (const leg of baseLegs) {
        const contract = chainData.contracts?.find((c) => c.strike === leg.strike);
        if (!contract) continue;
        const sideContract = leg.optionType === 'CE' ? contract.ce : contract.pe;
        if (!sideContract || !(sideContract.ltp > 0)) continue;
        legs.push({
          ...leg,
          entryPrice: sideContract.ltp,
          currentPrice: sideContract.ltp,
          iv: sideContract.iv || leg.iv,
          delta: sideContract.delta || leg.delta,
          gamma: sideContract.gamma || leg.gamma,
          theta: sideContract.theta || leg.theta,
          vega: sideContract.vega || leg.vega,
        });
      }

      if (legs.length === 0) {
        setNotification(`No live LTPs for "${tplName}" strikes on this expiry — try another expiry.`);
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      setStrategyLegs(legs);
      setAnalyticsTab('payoff');
      setNotification(`Loaded "${tplName}" strategy.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Quick Action: Add or Toggle leg from Option Chain
  const onAddOrToggleLeg = (input: {
    side: TradeSide;
    type: OptionType;
    strike: number;
    price: number;
    iv: number | null;
    expiry: string;
  }) => {
    const existingIndex = strategyLegs.findIndex(
      (l) => l.strike === input.strike && l.optionType === input.type,
    );

    if (existingIndex >= 0) {
      const existing = strategyLegs[existingIndex];
      if (existing.side === input.side) {
        toggleLegSide(existing.id);
        setNotification(`Toggled ${symbol} ₹${input.strike} ${input.type} to ${existing.side === 'BUY' ? 'SELL' : 'BUY'}.`);
      } else {
        removeLeg(existing.id);
        setNotification(`Removed ${symbol} ₹${input.strike} ${input.type} from strategy.`);
      }
    } else {
      addLegToStrategy(input.side, input.type, input.strike, input.price, input.iv);
    }
  };

  const addLegToStrategy = (
    side: TradeSide,
    type: OptionType | 'FUT',
    strike: number,
    price: number,
    ivVal?: number | null,
  ) => {
    let symLotSize = 50;
    if (symbol === 'BANKNIFTY') symLotSize = 15;
    if (symbol === 'FINNIFTY') symLotSize = 40;
    if (symbol === 'SENSEX') symLotSize = 10;

    const newLeg: StrategyLegDto = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      instrumentToken: `${type}-${strike}`,
      symbol,
      expiry: selectedExpiry || chainData?.selectedExpiry || chainData?.expiryDates?.[0] || '',
      strike,
      optionType: type,
      side,
      lots: 1,
      lotSize: symLotSize,
      entryPrice: Math.round(price * 100) / 100,
      currentPrice: Math.round(price * 100) / 100,
      iv: ivVal ? ivVal / 100 : null,
    };

    setStrategyLegs((prev) => [...prev, newLeg]);
    setNotification(`Added ${side} ${symbol} ₹${strike} ${type}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const removeLeg = (id: string) => {
    setStrategyLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLegLots = (id: string, delta: number) => {
    setStrategyLegs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, lots: Math.max(1, l.lots + delta) } : l)),
    );
  };

  const shiftLegStrike = (id: string, deltaSteps: number) => {
    let step = 50;
    if (symbol === 'BANKNIFTY' || symbol === 'SENSEX') step = 100;
    else if (symbol === 'MIDCPNIFTY') step = 25;

    setStrategyLegs((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const newStrike = l.strike + deltaSteps * step;
        const contractRow = chainData?.contracts.find((c) => c.strike === newStrike);
        const newPrice = contractRow
          ? l.optionType === 'CE'
            ? contractRow.ce.ltp
            : contractRow.pe.ltp
          : l.currentPrice;
        return {
          ...l,
          strike: newStrike,
          entryPrice: newPrice || l.entryPrice,
          currentPrice: newPrice || l.currentPrice,
        };
      }),
    );
  };

  const toggleLegSide = (id: string) => {
    setStrategyLegs((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, side: (l.side === 'BUY' ? 'SELL' : 'BUY') as TradeSide } : l,
      ),
    );
  };

  const toggleLegType = (id: string) => {
    setStrategyLegs((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const newType: OptionType = l.optionType === 'CE' ? 'PE' : 'CE';
        const contractRow = chainData?.contracts.find((c) => c.strike === l.strike);
        const newPrice = contractRow
          ? newType === 'CE'
            ? contractRow.ce.ltp
            : contractRow.pe.ltp
          : l.currentPrice;
        return {
          ...l,
          optionType: newType,
          entryPrice: newPrice || l.entryPrice,
          currentPrice: newPrice || l.currentPrice,
        };
      }),
    );
  };

  const applyMultiplier = (delta: number) => {
    const next = Math.max(1, multiplier + delta);
    setMultiplier(next);
    setStrategyLegs((prev) =>
      prev.map((l) => ({
        ...l,
        lots: Math.max(1, l.lots + delta),
      })),
    );
  };

  const toggleLegEnabled = (id: string) => {
    setEnabledLegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllLegsEnabled = () => {
    if (enabledLegIds.size === strategyLegs.length) {
      setEnabledLegIds(new Set());
    } else {
      setEnabledLegIds(new Set(strategyLegs.map((l) => l.id)));
    }
  };

  const resetAllLegs = () => {
    setStrategyLegs([]);
    setEnabledLegIds(new Set());
    setMultiplier(1);
    setDaysForward(0);
    setSpotShiftPct(0);
    setIvShiftPoints(0);
    setNotification('Cleared all strategy positions.');
    setTimeout(() => setNotification(null), 3000);
  };

  const loadSavedStrategy = (strategy: {
    name: string;
    underlying: string;
    legs: StrategyLegDto[];
  }) => {
    if (strategy.underlying && strategy.underlying !== symbol) {
      setSymbol(strategy.underlying);
    }
    const legs = (strategy.legs || []).map((l, i) => ({
      ...l,
      id: l.id || `leg-load-${Date.now()}-${i}`,
      symbol: l.symbol || strategy.underlying || symbol,
      lots: Math.max(1, l.lots || 1),
      lotSize: l.lotSize || lotSize,
      entryPrice: Number(l.entryPrice) || 0,
      currentPrice: Number(l.currentPrice ?? l.entryPrice) || 0,
    }));
    setStrategyLegs(legs);
    setEnabledLegIds(new Set(legs.map((l) => l.id)));
    setMultiplier(1);
    setAnalyticsTab('payoff');
    setActiveTab('strategy');
    setNotification(`Loaded "${strategy.name}" strategy.`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Aggregated Strategy Metrics
  const totalQty = strategyLegs.reduce((acc, l) => acc + l.lots * l.lotSize, 0);
  const totalPnl = strategyLegs.reduce((acc, l) => {
    const mult = l.side === 'BUY' ? 1 : -1;
    const cur = l.currentPrice ?? l.entryPrice;
    return acc + (cur - l.entryPrice) * mult * l.lots * l.lotSize;
  }, 0);
  const estMargin = (strategyLegs.length * 1.05 * multiplier).toFixed(2);

  // Execute in Sandbox Paper Portfolio
  const executeInSandbox = async () => {
    const legsToTrade = strategyLegs.filter((l) => enabledLegIds.has(l.id));
    if (legsToTrade.length === 0) {
      setNotification('Add or enable at least one strategy leg before Paper Trade.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    try {
      const { getStoredAccessToken } = await import('../../lib/auth-client');
      const token = getStoredAccessToken();
      if (!token) {
        setNotification('Sign in required to save paper positions.');
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const orders = legsToTrade.map((l) => ({
        symbol: l.symbol || symbol,
        expiry: l.expiry || selectedExpiry,
        strike: l.strike,
        optionType: l.optionType,
        side: l.side,
        quantity: Math.max(1, l.lots || 1),
        lotSize: l.lotSize || lotSize,
        orderType: 'MARKET' as const,
        price: l.entryPrice > 0 ? l.entryPrice : l.currentPrice,
      }));

      const res = await fetch('/api/v1/options/sandbox/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orders }),
      });

      const json = await res.json().catch(() => (null as any));
      if (res.ok && json?.success) {
        setNotification(json.message || `Filled ${orders.length} paper position(s).`);
        setVisitedTabs((prev) => new Set(prev).add('sandbox'));
        setActiveTab('sandbox');
        window.dispatchEvent(new CustomEvent('sandbox:refresh'));
      } else {
        setNotification(
          json?.message ||
            (res.status === 401
              ? 'Session expired — sign in again to paper trade.'
              : 'Paper trade failed. Check live chain LTP and try again.'),
        );
      }
    } catch {
      setNotification('Network error placing paper orders.');
    }
    setTimeout(() => setNotification(null), 4500);
  };

  return (
    <SidebarLayout>
      <OptionsShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedSymbol={symbol}
        onSymbolChange={(s) => {
          setSymbol(s);
          setSelectedExpiry('');
        }}
        selectedExpiry={selectedExpiry}
        onExpiryChange={setSelectedExpiry}
        expiryDates={chainData?.expiryDates || []}
        isSandbox={isSandbox}
        onToggleSandbox={() => setIsSandbox((p) => !p)}
        connectionStatus={connectionStatus}
        latencyMs={latencyMs}
        spotPrice={spot}
        spotChange={spotChange}
        spotChangePct={spotChangePct}
        pcr={chainData?.pcr ?? 0}
        maxPain={chainData?.maxPain || atmStrike}
        atmIv={chainData?.atmIv ?? null}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        connectedBroker={connectedBroker}
      >
        {chainData?.dataNote || chainData?.source ? (
          <div
            role="status"
            className={`opt-feed-banner ${
              chainData.source === 'NSE_LIVE' || chainData.source === 'BROKER_LIVE'
                ? 'live'
                : chainData.source === 'NSE_CACHED'
                  ? 'cached'
                  : 'warn'
            }`}
            title={chainData.dataNote || undefined}
          >
            <strong>{chainData.source || 'UNKNOWN'}</strong>
            <span>
              {chainData.timestamp
                ? new Date(chainData.timestamp).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : ''}
            </span>
            {isRefreshing ? <span>Updating…</span> : null}
            {(chainData.contracts?.length || 0) === 0 ? (
              <span>Connect broker for live OI</span>
            ) : null}
          </div>
        ) : null}

        {/* Notification Toast */}
        {notification && (
          <div
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              right: '1.5rem',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '0.625rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: STRATEGY BUILDER (StockMojo Dual Split-Screen Flagship)
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'strategy' && (
          <div
            className={`sm-layout-root animate-fadeIn ${isDesktopLayout ? 'is-desktop' : 'is-mobile'}`}
          >
            {/* ── Left Column: StockMojo Option Chain Ladder ── */}
            <StockMojoChainLadder
              symbol={symbol}
              onSymbolChange={(s) => {
                setSymbol(s);
                setSelectedExpiry('');
              }}
              symbolList={POPULAR_UNDERLYINGS}
              lotSize={lotSize}
              spotPrice={spot}
              spotChange={spotChange}
              spotChangePct={spotChangePct}
              vix={vix}
              vixChangePct={chainData?.vixChangePct ?? null}
              futures={futures}
              selectedExpiry={selectedExpiry}
              expiryDates={chainData?.expiryDates || []}
              onExpiryChange={setSelectedExpiry}
              contracts={chainData?.contracts || []}
              atmStrike={atmStrike}
              activeLegs={strategyLegs}
              onAddOrToggleLeg={onAddOrToggleLeg}
              isCollapsed={isDesktopLayout ? isChainCollapsed : false}
              onToggleCollapse={() => setIsChainCollapsed((p) => !p)}
              panelWidth={isDesktopLayout && !isChainCollapsed ? chainWidth : undefined}
              panelHeight={!isDesktopLayout ? chainMobileHeight : undefined}
              asOf={chainData?.timestamp || null}
              dataSource={chainData?.source || null}
              onOpenBroker={() => setIsBrokerModalOpen(true)}
              brokerConnected={Boolean(connectedBroker && connectedBroker !== 'sandbox')}
            />

            {isDesktopLayout && !isChainCollapsed ? (
              <PanelResizeHandle
                axis="horizontal"
                label="Resize option chain"
                onDrag={(delta) => setChainWidth((w) => w + delta)}
              />
            ) : null}

            {!isDesktopLayout ? (
              <PanelResizeHandle
                axis="vertical"
                label="Resize option chain height"
                className="sm-resize-handle--mobile-chain"
                onDrag={(delta) => setChainMobileHeight((h) => h + delta)}
              />
            ) : null}

            {/* ── Right Column: Interactive Strategy Workspace ── */}
            <div
              className={`sm-workspace-panel ${isChartPriority || (isPositionsCollapsed && !isChartFullscreen) ? 'is-chart-focus' : ''} ${isPositionsPriority ? 'is-pos-focus' : ''} ${isChartFullscreen ? 'is-fs-parent' : ''}`}
            >
              {/* Top Action Bar (Save, Saved, Reset/New, Clock) */}
              <div className="sm-top-action-bar">
                <div className="sm-action-btn-group">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(true)}
                    className="sm-action-btn sm-action-btn--primary"
                    title="Save strategy"
                  >
                    <Save className="sm-icon" aria-hidden />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSavedListOpen(true)}
                    className="sm-action-btn sm-action-btn--ghost"
                    title="Saved strategies"
                  >
                    <Library className="sm-icon" aria-hidden />
                    <span>Saved</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetAllLegs}
                    className="sm-action-btn sm-action-btn--danger"
                    title="Reset strategy"
                  >
                    <Undo2 className="sm-icon" aria-hidden />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Right: Live Market Clock */}
                <div className="sm-market-clock">
                  <span className="sm-clock-dot" />
                  <span>{currentTime || 'Market Live'}</span>
                </div>
              </div>

              <div className="sm-workspace-split" ref={workspaceSplitRef}>
              {/* Upper Section: Visual Analytics Card (Payoff / Charts) */}
              <div
                className={[
                  'sm-analytics-card',
                  isAnalyticsCollapsed ? 'is-collapsed' : '',
                  isChartPriority ? 'is-chart-priority' : '',
                  isPositionsCollapsed && !isAnalyticsCollapsed && !isChartFullscreen ? 'is-expanded' : '',
                  isChartFullscreen ? 'is-fullscreen' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={
                  isChartFullscreen
                    ? undefined
                    : isDesktopLayout && !isAnalyticsCollapsed && !isPositionsCollapsed
                      ? { flex: `${analyticsFlex} 1 0`, minHeight: 220 }
                      : isAnalyticsCollapsed
                        ? { flex: '0 0 auto' }
                        : { flex: '1 1 auto', minHeight: isPositionsCollapsed ? 'min(58vh, 720px)' : 220 }
                }
              >
                {/* Tabs Bar */}
                <div className="sm-analytics-tabs-bar">
                  <div className="sm-analytics-tab-group" role="tablist" aria-label="Analytics views">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={analyticsTab === 'payoff'}
                      onClick={() => setAnalyticsTab('payoff')}
                      className={`sm-analytics-tab ${analyticsTab === 'payoff' ? 'active' : ''}`}
                    >
                      Payoff
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={analyticsTab === 'ready_made'}
                      onClick={() => setAnalyticsTab('ready_made')}
                      className={`sm-analytics-tab ${analyticsTab === 'ready_made' ? 'active' : ''}`}
                    >
                      <span className="sm-tab-label-full">Ready-Made</span>
                      <span className="sm-tab-label-short">Ready</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={analyticsTab === 'strategy_chart'}
                      onClick={() => setAnalyticsTab('strategy_chart')}
                      className={`sm-analytics-tab ${analyticsTab === 'strategy_chart' ? 'active' : ''}`}
                    >
                      <span className="sm-tab-label-full">Strategy Chart</span>
                      <span className="sm-tab-label-short">Strat</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={analyticsTab === 'nifty_chart'}
                      onClick={() => setAnalyticsTab('nifty_chart')}
                      className={`sm-analytics-tab ${analyticsTab === 'nifty_chart' ? 'active' : ''}`}
                    >
                      <span className="sm-tab-label-full">{symbol} Chart</span>
                      <span className="sm-tab-label-short">Chart</span>
                    </button>
                  </div>

                  <div className="sm-toolbar-actions">
                    <button type="button" onClick={executeInSandbox} className="sm-btn-paper">
                      <Play className="fill-current" strokeWidth={2} />
                      <span className="sm-tab-label-full">Paper Trade</span>
                      <span className="sm-tab-label-short">Paper</span>
                    </button>
                    {analyticsTab === 'payoff' && (
                      <button
                        type="button"
                        onClick={() => setShowPayoffSettings(!showPayoffSettings)}
                        className="sm-btn-toggle"
                        title="Toggle Target Date & IV What-If Settings"
                      >
                        <span className="sm-tab-label-full">Payoff setting</span>
                        <span className="sm-tab-label-short">What-if</span>
                        <span className={`sm-switch ${showPayoffSettings ? 'on' : ''}`}>
                          <span className="sm-switch-knob" />
                        </span>
                      </button>
                    )}
                    <div className="sm-layout-controls" role="group" aria-label="Chart layout">
                      <button
                        type="button"
                        className={`sm-layout-btn ${isChartPriority ? 'is-on' : ''}`}
                        title="Expand chart (keep positions visible)"
                        onClick={expandAnalyticsPanel}
                      >
                        <Maximize2 strokeWidth={2} />
                        <span>Expand</span>
                      </button>
                      <button
                        type="button"
                        className={`sm-layout-btn sm-layout-btn--accent ${isChartFullscreen ? 'is-on' : ''}`}
                        title="Fullscreen chart (Esc to exit)"
                        onClick={() => (isChartFullscreen ? setIsChartFullscreen(false) : enterChartFullscreen())}
                      >
                        {isChartFullscreen ? <Minimize2 strokeWidth={2} /> : <Maximize2 strokeWidth={2} />}
                        <span>{isChartFullscreen ? 'Exit' : 'Full'}</span>
                      </button>
                      <button
                        type="button"
                        className={`sm-layout-btn ${isBalancedSplit ? 'is-on' : ''}`}
                        title="Split chart + positions (default sizes)"
                        onClick={balanceWorkspace}
                      >
                        <Minimize2 strokeWidth={2} />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        className="sm-layout-btn sm-layout-btn--icon"
                        title={isAnalyticsCollapsed ? 'Show chart panel' : 'Hide chart panel'}
                        aria-label={isAnalyticsCollapsed ? 'Show chart panel' : 'Hide chart panel'}
                        onClick={() => {
                          if (isChartFullscreen) setIsChartFullscreen(false);
                          setIsAnalyticsCollapsed((p) => !p);
                        }}
                      >
                        {isAnalyticsCollapsed ? (
                          <ChevronDown strokeWidth={2} />
                        ) : (
                          <ChevronUp strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {!isAnalyticsCollapsed ? (
                <>
                <div className="sm-analytics-body" ref={analyticsBodyRef}>
                {/* What-If / Payoff Settings Drawer */}
                {showPayoffSettings && analyticsTab === 'payoff' && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      padding: '0.75rem 1rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600, color: '#475569' }}>
                        <span>Target Days Forward:</span>
                        <span style={{ color: '#2563EB', fontWeight: 700 }}>T+{daysForward}d</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={daysForward}
                        onChange={(e) => setDaysForward(parseInt(e.target.value, 10))}
                        style={{ width: '100%', accentColor: '#2563EB' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600, color: '#475569' }}>
                        <span>Target Spot Shift:</span>
                        <span style={{ color: spotShiftPct >= 0 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                          {spotShiftPct >= 0 ? '+' : ''}{spotShiftPct}% (₹{Math.round(spot * (1 + spotShiftPct / 100)).toLocaleString('en-IN')})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={0.5}
                        value={spotShiftPct}
                        onChange={(e) => setSpotShiftPct(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#2563EB' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600, color: '#475569' }}>
                        <span>IV Shift:</span>
                        <span style={{ color: ivShiftPoints >= 0 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                          {ivShiftPoints >= 0 ? '+' : ''}{ivShiftPoints}% pts
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={0.5}
                        value={ivShiftPoints}
                        onChange={(e) => setIvShiftPoints(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#2563EB' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setDaysForward(0);
                          setSpotShiftPct(0);
                          setIvShiftPoints(0);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          color: '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reset Sliders
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 1: Payoff View */}
                {analyticsTab === 'payoff' && (
                  <div className="sm-payoff-split-container">
                    {/* Left Stats Column */}
                    <div className="sm-payoff-stats-col">
                      <div className={`sm-payoff-pnl-box ${totalPnl < 0 ? 'neg' : ''}`}>
                        <div className="sm-pnl-title">Strategy P&L</div>
                        <div className="sm-pnl-value">
                          ₹{Math.round(totalPnl).toLocaleString('en-IN')}
                          <span style={{ fontSize: '0.7em', fontWeight: 700, opacity: 0.85, marginLeft: '0.35rem' }}>
                            ({totalPnl >= 0 ? '+' : ''}
                            {(totalPnl / 1000).toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      <div className="sm-payoff-metric-row">
                        <span className="sm-metric-label">Est. Margin</span>
                        <span className="sm-metric-val">₹{estMargin} L</span>
                      </div>

                      <div className="sm-metric-pair">
                        <div className="sm-payoff-metric-row">
                          <span className="sm-metric-label">POP</span>
                          <span className="sm-metric-val">{payoffResult.greeks.probabilityOfProfit}%</span>
                        </div>
                        <div className="sm-payoff-metric-row">
                          <span className="sm-metric-label">R:R</span>
                          <span className="sm-metric-val">{payoffResult.greeks.riskRewardRatio}</span>
                        </div>
                      </div>

                      <div className="sm-payoff-metric-row">
                        <span className="sm-metric-label">Max Profit</span>
                        <span className="sm-metric-val green">
                          {typeof payoffResult.greeks.maxProfit === 'number'
                            ? `+₹${Math.round(payoffResult.greeks.maxProfit).toLocaleString('en-IN')}`
                            : payoffResult.greeks.maxProfit}
                        </span>
                      </div>

                      <div className="sm-payoff-metric-row">
                        <span className="sm-metric-label">Max Loss</span>
                        <span className="sm-metric-val red">
                          {typeof payoffResult.greeks.maxLoss === 'number'
                            ? `-₹${Math.abs(Math.round(payoffResult.greeks.maxLoss)).toLocaleString('en-IN')}`
                            : payoffResult.greeks.maxLoss}
                        </span>
                      </div>

                      <div className="sm-payoff-metric-row">
                        <span className="sm-metric-label">Breakevens</span>
                        <span className="sm-metric-val">
                          {payoffResult.greeks.breakevens.length > 0
                            ? payoffResult.greeks.breakevens.map((b) => Math.round(b)).join(' — ')
                            : 'None'}
                        </span>
                      </div>
                    </div>

                    {/* Right Chart Column */}
                    <div className="sm-payoff-chart-col">
                      <div className="sm-chart-zoom-btns" style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
                        <button
                          type="button"
                          className="sm-chart-zoom-btn"
                          onClick={() => zoomPayoffChart(0.7)}
                          title="Zoom in"
                          aria-label="Zoom in"
                        >
                          <ZoomIn strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="sm-chart-zoom-btn"
                          onClick={() => zoomPayoffChart(1.4)}
                          title="Zoom out"
                          aria-label="Zoom out"
                        >
                          <ZoomOut strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="sm-chart-zoom-btn"
                          onClick={resetPayoffZoom}
                          title="Reset zoom"
                          aria-label="Reset zoom"
                        >
                          <RotateCcw strokeWidth={2} />
                        </button>
                      </div>
                      <ReactECharts
                        option={payoffChartOption}
                        style={{
                          height: Math.max(240, chartPanelHeight - 8),
                          width: '100%',
                          minHeight: 240,
                        }}
                        notMerge={false}
                        lazyUpdate
                        opts={{ renderer: 'canvas' }}
                        onChartReady={(inst: any) => {
                          payoffChartRef.current = { getEchartsInstance: () => inst };
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Ready-Made Strategies Panel (StockMojo Screenshot 5) */}
                {analyticsTab === 'ready_made' && (
                  <div style={{ padding: '1.25rem' }}>
                    <div className="opt-ready-header">
                      <div className="opt-ready-title">
                        <Sliders className="w-4 h-4 text-blue-600" />
                        <span>Ready-Made Strategies</span>
                      </div>

                      <div className="opt-category-pills">
                        {(['Bullish', 'Bearish', 'Neutral', 'Other'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setReadyCategory(cat)}
                            className={`opt-category-pill ${readyCategory === cat ? 'active' : ''}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="opt-ready-cards-grid">
                      {READY_STRATEGIES[readyCategory].map((strat) => (
                        <div
                          key={strat.id}
                          onClick={() => applyTemplate(strat.name)}
                          className="opt-ready-card"
                          title={`Click to load ${strat.name} multi-leg strategy`}
                        >
                          <div className="opt-ready-preview-box">
                            <StrategyPayoffPreviewSvg name={strat.name} />
                          </div>
                          <div className="opt-ready-card-name">{strat.name}</div>
                          <div className="opt-ready-card-desc">{strat.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3 & 4: keep candlestick mounted so tab switch doesn't remount / refetch blank */}
                <NiftyCandlestickChart
                  symbol={symbol}
                  spotPrice={spot}
                  spotChange={spotChange}
                  spotChangePct={spotChangePct}
                  height={
                    isChartFullscreen
                      ? Math.max(560, typeof window !== 'undefined' ? window.innerHeight - 72 : 560)
                      : Math.max(280, chartPanelHeight - 4)
                  }
                  isActive={
                    analyticsTab === 'nifty_chart' || analyticsTab === 'strategy_chart'
                  }
                />
                </div>
                </>
                ) : null}
              </div>

              {isDesktopLayout && !isAnalyticsCollapsed && !isPositionsCollapsed && !isChartFullscreen ? (
                <PanelResizeHandle
                  axis="vertical"
                  label="Resize analytics and positions"
                  onDrag={(delta) => {
                    const splitH = workspaceSplitRef.current?.clientHeight || 640;
                    setAnalyticsFlex((prev) => prev + (delta / Math.max(splitH, 1)) * 100);
                  }}
                />
              ) : null}

              {/* Lower Section: Positions & Greeks Manager */}
              <div
                className={`sm-positions-card ${isPositionsCollapsed ? 'is-collapsed' : ''} ${isPositionsPriority ? 'is-pos-priority' : ''} ${isChartFullscreen ? 'is-hidden-fs' : ''}`}
                style={
                  isChartFullscreen
                    ? { display: 'none' }
                    : isDesktopLayout && !isAnalyticsCollapsed && !isPositionsCollapsed
                      ? { flex: `${100 - analyticsFlex} 1 0`, minHeight: 180 }
                      : isPositionsCollapsed
                        ? { flex: '0 0 auto' }
                        : { flex: '1 1 auto', minHeight: 180 }
                }
              >
                {/* Positions Subtabs Bar */}
                <div className="sm-positions-tabs-bar">
                  <div className="sm-positions-tab-group" role="tablist" aria-label="Positions views">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={positionsSubTab === 'positions'}
                      onClick={() => setPositionsSubTab('positions')}
                      className={`sm-positions-tab ${positionsSubTab === 'positions' ? 'active' : ''}`}
                    >
                      Positions ({strategyLegs.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={positionsSubTab === 'greeks'}
                      onClick={() => setPositionsSubTab('greeks')}
                      className={`sm-positions-tab ${positionsSubTab === 'greeks' ? 'active' : ''}`}
                    >
                      Greeks
                    </button>
                  </div>

                  {/* Multiplier & Total Summary Toolbar */}
                  <div className="sm-positions-toolbar">
                    <div className="sm-multiplier-box">
                      <span className="sm-toolbar-label">Multiplier</span>
                      <div className="sm-qty-stepper" role="group" aria-label="Strategy multiplier">
                        <button
                          type="button"
                          onClick={() => applyMultiplier(-1)}
                          className="sm-stepper-btn"
                          aria-label="Decrease multiplier"
                        >
                          <Minus className="sm-icon" aria-hidden />
                        </button>
                        <span className="sm-stepper-value">{multiplier}</span>
                        <button
                          type="button"
                          onClick={() => applyMultiplier(1)}
                          className="sm-stepper-btn"
                          aria-label="Increase multiplier"
                        >
                          <Plus className="sm-icon" aria-hidden />
                        </button>
                      </div>
                    </div>

                    <div className="sm-toolbar-divider" aria-hidden />

                    <div className="sm-toolbar-meta">
                      Qty: <strong className="font-mono text-slate-900">{totalQty}</strong>
                    </div>

                    <div className="sm-toolbar-divider" aria-hidden />

                    <div className="sm-toolbar-meta font-semibold text-slate-700">
                      P&L:{' '}
                      <strong className={`font-mono ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{totalPnl.toFixed(2)}
                      </strong>
                    </div>

                    <div className="sm-layout-controls" role="group" aria-label="Positions layout">
                      <button
                        type="button"
                        className={`sm-layout-btn ${isPositionsPriority ? 'is-on' : ''}`}
                        title="Expand positions (keep chart visible)"
                        onClick={expandPositionsPanel}
                      >
                        <Maximize2 strokeWidth={2} />
                        <span>Expand</span>
                      </button>
                      <button
                        type="button"
                        className={`sm-layout-btn ${isBalancedSplit ? 'is-on' : ''}`}
                        title="Split chart + positions (default sizes)"
                        onClick={balanceWorkspace}
                      >
                        <Minimize2 strokeWidth={2} />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        className="sm-layout-btn sm-layout-btn--icon"
                        title={isPositionsCollapsed ? 'Show positions' : 'Hide positions'}
                        aria-label={isPositionsCollapsed ? 'Show positions' : 'Hide positions'}
                        onClick={() => setIsPositionsCollapsed((p) => !p)}
                      >
                        {isPositionsCollapsed ? (
                          <ChevronDown strokeWidth={2} />
                        ) : (
                          <ChevronUp strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {!isPositionsCollapsed ? (
                <>
                {/* Positions Table */}
                {positionsSubTab === 'positions' && (
                  <div className="sm-positions-table-wrap">
                    {strategyLegs.length > 0 ? (
                      <table className="sm-positions-table">
                        <thead>
                          <tr>
                            <th style={{ width: '32px' }}>
                              <input
                                type="checkbox"
                                checked={enabledLegIds.size === strategyLegs.length}
                                onChange={toggleAllLegsEnabled}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                            </th>
                            <th style={{ width: '45px' }}>Side</th>
                            <th style={{ width: '55px' }}>Lots</th>
                            <th style={{ width: '90px' }}>Expiry</th>
                            <th style={{ width: '120px' }}>Strike</th>
                            <th style={{ width: '55px' }}>Type</th>
                            <th style={{ width: '80px' }}>Entry</th>
                            <th style={{ width: '80px' }}>LTP / Exit</th>
                            <th style={{ width: '75px' }}>P&L</th>
                            <th style={{ width: '40px', textAlign: 'center' }}>Exit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {strategyLegs.map((leg) => {
                            const isEnabled = enabledLegIds.has(leg.id);
                            const curPrice = leg.currentPrice ?? leg.entryPrice;
                            const legPnl = (curPrice - leg.entryPrice) * (leg.side === 'BUY' ? 1 : -1) * leg.lots * leg.lotSize;

                            return (
                              <tr key={leg.id} style={{ opacity: isEnabled ? 1 : 0.45 }}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => toggleLegEnabled(leg.id)}
                                    className="rounded text-blue-600 focus:ring-0"
                                  />
                                </td>

                                {/* Side Toggle Pill [ B ] / [ S ] */}
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => toggleLegSide(leg.id)}
                                    className={`sm-side-pill ${leg.side.toLowerCase()}`}
                                    title="Toggle Buy / Sell"
                                  >
                                    {leg.side === 'BUY' ? 'Buy' : 'Sell'}
                                  </button>
                                </td>

                                {/* Lots Counter */}
                                <td>
                                  <div className="sm-qty-stepper" role="group" aria-label="Lots">
                                    <button
                                      type="button"
                                      onClick={() => updateLegLots(leg.id, -1)}
                                      className="sm-stepper-btn"
                                      aria-label="Decrease lots"
                                    >
                                      <Minus className="sm-icon" aria-hidden />
                                    </button>
                                    <span className="sm-stepper-value">{leg.lots}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateLegLots(leg.id, 1)}
                                      className="sm-stepper-btn"
                                      aria-label="Increase lots"
                                    >
                                      <Plus className="sm-icon" aria-hidden />
                                    </button>
                                  </div>
                                </td>

                                {/* Expiry Dropdown */}
                                <td>
                                  <span className="sm-leg-expiry">{leg.expiry}</span>
                                </td>

                                {/* Strike Stepper */}
                                <td>
                                  <div className="sm-qty-stepper sm-strike-stepper" role="group" aria-label="Strike">
                                    <button
                                      type="button"
                                      onClick={() => shiftLegStrike(leg.id, -1)}
                                      className="sm-stepper-btn"
                                      title="Shift strike down"
                                      aria-label="Decrease strike"
                                    >
                                      <Minus className="sm-icon" aria-hidden />
                                    </button>
                                    <span className="sm-stepper-value sm-stepper-value-wide">{leg.strike}</span>
                                    <button
                                      type="button"
                                      onClick={() => shiftLegStrike(leg.id, 1)}
                                      className="sm-stepper-btn"
                                      title="Shift strike up"
                                      aria-label="Increase strike"
                                    >
                                      <Plus className="sm-icon" aria-hidden />
                                    </button>
                                  </div>
                                </td>

                                {/* Type Pill [ CE ] / [ PE ] */}
                                <td>
                                  <button
                                    onClick={() => toggleLegType(leg.id)}
                                    className={`sm-type-chip ${leg.optionType.toLowerCase()}`}
                                    title="Toggle CE / PE"
                                  >
                                    {leg.optionType}
                                  </button>
                                </td>

                                {/* Entry Price */}
                                <td>
                                  <span className="font-mono font-semibold">₹{leg.entryPrice.toFixed(2)}</span>
                                </td>

                                {/* LTP / Current Price */}
                                <td>
                                  <span className="font-mono font-semibold text-slate-900">
                                    ₹{(leg.currentPrice ?? leg.entryPrice).toFixed(2)}
                                  </span>
                                </td>

                                {/* P&L */}
                                <td>
                                  <span
                                    className={`font-mono font-bold ${
                                      legPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {legPnl >= 0 ? '+' : ''}₹{Math.round(legPnl)}
                                  </span>
                                </td>

                                {/* Delete Action */}
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    onClick={() => removeLeg(leg.id)}
                                    className="sm-trash-btn"
                                    title="Remove position"
                                  >
                                    <X className="sm-icon" aria-hidden />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center bg-slate-50/50">
                        <p className="text-sm font-bold text-slate-700">No active positions</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click any strike in the Option Chain on the left, or load a popular strategy template below:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          {['Bull Call Spread', 'Bear Put Spread', 'Short Straddle', 'Short Strangle', 'Iron Condor'].map(
                            (tpl) => (
                              <button
                                key={tpl}
                                onClick={() => applyTemplate(tpl)}
                                className="sm-quick-tpl-btn"
                              >
                                + {tpl}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Greeks Subtab */}
                {positionsSubTab === 'greeks' && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Net Delta:</span>{' '}
                      <strong className="text-slate-900 text-sm">{payoffResult.greeks.netDelta}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Net Gamma:</span>{' '}
                      <strong className="text-slate-900 text-sm">{payoffResult.greeks.netGamma}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Net Theta:</span>{' '}
                      <strong className={`text-sm ${payoffResult.greeks.netTheta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{payoffResult.greeks.netTheta}/day
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Net Vega:</span>{' '}
                      <strong className="text-slate-900 text-sm">₹{payoffResult.greeks.netVega}/%</strong>
                    </div>
                  </div>
                )}
                </>
                ) : null}
              </div>
              </div>{/* /.sm-workspace-split */}

              {/* ── Bottom Section: Educational Guide & Related Tools ── */}
              <div className={`sm-guide-card ${isGuideCollapsed ? 'is-collapsed' : ''} ${isChartFullscreen ? 'is-hidden-fs' : ''}`}>
                <button
                  type="button"
                  className="sm-guide-toggle"
                  onClick={() => setIsGuideCollapsed((p) => !p)}
                  aria-expanded={!isGuideCollapsed}
                >
                  <h4 className="sm-guide-title">How to Build an Option Strategy on GoalCompass Options Lab</h4>
                  <span className="sm-guide-toggle-hint">{isGuideCollapsed ? 'Show guide' : 'Hide guide'}</span>
                  {isGuideCollapsed ? <ChevronDown strokeWidth={2} /> : <ChevronUp strokeWidth={2} />}
                </button>
                {!isGuideCollapsed && (
                  <>
                <div className="sm-guide-steps">
                  <div>
                    <strong>1. Select symbol and expiry</strong> — Choose a symbol ({POPULAR_UNDERLYINGS.slice(0, 4).join(', ')}) and an expiry date from the ladder above.
                  </div>
                  <div>
                    <strong>2. Add your first leg</strong> — Pick Buy or Sell, Call or Put, and select a strike price directly from the Option Chain on the left.
                  </div>
                  <div>
                    <strong>3. Build multi-leg strategies</strong> — Add more legs (up to 6) to create spread strategies like Iron Condor, Butterfly, or Straddle.
                  </div>
                  <div>
                    <strong>4. Review the payoff diagram</strong> — Examine the curve showing profit/loss zones, breakeven points, standard deviations, and maximum profit at expiration.
                  </div>
                  <div>
                    <strong>5. Analyze combined Greeks</strong> — Check the combined Delta, Theta, Vega, and Gamma displayed in the positions panel to manage portfolio risk.
                  </div>
                </div>

                <div className="sm-tools-grid">
                  <div className="sm-tool-card" onClick={() => setActiveTab('sandbox')}>
                    <div className="sm-tool-title">Simulator</div>
                    <div className="sm-tool-desc">Backtest strategies risk-free with virtual paper margin.</div>
                  </div>
                  <div className="sm-tool-card" onClick={() => setActiveTab('chain')}>
                    <div className="sm-tool-title">Option Chain</div>
                    <div className="sm-tool-desc">Full table view with Greeks, PCR, and Volume filters.</div>
                  </div>
                  <div className="sm-tool-card" onClick={() => setActiveTab('oi')}>
                    <div className="sm-tool-title">Straddle & OI Chart</div>
                    <div className="sm-tool-desc">ATM straddle premium tracking & strike concentration.</div>
                  </div>
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: FULL OPTION CHAIN (Expanded Dedicated View)
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'chain' && (
          <OptionChainTable
            chainData={chainData}
            symbol={symbol}
            selectedExpiry={selectedExpiry}
            isLoading={isLoading}
            onAddOrToggleLeg={onAddOrToggleLeg}
          />
        )}

        {/* Keep visited analytics tabs mounted so charts don't remount / flash wrong */}
        {visitedTabs.has('oi') && (
          <div className={activeTab === 'oi' ? undefined : 'sm-tab-panel-hidden'} aria-hidden={activeTab !== 'oi'}>
            <OiTrackerView chainData={chainData} symbol={symbol} selectedExpiry={selectedExpiry} />
          </div>
        )}

        {visitedTabs.has('iv') && (
          <div className={activeTab === 'iv' ? undefined : 'sm-tab-panel-hidden'} aria-hidden={activeTab !== 'iv'}>
            <IvSurfaceView symbol={symbol} selectedExpiry={selectedExpiry} />
          </div>
        )}

        {visitedTabs.has('sandbox') && (
          <div
            className={activeTab === 'sandbox' ? undefined : 'sm-tab-panel-hidden'}
            aria-hidden={activeTab !== 'sandbox'}
          >
            <SandboxPortfolioView isActive={activeTab === 'sandbox'} liveChain={chainData} />
          </div>
        )}

        {/* Modals */}
        <BrokerConnectModal
          isOpen={isBrokerModalOpen}
          onClose={() => setIsBrokerModalOpen(false)}
          onConnectSuccess={(broker) => setConnectedBroker(broker)}
        />

        <SaveStrategyModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          underlying={symbol}
          legs={strategyLegs.filter((l) => enabledLegIds.has(l.id))}
          onSaveSuccess={() => {
            setNotification('Strategy saved successfully to your account.');
            setTimeout(() => setNotification(null), 3000);
          }}
        />

        <SavedStrategiesModal
          isOpen={isSavedListOpen}
          onClose={() => setIsSavedListOpen(false)}
          onLoad={loadSavedStrategy}
        />
      </OptionsShell>
    </SidebarLayout>
  );
}
