'use client';

import React, { useEffect, useRef, useState } from 'react';

const TV_EMBED =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

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
  // Equities on NSE cash
  if (/^[A-Z0-9&-]+$/.test(s)) return `NSE:${s}`;
  return 'NSE:NIFTY';
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

interface TradingViewAdvancedChartProps {
  symbol: string;
  timeframe?: '1m' | '5m' | '15m' | '1H' | '1D';
  height?: number | string;
  isActive?: boolean;
  className?: string;
  /** Show left drawing toolbar */
  fullTools?: boolean;
}

/**
 * Official TradingView Advanced Chart embed (not legacy tv.js).
 * Locks symbol to the requested NSE/BSE ticker — never falls back to AAPL.
 */
export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  symbol,
  timeframe = '5m',
  height = 420,
  isActive = true,
  className,
  fullTools = true,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const heightPx = typeof height === 'number' ? height : 420;
  const [booted, setBooted] = useState(isActive);
  const tvSymbol = toTradingViewSymbol(symbol);

  useEffect(() => {
    if (isActive) setBooted(true);
  }, [isActive]);

  useEffect(() => {
    if (!booted || !hostRef.current) return;

    const host = hostRef.current;
    host.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = `${heightPx}px`;
    container.style.width = '100%';

    const widgetEl = document.createElement('div');
    widgetEl.className = 'tradingview-widget-container__widget';
    widgetEl.style.height = 'calc(100% - 2px)';
    widgetEl.style.width = '100%';
    container.appendChild(widgetEl);

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval(timeframe),
      timezone: 'Asia/Kolkata',
      theme: 'light',
      style: '1',
      locale: 'en',
      backgroundColor: '#ffffff',
      toolbar_bg: '#f8fafc',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: !fullTools,
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      show_popup_button: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: fullTools
        ? ['Volume@tv-basicstudies', 'STD;EMA']
        : ['Volume@tv-basicstudies'],
    };

    const script = document.createElement('script');
    script.src = TV_EMBED;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);

    host.appendChild(container);

    return () => {
      host.innerHTML = '';
    };
  }, [booted, tvSymbol, timeframe, heightPx, fullTools]);

  return (
    <div
      className={`tv-advanced-chart ${className || ''}`}
      style={{ display: isActive ? 'block' : 'none', width: '100%' }}
      data-tv-symbol={tvSymbol}
    >
      <div className="tv-advanced-chart-meta" aria-hidden={false}>
        <span className="tv-advanced-chart-sym">{tvSymbol}</span>
        <span className="tv-advanced-chart-tf">{timeframe}</span>
      </div>
      <div
        ref={hostRef}
        className="tv-advanced-chart-host"
        style={{ width: '100%', minHeight: heightPx, height: heightPx }}
      />
    </div>
  );
};
