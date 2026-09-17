'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart2,
  Maximize2,
  RefreshCw,
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
}

export const NiftyCandlestickChart: React.FC<NiftyCandlestickChartProps> = ({
  symbol,
  spotPrice: _spotPrice,
  spotChange,
  spotChangePct,
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1D'>('5m');
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandlePoint | null>(null);

  // Fetch live candlestick data from API
  useEffect(() => {
    let isMounted = true;
    async function fetchChart() {
      try {
        setIsLoading(true);
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

        const res = await fetch(`/api/v1/options/chart/${symbol}?interval=${interval}&range=${range}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.candles && isMounted) {
            setCandles(json.data.candles);
          }
        }
      } catch {
        // Fallback candles generated if network fails
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchChart();
    const intervalId = setInterval(fetchChart, 15000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol, timeframe]);

  // Current active candle for OHLC display — never invent volume/OHLC
  const activeCandle = hoveredCandle || candles[candles.length - 1] || null;

  const isPositive = spotChange >= 0;

  // ECharts Option for Candlestick + Volume Chart
  const chartOption = useMemo(() => {
    if (!candles || candles.length === 0) return {};

    const dates = candles.map((c) => c.timeStr);
    // [open, close, lowest, highest] format for ECharts
    const ohlcData = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const volumes = candles.map((c) => [c.timeStr, c.volume, c.close >= c.open ? 1 : -1]);

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
      grid: [
        {
          left: 48,
          right: 24,
          top: 24,
          height: '62%',
        },
        {
          left: 48,
          right: 24,
          top: '74%',
          height: '18%',
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
          start: Math.max(0, 100 - (35 / candles.length) * 100),
          end: 100,
        },
      ],
      series: [
        {
          name: symbol,
          type: 'candlestick',
          data: ohlcData,
          itemStyle: {
            color: '#10B981',        // Green bull candle
            color0: '#F43F5E',       // Red bear candle
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
    <div className="sm-candlestick-wrapper">
      {/* ── Header Bar: Timeframes, Indicators, Live OHLC ── */}
      <div className="sm-chart-header-bar">
        <div className="flex items-center gap-2">
          {/* Timeframe selector pills */}
          <div className="sm-timeframe-group">
            {(['1m', '5m', '15m', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`sm-tf-btn ${timeframe === tf ? 'active' : ''}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Indicators Button */}
          <button className="sm-indicators-btn">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Indicators</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          )}
          <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Live OHLC Status Strip ── */}
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
          {isPositive ? '+' : ''}{spotChange.toFixed(2)} ({isPositive ? '+' : ''}{spotChangePct.toFixed(2)}%)
        </span>
      </div>

      {/* ── ECharts Candlestick Canvas ── */}
      <div className="sm-candlestick-canvas">
        {candles.length > 0 ? (
          <ReactECharts
            option={chartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge={true}
          />
        ) : (
          <div className="flex items-center justify-center h-[320px] text-slate-400 text-xs">
            Loading live chart feed...
          </div>
        )}
      </div>
    </div>
  );
};
