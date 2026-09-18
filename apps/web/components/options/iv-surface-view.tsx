'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasDataRef = useRef(false);

  useEffect(() => {
    hasDataRef.current = Boolean(ivSmileData || volSurfaceData || gexData);
  }, [ivSmileData, volSurfaceData, gexData]);

  useEffect(() => {
    let isMounted = true;
    let inFlight = false;

    async function loadAnalytics(silent: boolean) {
      if (silent && inFlight) return;
      inFlight = true;
      const keepUi = silent || hasDataRef.current;
      try {
        if (!keepUi) setIsLoading(true);
        else setIsRefreshing(true);
        const expQuery = selectedExpiry ? `?expiry=${selectedExpiry}` : '';

        const [smileRes, surfaceRes, gexRes] = await Promise.all([
          fetch(`/api/v1/options/analytics/iv-smile/${symbol}${expQuery}`),
          fetch(`/api/v1/options/analytics/vol-surface/${symbol}`),
          fetch(`/api/v1/options/analytics/gex/${symbol}${expQuery}`),
        ]);

        if (!isMounted) return;

        if (smileRes.ok) {
          const json = await smileRes.json();
          setIvSmileData(json.data);
        }

        if (surfaceRes.ok) {
          const json = await surfaceRes.json();
          setVolSurfaceData(json.data);
        }

        if (gexRes.ok) {
          const json = await gexRes.json();
          setGexData(json.data);
        }
      } catch {
      } finally {
        inFlight = false;
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadAnalytics(false);
    const intervalId = setInterval(() => {
      void loadAnalytics(true);
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
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
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        textStyle: { color: '#0F172A', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].name;
          const val = params[0].value;
          return `<div style="font-family: inherit; padding: 2px;"><strong>Strike: ₹${Number(s).toLocaleString('en-IN')}</strong><br/><span style="color:#0284C7">●</span> Implied Vol: <strong>${val}%</strong></div>`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'IV %',
        nameTextStyle: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', formatter: (v: number) => `${v}%`, fontSize: 11 },
      },
      series: [
        {
          name: 'Implied Volatility',
          type: 'line',
          data: ivs,
          smooth: true,
          lineStyle: { width: 3, color: '#0284C7' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(2, 132, 199, 0.20)' },
                { offset: 1, color: 'rgba(2, 132, 199, 0.0)' },
              ],
            },
          },
          markLine:
            atmStrike && strikes.includes(String(atmStrike))
              ? {
                  silent: true,
                  symbol: 'none',
                  data: [
                    {
                      xAxis: String(atmStrike),
                      lineStyle: { color: '#D97706', width: 2, type: 'dashed' },
                      label: { formatter: 'ATM Strike', color: '#D97706', position: 'insideEndTop', fontWeight: 'bold' },
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

    const colors = ['#0F766E', '#0284C7', '#D97706', '#7C3AED'];
    const baseStrikes = volSurfaceData.surfaces[0]?.strikes.map((s) => String(s.strike)) || [];

    const series = volSurfaceData.surfaces.map((s, idx) => ({
      name: `${s.expiry} (${s.dte} DTE)`,
      type: 'line',
      data: s.strikes.map((st) => st.iv),
      smooth: true,
      lineStyle: { width: 2.5, color: colors[idx % colors.length] },
    }));

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
        data: volSurfaceData.surfaces.map((s) => `${s.expiry} (${s.dte} DTE)`),
        textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: baseStrikes,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'IV %',
        nameTextStyle: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', formatter: (v: number) => `${v}%`, fontSize: 11 },
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
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        textStyle: { color: '#0F172A', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const s = params[0].name;
          const val = Number(params[0].value);
          const color = val >= 0 ? '#10B981' : '#F43F5E';
          return `<div style="padding: 2px;"><strong>Strike: ₹${Number(s).toLocaleString('en-IN')}</strong><br/>Net Dealer GEX: <strong style="color:${color}">₹${val.toLocaleString('en-IN')}</strong></div>`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: strikes,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 1, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'Net GEX (₹)',
        nameTextStyle: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          color: '#64748B',
          formatter: (v: number) => {
            if (Math.abs(v) >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
            if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
            return String(v);
          },
          fontSize: 11,
        },
      },
      series: [
        {
          name: 'Net Dealer GEX',
          type: 'bar',
          data: netGexs.map((v) => ({
            value: v,
            itemStyle: { color: v >= 0 ? '#10B981' : '#F43F5E', borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4] },
          })),
          markLine:
            gexData?.zeroGammaStrike && strikes.includes(String(gexData.zeroGammaStrike))
              ? {
                  silent: true,
                  symbol: 'none',
                  data: [
                    {
                      xAxis: String(gexData.zeroGammaStrike),
                      lineStyle: { color: '#D97706', width: 2, type: 'dashed' },
                      label: { formatter: 'Zero-Gamma Flip', color: '#D97706', position: 'insideEndTop', fontWeight: 'bold' },
                    },
                  ],
                }
              : undefined,
        },
      ],
    };
  }, [gexData]);

  const formattedAtmIv = useMemo(() => {
    if (ivSmileData?.atmIv == null) return '—';
    const val = Number(ivSmileData.atmIv);
    if (!Number.isFinite(val)) return '—';
    const normalized = val > 5 ? val : val * 100;
    return `${normalized.toFixed(1)}%`;
  }, [ivSmileData?.atmIv]);

  return (
    <div className="opt-view-stack">
      {/* ── Top Row: 4 Metric Cards ── */}
      <div className="opt-kpi-grid cols-4">
        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Gamma Regime</span>
          <div className="opt-kpi-value" style={{ marginTop: '0.25rem' }}>
            <span
              className={`opt-badge-pill ${
                gexData?.regime === 'POSITIVE_GAMMA' ? 'green' : 'rose'
              }`}
            >
              {gexData?.regime === 'POSITIVE_GAMMA' ? 'LONG GAMMA' : 'SHORT GAMMA'}
            </span>
          </div>
          <span className="opt-kpi-sub">
            {gexData?.regime === 'POSITIVE_GAMMA'
              ? 'Market makers buy dips & sell rips (mean reverting)'
              : 'Market makers sell dips & buy rips (trend expansion)'}
          </span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Zero-Gamma Flip Strike</span>
          <div className="opt-kpi-value" style={{ color: '#D97706' }}>
            {gexData?.zeroGammaStrike ? `₹${gexData.zeroGammaStrike.toLocaleString('en-IN')}` : '—'}
          </div>
          <span className="opt-kpi-sub">Volatility pivot threshold</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Net Dealer GEX</span>
          <div
            className="opt-kpi-value"
            style={{ color: (gexData?.netGex || 0) >= 0 ? '#10B981' : '#F43F5E' }}
          >
            {(gexData?.netGex || 0) >= 0 ? '+' : ''}₹
            {Math.abs((gexData?.netGex || 0) / 10000000).toFixed(2)} Cr
          </div>
          <span className="opt-kpi-sub">1% market move delta impact</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">ATM Implied Vol (IV)</span>
          <div className="opt-kpi-value" style={{ color: '#0284C7' }}>
            {formattedAtmIv}
          </div>
          <span className="opt-kpi-sub">Annualized standard deviation</span>
        </div>
      </div>

      {/* ── Primary Chart Card: IV Smile Curve ── */}
      <div className="opt-chart-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div className="opt-chart-icon">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="opt-chart-title">Implied Volatility (IV) Smile Curve</h3>
              <p className="opt-chart-subtitle">
                Strike vs market-implied standard deviation for {symbol} ({selectedExpiry || 'Current Expiry'})
              </p>
            </div>
          </div>
          {isLoading || isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : null}
        </div>

        <div className="opt-chart-container" style={{ height: '320px' }}>
          <ReactECharts option={ivSmileOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* ── Dual Secondary Grid: Vol Surface + GEX Distribution ── */}
      <div className="opt-charts-dual-grid">
        {/* Vol Surface Term Structure */}
        <div className="opt-chart-card" style={{ marginBottom: 0 }}>
          <div className="opt-chart-header">
            <div className="opt-chart-title-wrap">
              <div className="opt-chart-icon" style={{ color: '#D97706' }}>
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="opt-chart-title">Multi-Expiry Volatility Term Structure</h4>
                <p className="opt-chart-subtitle">IV across near, next & far monthly contracts</p>
              </div>
            </div>
          </div>
          <div className="opt-chart-container" style={{ height: '290px' }}>
            <ReactECharts option={volSurfaceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* GEX Distribution */}
        <div className="opt-chart-card" style={{ marginBottom: 0 }}>
          <div className="opt-chart-header">
            <div className="opt-chart-title-wrap">
              <div className="opt-chart-icon" style={{ color: '#10B981' }}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="opt-chart-title">Rupee Gamma Exposure (GEX) Distribution</h4>
                <p className="opt-chart-subtitle">Dealer positioning & market pinning pressure</p>
              </div>
            </div>
          </div>
          <div className="opt-chart-container" style={{ height: '290px' }}>
            <ReactECharts option={gexBarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
