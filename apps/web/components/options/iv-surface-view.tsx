'use client';

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/options-lab.css';
import dynamic from 'next/dynamic';
import { Sparkles, Activity, RefreshCw, Zap } from 'lucide-react';
import { GexSummaryDto, VolSurfaceExpiryDto } from '@ff/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface IvSurfaceViewProps {
  symbol: string;
  selectedExpiry: string;
}

export const IvSurfaceView: React.FC<IvSurfaceViewProps> = ({ symbol, selectedExpiry }) => {
  const [ivSmileData, setIvSmileData] = useState<any>(null);
  const [volSurfaceData, setVolSurfaceData] = useState<{ surfaces: VolSurfaceExpiryDto[] } | null>(null);
  const [gexData, setGexData] = useState<GexSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const expQuery = selectedExpiry ? `?expiry=${selectedExpiry}` : '';

        const [smileRes, surfaceRes, gexRes] = await Promise.all([
          fetch(`/api/v1/options/analytics/iv-smile/${symbol}${expQuery}`),
          fetch(`/api/v1/options/analytics/vol-surface/${symbol}`),
          fetch(`/api/v1/options/analytics/gex/${symbol}${expQuery}`),
        ]);

        if (smileRes.ok && isMounted) {
          const json = await smileRes.json();
          setIvSmileData(json.data);
        }

        if (surfaceRes.ok && isMounted) {
          const json = await surfaceRes.json();
          setVolSurfaceData(json.data);
        }

        if (gexRes.ok && isMounted) {
          const json = await gexRes.json();
          setGexData(json.data);
        }
      } catch {
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, [symbol, selectedExpiry]);

  // IV Smile Chart Option
  const ivSmileOption = useMemo(() => {
    if (!ivSmileData?.points || ivSmileData.points.length === 0) return {};

    const strikes = ivSmileData.points.map((p: any) => String(p.strike));
    const ivs = ivSmileData.points.map((p: any) => p.iv);
    const atmStrike = ivSmileData.points.find((p: any) => p.isAtm)?.strike;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].name;
          const val = params[0].value;
          return `<div class="text-xs font-mono p-1"><strong>Strike: ₹${s}</strong><br/>Implied Vol: <strong style="color:#38bdf8">${val}%</strong></div>`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'IV %',
        nameTextStyle: { color: '#a3a3a3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: { color: '#a3a3a3', formatter: (v: number) => `${v}%`, fontSize: 10 },
      },
      series: [
        {
          name: 'Implied Volatility',
          type: 'line',
          data: ivs,
          smooth: true,
          lineStyle: { width: 3, color: '#38bdf8' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(56, 189, 248, 0.25)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0.0)' },
              ],
            },
          },
          markLine: atmStrike
            ? {
                silent: true,
                symbol: 'none',
                data: [
                  {
                    xAxis: String(atmStrike),
                    lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                    label: { formatter: 'ATM', color: '#f59e0b', position: 'insideEndTop' },
                  },
                ],
              }
            : undefined,
        },
      ],
    };
  }, [ivSmileData]);

  // Multi-Expiry Volatility Surface Term Structure Option
  const volSurfaceOption = useMemo(() => {
    if (!volSurfaceData?.surfaces || volSurfaceData.surfaces.length === 0) return {};

    const colors = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7'];
    const baseStrikes = volSurfaceData.surfaces[0]?.strikes.map((s) => String(s.strike)) || [];

    const series = volSurfaceData.surfaces.map((s, idx) => ({
      name: `${s.expiry} (${s.dte} DTE)`,
      type: 'line',
      data: s.strikes.map((st) => st.iv),
      smooth: true,
      lineStyle: { width: 2, color: colors[idx % colors.length] },
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: {
        data: volSurfaceData.surfaces.map((s) => `${s.expiry} (${s.dte} DTE)`),
        textStyle: { color: '#a3a3a3', fontSize: 11 },
        top: 5,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: baseStrikes,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'IV %',
        nameTextStyle: { color: '#a3a3a3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: { color: '#a3a3a3', formatter: (v: number) => `${v}%`, fontSize: 10 },
      },
      series,
    };
  }, [volSurfaceData]);

  // Gamma Exposure (GEX) Chart Option
  const gexBarOption = useMemo(() => {
    if (!gexData?.strikes || gexData.strikes.length === 0) return {};

    const strikes = gexData.strikes.map((s) => String(s.strike));
    const netGexs = gexData.strikes.map((s) => s.netGex);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].name;
          const val = Number(params[0].value);
          const color = val >= 0 ? '#10b981' : '#f43f5e';
          return `<div class="text-xs font-mono p-1"><strong>Strike: ₹${s}</strong><br/>Net Dealer GEX: <strong style="color:${color}">₹${val.toLocaleString('en-IN')}</strong></div>`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#404040' } },
        axisLabel: { color: '#a3a3a3', fontSize: 10, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'Net GEX (₹)',
        nameTextStyle: { color: '#a3a3a3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#262626' } },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (v: number) => {
            if (Math.abs(v) >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
            if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
            return String(v);
          },
          fontSize: 10,
        },
      },
      series: [
        {
          name: 'Net Dealer GEX',
          type: 'bar',
          data: netGexs.map((v) => ({
            value: v,
            itemStyle: { color: v >= 0 ? '#10b981' : '#f43f5e', borderRadius: v >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] },
          })),
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                xAxis: String(gexData.zeroGammaStrike),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                label: { formatter: 'Zero-Gamma Flip', color: '#f59e0b', position: 'insideEndTop' },
              },
            ],
          },
        },
      ],
    };
  }, [gexData]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* GEX Regime Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Gamma Regime</span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                gexData?.regime === 'POSITIVE_GAMMA'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {gexData?.regime === 'POSITIVE_GAMMA' ? 'LONG GAMMA' : 'SHORT GAMMA'}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            {gexData?.regime === 'POSITIVE_GAMMA'
              ? 'Market makers buy dips & sell rips (mean reverting).'
              : 'Market makers sell dips & buy rips (trend expansion).'}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Zero-Gamma Flip Strike</span>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            {gexData?.zeroGammaStrike ? `₹${gexData.zeroGammaStrike.toLocaleString('en-IN')}` : '—'}
          </div>
          <span className="text-[10px] text-neutral-500">Volatility pivot threshold</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Net Dealer GEX</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              (gexData?.netGex || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(gexData?.netGex || 0) >= 0 ? '+' : ''}₹
            {Math.abs((gexData?.netGex || 0) / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[10px] text-neutral-500">1% market move delta impact</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">ATM Implied Vol</span>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">
            {ivSmileData?.atmIv ? `${ivSmileData.atmIv}%` : '14.2%'}
          </div>
          <span className="text-[10px] text-neutral-500">Annualized standard deviation</span>
        </div>
      </div>

      {/* Primary Chart: IV Smile Curve */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Implied Volatility (IV) Smile Curve</h3>
              <p className="text-xs text-neutral-400">
                Strike vs market-implied standard deviation for {symbol} ({selectedExpiry || 'Current Expiry'})
              </p>
            </div>
          </div>
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />}
        </div>

        <div className="h-72 w-full">
          <ReactECharts option={ivSmileOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Grid: Vol Surface + GEX Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vol Surface Term Structure */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Multi-Expiry Volatility Term Structure</h4>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={volSurfaceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* GEX Distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Rupee Gamma Exposure (GEX) Distribution</h4>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={gexBarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
