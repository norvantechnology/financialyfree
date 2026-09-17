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
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        textStyle: { color: '#0F172A', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const strike = params[0].name;
          let html = `<div style="padding: 2px;"><strong>Strike: ₹${Number(strike).toLocaleString('en-IN')}</strong><br/>`;
          params.forEach((p) => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${Number(p.value).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['Call OI (CE Resistance)', 'Put OI (PE Support)'],
        textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 10, interval: 0, rotate: 35 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          color: '#64748B',
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
          itemStyle: { color: '#10B981', borderRadius: [3, 3, 0, 0] },
          barGap: '15%',
          markLine:
            maxPain && strikes.includes(String(maxPain))
              ? {
                  silent: true,
                  symbol: 'none',
                  data: [
                    {
                      xAxis: String(maxPain),
                      lineStyle: { color: '#D97706', width: 2, type: 'dashed' },
                      label: { formatter: 'Max Pain', position: 'insideEndTop', color: '#D97706', fontWeight: 'bold' },
                    },
                  ],
                }
              : undefined,
        },
        {
          name: 'Put OI (PE Support)',
          type: 'bar',
          data: putOis,
          itemStyle: { color: '#F43F5E', borderRadius: [3, 3, 0, 0] },
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
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        textStyle: { color: '#0F172A', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const strike = params[0].name;
          let html = `<div style="padding: 2px;"><strong>Strike: ₹${Number(strike).toLocaleString('en-IN')}</strong><br/>`;
          params.forEach((p) => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${Number(p.value).toLocaleString('en-IN')}</strong><br/>`;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['Call OI Chg', 'Put OI Chg'],
        textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 10, interval: 0, rotate: 35 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          color: '#64748B',
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
          itemStyle: { color: '#34D399', borderRadius: [2, 2, 0, 0] },
        },
        {
          name: 'Put OI Chg',
          type: 'bar',
          data: putOiChgs,
          itemStyle: { color: '#FB7185', borderRadius: [2, 2, 0, 0] },
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
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        textStyle: { color: '#0F172A', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
      },
      legend: {
        data: ['PCR Ratio', 'Underlying Spot'],
        textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'PCR',
          nameTextStyle: { color: '#0284C7', fontSize: 10, fontWeight: 'bold' },
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
          axisLabel: { color: '#0284C7', fontSize: 10 },
        },
        {
          type: 'value',
          name: 'Spot Price',
          nameTextStyle: { color: '#D97706', fontSize: 10, fontWeight: 'bold' },
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          splitLine: { show: false },
          axisLabel: { color: '#D97706', fontSize: 10 },
        },
      ],
      series: [
        {
          name: 'PCR Ratio',
          type: 'line',
          yAxisIndex: 0,
          data: pcrs,
          smooth: true,
          lineStyle: { width: 2.5, color: '#0284C7' },
        },
        {
          name: 'Underlying Spot',
          type: 'line',
          yAxisIndex: 1,
          data: spots,
          smooth: true,
          lineStyle: { width: 2, color: '#D97706', type: 'dashed' },
        },
      ],
    };
  }, [oiHistory]);

  return (
    <div className="opt-view-stack">
      {/* ── Top Row: 5 Metric Cards ── */}
      <div className="opt-kpi-grid cols-5">
        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Total Call OI</span>
          <div className="opt-kpi-value" style={{ color: '#059669' }}>
            {(stats.totalCallOi / 100000).toFixed(2)} Lakh
          </div>
          <span className="opt-kpi-sub">
            Chg: {stats.totalCallOiChg >= 0 ? `+${(stats.totalCallOiChg / 100000).toFixed(2)}L` : `${(stats.totalCallOiChg / 100000).toFixed(2)}L`}
          </span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Total Put OI</span>
          <div className="opt-kpi-value" style={{ color: '#E11D48' }}>
            {(stats.totalPutOi / 100000).toFixed(2)} Lakh
          </div>
          <span className="opt-kpi-sub">
            Chg: {stats.totalPutOiChg >= 0 ? `+${(stats.totalPutOiChg / 100000).toFixed(2)}L` : `${(stats.totalPutOiChg / 100000).toFixed(2)}L`}
          </span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Put-Call Ratio (PCR)</span>
          <div className="opt-kpi-value" style={{ color: '#0F172A' }}>
            {stats.pcr.toFixed(2)}
            <span
              className={`opt-badge-pill ${stats.pcr >= 1.0 ? 'green' : 'rose'}`}
            >
              {stats.pcr >= 1.0 ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <span className="opt-kpi-sub">Vol PCR: {stats.volPcr.toFixed(2)}</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Max Pain Strike</span>
          <div className="opt-kpi-value" style={{ color: '#D97706' }}>
            ₹{stats.maxPain.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Option Sellers' Sweet Spot</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">ATM Strike</span>
          <div className="opt-kpi-value" style={{ color: '#0284C7' }}>
            {chainData?.atmStrike ? `₹${chainData.atmStrike.toLocaleString('en-IN')}` : '—'}
          </div>
          <span className="opt-kpi-sub">
            Spot: ₹{chainData?.spotPrice?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Main Dual Bar Chart Card ── */}
      <div className="opt-chart-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div className="opt-chart-icon" style={{ color: '#D97706' }}>
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="opt-chart-title">Strike-wise Open Interest Concentration</h3>
              <p className="opt-chart-subtitle">Direct Call (Resistance) vs Put (Support) volume depth</p>
            </div>
          </div>

          <div className="opt-filter-group">
            <span className="opt-filter-label">Strikes:</span>
            {(['10', '15', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setStrikeRange(r)}
                className={`opt-filter-btn ${strikeRange === r ? 'active' : ''}`}
              >
                {r === 'all' ? 'All' : `±${r}`}
              </button>
            ))}
          </div>
        </div>

        <div className="opt-chart-container" style={{ height: '340px' }}>
          <ReactECharts option={oiBarOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* ── Secondary Grid: Change in OI & Intraday Timeline ── */}
      <div className="opt-charts-dual-grid">
        {/* Change in OI Chart */}
        <div className="opt-chart-card" style={{ marginBottom: 0 }}>
          <div className="opt-chart-header">
            <div className="opt-chart-title-wrap">
              <div className="opt-chart-icon" style={{ color: '#059669' }}>
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="opt-chart-title">Change in OI (Intraday Writing Pressure)</h4>
                <p className="opt-chart-subtitle">Fresh positioning & unwinding momentum</p>
              </div>
            </div>
          </div>
          <div className="opt-chart-container" style={{ height: '280px' }}>
            <ReactECharts option={oiChangeOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Intraday PCR & Spot Trend */}
        <div className="opt-chart-card" style={{ marginBottom: 0 }}>
          <div className="opt-chart-header">
            <div className="opt-chart-title-wrap">
              <div className="opt-chart-icon" style={{ color: '#0284C7' }}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="opt-chart-title">Intraday PCR & Spot Movement</h4>
                <p className="opt-chart-subtitle">Real-time sentiment correlation</p>
              </div>
            </div>
            {isLoadingHistory && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <div className="opt-chart-container" style={{ height: '280px' }}>
            <ReactECharts option={intradayTimelineOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
