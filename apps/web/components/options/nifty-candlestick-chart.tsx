'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TradingViewAdvancedChart } from './tradingview-advanced-chart';

export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '1D';

interface NiftyCandlestickChartProps {
  symbol?: string;
  height?: number;
  isActive?: boolean;
  /** Optional spot overlay (kept for callers; TV shows live OHLC itself) */
  spotPrice?: number;
  spotChange?: number;
  spotChangePct?: number;
  /** Immersive mode: full drawing tools, hide compact hint */
  immersive?: boolean;
  fullTools?: boolean;
}

const TF_OPTIONS: ChartTimeframe[] = ['1m', '5m', '15m', '1H', '1D'];

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

/**
 * Live NSE/BSE chart via TradingView Advanced Chart.
 * Drawings, indicators, multi-timeframe — for strategy analysis & long-term testing.
 * (App Feed / delayed Yahoo candles removed — not accurate enough for live work.)
 */
export const NiftyCandlestickChart: React.FC<NiftyCandlestickChartProps> = ({
  symbol = 'NIFTY',
  height = 420,
  isActive = true,
  immersive = false,
  fullTools = true,
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const takeSnapshot = () => {
    window.open(
      `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const chartHeight = fullscreen
    ? Math.max(480, typeof window !== 'undefined' ? window.innerHeight - 120 : 480)
    : height;

  return (
    <div
      className={`nifty-chart-shell ${fullscreen ? 'nifty-chart-shell--fs' : ''}`}
      ref={wrapRef}
      style={{ display: isActive ? undefined : 'none' }}
      aria-hidden={!isActive}
    >
      <div className="nifty-chart-toolbar">
        <div className="nifty-chart-toolbar-left">
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
          <span className="nifty-chart-live-pill" title="Streaming via TradingView (NSE/BSE)">
            NSE LIVE · TradingView
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
            title="Open in TradingView"
            aria-label="Open in TradingView"
            onClick={takeSnapshot}
          >
            <IconCamera />
          </button>
        </div>
      </div>

      <TradingViewAdvancedChart
        symbol={symbol}
        timeframe={timeframe}
        height={chartHeight}
        isActive={isActive}
        fullTools={fullTools || immersive}
      />

      {!immersive && (
        <p className="nifty-chart-hint">
          Live NSE quotes, drawings, Fibonacci, indicators &amp; multi-timeframe analysis via TradingView —
          use this to plan and test strategies before paper/live execution.
        </p>
      )}
    </div>
  );
};
