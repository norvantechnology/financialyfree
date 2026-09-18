'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView?: {
      widget: new (opts: Record<string, unknown>) => unknown;
    };
  }
}

const TV_SCRIPT = 'https://s3.tradingview.com/tv.js';

/** Map app underlyings to TradingView exchange symbols (live NSE/BSE feed). */
export function toTradingViewSymbol(symbol: string): string {
  const s = (symbol || 'NIFTY').toUpperCase().trim();
  const indexMap: Record<string, string> = {
    NIFTY: 'NSE:NIFTY',
    BANKNIFTY: 'NSE:BANKNIFTY',
    FINNIFTY: 'NSE:FINNIFTY',
    MIDCPNIFTY: 'NSE:MIDCPNIFTY',
    SENSEX: 'BSE:SENSEX',
    BANKEX: 'BSE:BANKEX',
  };
  if (indexMap[s]) return indexMap[s];
  return `NSE:${s}`;
}

function tvInterval(tf: string): string {
  switch (tf) {
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '1H':
      return '60';
    case '1D':
      return 'D';
    default:
      return '5';
  }
}

let tvScriptPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.TradingView?.widget) return Promise.resolve();
  if (tvScriptPromise) return tvScriptPromise;

  tvScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TV_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      if (window.TradingView?.widget) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = TV_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      tvScriptPromise = null;
      reject(new Error('Failed to load TradingView library'));
    };
    document.head.appendChild(script);
  });

  return tvScriptPromise;
}

interface TradingViewAdvancedChartProps {
  symbol: string;
  timeframe?: '1m' | '5m' | '15m' | '1H' | '1D';
  height?: number | string;
  /** When false, hide with CSS but keep widget alive after first show */
  isActive?: boolean;
  className?: string;
  /** Full drawing toolbar + richer studies (use in fullscreen / drawer) */
  fullTools?: boolean;
}

/**
 * Production TradingView Advanced Chart widget.
 * Drawing tools, indicators, timeframes, live NSE/BSE quotes.
 * Free Advanced Chart widget. Full white-label Charting Library is a paid TradingView license.
 */
export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  symbol,
  timeframe = '5m',
  height = 420,
  isActive = true,
  className,
  fullTools = false,
}) => {
  const rawId = useId().replace(/:/g, '');
  const containerId = `tv_chart_${rawId}`;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const heightPx = typeof height === 'number' ? height : 420;
  // Latch: once the chart tab has been opened, keep the widget mounted across tab switches
  const [booted, setBooted] = useState(isActive);

  useEffect(() => {
    if (isActive) setBooted(true);
  }, [isActive]);

  useEffect(() => {
    if (!booted) return;

    let cancelled = false;

    async function mount() {
      try {
        await loadTradingViewScript();
        if (cancelled || !hostRef.current || !window.TradingView?.widget) return;

        hostRef.current.innerHTML = '';
        const mountEl = document.createElement('div');
        mountEl.id = containerId;
        mountEl.style.height = `${heightPx}px`;
        mountEl.style.width = '100%';
        hostRef.current.appendChild(mountEl);

        new window.TradingView.widget({
          autosize: true,
          symbol: toTradingViewSymbol(symbol),
          interval: tvInterval(timeframe),
          timezone: 'Asia/Kolkata',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#FFFFFF',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_top_toolbar: false,
          hide_legend: false,
          hide_side_toolbar: false,
          withdateranges: true,
          details: fullTools,
          hotlist: false,
          calendar: false,
          show_popup_button: fullTools,
          popup_width: '1000',
          popup_height: '650',
          studies: fullTools
            ? ['Volume@tv-basicstudies', 'STD;EMA', 'STD;SMA', 'STD;RSI']
            : ['Volume@tv-basicstudies', 'STD;EMA'],
          disabled_features: fullTools ? [] : undefined,
          enabled_features: fullTools
            ? ['side_toolbar_in_fullscreen_mode', 'header_in_fullscreen_mode']
            : undefined,
          container_id: containerId,
          height: heightPx,
          width: '100%',
        });
      } catch {
        if (hostRef.current) {
          hostRef.current.innerHTML =
            '<div class="tv-chart-fallback">TradingView chart unavailable. Switch to App Feed.</div>';
        }
      }
    }

    void mount();
    return () => {
      cancelled = true;
    };
  }, [booted, symbol, timeframe, heightPx, containerId, fullTools]);

  useEffect(() => {
    return () => {
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div
      className={`tv-advanced-chart ${className || ''}`}
      style={{ display: isActive ? 'block' : 'none', width: '100%' }}
    >
      <div
        ref={hostRef}
        className="tv-advanced-chart-host"
        style={{ width: '100%', minHeight: heightPx, height: heightPx }}
      />
    </div>
  );
};
