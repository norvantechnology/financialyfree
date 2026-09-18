'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toTradingViewSymbol } from './tradingview-advanced-chart';
import { thinChartDataZoom } from './echarts-data-zoom';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '1D';

interface NiftyCandlestickChartProps {
  symbol?: string;
  height?: number;
  isActive?: boolean;
  spotPrice?: number;
  spotChange?: number;
  spotChangePct?: number;
  immersive?: boolean;
  fullTools?: boolean;
}

interface CandleBar {
  time: number;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartPayload {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePct: number;
  candles: CandleBar[];
  source?: string;
}

const TF_OPTIONS: ChartTimeframe[] = ['1m', '5m', '15m', '1H', '1D'];

function yahooParams(tf: ChartTimeframe): { interval: string; range: string } {
  switch (tf) {
    case '1m':
      return { interval: '1m', range: '1d' };
    case '5m':
      return { interval: '5m', range: '1d' };
    case '15m':
      return { interval: '15m', range: '5d' };
    case '1H':
      return { interval: '60m', range: '1mo' };
    case '1D':
      return { interval: '1d', range: '6mo' };
    default:
      return { interval: '5m', range: '1d' };
  }
}

function IconFullscreen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconExternal({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 4h6v6M10 14 20 4M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Live index/equity candlestick chart from our Options Lab candle API
 * (Yahoo ^NSEI / ^NSEBANK / NSE equities). No TradingView embed - that widget
 * silently falls back to AAPL when the NSE symbol fails to resolve.
 */
export const NiftyCandlestickChart: React.FC<NiftyCandlestickChartProps> = ({
  symbol = 'NIFTY',
  height = 420,
  isActive = true,
  spotPrice,
  spotChange,
  spotChangePct,
  immersive = false,
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [fullscreen, setFullscreen] = useState(false);
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const tvSymbol = toTradingViewSymbol(symbol);

  const fetchCandles = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    const { interval, range } = yahooParams(timeframe);
    try {
      const res = await fetch(
        `/api/v1/options/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
        { signal: ac.signal, cache: 'no-store' },
      );
      if (!res.ok) {
        throw new Error(`Chart HTTP ${res.status}`);
      }
      const json = await res.json();
      const data = (json?.data || json) as ChartPayload;
      if (!data?.candles?.length) {
        setPayload({
          symbol,
          currentPrice: Number(data?.currentPrice) || Number(spotPrice) || 0,
          previousClose: Number(data?.previousClose) || 0,
          change: Number(data?.change) || Number(spotChange) || 0,
          changePct: Number(data?.changePct) || Number(spotChangePct) || 0,
          candles: [],
        });
        setError('Live candle feed returned no bars for this symbol/timeframe.');
        return;
      }
      setPayload({
        symbol: data.symbol || symbol,
        currentPrice: Number(data.currentPrice) || 0,
        previousClose: Number(data.previousClose) || 0,
        change: Number(data.change) || 0,
        changePct: Number(data.changePct) || 0,
        candles: data.candles,
        source: 'YAHOO_LIVE',
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load chart');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [symbol, timeframe, spotPrice, spotChange, spotChangePct]);

  useEffect(() => {
    if (!isActive) return;
    void fetchCandles();
    const ms = timeframe === '1D' ? 120_000 : 30_000;
    const id = window.setInterval(() => void fetchCandles(), ms);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [isActive, fetchCandles, timeframe]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const chartHeight = fullscreen
    ? Math.max(480, typeof window !== 'undefined' ? window.innerHeight - 120 : 480)
    : height;

  const last = payload?.candles?.[payload.candles.length - 1];
  const displayPrice =
    (spotPrice && spotPrice > 0 ? spotPrice : 0) ||
    payload?.currentPrice ||
    last?.close ||
    0;
  const displayChg =
    spotChange != null && Number.isFinite(spotChange)
      ? spotChange
      : payload?.change ?? 0;
  const displayChgPct =
    spotChangePct != null && Number.isFinite(spotChangePct)
      ? spotChangePct
      : payload?.changePct ?? 0;

  const option = useMemo(() => {
    const candles = payload?.candles || [];
    const category = candles.map((c) =>
      timeframe === '1D'
        ? new Date(c.time).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          })
        : c.timeStr,
    );
    const ohlc = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const up = candles.map((c) => (c.close >= c.open ? c.volume || 0 : 0));
    const down = candles.map((c) => (c.close < c.open ? c.volume || 0 : 0));

    return {
      animation: false,
      backgroundColor: 'transparent',
      legend: { show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 11 },
        formatter: (params: any[]) => {
          const i = params?.[0]?.dataIndex ?? 0;
          const c = candles[i];
          if (!c) return '';
          return [
            `<b>${category[i]}</b>`,
            `O ${c.open.toLocaleString('en-IN')}`,
            `H ${c.high.toLocaleString('en-IN')}`,
            `L ${c.low.toLocaleString('en-IN')}`,
            `C ${c.close.toLocaleString('en-IN')}`,
            c.volume ? `Vol ${c.volume.toLocaleString('en-IN')}` : null,
          ]
            .filter(Boolean)
            .join('<br/>');
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 56, right: 16, top: 28, height: '58%' },
        { left: 56, right: 16, top: '76%', height: '14%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: category,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          min: 'dataMin',
          max: 'dataMax',
        },
        {
          type: 'category',
          gridIndex: 1,
          data: category,
          boundaryGap: true,
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          scale: true,
          position: 'right',
          axisLabel: {
            color: '#64748b',
            fontSize: 10,
            formatter: (v: number) =>
              v >= 1000 ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : v.toFixed(2),
          },
          splitLine: { lineStyle: { color: '#e2e8f0' } },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: thinChartDataZoom({
        xAxisIndex: [0, 1],
        start: 0,
        end: 100,
        bottom: 4,
      }),
      series: [
        {
          name: symbol,
          type: 'candlestick',
          data: ohlc,
          itemStyle: {
            color: '#059669',
            color0: '#e11d48',
            borderColor: '#059669',
            borderColor0: '#e11d48',
          },
        },
        {
          name: 'Vol Up',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: up,
          itemStyle: { color: 'rgba(5,150,105,0.45)' },
          stack: 'vol',
          large: true,
        },
        {
          name: 'Vol Down',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: down,
          itemStyle: { color: 'rgba(225,29,72,0.45)' },
          stack: 'vol',
          large: true,
        },
      ],
    };
  }, [payload, symbol, timeframe]);

  const openTradingView = () => {
    window.open(
      `https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div
      className={`nifty-chart-shell ${fullscreen ? 'nifty-chart-shell--fs' : ''}`}
      ref={wrapRef}
      style={{ display: isActive ? undefined : 'none' }}
      aria-hidden={!isActive}
    >
      <div className="nifty-chart-toolbar">
        <div className="nifty-chart-toolbar-left">
          <div className="nifty-chart-sym-badge" title="Live Yahoo / NSE index feed">
            <strong>{(payload?.symbol || symbol).toUpperCase()}</strong>
            <span>
              {displayPrice > 0
                ? displayPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                : '-'}
            </span>
            <span className={displayChgPct >= 0 ? 'pos' : 'neg'}>
              {displayChg >= 0 ? '+' : ''}
              {displayChg.toFixed(2)} ({displayChgPct >= 0 ? '+' : ''}
              {displayChgPct.toFixed(2)}%)
            </span>
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
        </div>

        <div className="nifty-chart-toolbar-right">
          <span
            className="nifty-chart-live-pill"
            title="Candles from Yahoo Finance index tickers (^NSEI / ^NSEBANK / NSE equities)"
          >
            {loading ? 'Refreshing…' : payload?.candles?.length ? 'LIVE FEED' : 'NO BARS'}
          </span>
          <button
            type="button"
            className="nifty-chart-ico"
            title="Fullscreen"
            aria-label="Fullscreen"
            onClick={() => setFullscreen((v) => !v)}
          >
            <IconFullscreen />
          </button>
          <button
            type="button"
            className="nifty-chart-ico"
            title={`Open ${tvSymbol} on TradingView`}
            aria-label="Open on TradingView"
            onClick={openTradingView}
          >
            <IconExternal />
          </button>
        </div>
      </div>

      <div className="nifty-chart-canvas" style={{ height: chartHeight, minHeight: chartHeight }}>
        {error && !(payload?.candles?.length) ? (
          <div className="nifty-chart-empty">
            <p>{error}</p>
            <button type="button" className="nifty-chart-retry" onClick={() => void fetchCandles()}>
              Retry
            </button>
          </div>
        ) : (
          <ReactECharts
            option={option as any}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
        )}
      </div>

      {!immersive && (
        <p className="nifty-chart-hint">
          Live {symbol} candles from our market feed (not TradingView embed). Use drawings on
          TradingView via the external link if needed - embedded TV widgets often default to AAPL.
        </p>
      )}
    </div>
  );
};
