'use client';

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/options-lab.css';
import dynamic from 'next/dynamic';
import { TrendingUp, RefreshCw, BarChart2, Activity } from 'lucide-react';
import { OptionChainDto } from '@ff/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface OiTrackerViewProps {
  chainData: OptionChainDto | null;
  symbol: string;
  selectedExpiry: string;
}

export const OiTrackerView: React.FC<OiTrackerViewProps> = ({
  chainData,
  symbol,
  selectedExpiry,
}) => {
  const [strikeRange, setStrikeRange] = useState<'10' | '15' | 'all'>('15');
  const [oiHistory, setOiHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const res = await fetch(
          `/api/v1/options/analytics/oi-history/${symbol}${selectedExpiry ? `?expiry=${selectedExpiry}` : ''}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data?.points && isMounted) {
            setOiHistory(json.data.points);
          }
        }
      } catch {
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [symbol, selectedExpiry]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!chainData?.contracts || chainData.contracts.length === 0) {
      return {
        totalCallOi: 0,
        totalPutOi: 0,
        totalCallOiChg: 0,
        totalPutOiChg: 0,
        pcr: 1.0,
        volPcr: 1.0,
        maxPain: 0,
      };
    }

    let cOi = 0;
    let pOi = 0;
    let cOiChg = 0;
    let pOiChg = 0;

    chainData.contracts.forEach((c) => {
      cOi += c.ce.oi;
      pOi += c.pe.oi;
      cOiChg += c.ce.oiChange;
      pOiChg += c.pe.oiChange;
    });

    return {
      totalCallOi: cOi,
      totalPutOi: pOi,
      totalCallOiChg: cOiChg,
      totalPutOiChg: pOiChg,
      pcr: chainData.pcr || (cOi > 0 ? pOi / cOi : 1.0),
      volPcr: chainData.volumePcr || 1.0,
      maxPain: chainData.maxPain || chainData.atmStrike,
    };
  }, [chainData]);

  // Filtered strikes based on strikeRange
  const filteredContracts = useMemo(() => {
    if (!chainData?.contracts) return [];
    if (strikeRange === 'all') return chainData.contracts;

    const limit = parseInt(strikeRange, 10);
    const atmIndex = chainData.contracts.findIndex((c) => c.strike >= chainData.atmStrike);
    const start = Math.max(0, atmIndex - limit);
    const end = Math.min(chainData.contracts.length, atmIndex + limit + 1);
    return chainData.contracts.slice(start, end);
  }, [chainData, strikeRange]);

  // Dual Bar Chart Option (Call OI vs Put OI)
  const oiBarOption = useMemo(() => {
    if (filteredContracts.length === 0) return {};

    const strikes = filteredContracts.map((c) => String(c.strike));
    const callOis = filteredContracts.map((c) => c.ce.oi);
    const putOis = filteredContracts.map((c) => c.pe.oi);
    const maxPain = chainData?.maxPain || chainData?.atmStrike;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const strike = params[0].name;
          let html = `<div class="text-xs font-mono p-1"><strong>Strike: ₹${strike}</strong><br/>`;
          params.forEach((p) => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${Number(p.value).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['Call OI (CE Resistance)', 'Put OI (PE Support)'],
        textStyle: { color: '#a3a3a3', fontSize: 11 },
        top: 5,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10, interval: 0, rotate: 35 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (v: number) => {
            if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
            if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
            return String(v);
          },
          fontSize: 10,
        },
      },
      series: [
        {
          name: 'Call OI (CE Resistance)',
          type: 'bar',
          data: callOis,
          itemStyle: { color: '#10b981', borderRadius: [3, 3, 0, 0] },
          barGap: '15%',
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                xAxis: String(maxPain),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                label: { formatter: 'Max Pain', position: 'insideEndTop', color: '#f59e0b' },
              },
            ],
          },
        },
        {
          name: 'Put OI (PE Support)',
          type: 'bar',
          data: putOis,
          itemStyle: { color: '#f43f5e', borderRadius: [3, 3, 0, 0] },
        },
      ],
    };
  }, [filteredContracts, chainData]);

  // Change in OI Chart
  const oiChangeOption = useMemo(() => {
    if (filteredContracts.length === 0) return {};

    const strikes = filteredContracts.map((c) => String(c.strike));
    const callOiChgs = filteredContracts.map((c) => c.ce.oiChange);
    const putOiChgs = filteredContracts.map((c) => c.pe.oiChange);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const strike = params[0].name;
          let html = `<div class="text-xs font-mono p-1"><strong>Strike: ₹${strike}</strong><br/>`;
          params.forEach((p) => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${Number(p.value).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['Call OI Chg', 'Put OI Chg'],
        textStyle: { color: '#a3a3a3', fontSize: 11 },
        top: 5,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10, interval: 0, rotate: 35 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (v: number) => {
            if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
            return String(v);
          },
          fontSize: 10,
        },
      },
      series: [
        {
          name: 'Call OI Chg',
          type: 'bar',
          data: callOiChgs,
          itemStyle: { color: '#34d399', borderRadius: [2, 2, 0, 0] },
        },
        {
          name: 'Put OI Chg',
          type: 'bar',
          data: putOiChgs,
          itemStyle: { color: '#fb7185', borderRadius: [2, 2, 0, 0] },
        },
      ],
    };
  }, [filteredContracts]);

  // Intraday Timeline Chart Option
  const intradayTimelineOption = useMemo(() => {
    if (oiHistory.length === 0) return {};

    const times = oiHistory.map((p) => p.timestamp.slice(11, 16));
    const pcrs = oiHistory.map((p) => p.pcr);
    const spots = oiHistory.map((p) => p.spotPrice);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['PCR Ratio', 'Underlying Spot'],
        textStyle: { color: '#a3a3a3', fontSize: 11 },
        top: 5,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'PCR',
          nameTextStyle: { color: '#a3a3a3', fontSize: 10 },
          axisLine: { lineStyle: { color: '#404040' } },
          splitLine: { lineStyle: { color: '#262626' } },
          axisLabel: { color: '#38bdf8', fontSize: 10 },
        },
        {
          type: 'value',
          name: 'Spot Price',
          nameTextStyle: { color: '#a3a3a3', fontSize: 10 },
          axisLine: { lineStyle: { color: '#404040' } },
          splitLine: { show: false },
          axisLabel: { color: '#f59e0b', fontSize: 10 },
        },
      ],
      series: [
        {
          name: 'PCR Ratio',
          type: 'line',
          yAxisIndex: 0,
          data: pcrs,
          smooth: true,
          lineStyle: { width: 2.5, color: '#38bdf8' },
        },
        {
          name: 'Underlying Spot',
          type: 'line',
          yAxisIndex: 1,
          data: spots,
          smooth: true,
          lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
        },
      ],
    };
  }, [oiHistory]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Total Call OI</span>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {(stats.totalCallOi / 100000).toFixed(2)} Lakh
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Chg: {stats.totalCallOiChg >= 0 ? `+${(stats.totalCallOiChg / 100000).toFixed(2)}L` : `${(stats.totalCallOiChg / 100000).toFixed(2)}L`}
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Total Put OI</span>
          <div className="text-base font-bold font-mono text-rose-400 mt-1">
            {(stats.totalPutOi / 100000).toFixed(2)} Lakh
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Chg: {stats.totalPutOiChg >= 0 ? `+${(stats.totalPutOiChg / 100000).toFixed(2)}L` : `${(stats.totalPutOiChg / 100000).toFixed(2)}L`}
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Put-Call Ratio (PCR)</span>
          <div className="text-base font-bold font-mono text-white mt-1 flex items-center gap-1.5">
            {stats.pcr.toFixed(2)}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                stats.pcr >= 1.0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {stats.pcr >= 1.0 ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500">Vol PCR: {stats.volPcr.toFixed(2)}</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Max Pain Pin</span>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            ₹{stats.maxPain.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500">Option Sellers' Sweet Spot</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Atm Strike</span>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">
            {chainData?.atmStrike ? `₹${chainData.atmStrike.toLocaleString('en-IN')}` : '—'}
          </div>
          <span className="text-[10px] text-neutral-500">
            Spot: ₹{chainData?.spotPrice?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main Dual Bar Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Strike-wise Open Interest Concentration</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Strikes:</span>
            {(['10', '15', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setStrikeRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  strikeRange === r
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {r === 'all' ? 'All' : `±${r}`}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ReactECharts option={oiBarOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Secondary Grid: Change in OI & Intraday Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change in OI Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Change in OI (Intraday Writing Pressure)</h4>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={oiChangeOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Intraday PCR & Spot Trend */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white">Intraday PCR & Spot Movement</h4>
            </div>
            {isLoadingHistory && <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={intradayTimelineOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
