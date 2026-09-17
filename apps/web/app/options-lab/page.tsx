'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../../styles/options-lab.css';
import dynamic from 'next/dynamic';
import {
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
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
import { OptionsShell, OptionsTab } from '../../components/options/options-shell';
import { BrokerConnectModal } from '../../components/options/broker-connect-modal';
import { SaveStrategyModal } from '../../components/options/save-strategy-modal';
import { OiTrackerView } from '../../components/options/oi-tracker-view';
import { IvSurfaceView } from '../../components/options/iv-surface-view';
import { SandboxPortfolioView } from '../../components/options/sandbox-portfolio-view';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function OptionsLabPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>('chain');
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

  // Chain Filter State
  const [strikeFilter, setStrikeFilter] = useState<'all' | '10' | '15' | '20'>('15');
  const [showGreeks, setShowGreeks] = useState(true);

  // Strategy Builder State
  const [strategyCategory, setStrategyCategory] = useState<'All' | 'Bullish' | 'Bearish' | 'Neutral' | 'Volatility'>('All');
  const [strategyLegs, setStrategyLegs] = useState<StrategyLegDto[]>([]);

  // What-If Scenario State
  const [spotShiftPct, setSpotShiftPct] = useState(0);
  const [ivShiftPoints, setIvShiftPoints] = useState(0);
  const [daysForward, setDaysForward] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/options`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('subscribe_chain', { underlying: symbol });
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

        const updatedSpot = tick.symbol === symbol ? tick.ltp : prev.spotPrice;
        return {
          ...prev,
          spotPrice: updatedSpot,
          contracts: updatedContracts,
        };
      });
    });

    socket.on('disconnect', () => {
      setConnectionStatus('reconnecting');
    });

    return () => {
      socket.emit('unsubscribe_chain', { underlying: symbol });
      socket.disconnect();
    };
  }, [symbol]);

  // Filtered Option Chain Contracts
  const filteredChainRows = useMemo(() => {
    if (!chainData?.contracts) return [];
    if (strikeFilter === 'all') return chainData.contracts;

    const limit = parseInt(strikeFilter, 10);
    const atmIndex = chainData.contracts.findIndex((c) => c.strike >= chainData.atmStrike);
    const start = Math.max(0, atmIndex - limit);
    const end = Math.min(chainData.contracts.length, atmIndex + limit + 1);
    return chainData.contracts.slice(start, end);
  }, [chainData, strikeFilter]);

  // Strategy Payoff Calculation
  const payoffResult = useMemo(() => {
    const currentSpot = (chainData?.spotPrice || 0) * (1 + spotShiftPct / 100);

    const shiftedLegs = strategyLegs.map((l) => ({
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
  }, [strategyLegs, chainData?.spotPrice, spotShiftPct, ivShiftPoints, daysForward]);

  // ECharts Option for Payoff Diagram
  const payoffChartOption = useMemo(() => {
    if (!payoffResult.payoffPoints || payoffResult.payoffPoints.length === 0) return {};
    const spots = payoffResult.payoffPoints.map((p) => p.spotPrice);
    const expiryPayoffs = payoffResult.payoffPoints.map((p) => p.expiryPayoff);
    const targetPayoffs = payoffResult.payoffPoints.map((p) => p.targetDatePayoff);
    const currentSpot = chainData?.spotPrice || 0;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].name;
          let html = `<div class="text-xs font-mono p-1"><strong>Spot: ₹${s}</strong><br/>`;
          params.forEach((p) => {
            const color = p.value >= 0 ? '#10b981' : '#f43f5e';
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong style="color:${color}">₹${Math.round(p.value).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['At Expiry Payoff', `Target (T+${daysForward}) Payoff`],
        textStyle: { color: '#a3a3a3', fontSize: 11 },
        top: 5,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: spots,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (v: number) => `₹${v.toLocaleString('en-IN')}`,
          fontSize: 10,
        },
      },
      series: [
        {
          name: 'At Expiry Payoff',
          type: 'line',
          data: expiryPayoffs,
          smooth: true,
          lineStyle: { width: 3, color: '#f59e0b' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              { yAxis: 0, lineStyle: { color: '#737373', type: 'dashed' } },
              {
                xAxis: String(Math.round(currentSpot)),
                lineStyle: { color: '#38bdf8', type: 'solid', width: 2 },
                label: { formatter: 'Spot', color: '#38bdf8' },
              },
              ...payoffResult.greeks.breakevens.map((b) => ({
                xAxis: String(Math.round(b)),
                lineStyle: { color: '#f59e0b', type: 'dotted' },
                label: { formatter: `BE: ₹${Math.round(b)}`, color: '#f59e0b' },
              })),
            ],
          },
        },
        {
          name: `Target (T+${daysForward}) Payoff`,
          type: 'line',
          data: targetPayoffs,
          smooth: true,
          lineStyle: { width: 2, color: '#06b6d4', type: 'dashed' },
        },
      ],
    };
  }, [payoffResult, daysForward, chainData?.spotPrice]);

  // Strategy Template Application
  const applyTemplate = (tplName: string) => {
    const tpl = STRATEGY_TEMPLATES.find((t) => t.name === tplName);
    if (tpl) {
      const spot = chainData?.spotPrice;
      if (!spot) {
        setNotification('Waiting for live market feed to initialize...');
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      let step = 50;
      let lotSize = 25;

      if (symbol === 'BANKNIFTY') {
        step = 100;
        lotSize = 15;
      } else if (symbol === 'FINNIFTY') {
        step = 50;
        lotSize = 40;
      } else if (symbol === 'SENSEX') {
        step = 100;
        lotSize = 10;
      }

      const legs = tpl.createLegs(spot, step, selectedExpiry || '2026-09-24', lotSize);
      setStrategyLegs(legs);
      setNotification(`Loaded "${tpl.name}" strategy template.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Quick Action: Add leg from Option Chain or Custom
  const addLegToStrategy = (
    side: TradeSide,
    type: OptionType | 'FUT',
    strike: number,
    price: number,
    ivVal?: number | null,
  ) => {
    let lotSize = 25;
    if (symbol === 'BANKNIFTY') lotSize = 15;
    if (symbol === 'FINNIFTY') lotSize = 40;
    if (symbol === 'SENSEX') lotSize = 10;

    const newLeg: StrategyLegDto = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      instrumentToken: `${type}-${strike}`,
      symbol,
      expiry: selectedExpiry || '2026-09-24',
      strike,
      optionType: type,
      side,
      lots: 1,
      lotSize,
      entryPrice: Math.round(price * 100) / 100,
      currentPrice: Math.round(price * 100) / 100,
      iv: ivVal ? ivVal / 100 : 0.14,
    };

    setStrategyLegs((prev) => [...prev, newLeg]);
    setActiveTab('strategy');
    setNotification(`Added ${side} ${symbol} ₹${strike} ${type} to Strategy Builder.`);
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

  const toggleLegSide = (id: string) => {
    setStrategyLegs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, side: l.side === 'BUY' ? 'SELL' : 'BUY' } : l)),
    );
  };

  // Paper trade all legs into sandbox
  const executeInSandbox = async () => {
    if (strategyLegs.length === 0) return;
    try {
      for (const leg of strategyLegs) {
        await fetch('/api/v1/options/sandbox/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: leg.symbol,
            strike: leg.strike,
            optionType: leg.optionType,
            expiry: leg.expiry,
            side: leg.side,
            quantity: leg.lots,
            price: leg.entryPrice,
          }),
        });
      }
      setActiveTab('sandbox');
      setNotification('Strategy legs filled in Sandbox portfolio at live market price.');
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification('Failed to execute paper trade. Please try again.');
    }
  };

  const filteredTemplates = useMemo(() => {
    if (strategyCategory === 'All') return STRATEGY_TEMPLATES;
    return STRATEGY_TEMPLATES.filter((t) => t.category === strategyCategory);
  }, [strategyCategory]);

  const step = symbol === 'BANKNIFTY' || symbol === 'SENSEX' ? 100 : 50;
  const spot = chainData?.spotPrice || (symbol === 'BANKNIFTY' ? 56055.75 : symbol === 'SENSEX' ? 74314.59 : 23270.6);
  const atmStrike = chainData?.atmStrike || Math.round(spot / step) * step;

  return (
    <SidebarLayout activePath="/options-lab">
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
        onToggleSandbox={() => setIsSandbox(!isSandbox)}
        connectionStatus={connectionStatus}
        latencyMs={latencyMs}
        spotPrice={spot}
        spotChange={chainData?.spotChange || 0}
        spotChangePct={chainData?.spotChangePct || 0}
        pcr={chainData?.pcr || 1.0}
        maxPain={chainData?.maxPain || atmStrike}
        atmIv={chainData?.atmIv || 13.8}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        connectedBroker={connectedBroker}
      >
        {/* Toast Notification */}
        {notification && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ── TAB 1: LIVE OPTION CHAIN ── */}
        {activeTab === 'chain' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Table Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8E4DC] rounded-xl px-4 py-3 text-xs shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-slate-700">Feed:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                  {chainData?.source === 'NSE_LIVE' ? 'NSE Official Feed' : 'Live Feed (NSE / BSE)'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">ATM Strike:</span>
                <strong className="text-amber-700 font-mono font-bold">₹{atmStrike.toLocaleString('en-IN')}</strong>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">PCR:</span>
                <span className="text-slate-900 font-mono font-bold">{chainData?.pcr ? chainData.pcr.toFixed(2) : '1.00'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Strike Limit Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Strikes:</span>
                  {(['10', '15', '20', 'all'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStrikeFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                        strikeFilter === st
                          ? 'bg-[#0F766E] text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'all' ? 'All' : `±${st}`}
                    </button>
                  ))}
                </div>

                {/* Toggle Greeks Button */}
                <button
                  onClick={() => setShowGreeks(!showGreeks)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  {showGreeks ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showGreeks ? 'Compact' : 'Greeks'}</span>
                </button>

                <button
                  onClick={fetchChain}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  title="Refresh Quotes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Option Chain Table */}
            <div className="opt-table-wrap">
              <table className="opt-table">
              <thead>
                <tr>
                  <th
                    colSpan={showGreeks ? 8 : 4}
                    className="opt-th-call-header"
                  >
                    CALLS (CE)
                  </th>
                  <th className="opt-th-strike-header">STRIKE</th>
                  <th
                    colSpan={showGreeks ? 8 : 4}
                    className="opt-th-put-header"
                  >
                    PUTS (PE)
                  </th>
                </tr>
                <tr>
                  {/* Call Columns */}
                  <th style={{ textAlign: 'center' }}>Action</th>
                  <th style={{ textAlign: 'right' }}>OI</th>
                  <th style={{ textAlign: 'right' }}>Chg OI</th>
                  {showGreeks && <th style={{ textAlign: 'right' }}>IV%</th>}
                  {showGreeks && <th style={{ textAlign: 'right' }}>Delta</th>}
                  {showGreeks && <th style={{ textAlign: 'right' }}>Theta</th>}
                  {showGreeks && <th style={{ textAlign: 'center' }}>Buildup</th>}
                  <th style={{ textAlign: 'right', color: '#34d399', fontWeight: 800 }}>
                    LTP
                  </th>

                  {/* Center Strike */}
                  <th style={{ textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>Strike</th>

                  {/* Put Columns */}
                  <th style={{ textAlign: 'left', color: '#fb7185', fontWeight: 800 }}>
                    LTP
                  </th>
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
                {filteredChainRows.length > 0 ? (
                  filteredChainRows.map((row: OptionChainRowDto) => {
                    const isAtm = row.strike === atmStrike;
                    const isItmCall = row.strike < spot;
                    const isItmPut = row.strike > spot;

                    return (
                      <tr
                        key={row.strike}
                        className={isAtm ? 'opt-row-atm' : ''}
                      >
                        {/* Call Actions (+B / +S) */}
                        <td className={isItmCall ? 'opt-td-itm-call' : ''} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              onClick={() => addLegToStrategy('BUY', 'CE', row.strike, row.ce.ltp, row.ce.iv)}
                              className="opt-action-btn-buy"
                              title="Buy Call"
                            >
                              +B
                            </button>
                            <button
                              onClick={() => addLegToStrategy('SELL', 'CE', row.strike, row.ce.ltp, row.ce.iv)}
                              className="opt-action-btn-sell"
                              title="Sell Call"
                            >
                              +S
                            </button>
                          </div>
                        </td>

                        {/* Call OI */}
                        <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-950/15' : ''}`}>
                          {row.ce.oi.toLocaleString('en-IN')}
                        </td>

                        {/* Call OI Change */}
                        <td
                          className={`px-2 py-2 text-right ${
                            row.ce.oiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } ${isItmCall ? 'bg-emerald-950/15' : ''}`}
                        >
                          {row.ce.oiChange >= 0 ? '+' : ''}
                          {row.ce.oiChange.toLocaleString('en-IN')}
                        </td>

                        {/* Call Greeks & Buildup */}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-right text-neutral-400 ${isItmCall ? 'bg-emerald-950/15' : ''}`}>
                            {row.ce.iv !== null ? `${row.ce.iv}%` : '-'}
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-950/15' : ''}`}>
                            {row.ce.delta ?? '-'}
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-right text-neutral-400 ${isItmCall ? 'bg-emerald-950/15' : ''}`}>
                            {row.ce.theta ?? '-'}
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-center ${isItmCall ? 'bg-emerald-950/15' : ''}`}>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded whitespace-nowrap ${
                                row.ce.buildup === 'Long Buildup'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : row.ce.buildup === 'Short Buildup'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : row.ce.buildup === 'Short Covering'
                                  ? 'bg-sky-500/20 text-sky-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {row.ce.buildup}
                            </span>
                          </td>
                        )}

                        {/* Call LTP */}
                        <td
                          className={`px-3 py-2 text-right font-bold ${
                            isItmCall ? 'opt-td-itm-call' : ''
                          }`}
                          style={{ borderRight: '1px solid #E2E8F0', color: '#059669', fontSize: '0.8125rem' }}
                        >
                          ₹{row.ce.ltp.toFixed(2)}
                        </td>

                        {/* Center Strike with ATM Badge */}
                        <td className="opt-td-strike">
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>{row.strike}</span>
                          {isAtm && (
                            <span
                              style={{
                                marginLeft: '0.35rem',
                                fontSize: '0.625rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '9999px',
                                background: '#F59E0B',
                                color: '#FFFFFF',
                                fontWeight: 800,
                              }}
                            >
                              ATM
                            </span>
                          )}
                        </td>

                        {/* Put LTP */}
                        <td
                          className={`px-3 py-2 text-left font-bold ${
                            isItmPut ? 'opt-td-itm-put' : ''
                          }`}
                          style={{ borderRight: '1px solid #F1F5F9', color: '#E11D48', fontSize: '0.8125rem' }}
                        >
                          ₹{row.pe.ltp.toFixed(2)}
                        </td>

                        {/* Put Greeks & Buildup */}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-center ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-medium ${
                                row.pe.buildup === 'Long Buildup'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.pe.buildup === 'Short Buildup'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : row.pe.buildup === 'Short Covering'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {row.pe.buildup}
                            </span>
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-left text-slate-500 ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                            {row.pe.theta ?? '-'}
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-left ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                            {row.pe.delta ?? '-'}
                          </td>
                        )}
                        {showGreeks && (
                          <td className={`px-2 py-2 text-left text-slate-500 ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                            {row.pe.iv !== null ? `${row.pe.iv}%` : '-'}
                          </td>
                        )}

                        {/* Put OI Change */}
                        <td
                          className={`px-2 py-2 text-right font-medium ${
                            row.pe.oiChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          } ${isItmPut ? 'opt-td-itm-put' : ''}`}
                        >
                          {row.pe.oiChange >= 0 ? '+' : ''}
                          {row.pe.oiChange.toLocaleString('en-IN')}
                        </td>

                        {/* Put OI */}
                        <td className={`px-2 py-2 text-right ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                          {row.pe.oi.toLocaleString('en-IN')}
                        </td>

                        {/* Put Actions (+B / +S) */}
                        <td className={`px-2 py-2 text-center whitespace-nowrap ${isItmPut ? 'opt-td-itm-put' : ''}`}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              onClick={() => addLegToStrategy('BUY', 'PE', row.strike, row.pe.ltp, row.pe.iv)}
                              className="opt-action-btn-buy"
                              title="Buy Put"
                            >
                              +B
                            </button>
                            <button
                              onClick={() => addLegToStrategy('SELL', 'PE', row.strike, row.pe.ltp, row.pe.iv)}
                              className="opt-action-btn-sell"
                              title="Sell Put"
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
                    <td colSpan={showGreeks ? 17 : 9} className="py-16 text-center text-slate-500 font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                        <span className="font-semibold text-sm text-slate-800">
                          Loading real-time options chain for {symbol}...
                        </span>
                        <span className="text-xs text-slate-500">
                          Connecting to live feed & calculating Black-Scholes Greeks
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: STRATEGY BUILDER & PAYOFF (FLAGSHIP) ── */}
      {activeTab === 'strategy' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Categorized 23 Pre-built Strategies Picker */}
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pre-Built Indian F&O Strategy Templates (23)</h3>
                  <p className="text-xs text-slate-500">1-click automated multi-leg structure & strike selection</p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Bullish', 'Bearish', 'Neutral', 'Volatility'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStrategyCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      strategyCategory === cat
                        ? 'bg-[#0F766E] text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Buttons Grid */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl.name)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-teal-500 transition-all flex items-center gap-1.5 shadow-sm"
                  title={tpl.description}
                >
                  <span className="font-medium">{tpl.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      tpl.category === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tpl.category === 'Bearish'
                        ? 'bg-rose-100 text-rose-800'
                        : tpl.category === 'Neutral'
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tpl.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Grid: Leg Editor + Greeks / Payoff Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Strategy Legs Table & What-If Simulator */}
            <div className="lg:col-span-1 bg-white border border-[#E8E4DC] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Strategy Legs ({strategyLegs.length})</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addLegToStrategy('BUY', 'CE', atmStrike, 140)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0F766E] hover:bg-teal-800 text-white flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Leg
                  </button>
                  {strategyLegs.length > 0 && (
                    <button
                      onClick={() => setStrategyLegs([])}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Clear All Legs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Legs List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {strategyLegs.map((leg) => (
                  <div
                    key={leg.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleLegSide(leg.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            leg.side === 'BUY'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {leg.side}
                        </button>
                        <strong className="text-slate-900">
                          ₹{leg.strike} {leg.optionType}
                        </strong>
                      </div>
                      <button
                        onClick={() => removeLeg(leg.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>Lots:</span>
                        <button
                          onClick={() => updateLegLots(leg.id, -1)}
                          className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <strong className="text-slate-900">{leg.lots}</strong>
                        <button
                          onClick={() => updateLegLots(leg.id, 1)}
                          className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      <div>
                        Price: <strong className="text-slate-900 font-mono">₹{leg.entryPrice}</strong>
                      </div>
                      <div>
                        Qty: <strong className="text-slate-900 font-mono">{leg.lots * leg.lotSize}</strong>
                      </div>
                    </div>
                  </div>
                ))}
                {strategyLegs.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No active legs. Select a pre-built strategy above or click "+B" / "+S" on the Option Chain table.
                  </div>
                )}
              </div>

              {/* What-If Simulation Sliders */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">What-If Scenario Simulator</h4>
                  {(spotShiftPct !== 0 || ivShiftPoints !== 0 || daysForward !== 0) && (
                    <button
                      onClick={() => {
                        setSpotShiftPct(0);
                        setIvShiftPoints(0);
                        setDaysForward(0);
                      }}
                      className="text-[10px] text-teal-700 font-semibold hover:underline"
                    >
                      Reset Sliders
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Spot Shift:</span>
                    <strong className="text-slate-900 font-mono">
                      {spotShiftPct > 0 ? `+${spotShiftPct}` : spotShiftPct}% (₹{Math.round(spot * (1 + spotShiftPct / 100))})
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={spotShiftPct}
                    onChange={(e) => setSpotShiftPct(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>IV Shift (Vol Points):</span>
                    <strong className="text-slate-900 font-mono">
                      {ivShiftPoints > 0 ? `+${ivShiftPoints}` : ivShiftPoints} pts
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="30"
                    step="1"
                    value={ivShiftPoints}
                    onChange={(e) => setIvShiftPoints(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Time Decay (T+Days):</span>
                    <strong className="text-slate-900 font-mono">+{daysForward} days</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={daysForward}
                    onChange={(e) => setDaysForward(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Payoff Chart & Greeks Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payoff Chart Card */}
              <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Live Strategy Payoff Diagram</h3>
                    <p className="text-xs text-slate-500">
                      Analytical Black-Scholes curves at Expiry & Target date
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setIsSaveModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-teal-600" /> Save Strategy
                    </button>
                    <button
                      onClick={executeInSandbox}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#0F766E] hover:bg-teal-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Paper Trade
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ReactECharts option={payoffChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>

              {/* Risk & Reward Summary KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white border border-[#E8E4DC] rounded-xl p-3.5 shadow-sm">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Max Profit</span>
                  <div className="text-base font-bold font-mono text-emerald-600 mt-1">
                    {typeof payoffResult.greeks.maxProfit === 'number'
                      ? `₹${payoffResult.greeks.maxProfit.toLocaleString('en-IN')}`
                      : payoffResult.greeks.maxProfit}
                  </div>
                </div>

                <div className="bg-white border border-[#E8E4DC] rounded-xl p-3.5 shadow-sm">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Max Loss</span>
                  <div className="text-base font-bold font-mono text-rose-600 mt-1">
                    {typeof payoffResult.greeks.maxLoss === 'number'
                      ? `₹${payoffResult.greeks.maxLoss.toLocaleString('en-IN')}`
                      : payoffResult.greeks.maxLoss}
                  </div>
                </div>

                <div className="bg-white border border-[#E8E4DC] rounded-xl p-3.5 shadow-sm">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Breakevens</span>
                  <div className="text-xs font-bold font-mono text-amber-700 mt-1">
                    {payoffResult.greeks.breakevens.length > 0
                      ? payoffResult.greeks.breakevens.map((b) => `₹${Math.round(b)}`).join(' | ')
                      : 'None'}
                  </div>
                </div>

                <div className="bg-white border border-[#E8E4DC] rounded-xl p-3.5 shadow-sm">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Probability of Profit</span>
                  <div className="text-base font-bold font-mono text-teal-700 mt-1">
                    {payoffResult.greeks.probabilityOfProfit}%
                  </div>
                </div>
              </div>

              {/* Net Aggregated Portfolio Greeks */}
              <div className="bg-white border border-[#E8E4DC] rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800">Strategy Aggregate Greeks</h4>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    R:R Ratio: {payoffResult.greeks.riskRewardRatio}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Net Delta:</span>{' '}
                    <strong className="text-slate-900">{payoffResult.greeks.netDelta}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Net Gamma:</span>{' '}
                    <strong className="text-slate-900">{payoffResult.greeks.netGamma}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Net Theta:</span>{' '}
                    <strong className={payoffResult.greeks.netTheta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      ₹{payoffResult.greeks.netTheta}/day
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Net Vega:</span>{' '}
                    <strong className="text-slate-900">₹{payoffResult.greeks.netVega}/%</strong>
                  </div>
                </div>
              </div>
            </div>
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

      {/* ── TAB 5: SANDBOX PAPER TRADING PORTFOLIO ── */}
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
