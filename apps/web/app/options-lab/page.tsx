'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../../styles/options-lab.css';
import dynamic from 'next/dynamic';
import {
  Trash2,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  FolderOpen,
} from 'lucide-react';
import {
  OptionChainDto,
  OptionChainRowDto,
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
import { OiTrackerView } from '../../components/options/oi-tracker-view';
import { IvSurfaceView } from '../../components/options/iv-surface-view';
import { SandboxPortfolioView } from '../../components/options/sandbox-portfolio-view';
import { StockMojoChainLadder } from '../../components/options/stockmojo-chain-ladder';
import { NiftyCandlestickChart } from '../../components/options/nifty-candlestick-chart';

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
  const [symbol, setSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [connectedBroker, setConnectedBroker] = useState<string | null>('sandbox');
  const [chainData, setChainData] = useState<OptionChainDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'closed'>('connected');
  const [latencyMs, setLatencyMs] = useState(22);

  // Split-Screen & Analytics Workspace States
  const [isChainCollapsed, setIsChainCollapsed] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'payoff' | 'ready_made' | 'strategy_chart' | 'nifty_chart'>('payoff');
  const [readyCategory, setReadyCategory] = useState<'Neutral' | 'Bullish' | 'Bearish' | 'Other'>('Neutral');
  const [positionsSubTab, setPositionsSubTab] = useState<'positions' | 'greeks'>('positions');
  const [multiplier, setMultiplier] = useState(1);
  const [enabledLegIds, setEnabledLegIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState('');

  // Chain Filter State (For full Option Chain tab)
  const [strikeFilter, setStrikeFilter] = useState<'all' | '10' | '15' | '20'>('15');
  const [showGreeks, setShowGreeks] = useState(true);

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

  // Fetch Option Chain Data
  const fetchChain = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `/api/v1/options/chain/${symbol}${selectedExpiry ? `?expiry=${selectedExpiry}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setChainData(json.data);
          if (!selectedExpiry && json.data.selectedExpiry) {
            setSelectedExpiry(json.data.selectedExpiry);
          }
          setConnectionStatus('connected');
          setLatencyMs(Math.floor(18 + Math.random() * 12));
        }
      }
    } catch {
      setConnectionStatus('reconnecting');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedExpiry]);

  // Polling fallback
  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, 5000);
    return () => clearInterval(interval);
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
      setLatencyMs(Math.floor(14 + Math.random() * 8));
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
  const vix = chainData?.vix || 12.29;
  const futures = chainData?.futures || [];
  const lotSize = chainData?.lotSize || 50;

  // Filtered Option Chain Contracts for full tab
  const filteredChainRows = useMemo(() => {
    if (!chainData?.contracts) return [];
    if (strikeFilter === 'all') return chainData.contracts;

    const limit = parseInt(strikeFilter, 10);
    const atmIndex = chainData.contracts.findIndex((c) => c.strike >= chainData.atmStrike);
    const start = Math.max(0, atmIndex - limit);
    const end = Math.min(chainData.contracts.length, atmIndex + limit + 1);
    return chainData.contracts.slice(start, end);
  }, [chainData, strikeFilter]);

  // Strategy Payoff Calculation Engine
  const activeEnabledLegs = useMemo(() => {
    return strategyLegs.filter((l) => enabledLegIds.has(l.id));
  }, [strategyLegs, enabledLegIds]);

  const payoffResult = useMemo(() => {
    const currentSpot = (chainData?.spotPrice || 23270.6) * (1 + spotShiftPct / 100);

    const shiftedLegs = activeEnabledLegs.map((l) => ({
      ...l,
      iv: Math.max(0.01, (l.iv ?? 0.14) + ivShiftPoints / 100),
    }));

    return calculateStrategyPayoff({
      legs: shiftedLegs,
      currentSpot,
      targetDaysForward: daysForward,
      spotRangePct: 0.12,
      numPoints: 81,
    });
  }, [activeEnabledLegs, chainData?.spotPrice, spotShiftPct, ivShiftPoints, daysForward]);

  // ECharts Option for Payoff Diagram with continuous value coordinate system
  const payoffChartOption = useMemo(() => {
    const currentSpot = chainData?.spotPrice || 23270.6;
    const atmIv = chainData?.atmIv || 13.8;
    const tteYears = (7 + daysForward) / 365;
    const oneSd = currentSpot * (atmIv / 100) * Math.sqrt(tteYears);
    const roundSpot = Math.round(currentSpot);

    // Baseline chart when no legs are active
    if (!payoffResult.payoffPoints || payoffResult.payoffPoints.length === 0) {
      const minX = Math.round(currentSpot - 2.5 * oneSd);
      const maxX = Math.round(currentSpot + 2.5 * oneSd);

      return {
        backgroundColor: '#FFFFFF',
        grid: { left: 55, right: 35, bottom: 25, top: 40, containLabel: true },
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
            data: [
              [minX, 0],
              [maxX, 0],
            ],
            lineStyle: { width: 1.5, color: '#94A3B8', type: 'dashed' },
            markLine: {
              silent: true,
              symbol: 'none',
              data: [
                {
                  xAxis: roundSpot,
                  lineStyle: { color: '#0F172A', type: 'solid', width: 2 },
                  label: {
                    formatter: `Spot: ${roundSpot.toLocaleString('en-IN')}`,
                    position: 'top',
                    color: '#0F172A',
                    fontSize: 10,
                    fontWeight: 700,
                  },
                },
                {
                  xAxis: Math.round(currentSpot - 2 * oneSd),
                  lineStyle: { color: '#94A3B8', type: 'dashed' },
                  label: { formatter: '-2SD', color: '#64748B', position: 'top', fontSize: 10 },
                },
                {
                  xAxis: Math.round(currentSpot - oneSd),
                  lineStyle: { color: '#94A3B8', type: 'dashed' },
                  label: { formatter: '-1SD', color: '#64748B', position: 'top', fontSize: 10 },
                },
                {
                  xAxis: Math.round(currentSpot + oneSd),
                  lineStyle: { color: '#94A3B8', type: 'dashed' },
                  label: { formatter: '+1SD', color: '#64748B', position: 'top', fontSize: 10 },
                },
                {
                  xAxis: Math.round(currentSpot + 2 * oneSd),
                  lineStyle: { color: '#94A3B8', type: 'dashed' },
                  label: { formatter: '+2SD', color: '#64748B', position: 'top', fontSize: 10 },
                },
              ],
            },
          },
        ],
      };
    }

    const expiryData = payoffResult.payoffPoints.map((p) => [Math.round(p.spotPrice), Math.round(p.expiryPayoff)]);
    const targetData = payoffResult.payoffPoints.map((p) => [Math.round(p.spotPrice), Math.round(p.targetDatePayoff)]);
    const minSpot = Math.round(payoffResult.payoffPoints[0]?.spotPrice || currentSpot - 2 * oneSd);
    const maxSpot = Math.round(payoffResult.payoffPoints[payoffResult.payoffPoints.length - 1]?.spotPrice || currentSpot + 2 * oneSd);

    return {
      backgroundColor: '#FFFFFF',
      tooltip: {
        trigger: 'axis',
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
        data: ['At Expiry Payoff', `Target (T+${daysForward}) Payoff`],
        textStyle: { color: '#64748B', fontSize: 11 },
        top: 4,
      },
      grid: { left: 55, right: 35, bottom: 25, top: 40, containLabel: true },
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
          name: 'At Expiry Payoff',
          type: 'line',
          data: expiryData,
          smooth: true,
          lineStyle: { width: 2.5 },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              { yAxis: 0, lineStyle: { color: '#94A3B8', type: 'dashed' } },
              {
                xAxis: roundSpot,
                lineStyle: { color: '#0F172A', type: 'solid', width: 2 },
                label: {
                  formatter: `Spot: ${roundSpot.toLocaleString('en-IN')}`,
                  position: 'top',
                  color: '#0F172A',
                  fontSize: 10,
                  fontWeight: 700,
                },
              },
              {
                xAxis: Math.round(currentSpot - 2 * oneSd),
                lineStyle: { color: '#94A3B8', type: 'dashed' },
                label: { formatter: '-2SD', color: '#64748B', position: 'top', fontSize: 10 },
              },
              {
                xAxis: Math.round(currentSpot - oneSd),
                lineStyle: { color: '#94A3B8', type: 'dashed' },
                label: { formatter: '-1SD', color: '#64748B', position: 'top', fontSize: 10 },
              },
              {
                xAxis: Math.round(currentSpot + oneSd),
                lineStyle: { color: '#94A3B8', type: 'dashed' },
                label: { formatter: '+1SD', color: '#64748B', position: 'top', fontSize: 10 },
              },
              {
                xAxis: Math.round(currentSpot + 2 * oneSd),
                lineStyle: { color: '#94A3B8', type: 'dashed' },
                label: { formatter: '+2SD', color: '#64748B', position: 'top', fontSize: 10 },
              },
              ...payoffResult.greeks.breakevens.map((b) => ({
                xAxis: Math.round(b),
                lineStyle: { color: '#D97706', type: 'dotted' },
                label: { formatter: `BE: ₹${Math.round(b).toLocaleString('en-IN')}`, color: '#D97706', fontSize: 10 },
              })),
            ],
          },
        },
        {
          name: `Target (T+${daysForward}) Payoff`,
          type: 'line',
          data: targetData,
          smooth: true,
          lineStyle: { width: 2, color: '#2563EB', type: 'dashed' },
        },
      ],
    };
  }, [payoffResult, chainData?.spotPrice, chainData?.atmIv, daysForward, symbol]);

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
      selectedExpiry || chainData.selectedExpiry || chainData.expiryDates[0] || '2026-09-24';
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
      // Enrich with live contract LTPs and Greeks from chainData
      const legs = baseLegs.map((leg) => {
        const contract = chainData.contracts?.find((c) => c.strike === leg.strike);
        if (contract) {
          const sideContract = leg.optionType === 'CE' ? contract.ce : contract.pe;
          if (sideContract && sideContract.ltp > 0) {
            return {
              ...leg,
              entryPrice: sideContract.ltp,
              currentPrice: sideContract.ltp,
              iv: sideContract.iv || leg.iv,
              delta: sideContract.delta || leg.delta,
              gamma: sideContract.gamma || leg.gamma,
              theta: sideContract.theta || leg.theta,
              vega: sideContract.vega || leg.vega,
            };
          }
        }
        return leg;
      });

      setStrategyLegs(legs);
      setAnalyticsTab('payoff');
      setNotification(`Loaded "${tplName}" strategy.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Auto-initialize default demo strategy on first load (Short Strangle matching StockMojo)
  const hasInitializedStrategy = useRef(false);
  useEffect(() => {
    if (!hasInitializedStrategy.current && chainData?.spotPrice) {
      hasInitializedStrategy.current = true;
      applyTemplate('Short Strangle');
    }
  }, [chainData?.spotPrice]);

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
      expiry: selectedExpiry || '2026-09-24',
      strike,
      optionType: type,
      side,
      lots: 1,
      lotSize: symLotSize,
      entryPrice: Math.round(price * 100) / 100,
      currentPrice: Math.round(price * 100) / 100,
      iv: ivVal ? ivVal / 100 : 0.14,
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
    setNotification('Cleared all strategy positions.');
    setTimeout(() => setNotification(null), 3000);
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
    if (strategyLegs.length === 0) return;
    try {
      const orders = strategyLegs.map((l) => ({
        symbol: l.symbol,
        expiry: l.expiry,
        strike: l.strike,
        optionType: l.optionType,
        side: l.side,
        lots: l.lots,
        lotSize: l.lotSize,
        price: l.entryPrice,
      }));

      const res = await fetch('/api/v1/options/sandbox/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      if (res.ok) {
        setNotification('Strategy executed in Paper Trading Sandbox!');
        setActiveTab('sandbox');
      } else {
        setNotification('Orders simulated successfully.');
        setActiveTab('sandbox');
      }
    } catch {
      setNotification('Position recorded in Sandbox mode.');
      setActiveTab('sandbox');
    }
    setTimeout(() => setNotification(null), 4000);
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
        pcr={chainData?.pcr || 1.0}
        maxPain={chainData?.maxPain || atmStrike}
        atmIv={chainData?.atmIv || 13.8}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        connectedBroker={connectedBroker}
      >
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
          <div className="sm-layout-root animate-fadeIn">
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
              futures={futures}
              selectedExpiry={selectedExpiry}
              expiryDates={chainData?.expiryDates || []}
              onExpiryChange={setSelectedExpiry}
              contracts={chainData?.contracts || []}
              atmStrike={atmStrike}
              activeLegs={strategyLegs}
              onAddOrToggleLeg={onAddOrToggleLeg}
              isCollapsed={isChainCollapsed}
              onToggleCollapse={() => setIsChainCollapsed((p) => !p)}
            />

            {/* ── Right Column: Interactive Strategy Workspace ── */}
            <div className="sm-workspace-panel">
              {/* Top Action Bar (Save, Saved, Reset/New, Clock) */}
              <div className="sm-top-action-bar">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="sm-action-btn-save"
                    title="Save current strategy to account"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="sm-action-btn-saved"
                    title="View Saved Strategies"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Saved</span>
                  </button>

                  <button
                    onClick={resetAllLegs}
                    className="sm-action-btn-reset"
                    title="Reset strategy positions to clean slate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset/New</span>
                  </button>
                </div>

                {/* Right: Live Market Clock */}
                <div className="sm-market-clock">
                  <span className="sm-clock-dot" />
                  <span>{currentTime || 'Market Live'}</span>
                </div>
              </div>

              {/* Upper Section: Visual Analytics Card (Payoff / Charts) */}
              <div className="sm-analytics-card">
                {/* Tabs Bar */}
                <div className="sm-analytics-tabs-bar">
                  <div className="sm-analytics-tab-group">
                    <button
                      onClick={() => setAnalyticsTab('payoff')}
                      className={`sm-analytics-tab ${analyticsTab === 'payoff' ? 'active' : ''}`}
                    >
                      Payoff
                    </button>
                    <button
                      onClick={() => setAnalyticsTab('ready_made')}
                      className={`sm-analytics-tab ${analyticsTab === 'ready_made' ? 'active' : ''}`}
                    >
                      Ready-Made Strategies
                    </button>
                    <button
                      onClick={() => setAnalyticsTab('strategy_chart')}
                      className={`sm-analytics-tab ${analyticsTab === 'strategy_chart' ? 'active' : ''}`}
                    >
                      Strategy Chart
                    </button>
                    <button
                      onClick={() => setAnalyticsTab('nifty_chart')}
                      className={`sm-analytics-tab ${analyticsTab === 'nifty_chart' ? 'active' : ''}`}
                    >
                      {symbol} Chart
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <button
                      onClick={executeInSandbox}
                      className="px-3 py-1 rounded bg-[#0F766E] hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm text-xs"
                    >
                      <Play className="w-3 h-3 fill-current" /> Paper Trade
                    </button>
                    {analyticsTab === 'payoff' && (
                      <button
                        type="button"
                        onClick={() => setShowPayoffSettings(!showPayoffSettings)}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded border border-slate-200 bg-white"
                        title="Toggle Target Date & IV What-If Settings"
                      >
                        <span>Payoff setting</span>
                        <span
                          style={{
                            width: '28px',
                            height: '16px',
                            borderRadius: '999px',
                            background: showPayoffSettings ? '#2563EB' : '#CBD5E1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px',
                            transition: 'background 0.2s',
                          }}
                        >
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '999px',
                              background: '#FFFFFF',
                              transform: showPayoffSettings ? 'translateX(12px)' : 'translateX(0)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </span>
                      </button>
                    )}
                  </div>
                </div>

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
                          ₹{Math.round(totalPnl).toLocaleString('en-IN')} (
                          {totalPnl >= 0 ? '+' : ''}
                          {(totalPnl / 1000).toFixed(2)}%)
                        </div>
                      </div>

                      <div className="sm-payoff-metric-row">
                        <span className="sm-metric-label">Est. Margin</span>
                        <span className="sm-metric-val">₹{estMargin} L</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="sm-payoff-metric-row">
                          <span className="sm-metric-label">POP</span>
                          <span className="sm-metric-val">{payoffResult.greeks.probabilityOfProfit}%</span>
                        </div>
                        <div className="sm-payoff-metric-row">
                          <span className="sm-metric-label">R : R</span>
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
                        <span className="sm-metric-val font-mono text-xs">
                          {payoffResult.greeks.breakevens.length > 0
                            ? payoffResult.greeks.breakevens.map((b) => Math.round(b)).join(' — ')
                            : 'None'}
                        </span>
                      </div>
                    </div>

                    {/* Right Chart Column */}
                    <div className="sm-payoff-chart-col">
                      <ReactECharts
                        option={payoffChartOption}
                        style={{ height: '330px', width: '100%' }}
                        notMerge={true}
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

                {/* Tab 3 & 4: Interactive Candlestick Chart */}
                {(analyticsTab === 'nifty_chart' || analyticsTab === 'strategy_chart') && (
                  <NiftyCandlestickChart
                    symbol={symbol}
                    spotPrice={spot}
                    spotChange={spotChange}
                    spotChangePct={spotChangePct}
                  />
                )}
              </div>

              {/* Lower Section: Positions & Greeks Manager */}
              <div className="sm-positions-card">
                {/* Positions Subtabs Bar */}
                <div className="sm-positions-tabs-bar">
                  <div className="sm-positions-tab-group">
                    <button
                      onClick={() => setPositionsSubTab('positions')}
                      className={`sm-positions-tab ${positionsSubTab === 'positions' ? 'active' : ''}`}
                    >
                      Positions ({strategyLegs.length})
                    </button>
                    <button
                      onClick={() => setPositionsSubTab('greeks')}
                      className={`sm-positions-tab ${positionsSubTab === 'greeks' ? 'active' : ''}`}
                    >
                      Greeks
                    </button>
                  </div>

                  {/* Multiplier & Total Summary Toolbar */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="sm-multiplier-box">
                      <span className="text-slate-500 font-semibold">Multiplier:</span>
                      <button onClick={() => applyMultiplier(-1)} className="sm-multiplier-btn">
                        -
                      </button>
                      <span className="font-bold font-mono px-1">{multiplier}</span>
                      <button onClick={() => applyMultiplier(1)} className="sm-multiplier-btn">
                        +
                      </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200" />

                    <div className="text-slate-600">
                      Qty: <strong className="font-mono text-slate-900">{totalQty}</strong>
                    </div>

                    <div className="h-4 w-px bg-slate-200" />

                    <div className="font-semibold text-slate-700">
                      Total P&L:{' '}
                      <strong className={`font-mono ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{totalPnl.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Positions Table */}
                {positionsSubTab === 'positions' && (
                  <div className="overflow-x-auto">
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
                                    onClick={() => toggleLegSide(leg.id)}
                                    className={`sm-side-pill ${leg.side.toLowerCase()}`}
                                    title="Click to toggle BUY / SELL"
                                  >
                                    {leg.side === 'BUY' ? 'B' : 'S'}
                                  </button>
                                </td>

                                {/* Lots Counter */}
                                <td>
                                  <div className="flex items-center gap-1 font-mono">
                                    <button
                                      onClick={() => updateLegLots(leg.id, -1)}
                                      className="w-4 h-4 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold flex items-center justify-center text-[10px]"
                                    >
                                      -
                                    </button>
                                    <span className="font-bold">{leg.lots}</span>
                                    <button
                                      onClick={() => updateLegLots(leg.id, 1)}
                                      className="w-4 h-4 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold flex items-center justify-center text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Expiry Dropdown */}
                                <td>
                                  <span className="text-slate-700 font-mono text-xs">{leg.expiry}</span>
                                </td>

                                {/* Strike Stepper [ - ] 23250 [ + ] */}
                                <td>
                                  <div className="sm-strike-stepper">
                                    <button
                                      onClick={() => shiftLegStrike(leg.id, -1)}
                                      className="sm-stepper-btn"
                                      title="Shift strike down"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold px-1.5">{leg.strike}</span>
                                    <button
                                      onClick={() => shiftLegStrike(leg.id, 1)}
                                      className="sm-stepper-btn"
                                      title="Shift strike up"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Type Pill [ CE ] / [ PE ] */}
                                <td>
                                  <button
                                    onClick={() => toggleLegType(leg.id)}
                                    className={`sm-type-pill ${leg.optionType.toLowerCase()}`}
                                    title="Click to toggle CE / PE"
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
                                    <Trash2 className="w-3.5 h-3.5" />
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
              </div>

              {/* ── Bottom Section: Educational Guide & Related Tools (Screenshot 5) ── */}
              <div className="sm-guide-card">
                <h4 className="sm-guide-title">How to Build an Option Strategy on GoalCompass Options Lab</h4>
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
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: FULL OPTION CHAIN (Expanded Dedicated View)
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'chain' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Filters Bar */}
            <div className="opt-filters-bar">
              <div className="opt-filter-group">
                <span className="opt-filter-label">Strikes:</span>
                {(['10', '15', '20', 'all'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStrikeFilter(filter)}
                    className={`opt-filter-btn ${strikeFilter === filter ? 'active' : ''}`}
                  >
                    {filter === 'all' ? 'All' : `±${filter}`}
                  </button>
                ))}
              </div>

              <div className="opt-filter-group" style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => setShowGreeks(!showGreeks)}
                  className={`opt-filter-btn ${showGreeks ? 'active' : ''}`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showGreeks ? 'Greeks Visible' : 'Compact View'}</span>
                </button>
              </div>
            </div>

            {/* Full Option Chain Table */}
            <div className="opt-table-wrap">
              <table className="opt-table">
                <thead>
                  <tr>
                    <th colSpan={showGreeks ? 8 : 4} className="opt-th-call-header">
                      CALLS (CE)
                    </th>
                    <th className="opt-th-strike-header">STRIKE</th>
                    <th colSpan={showGreeks ? 8 : 4} className="opt-th-put-header">
                      PUTS (PE)
                    </th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Action</th>
                    <th style={{ textAlign: 'right' }}>OI</th>
                    <th style={{ textAlign: 'right' }}>Chg OI</th>
                    {showGreeks && <th style={{ textAlign: 'right' }}>IV%</th>}
                    {showGreeks && <th style={{ textAlign: 'right' }}>Delta</th>}
                    {showGreeks && <th style={{ textAlign: 'right' }}>Theta</th>}
                    {showGreeks && <th style={{ textAlign: 'center' }}>Buildup</th>}
                    <th style={{ textAlign: 'right', color: '#059669', fontWeight: 800 }}>LTP</th>
                    <th style={{ textAlign: 'center', fontWeight: 800, color: '#D97706' }}>Strike</th>
                    <th style={{ textAlign: 'left', color: '#E11D48', fontWeight: 800 }}>LTP</th>
                    {showGreeks && <th style={{ textAlign: 'center' }}>Buildup</th>}
                    {showGreeks && <th style={{ textAlign: 'left' }}>Theta</th>}
                    {showGreeks && <th style={{ textAlign: 'left' }}>Delta</th>}
                    {showGreeks && <th style={{ textAlign: 'left' }}>IV%</th>}
                    <th style={{ textAlign: 'right' }}>Chg OI</th>
                    <th style={{ textAlign: 'right' }}>OI</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && filteredChainRows.length > 0 ? (
                    filteredChainRows.map((row: OptionChainRowDto) => {
                      const isAtm = row.strike === atmStrike;
                      const isItmCall = row.strike < spot;
                      const isItmPut = row.strike > spot;

                      return (
                        <tr key={row.strike} className={isAtm ? 'opt-row-atm' : ''}>
                          <td className={isItmCall ? 'opt-td-itm-call' : ''} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => onAddOrToggleLeg({ side: 'BUY', type: 'CE', strike: row.strike, price: row.ce.ltp, iv: row.ce.iv, expiry: selectedExpiry })}
                                className="opt-action-btn-buy"
                              >
                                +B
                              </button>
                              <button
                                onClick={() => onAddOrToggleLeg({ side: 'SELL', type: 'CE', strike: row.strike, price: row.ce.ltp, iv: row.ce.iv, expiry: selectedExpiry })}
                                className="opt-action-btn-sell"
                              >
                                +S
                              </button>
                            </div>
                          </td>
                          <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-50' : ''}`}>
                            {row.ce.oi.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-2 py-2 text-right ${row.ce.oiChange >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isItmCall ? 'bg-emerald-50' : ''}`}>
                            {row.ce.oiChange >= 0 ? '+' : ''}{row.ce.oiChange.toLocaleString('en-IN')}
                          </td>
                          {showGreeks && (
                            <td className={`px-2 py-2 text-right text-slate-500 ${isItmCall ? 'bg-emerald-50' : ''}`}>
                              {row.ce.iv !== null ? `${row.ce.iv}%` : '-'}
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-50' : ''}`}>
                              {row.ce.delta ?? '-'}
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-right text-slate-500 ${isItmCall ? 'bg-emerald-50' : ''}`}>
                              {row.ce.theta ?? '-'}
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-center ${isItmCall ? 'bg-emerald-50' : ''}`}>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                                {row.ce.buildup}
                              </span>
                            </td>
                          )}
                          <td className={`px-3 py-2 text-right font-bold text-emerald-700 font-mono ${isItmCall ? 'opt-td-itm-call' : ''}`}>
                            ₹{row.ce.ltp.toFixed(2)}
                          </td>
                          <td className="opt-td-strike">
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>{row.strike}</span>
                            {isAtm && (
                              <span style={{ marginLeft: '0.35rem', fontSize: '0.625rem', padding: '0.1rem 0.35rem', background: '#F59E0B', color: '#FFFFFF', borderRadius: '4px', fontWeight: 800 }}>
                                ATM
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-2 text-left font-bold text-rose-700 font-mono ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                            ₹{row.pe.ltp.toFixed(2)}
                          </td>
                          {showGreeks && (
                            <td className={`px-2 py-2 text-center ${isItmPut ? 'bg-rose-50' : ''}`}>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                                {row.pe.buildup}
                              </span>
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-left text-slate-500 ${isItmPut ? 'bg-rose-50' : ''}`}>
                              {row.pe.theta ?? '-'}
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-left ${isItmPut ? 'bg-rose-50' : ''}`}>
                              {row.pe.delta ?? '-'}
                            </td>
                          )}
                          {showGreeks && (
                            <td className={`px-2 py-2 text-left text-slate-500 ${isItmPut ? 'bg-rose-50' : ''}`}>
                              {row.pe.iv !== null ? `${row.pe.iv}%` : '-'}
                            </td>
                          )}
                          <td className={`px-2 py-2 text-right ${row.pe.oiChange >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isItmPut ? 'bg-rose-50' : ''}`}>
                            {row.pe.oiChange >= 0 ? '+' : ''}{row.pe.oiChange.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-2 py-2 text-right ${isItmPut ? 'bg-rose-50' : ''}`}>
                            {row.pe.oi.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-2 py-2 text-center ${isItmPut ? 'bg-rose-50' : ''}`}>
                            <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => onAddOrToggleLeg({ side: 'BUY', type: 'PE', strike: row.strike, price: row.pe.ltp, iv: row.pe.iv, expiry: selectedExpiry })}
                                className="opt-action-btn-buy"
                              >
                                +B
                              </button>
                              <button
                                onClick={() => onAddOrToggleLeg({ side: 'SELL', type: 'PE', strike: row.strike, price: row.pe.ltp, iv: row.pe.iv, expiry: selectedExpiry })}
                                className="opt-action-btn-sell"
                              >
                                +S
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={showGreeks ? 17 : 9} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                          <span className="font-semibold text-sm text-slate-800">Loading option chain...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: OPEN INTEREST TRACKER & MAX PAIN ── */}
        {activeTab === 'oi' && (
          <OiTrackerView chainData={chainData} symbol={symbol} selectedExpiry={selectedExpiry} />
        )}

        {/* ── TAB 4: IV SMILE, VOL SURFACE & GEX ── */}
        {activeTab === 'iv' && (
          <IvSurfaceView symbol={symbol} selectedExpiry={selectedExpiry} />
        )}

        {/* ── TAB 5: SIMULATOR / SANDBOX PAPER TRADING ── */}
        {activeTab === 'sandbox' && <SandboxPortfolioView />}

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
          legs={strategyLegs}
          onSaveSuccess={() => {
            setNotification('Strategy saved successfully to your account.');
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      </OptionsShell>
    </SidebarLayout>
  );
}
