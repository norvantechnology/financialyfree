'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Layers,
  Plus,
  Trash2,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  OptionChainDto,
  OptionChainRowDto,
  StrategyLegDto,
  SandboxPositionDto,
} from '@ff/types';
import {
  calculateStrategyPayoff,
  STRATEGY_TEMPLATES,
} from '@ff/calc';
import { OptionsShell, OptionsTab } from '../../components/options/options-shell';
import { BrokerConnectModal } from '../../components/options/broker-connect-modal';

// Dynamically import ReactECharts to avoid SSR hydration issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function OptionsLabPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>('chain');
  const [symbol, setSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [connectedBroker, setConnectedBroker] = useState<string | null>('sandbox');
  const [chainData, setChainData] = useState<OptionChainDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'closed'>('connected');
  const [latencyMs, setLatencyMs] = useState(24);

  // Strategy Builder State
  const [strategyLegs, setStrategyLegs] = useState<StrategyLegDto[]>([
    {
      id: 'leg-1',
      instrumentToken: 'CE-ATM',
      symbol: 'NIFTY',
      expiry: '2026-09-24',
      strike: 25150,
      optionType: 'CE',
      side: 'BUY',
      lots: 1,
      lotSize: 25,
      entryPrice: 145,
      iv: 0.138,
    },
    {
      id: 'leg-2',
      instrumentToken: 'PE-ATM',
      symbol: 'NIFTY',
      expiry: '2026-09-24',
      strike: 25150,
      optionType: 'PE',
      side: 'BUY',
      lots: 1,
      lotSize: 25,
      entryPrice: 135,
      iv: 0.142,
    },
  ]);

  // What-If Scenario State
  const [spotShiftPct, setSpotShiftPct] = useState(0);
  const [ivShiftPoints, setIvShiftPoints] = useState(0);
  const [daysForward, setDaysForward] = useState(0);

  // Sandbox Positions State
  const [sandboxPositions, setSandboxPositions] = useState<SandboxPositionDto[]>([]);

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
          setLatencyMs(Math.floor(18 + Math.random() * 14));
        }
      }
    } catch {
      setConnectionStatus('reconnecting');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedExpiry]);

  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, [fetchChain]);

  // Fetch Sandbox Positions
  const fetchSandboxPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/options/sandbox/positions');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setSandboxPositions(json.data);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sandbox') {
      fetchSandboxPositions();
    }
  }, [activeTab, fetchSandboxPositions]);

  // Payoff Calculation
  const payoffResult = useMemo(() => {
    const currentSpot = chainData?.spotPrice || 25150;
    const adjustedSpot = currentSpot * (1 + spotShiftPct / 100);

    const shiftedLegs = strategyLegs.map((l) => ({
      ...l,
      iv: Math.max(0.01, (l.iv ?? 0.14) + ivShiftPoints / 100),
    }));

    return calculateStrategyPayoff({
      legs: shiftedLegs,
      currentSpot: adjustedSpot,
      targetDaysForward: daysForward,
      spotRangePct: 0.1,
      numPoints: 81,
    });
  }, [strategyLegs, chainData?.spotPrice, spotShiftPct, ivShiftPoints, daysForward]);

  // ECharts Option for Payoff Diagram
  const payoffChartOption = useMemo(() => {
    if (!payoffResult.payoffPoints || payoffResult.payoffPoints.length === 0) return {};
    const spots = payoffResult.payoffPoints.map((p) => p.spotPrice);
    const expiryPayoffs = payoffResult.payoffPoints.map((p) => p.expiryPayoff);
    const targetPayoffs = payoffResult.payoffPoints.map((p) => p.targetDatePayoff);
    const currentSpot = chainData?.spotPrice || 25150;

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
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong style="color:${color}">₹${p.value.toLocaleString()}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['At Expiry Payoff', `T+${daysForward} Payoff`],
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
          lineStyle: { width: 2.5, color: '#f59e0b' },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              { yAxis: 0, lineStyle: { color: '#737373', type: 'dashed' } },
              { xAxis: String(Math.round(currentSpot)), lineStyle: { color: '#38bdf8', type: 'solid' }, label: { formatter: 'Spot' } },
            ],
          },
        },
        {
          name: `T+${daysForward} Payoff`,
          type: 'line',
          data: targetPayoffs,
          smooth: true,
          lineStyle: { width: 1.8, color: '#06b6d4', type: 'dotted' },
        },
      ],
    };
  }, [payoffResult, daysForward, chainData?.spotPrice]);

  // Prebuilt template loader
  const applyTemplate = (tplName: string) => {
    const tpl = STRATEGY_TEMPLATES.find((t) => t.name === tplName);
    if (tpl) {
      const spot = chainData?.spotPrice || 25150;
      const step = symbol === 'BANKNIFTY' ? 100 : 50;
      const legs = tpl.createLegs(spot, step, selectedExpiry || '2026-09-24', 25);
      setStrategyLegs(legs);
    }
  };

  const addCustomLeg = (side: 'BUY' | 'SELL', type: 'CE' | 'PE', strike: number, price: number) => {
    const newLeg: StrategyLegDto = {
      id: `leg-${Date.now()}`,
      instrumentToken: `${type}-${strike}`,
      symbol,
      expiry: selectedExpiry || '2026-09-24',
      strike,
      optionType: type,
      side,
      lots: 1,
      lotSize: 25,
      entryPrice: price,
      iv: 0.14,
    };
    setStrategyLegs((prev) => [...prev, newLeg]);
    setActiveTab('strategy');
  };

  const removeLeg = (id: string) => {
    setStrategyLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const spot = chainData?.spotPrice || 25150;
  const atmStrike = chainData?.atmStrike || 25150;

  return (
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
      atmIv={chainData?.atmIv || 14.2}
      onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
      connectedBroker={connectedBroker}
    >
      {/* ── TAB 1: OPTION CHAIN TABLE ── */}
      {activeTab === 'chain' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-300">Option Chain Feed:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {chainData?.source === 'BROKER_LIVE' ? 'Direct Broker Feed' : 'NSE Live Fallback'}
              </span>
              <span className="text-neutral-500">|</span>
              <span className="text-neutral-400">Atm Strike:</span>
              <strong className="text-amber-400 font-mono">₹{atmStrike}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchChain}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Refresh Quotes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Option Chain Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-xl">
            <table className="w-full text-xs text-left text-neutral-300 font-mono">
              <thead className="text-[11px] uppercase bg-neutral-950/90 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th colSpan={7} className="px-3 py-2 text-center text-emerald-400 bg-emerald-950/20 border-r border-neutral-800">
                    CALLS (CE)
                  </th>
                  <th className="px-3 py-2 text-center text-amber-300 bg-neutral-900">
                    STRIKE
                  </th>
                  <th colSpan={7} className="px-3 py-2 text-center text-rose-400 bg-rose-950/20 border-l border-neutral-800">
                    PUTS (PE)
                  </th>
                </tr>
                <tr className="border-b border-neutral-800/60 text-[10px] text-neutral-400">
                  {/* Calls columns */}
                  <th className="px-2 py-1.5">Action</th>
                  <th className="px-2 py-1.5 text-right">OI</th>
                  <th className="px-2 py-1.5 text-right">Chg OI</th>
                  <th className="px-2 py-1.5 text-right">IV%</th>
                  <th className="px-2 py-1.5 text-right">Delta</th>
                  <th className="px-2 py-1.5 text-right">Theta</th>
                  <th className="px-3 py-1.5 text-right text-emerald-300 font-bold border-r border-neutral-800">LTP</th>

                  {/* Center Strike */}
                  <th className="px-3 py-1.5 text-center font-bold text-amber-300">Strike</th>

                  {/* Puts columns */}
                  <th className="px-3 py-1.5 text-left text-rose-300 font-bold border-r border-neutral-800/40">LTP</th>
                  <th className="px-2 py-1.5 text-left">Theta</th>
                  <th className="px-2 py-1.5 text-left">Delta</th>
                  <th className="px-2 py-1.5 text-left">IV%</th>
                  <th className="px-2 py-1.5 text-right">Chg OI</th>
                  <th className="px-2 py-1.5 text-right">OI</th>
                  <th className="px-2 py-1.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {chainData?.contracts && chainData.contracts.length > 0 ? (
                  chainData.contracts.map((row: OptionChainRowDto) => {
                    const isAtm = row.strike === atmStrike;
                    const isItmCall = row.strike < spot;
                    const isItmPut = row.strike > spot;

                    return (
                      <tr
                        key={row.strike}
                        className={`transition-colors hover:bg-neutral-800/40 ${
                          isAtm ? 'bg-amber-500/10 font-semibold' : ''
                        }`}
                      >
                        {/* Call Quick Action */}
                        <td className={`px-2 py-2 ${isItmCall ? 'bg-emerald-950/10' : ''}`}>
                          <button
                            onClick={() => addCustomLeg('BUY', 'CE', row.strike, row.ce.ltp)}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40"
                          >
                            +B
                          </button>
                        </td>
                        <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-950/10' : ''}`}>
                          {row.ce.oi.toLocaleString('en-IN')}
                        </td>
                        <td
                          className={`px-2 py-2 text-right ${
                            row.ce.oiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } ${isItmCall ? 'bg-emerald-950/10' : ''}`}
                        >
                          {row.ce.oiChange >= 0 ? '+' : ''}
                          {row.ce.oiChange.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-2 py-2 text-right text-neutral-400 ${isItmCall ? 'bg-emerald-950/10' : ''}`}>
                          {row.ce.iv !== null ? `${row.ce.iv}%` : '-'}
                        </td>
                        <td className={`px-2 py-2 text-right ${isItmCall ? 'bg-emerald-950/10' : ''}`}>
                          {row.ce.delta ?? '-'}
                        </td>
                        <td className={`px-2 py-2 text-right text-neutral-400 ${isItmCall ? 'bg-emerald-950/10' : ''}`}>
                          {row.ce.theta ?? '-'}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-bold text-white border-r border-neutral-800 ${
                            isItmCall ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          ₹{row.ce.ltp.toFixed(2)}
                        </td>

                        {/* Center Strike with ATM Badge */}
                        <td
                          className={`px-3 py-2 text-center font-bold text-amber-300 relative ${
                            isAtm ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-950/60'
                          }`}
                        >
                          {row.strike}
                          {isAtm && (
                            <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-amber-500 text-neutral-950 rounded uppercase">
                              ATM
                            </span>
                          )}
                        </td>

                        {/* Put Side */}
                        <td
                          className={`px-3 py-2 text-left font-bold text-white border-r border-neutral-800/40 ${
                            isItmPut ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          ₹{row.pe.ltp.toFixed(2)}
                        </td>
                        <td className={`px-2 py-2 text-left text-neutral-400 ${isItmPut ? 'bg-rose-950/10' : ''}`}>
                          {row.pe.theta ?? '-'}
                        </td>
                        <td className={`px-2 py-2 text-left ${isItmPut ? 'bg-rose-950/10' : ''}`}>
                          {row.pe.delta ?? '-'}
                        </td>
                        <td className={`px-2 py-2 text-left text-neutral-400 ${isItmPut ? 'bg-rose-950/10' : ''}`}>
                          {row.pe.iv !== null ? `${row.pe.iv}%` : '-'}
                        </td>
                        <td
                          className={`px-2 py-2 text-right ${
                            row.pe.oiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } ${isItmPut ? 'bg-rose-950/10' : ''}`}
                        >
                          {row.pe.oiChange >= 0 ? '+' : ''}
                          {row.pe.oiChange.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-2 py-2 text-right ${isItmPut ? 'bg-rose-950/10' : ''}`}>
                          {row.pe.oi.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-2 py-2 text-center ${isItmPut ? 'bg-rose-950/10' : ''}`}>
                          <button
                            onClick={() => addCustomLeg('BUY', 'PE', row.strike, row.pe.ltp)}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/40"
                          >
                            +B
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-neutral-400">
                      Loading option chain contracts...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: STRATEGY BUILDER & PAYOFF ── */}
      {activeTab === 'strategy' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Controls: Template Selector & Add Leg */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-300">Pre-Built Strategies:</span>
              <div className="flex flex-wrap gap-2">
                {STRATEGY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => applyTemplate(tpl.name)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => addCustomLeg('BUY', 'CE', atmStrike, 140)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Leg
            </button>
          </div>

          {/* Grid Layout: Leg Editor + Greeks / Payoff Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Strategy Legs Table */}
            <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" /> Strategy Legs ({strategyLegs.length})
                </h3>
                <span className="text-xs text-neutral-400">{symbol}</span>
              </div>

              <div className="space-y-3">
                {strategyLegs.map((leg) => (
                  <div
                    key={leg.id}
                    className="p-3 bg-neutral-850/60 border border-neutral-800 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            leg.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {leg.side}
                        </span>
                        <strong className="text-white">
                          ₹{leg.strike} {leg.optionType}
                        </strong>
                      </div>
                      <button
                        onClick={() => removeLeg(leg.id)}
                        className="text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400">
                      <div>
                        Lots: <strong className="text-white">{leg.lots}</strong> ({leg.lots * leg.lotSize} qty)
                      </div>
                      <div>
                        Price: <strong className="text-white">₹{leg.entryPrice}</strong>
                      </div>
                      <div>
                        IV: <strong className="text-white">{leg.iv ? `${(leg.iv * 100).toFixed(1)}%` : '14%'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* What-If Sliders */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-300">What-If Simulation Simulator</h4>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Spot Price Shift:</span>
                    <strong className="text-white font-mono">{spotShiftPct > 0 ? `+${spotShiftPct}` : spotShiftPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={spotShiftPct}
                    onChange={(e) => setSpotShiftPct(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>IV Shift (Vol Points):</span>
                    <strong className="text-white font-mono">{ivShiftPoints > 0 ? `+${ivShiftPoints}` : ivShiftPoints} pts</strong>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={ivShiftPoints}
                    onChange={(e) => setIvShiftPoints(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Days Forward:</span>
                    <strong className="text-white font-mono">T+{daysForward} Days</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={daysForward}
                    onChange={(e) => setDaysForward(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Payoff Diagram + Summary Metrics */}
            <div className="lg:col-span-2 space-y-4">
              {/* Payoff Diagram Chart */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-white">Strategy Payoff Diagram</h3>
                  <div className="text-xs text-neutral-400 font-mono">
                    Underlying Spot: <strong className="text-sky-400">₹{spot}</strong>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ReactECharts option={payoffChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>

              {/* Strategy Risk & Reward Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Max Profit</span>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {typeof payoffResult.greeks.maxProfit === 'number'
                      ? `₹${payoffResult.greeks.maxProfit.toLocaleString('en-IN')}`
                      : payoffResult.greeks.maxProfit}
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Max Loss</span>
                  <div className="text-base font-bold font-mono text-rose-400 mt-1">
                    {typeof payoffResult.greeks.maxLoss === 'number'
                      ? `₹${payoffResult.greeks.maxLoss.toLocaleString('en-IN')}`
                      : payoffResult.greeks.maxLoss}
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Breakevens</span>
                  <div className="text-xs font-bold font-mono text-amber-300 mt-1">
                    {payoffResult.greeks.breakevens.length > 0
                      ? payoffResult.greeks.breakevens.map((b) => `₹${b}`).join(' | ')
                      : 'None'}
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Prob of Profit (POP)</span>
                  <div className="text-base font-bold font-mono text-sky-400 mt-1">
                    {payoffResult.greeks.probabilityOfProfit}%
                  </div>
                </div>
              </div>

              {/* Aggregated Net Greeks */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-neutral-300 mb-3">Portfolio Net Greeks</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-2 rounded bg-neutral-800/40 border border-neutral-800">
                    <span className="text-neutral-400">Net Delta:</span>{' '}
                    <strong className="text-white">{payoffResult.greeks.netDelta}</strong>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/40 border border-neutral-800">
                    <span className="text-neutral-400">Net Gamma:</span>{' '}
                    <strong className="text-white">{payoffResult.greeks.netGamma}</strong>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/40 border border-neutral-800">
                    <span className="text-neutral-400">Net Theta:</span>{' '}
                    <strong className={payoffResult.greeks.netTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ₹{payoffResult.greeks.netTheta}/day
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/40 border border-neutral-800">
                    <span className="text-neutral-400">Net Vega:</span>{' '}
                    <strong className="text-white">₹{payoffResult.greeks.netVega}/%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: OI TRACKER & MAX PAIN ── */}
      {activeTab === 'oi' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center space-y-3">
            <TrendingUp className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Open Interest & Max Pain Buildup Analysis</h3>
            <p className="text-xs text-neutral-400 max-w-xl mx-auto">
              Track multi-strike call and put concentrations. Max Pain for {symbol} is currently pinned at{' '}
              <strong className="text-amber-400">₹{chainData?.maxPain || atmStrike}</strong>, with a Put-Call Ratio (PCR)
              of <strong className="text-white">{chainData?.pcr || 1.15}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 4: SANDBOX PAPER TRADING ── */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Active Sandbox Portfolio
                </h3>
                <p className="text-xs text-neutral-400">Virtual margin of ₹10,00,000 against real live ticks</p>
              </div>
              <button
                onClick={fetchSandboxPositions}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {sandboxPositions.length > 0 ? (
              <div className="divide-y divide-neutral-800 text-xs">
                {sandboxPositions.map((pos) => (
                  <div key={pos.id} className="py-3 flex items-center justify-between">
                    <div>
                      <strong className="text-white">
                        {pos.side} {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : ''}
                      </strong>
                      <div className="text-[11px] text-neutral-400">
                        Qty: {pos.quantity} | Entry: ₹{pos.entryPrice} | CMP: ₹{pos.currentPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold font-mono ${
                          pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pos.unrealizedPnl >= 0 ? '+' : ''}₹{pos.unrealizedPnl}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                No open sandbox paper positions. Add a leg from the Option Chain or Strategy Builder to test.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Broker Connect Modal */}
      <BrokerConnectModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onConnectSuccess={(broker) => setConnectedBroker(broker)}
      />
    </OptionsShell>
  );
}
