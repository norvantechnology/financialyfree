'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart2,
  Maximize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface CandlePoint {
  time: number;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NiftyCandlestickChartProps {
  symbol: string;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  /** When false, chart stays mounted but hidden — call resize when shown again */
  isActive?: boolean;
}

/** Module cache so remount / tab switch keeps the same candles */
const candleCache = new Map<string, CandlePoint[]>();
const cacheKey = (symbol: string, tf: string) => `${symbol}:${tf}`;

export const NiftyCandlestickChart: React.FC<NiftyCandlestickChartProps> = ({
  symbol,
  spotPrice: _spotPrice,
  spotChange,
  spotChangePct,
  isActive = true,
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1D'>('5m');
  const [candles, setCandles] = useState<CandlePoint[]>(
    () => candleCache.get(cacheKey(symbol, '5m')) || [],
  );
  const [isLoading, setIsLoading] = useState(() => !(candleCache.get(cacheKey(symbol, '5m'))?.length));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandlePoint | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const candlesRef = useRef<CandlePoint[]>(candles);
  const inFlightRef = useRef(false);
  const chartRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  // Seed from cache when symbol/timeframe changes
  useEffect(() => {
    const cached = candleCache.get(cacheKey(symbol, timeframe));
    if (cached?.length) {
      setCandles(cached);
      candlesRef.current = cached;
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    let isMounted = true;
    async function fetchChart(silent: boolean) {
      if (silent && inFlightRef.current) return;
      inFlightRef.current = true;
      const keepUi = silent || candlesRef.current.length > 0;
      try {
        if (!keepUi) setIsLoading(true);
        else setIsRefreshing(true);
        const intervalMap = {
          '1m': '1m',
          '5m': '5m',
          '15m': '15m',
          '1D': '1d',
        };
        const rangeMap = {
          '1m': '1d',
          '5m': '1d',
          '15m': '5d',
          '1D': '1mo',
        };
        const interval = intervalMap[timeframe] || '5m';
        const range = rangeMap[timeframe] || '1d';

        const res = await fetch(
          `/api/v1/options/chart/${symbol}?interval=${interval}&range=${range}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data?.candles && isMounted) {
            const next = json.data.candles as CandlePoint[];
            candleCache.set(cacheKey(symbol, timeframe), next);
            setCandles(next);
            candlesRef.current = next;
          }
        }
      } catch {
        // Keep last candles when network fails
      } finally {
        inFlightRef.current = false;
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void fetchChart(false);
    const intervalId = setInterval(() => {
      void fetchChart(true);
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol, timeframe]);

  // Resize when tab becomes visible again (fixes blank / wrong first paint)
  useEffect(() => {
    if (!isActive) return;
    const t = window.setTimeout(() => {
      try {
        chartRef.current?.getEchartsInstance?.()?.resize?.();
      } catch {
        /* ignore */
      }
    }, 60);
    return () => window.clearTimeout(t);
  }, [isActive, timeframe, candles.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      try {
        chartRef.current?.getEchartsInstance?.()?.resize?.();
      } catch {
        /* ignore */
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const opt = inst.getOption() as any;
    const dz = opt?.dataZoom?.[0];
    const start = typeof dz?.start === 'number' ? dz.start : 0;
    const end = typeof dz?.end === 'number' ? dz.end : 100;
    const center = (start + end) / 2;
    const span = Math.max(5, (end - start) * factor);
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

  const resetZoom = useCallback(() => {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const n = candlesRef.current.length || 1;
    const start = Math.max(0, 100 - (35 / n) * 100);
    inst.dispatchAction({ type: 'dataZoom', start, end: 100 });
  }, []);

  const activeCandle = hoveredCandle || candles[candles.length - 1] || null;
  const isPositive = spotChange >= 0;

  const chartOption = useMemo(() => {
    if (!candles || candles.length === 0) return {};

    const dates = candles.map((c) => c.timeStr);
    const ohlcData = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const volumes = candles.map((c) => [c.timeStr, c.volume, c.close >= c.open ? 1 : -1]);
    const zoomStart = Math.max(0, 100 - (35 / candles.length) * 100);

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#94A3B8', type: 'dashed' },
        },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const p = params[0];
          const cIndex = p.dataIndex;
          const c = candles[cIndex];
          if (c) {
            setTimeout(() => setHoveredCandle(c), 0);
          }
          return `
            <div style="font-family: monospace; font-size: 11px; padding: 4px;">
              <strong>${symbol} (${p.name})</strong><br/>
              O: ₹${c?.open.toLocaleString('en-IN')}<br/>
              H: ₹${c?.high.toLocaleString('en-IN')}<br/>
              L: ₹${c?.low.toLocaleString('en-IN')}<br/>
              C: ₹${c?.close.toLocaleString('en-IN')}<br/>
              Vol: ${c?.volume.toLocaleString('en-IN')}
            </div>
          `;
        },
      },
      toolbox: {
        show: false,
      },
      grid: [
        {
          left: 12,
          right: 56,
          top: 16,
          height: '58%',
          containLabel: false,
        },
        {
          left: 12,
          right: 56,
          top: '72%',
          height: '16%',
          containLabel: false,
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 10 },
          splitLine: { show: false },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          position: 'right',
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: {
            color: '#64748B',
            fontSize: 10,
            formatter: (v: number) => Math.round(v).toLocaleString('en-IN'),
          },
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
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: zoomStart,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: zoomStart,
          end: 100,
          height: 18,
          bottom: 4,
          borderColor: '#E2E8F0',
          fillerColor: 'rgba(15, 118, 110, 0.15)',
          handleStyle: { color: '#0F766E' },
          textStyle: { color: '#64748B', fontSize: 9 },
        },
      ],
      series: [
        {
          name: symbol,
          type: 'candlestick',
          data: ohlcData,
          itemStyle: {
            color: '#10B981',
            color0: '#F43F5E',
            borderColor: '#10B981',
            borderColor0: '#F43F5E',
          },
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes.map((v) => ({
            value: v[1],
            itemStyle: {
              color: v[2] === 1 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
            },
          })),
        },
      ],
    };
  }, [candles, symbol]);

  return (
    <div
      ref={wrapRef}
      className={`sm-candlestick-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={isActive ? undefined : { display: 'none' }}
    >
      <div className="sm-chart-header-bar">
        <div className="sm-chart-toolbar-start">
          <div className="sm-timeframe-group">
            {(['1m', '5m', '15m', '1D'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`sm-tf-btn ${timeframe === tf ? 'active' : ''}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button type="button" className="sm-indicators-btn" title="Indicators (coming soon)">
            <BarChart2 strokeWidth={2} />
            <span>Indicators</span>
          </button>

          <div className="sm-chart-zoom-btns" title="Scroll to pan · pinch/wheel to zoom">
            <button
              type="button"
              className="sm-chart-zoom-btn"
              onClick={() => zoomBy(0.7)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn strokeWidth={2} />
            </button>
            <button
              type="button"
              className="sm-chart-zoom-btn"
              onClick={() => zoomBy(1.4)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut strokeWidth={2} />
            </button>
            <button
              type="button"
              className="sm-chart-zoom-btn"
              onClick={resetZoom}
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="sm-chart-toolbar-end">
          {(isLoading || isRefreshing) && (
            <RefreshCw className="sm-chart-spin-icon" />
          )}
          <button
            type="button"
            className="sm-panel-icon-btn"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="sm-ohlc-status-strip">
        <span className="sm-ohlc-symbol">{symbol}</span>
        {activeCandle ? (
          <>
            <span className="sm-ohlc-item">
              O <strong className="font-mono">{activeCandle.open.toFixed(2)}</strong>
            </span>
            <span className="sm-ohlc-item">
              H <strong className="font-mono">{activeCandle.high.toFixed(2)}</strong>
            </span>
            <span className="sm-ohlc-item">
              L <strong className="font-mono">{activeCandle.low.toFixed(2)}</strong>
            </span>
            <span className="sm-ohlc-item">
              C <strong className="font-mono">{activeCandle.close.toFixed(2)}</strong>
            </span>
          </>
        ) : (
          <span className="sm-ohlc-item">No candle data</span>
        )}
        <span className={`sm-ohlc-diff ${isPositive ? 'pos' : 'neg'}`}>
          {isPositive ? '+' : ''}
          {spotChange.toFixed(2)} ({isPositive ? '+' : ''}
          {spotChangePct.toFixed(2)}%)
        </span>
      </div>

      <div className="sm-candlestick-canvas">
        {candles.length > 0 ? (
          <ReactECharts
            option={chartOption}
            style={{ height: isFullscreen ? '70vh' : '320px', width: '100%' }}
            notMerge={false}
            lazyUpdate
            opts={{ renderer: 'canvas' }}
            onChartReady={(inst: any) => {
              chartRef.current = { getEchartsInstance: () => inst };
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-[320px] text-slate-400 text-xs">
            {isLoading ? 'Loading live chart feed…' : 'No candle data for this timeframe'}
          </div>
        )}
      </div>
    </div>
  );
};
