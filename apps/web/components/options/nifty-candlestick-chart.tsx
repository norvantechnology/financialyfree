'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { TradingViewAdvancedChart } from './tradingview-advanced-chart';
import { thinChartDataZoom } from './echarts-data-zoom';

export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '1D';
export type ChartFeedMode = 'tradingview' | 'app';

interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface NiftyCandlestickChartProps {
  symbol?: string;
  height?: number;
  isActive?: boolean;
  defaultFeed?: ChartFeedMode;
  /** Optional spot overlay (kept for callers; TV shows live OHLC itself) */
  spotPrice?: number;
  spotChange?: number;
  spotChangePct?: number;
  /** Immersive mode: TradingView full tools, hide compact hint */
  immersive?: boolean;
  fullTools?: boolean;
}

const TF_OPTIONS: ChartTimeframe[] = ['1m', '5m', '15m', '1H', '1D'];

const chartCache = new Map<string, { candles: CandlePoint[]; asOf: string | null; fetchedAt: number }>();
const CACHE_TTL_MS = 60_000;

function IconCandles({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4v3M7 17v3M17 6v2M17 16v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="5" y="7" width="4" height="10" rx="0.75" stroke="currentColor" strokeWidth="1.75" />
      <rect x="15" y="8" width="4" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconIndicators({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18V6M10 18V10M16 18V8M20 18H3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12c2.5-3 5.5-3 8 0s5.5 3 8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFullscreen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.1l1.2-1.6A1 1 0 0 1 9.6 5h4.8a1 1 0 0 1 .8.4L16.4 7h2.1A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-8Z" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconLightning({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Production chart shell:
 * - TradingView Advanced Chart (default): live NSE data + drawings, indicators, timeframes
 * - App Feed: our Yahoo/NSE candle API via ECharts (offline / no-TV fallback)
 */
export const NiftyCandlestickChart: React.FC<NiftyCandlestickChartProps> = ({
  symbol = 'NIFTY',
  height = 420,
  isActive = true,
  defaultFeed = 'tradingview',
  spotPrice: _spotPrice,
  spotChange: _spotChange,
  spotChangePct: _spotChangePct,
  immersive = false,
  fullTools = false,
}) => {
  const [feed, setFeed] = useState<ChartFeedMode>(defaultFeed);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMa, setShowMa] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const chartRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (feed !== 'app' || !isActive) return;
    let cancelled = false;
    const key = `${symbol}|${timeframe}`;
    const cached = chartCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setCandles(cached.candles);
      setAsOf(cached.asOf);
      setError(null);
      setLoading(false);
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/options/chart/${encodeURIComponent(symbol)}?timeframe=${timeframe}`,
          { credentials: 'include' },
        );
        if (!res.ok) throw new Error(`Chart ${res.status}`);
        const json = await res.json();
        const next: CandlePoint[] = Array.isArray(json?.candles) ? json.candles : [];
        if (cancelled) return;
        setCandles(next);
        setAsOf(json?.asOf || null);
        chartCache.set(key, { candles: next, asOf: json?.asOf || null, fetchedAt: Date.now() });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load chart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbol, timeframe, feed, isActive]);

  useEffect(() => {
    if (!isActive || feed !== 'app') return;
    const t = window.setTimeout(() => {
      try {
        chartRef.current?.getEchartsInstance?.()?.resize?.();
      } catch {
        /* ignore */
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [isActive, feed, height, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const option = useMemo<EChartsOption>(() => {
    const times = candles.map((c) => {
      const d = new Date(c.time);
      if (timeframe === '1D') {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      }
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    });
    const ohlc = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const volumes = candles.map((c) => c.volume ?? 0);
    const closes = candles.map((c) => c.close);
    const ma = (period: number) =>
      closes.map((_, i) => {
        if (i < period - 1) return null;
        const slice = closes.slice(i - period + 1, i + 1);
        return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
      });

    const series: any[] = [
      {
        type: 'candlestick',
        name: symbol,
        data: ohlc,
        itemStyle: {
          color: '#16A34A',
          color0: '#DC2626',
          borderColor: '#16A34A',
          borderColor0: '#DC2626',
        },
      },
    ];
    if (showMa) {
      series.push(
        { type: 'line', name: 'EMA 9', data: ma(9), smooth: true, showSymbol: false, lineStyle: { width: 1.2, color: '#2563EB' } },
        { type: 'line', name: 'EMA 21', data: ma(21), smooth: true, showSymbol: false, lineStyle: { width: 1.2, color: '#F59E0B' } },
      );
    }
    if (showVolume) {
      series.push({
        type: 'bar',
        name: 'Volume',
        data: volumes,
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: { color: 'rgba(100,116,139,0.35)' },
      });
    }

    return {
      animation: false,
      backgroundColor: '#FFFFFF',
      legend: { top: 4, left: 8, textStyle: { fontSize: 11, color: '#64748B' }, data: showMa ? [symbol, 'EMA 9', 'EMA 21'] : [symbol] },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: showVolume
        ? [
            { left: 48, right: 16, top: 36, height: '58%' },
            { left: 48, right: 16, top: '74%', height: '16%' },
          ]
        : [{ left: 48, right: 16, top: 36, bottom: 28 }],
      xAxis: showVolume
        ? [
            { type: 'category', data: times, boundaryGap: true, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#94A3B8', fontSize: 10 }, splitLine: { show: false } },
            { type: 'category', gridIndex: 1, data: times, boundaryGap: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { show: false } },
          ]
        : [{ type: 'category', data: times, boundaryGap: true, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#94A3B8', fontSize: 10 } }],
      yAxis: showVolume
        ? [
            { scale: true, splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 10 } },
            { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
          ]
        : [{ scale: true, splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 10 } }],
      dataZoom: thinChartDataZoom({
        xAxisIndex: showVolume ? [0, 1] : [0],
        start: 60,
        end: 100,
        bottom: 2,
        accent: 'blue',
      }),
      series,
    };
  }, [candles, symbol, timeframe, showMa, showVolume]);

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const chg = last && prev ? last.close - prev.close : 0;
  const chgPct = last && prev && prev.close ? (chg / prev.close) * 100 : 0;
  const up = chg >= 0;

  const takeSnapshot = () => {
    if (feed === 'tradingview') {
      window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const url = chartRef.current?.getEchartsInstance?.()?.getDataURL?.({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}-${timeframe}-${Date.now()}.png`;
      a.click();
    } catch {
      /* ignore */
    }
  };

  const chartHeight = fullscreen ? Math.max(480, typeof window !== 'undefined' ? window.innerHeight - 120 : 480) : height;

  return (
    <div
      className={`nifty-chart-shell ${fullscreen ? 'nifty-chart-shell--fs' : ''}`}
      ref={wrapRef}
      style={{ display: isActive ? undefined : 'none' }}
      aria-hidden={!isActive}
    >
      <div className="nifty-chart-toolbar">
        <div className="nifty-chart-toolbar-left">
          <div className="nifty-chart-feed-toggle" role="group" aria-label="Chart data source">
            <button
              type="button"
              className={feed === 'tradingview' ? 'active' : ''}
              onClick={() => setFeed('tradingview')}
              title="Live TradingView chart (NSE) — drawings, indicators, professional tools"
            >
              Live TV
            </button>
            <button
              type="button"
              className={feed === 'app' ? 'active' : ''}
              onClick={() => setFeed('app')}
              title="App candle feed (Yahoo/NSE via our API)"
            >
              App Feed
            </button>
          </div>

          <div className="nifty-chart-tf" role="group" aria-label="Timeframe">
            {TF_OPTIONS.map((tf) => (
              <button
                key={tf}
                type="button"
                className={timeframe === tf ? 'active' : ''}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {feed === 'app' && (
            <>
              <button type="button" className="nifty-chart-ico" title="Candlestick" aria-label="Candlestick">
                <IconCandles />
              </button>
              <button
                type="button"
                className={`nifty-chart-ico ${showMa ? 'active' : ''}`}
                title="Indicators (EMA)"
                aria-label="Indicators"
                onClick={() => setShowMa((v) => !v)}
              >
                <IconIndicators />
                <span className="nifty-chart-ico-label">fx</span>
              </button>
              <button
                type="button"
                className={`nifty-chart-ico ${showVolume ? 'active' : ''}`}
                title="Volume"
                aria-label="Volume"
                onClick={() => setShowVolume((v) => !v)}
              >
                <IconSettings />
              </button>
            </>
          )}
        </div>

        <div className="nifty-chart-toolbar-right">
          {feed === 'tradingview' ? (
            <span className="nifty-chart-live-pill" title="Streaming via TradingView (NSE/BSE)">
              NSE LIVE · TradingView
            </span>
          ) : asOf ? (
            <span className="nifty-chart-asof">
              {new Date(asOf).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          ) : null}
          <button type="button" className="nifty-chart-ico" title="Quick trade" aria-label="Quick trade">
            <IconLightning />
          </button>
          <button type="button" className="nifty-chart-ico" title="Fullscreen" aria-label="Fullscreen" onClick={() => setFullscreen((v) => !v)}>
            <IconFullscreen />
          </button>
          <button type="button" className="nifty-chart-ico" title="Snapshot" aria-label="Snapshot" onClick={takeSnapshot}>
            <IconCamera />
          </button>
        </div>
      </div>

      {feed === 'app' && last && (
        <div className="nifty-chart-ohlc">
          <strong>{symbol}</strong>
          <span>· {timeframe}</span>
          <span className="ohlc-vals">
            O {last.open.toLocaleString('en-IN')} H {last.high.toLocaleString('en-IN')} L {last.low.toLocaleString('en-IN')} C{' '}
            <em className={up ? 'up' : 'dn'}>{last.close.toLocaleString('en-IN')}</em>{' '}
            <em className={up ? 'up' : 'dn'}>
              {up ? '+' : ''}
              {chg.toFixed(2)} ({up ? '+' : ''}
              {chgPct.toFixed(2)}%)
            </em>
          </span>
        </div>
      )}

      {feed === 'tradingview' ? (
        <TradingViewAdvancedChart
          symbol={symbol}
          timeframe={timeframe}
          height={chartHeight}
          isActive={isActive}
          fullTools={fullTools || immersive}
        />
      ) : (
        <div className="nifty-chart-body" style={{ height: chartHeight }}>
          {loading && candles.length === 0 && <div className="nifty-chart-state">Loading chart…</div>}
          {error && candles.length === 0 && <div className="nifty-chart-state nifty-chart-state--err">{error}</div>}
          {candles.length > 0 && (
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
              lazyUpdate
            />
          )}
        </div>
      )}

      {feed === 'tradingview' && !immersive && (
        <p className="nifty-chart-hint">
          Drawing tools, Fibonacci, indicators &amp; live NSE quotes via TradingView Advanced Chart.
          Switch to <button type="button" className="linkish" onClick={() => setFeed('app')}>App Feed</button> for our API candles.
        </p>
      )}
    </div>
  );
};
