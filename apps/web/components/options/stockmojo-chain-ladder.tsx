'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Crosshair,
  Download,
  Settings,
  Clock,
  Link2,
} from 'lucide-react';
import { OptionChainRowDto, StrategyLegDto, TradeSide, OptionType } from '@ff/types';

interface FuturesItem {
  expiry: string;
  ltp: number;
  lots: string;
  changePct?: number;
}

interface StockMojoChainLadderProps {
  symbol: string;
  onSymbolChange: (sym: string) => void;
  symbolList: string[];
  lotSize: number;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  vix: number | null;
  vixChangePct?: number | null;
  futures: FuturesItem[];
  selectedExpiry: string;
  expiryDates: string[];
  onExpiryChange: (exp: string) => void;
  contracts: OptionChainRowDto[];
  atmStrike: number;
  activeLegs: StrategyLegDto[];
  onAddOrToggleLeg: (leg: {
    side: TradeSide;
    type: OptionType;
    strike: number;
    price: number;
    iv: number | null;
    expiry: string;
  }) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  panelWidth?: number;
  panelHeight?: number;
  /** Live chain as-of timestamp */
  asOf?: string | null;
  dataSource?: string | null;
  onOpenBroker?: () => void;
  brokerConnected?: boolean;
}

type FeedMode = 'live' | 'historical';
type CycleMode = 'prev_day' | '1w' | '1m';

export const StockMojoChainLadder: React.FC<StockMojoChainLadderProps> = ({
  symbol,
  onSymbolChange,
  symbolList,
  lotSize,
  spotPrice,
  spotChangePct,
  vix,
  vixChangePct,
  futures,
  selectedExpiry,
  expiryDates,
  onExpiryChange,
  contracts,
  atmStrike,
  activeLegs,
  onAddOrToggleLeg,
  isCollapsed,
  onToggleCollapse,
  panelWidth,
  panelHeight,
  asOf,
  dataSource,
  onOpenBroker,
  brokerConnected,
}) => {
  const [feedMode, setFeedMode] = useState<FeedMode>('live');
  const [cycle, setCycle] = useState<CycleMode>('prev_day');
  const [showSettings, setShowSettings] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const atmRowRef = useRef<HTMLTableRowElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const maxOi = useMemo(() => {
    let max = 1;
    contracts.forEach((r) => {
      if (r.ce.oi > max) max = r.ce.oi;
      if (r.pe.oi > max) max = r.pe.oi;
    });
    return max;
  }, [contracts]);

  /** Synthetic future from ATM CE - PE (live). Prefer exchange fut LTP when present. */
  const synFuture = useMemo(() => {
    const fut = futures[0];
    if (fut?.ltp > 0) {
      return {
        value: fut.ltp,
        changePct:
          fut.changePct != null
            ? fut.changePct
            : spotPrice > 0
              ? parseFloat((((fut.ltp - spotPrice) / spotPrice) * 100).toFixed(2))
              : 0,
        label: 'Syn Future',
      };
    }
    const atm = contracts.find((c) => c.strike === atmStrike);
    if (atm && atm.ce.ltp > 0 && atm.pe.ltp > 0) {
      const value = parseFloat((atmStrike + atm.ce.ltp - atm.pe.ltp).toFixed(2));
      const changePct =
        spotPrice > 0 ? parseFloat((((value - spotPrice) / spotPrice) * 100).toFixed(2)) : 0;
      return { value, changePct, label: 'Syn Future' };
    }
    return null;
  }, [futures, contracts, atmStrike, spotPrice]);

  const currentSymbolIndex = symbolList.indexOf(symbol);
  const handlePrevSymbol = () => {
    const nextIdx = (currentSymbolIndex - 1 + symbolList.length) % symbolList.length;
    onSymbolChange(symbolList[nextIdx]);
  };
  const handleNextSymbol = () => {
    const nextIdx = (currentSymbolIndex + 1) % symbolList.length;
    onSymbolChange(symbolList[nextIdx]);
  };

  const scrollToAtm = () => {
    if (atmRowRef.current && tableContainerRef.current) {
      const container = tableContainerRef.current;
      const row = atmRowRef.current;
      const offsetTop = row.offsetTop - container.offsetTop;
      container.scrollTo({
        top: offsetTop - container.clientHeight / 2 + row.clientHeight / 2,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (contracts.length > 0) {
      setTimeout(scrollToAtm, 300);
    }
  }, [contracts.length, symbol]);

  useEffect(() => {
    if (!showSettings) return;
    const onDoc = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showSettings]);

  const formatExpiryLabel = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const target = new Date(y, m - 1, d);
      const now = new Date();
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.max(0, Math.round((target.getTime() - nowDate.getTime()) / 86400000));
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${target.getDate()} ${months[target.getMonth()]} (${diffDays}d)`;
    } catch {
      return dateStr;
    }
  };

  const asOfLabel = useMemo(() => {
    if (!asOf) return null;
    try {
      return new Date(asOf).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  }, [asOf]);

  const isLiveSource =
    dataSource === 'NSE_LIVE' || dataSource === 'BROKER_LIVE' || dataSource === 'NSE_CACHED';

  const downloadCsv = () => {
    if (!contracts.length) return;
    const lines = ['Strike,CE_LTP,CE_OI,CE_IV,PE_LTP,PE_OI,PE_IV'];
    contracts.forEach((r) => {
      lines.push(
        [
          r.strike,
          r.ce.ltp,
          r.ce.oi,
          r.ce.iv ?? '',
          r.pe.ltp,
          r.pe.oi,
          r.pe.iv ?? '',
        ].join(','),
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}-${selectedExpiry || 'chain'}-live.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Historical mode only uses real prev-day OI change from NSE - no invented history */
  const displayContracts = useMemo(() => {
    if (feedMode === 'live') return contracts;
    // Prev-day cycle: still live chain; OI change column is vs previous day (NSE field)
    return contracts;
  }, [contracts, feedMode, cycle]);

  return (
    <div
      className={`sm-chain-panel ${isCollapsed ? 'collapsed' : ''}`}
      style={
        !isCollapsed && panelWidth
          ? {
              width: panelWidth,
              minWidth: panelWidth,
              ...(panelHeight ? { height: panelHeight } : null),
            }
          : panelHeight && !isCollapsed
            ? { height: panelHeight }
            : undefined
      }
    >
      {/* ── StockMojo-style live ticker header ── */}
      <div className="sm-chain-live-header">
        <div className="sm-chain-live-top">
          <div className="sm-symbol-pill-box">
            <span className="sm-lot-badge">{lotSize}</span>
            <span className="sm-symbol-name">{symbol}</span>
            <div className="sm-symbol-arrows">
              <button type="button" onClick={handlePrevSymbol} className="sm-arrow-btn" title="Previous symbol">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleNextSymbol} className="sm-arrow-btn" title="Next symbol">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="sm-expiry-select-wrap">
            <select
              className="sm-expiry-select"
              value={selectedExpiry || expiryDates[0] || ''}
              onChange={(e) => onExpiryChange(e.target.value)}
              aria-label="Expiry"
              disabled={expiryDates.length === 0}
            >
              {expiryDates.length === 0 ? (
                <option value="">No expiry</option>
              ) : (
                expiryDates.map((exp) => (
                  <option key={exp} value={exp}>
                    {formatExpiryLabel(exp)}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="sm-expiry-select-chevron" aria-hidden />
          </div>

          <div className="sm-live-metrics">
            <div className="sm-live-metric">
              <span className="sm-live-metric-label">Spot</span>
              <span className="sm-live-metric-val">
                {spotPrice > 0
                  ? spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '-'}
              </span>
              {spotPrice > 0 ? (
                <span className={`sm-live-metric-chg ${spotChangePct >= 0 ? 'pos' : 'neg'}`}>
                  {spotChangePct >= 0 ? '+' : ''}
                  {spotChangePct.toFixed(2)}%
                </span>
              ) : null}
            </div>

            <div className="sm-live-metric">
              <span className="sm-live-metric-label">Syn Future</span>
              <span className="sm-live-metric-val">
                {synFuture
                  ? synFuture.value.toLocaleString('en-IN', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : '-'}
              </span>
              {synFuture ? (
                <span className={`sm-live-metric-chg ${synFuture.changePct >= 0 ? 'pos' : 'neg'}`}>
                  {synFuture.changePct >= 0 ? '+' : ''}
                  {synFuture.changePct.toFixed(2)}%
                </span>
              ) : null}
            </div>

            <div className="sm-live-metric">
              <span className="sm-live-metric-label">VIX</span>
              <span className="sm-live-metric-val">
                {vix != null && vix > 0 ? vix.toFixed(2) : '-'}
              </span>
              {vix != null && vixChangePct != null ? (
                <span className={`sm-live-metric-chg ${vixChangePct >= 0 ? 'pos' : 'neg'}`}>
                  {vixChangePct >= 0 ? '+' : ''}
                  {vixChangePct.toFixed(2)}%
                </span>
              ) : null}
            </div>
          </div>

          <div className="sm-live-tools">
            <button type="button" className="sm-tool-ico" title="Download live chain CSV" onClick={downloadCsv}>
              <Download strokeWidth={2} />
            </button>
            <div className="sm-settings-wrap" ref={settingsRef}>
              <button
                type="button"
                className="sm-tool-ico"
                title="Chain settings"
                onClick={() => setShowSettings((p) => !p)}
              >
                <Settings strokeWidth={2} />
              </button>
              {showSettings ? (
                <div className="sm-settings-popover">
                  <button type="button" onClick={scrollToAtm}>
                    Scroll to ATM
                  </button>
                  <button type="button" onClick={onToggleCollapse}>
                    {isCollapsed ? 'Expand panel' : 'Collapse panel'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="sm-chain-live-bottom">
          <div className="sm-feed-toggle" role="group" aria-label="Data mode">
            <button
              type="button"
              className={feedMode === 'live' ? 'active' : ''}
              onClick={() => setFeedMode('live')}
            >
              Live
            </button>
            <button
              type="button"
              className={feedMode === 'historical' ? 'active' : ''}
              onClick={() => setFeedMode('historical')}
              title="Uses NSE previous-day OI change - no invented history"
            >
              Historical
            </button>
          </div>

          {/* Cycle only for Historical - unwanted in Live */}
          {feedMode === 'historical' ? (
            <label className="sm-cycle-label">
              Cycle:
              <select
                className="sm-cycle-select"
                value={cycle}
                onChange={(e) => setCycle(e.target.value as CycleMode)}
              >
                <option value="prev_day">Prev Day</option>
                <option value="1w">1 Week</option>
                <option value="1m">1 Month</option>
              </select>
            </label>
          ) : null}

          <div className="sm-live-status">
            {asOfLabel ? (
              <span className="sm-live-asof" title={dataSource || 'Feed time'}>
                <Clock strokeWidth={2} />
                {asOfLabel}
              </span>
            ) : null}
            {isLiveSource && feedMode === 'live' ? (
              <span className="sm-live-badge" title={dataSource || ''}>
                NSE LIVE
              </span>
            ) : null}
            {!brokerConnected && onOpenBroker ? (
              <button type="button" className="sm-login-latest-btn" onClick={onOpenBroker}>
                <Link2 strokeWidth={2} />
                Connect for latest
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="sm-hide-chain-btn sm-hide-chain-btn--inline"
            title={isCollapsed ? 'Show option chain' : 'Hide option chain'}
          >
            {isCollapsed ? <PanelLeftOpen className="sm-icon" /> : <PanelLeftClose className="sm-icon" />}
            <span>{isCollapsed ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {feedMode === 'historical' && cycle !== 'prev_day' ? (
          <p className="sm-hist-note">
            Multi-week OI history needs saved snapshots. Showing live chain with NSE prev-day OI change only - no
            fake history.
          </p>
        ) : null}
      </div>

      {/* ── Option Chain Table ── */}
      <div className="sm-chain-table-container" ref={tableContainerRef}>
        <table className="sm-ladder-table">
          <thead>
            <tr>
              <th className="th-delta th-call" title="Call delta">
                CE Δ
              </th>
              <th className="th-ltp th-call" title="Call last traded price">
                LTP
              </th>
              <th className="th-strike" title="Strike price">
                Strike
              </th>
              <th className="th-oi" title={feedMode === 'historical' ? 'OI / OI Chg (prev day)' : 'Open interest CE / PE'}>
                {feedMode === 'historical' ? 'OI Chg' : 'OI'}
              </th>
              <th className="th-ltp th-put" title="Put last traded price">
                LTP
              </th>
              <th className="th-delta th-put" title="Put delta">
                PE Δ
              </th>
            </tr>
          </thead>
          <tbody>
            {displayContracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="sm-chain-empty-cell">
                  {spotPrice > 0
                    ? 'No option rows for this expiry yet. Spot is live - wait for NSE chain or pick another expiry.'
                    : 'Option chain unavailable. Spot and strikes will appear when the market feed responds.'}
                </td>
              </tr>
            ) : null}
            {displayContracts.map((row) => {
              const isAtm = row.strike === atmStrike;
              const isCeItm = row.strike < atmStrike;
              const isPeItm = row.strike > atmStrike;

              const activeCeLeg = activeLegs.find(
                (l) => l.strike === row.strike && l.optionType === 'CE',
              );
              const activePeLeg = activeLegs.find(
                (l) => l.strike === row.strike && l.optionType === 'PE',
              );

              const formatCallDelta = (d?: number | null) => {
                if (d == null) return '-';
                if (d >= 0.995) return '1';
                return d.toFixed(2);
              };
              const formatPutDelta = (d?: number | null) => {
                if (d == null) return '-';
                if (Math.abs(d) <= 0.005) return '0';
                return d.toFixed(2);
              };
              const lot = Math.max(1, Number(lotSize) || 1);
              const formatOi = (n: number) => {
                const units = (Number(n) || 0) * lot;
                if (!units) return '-';
                if (units >= 10000000) return `${(units / 10000000).toFixed(2)} Cr`;
                if (units >= 100000) return `${(units / 100000).toFixed(2)} L`;
                if (units >= 1000) return `${(units / 1000).toFixed(1)} K`;
                return String(Math.round(units));
              };
              const formatChg = (n: number) => {
                if (!n) return '-';
                const units = Math.abs(n) * lot;
                const s =
                  units >= 10000000
                    ? `${(units / 10000000).toFixed(2)} Cr`
                    : units >= 100000
                      ? `${(units / 100000).toFixed(1)} L`
                      : units >= 1000
                        ? `${(units / 1000).toFixed(1)} K`
                        : String(Math.round(units));
                return `${n > 0 ? '+' : '-'}${s}`;
              };
              const ceOiPct = maxOi > 0 ? Math.min(100, Math.round((row.ce.oi / maxOi) * 100)) : 0;
              const peOiPct = maxOi > 0 ? Math.min(100, Math.round((row.pe.oi / maxOi) * 100)) : 0;

              return (
                <tr
                  key={row.strike}
                  ref={isAtm ? atmRowRef : null}
                  className={`sm-ladder-row ${isAtm ? 'atm-row' : ''}`}
                >
                  <td className={`td-delta ${isCeItm ? 'itm-call' : ''}`}>
                    {formatCallDelta(row.ce.delta)}
                  </td>
                  <td
                    className={`td-ltp call ${isCeItm ? 'itm-call' : ''} ${
                      activeCeLeg ? `has-leg leg-${activeCeLeg.side.toLowerCase()}` : ''
                    }`}
                    onClick={() =>
                      onAddOrToggleLeg({
                        side: activeCeLeg?.side === 'BUY' ? 'SELL' : 'BUY',
                        type: 'CE',
                        strike: row.strike,
                        price: row.ce.ltp,
                        iv: row.ce.iv,
                        expiry: selectedExpiry,
                      })
                    }
                    title={activeCeLeg ? `${activeCeLeg.side} Call on this strike` : 'Add Call leg'}
                  >
                    <span className="sm-ltp-value">
                      {row.ce.ltp > 0 ? row.ce.ltp.toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className={`td-strike ${isAtm ? 'atm-cell' : ''} ${isCeItm ? 'itm-call' : ''}`}>
                    <span className="strike-text">{row.strike}</span>
                    {(activeCeLeg || activePeLeg) && (
                      <span className="sm-strike-leg-dot" aria-hidden />
                    )}
                  </td>
                  <td className="td-oi">
                    <div className="sm-oi-cell">
                      <div className="sm-oi-nums">
                        {feedMode === 'historical' ? (
                          <>
                            <span className="sm-oi-ce">{formatChg(row.ce.oiChange)}</span>
                            <span className="sm-oi-sep">/</span>
                            <span className="sm-oi-pe">{formatChg(row.pe.oiChange)}</span>
                          </>
                        ) : (
                          <>
                            <span className="sm-oi-ce">{formatOi(row.ce.oi)}</span>
                            <span className="sm-oi-sep">/</span>
                            <span className="sm-oi-pe">{formatOi(row.pe.oi)}</span>
                          </>
                        )}
                      </div>
                      <div className="sm-oi-bar-wrapper" aria-hidden>
                        <div
                          className="sm-oi-bar-fill sm-oi-bar-ce"
                          style={{ width: `${Math.max(ceOiPct > 0 ? 8 : 0, ceOiPct / 2)}%` }}
                        />
                        <div
                          className="sm-oi-bar-fill sm-oi-bar-pe"
                          style={{ width: `${Math.max(peOiPct > 0 ? 8 : 0, peOiPct / 2)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td
                    className={`td-ltp put ${isPeItm ? 'itm-put' : ''} ${
                      activePeLeg ? `has-leg leg-${activePeLeg.side.toLowerCase()}` : ''
                    } ${isAtm ? 'atm-put-highlight' : ''}`}
                    onClick={() =>
                      onAddOrToggleLeg({
                        side: activePeLeg?.side === 'BUY' ? 'SELL' : 'BUY',
                        type: 'PE',
                        strike: row.strike,
                        price: row.pe.ltp,
                        iv: row.pe.iv,
                        expiry: selectedExpiry,
                      })
                    }
                    title={activePeLeg ? `${activePeLeg.side} Put on this strike` : 'Add Put leg'}
                  >
                    <span className="sm-ltp-value">
                      {row.pe.ltp > 0 ? row.pe.ltp.toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className={`td-delta ${isPeItm ? 'itm-put' : ''}`}>
                    {formatPutDelta(row.pe.delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {displayContracts.length > 0 ? (
          <button
            type="button"
            onClick={scrollToAtm}
            className="sm-go-to-atm-floating-btn"
            title="Jump to At-The-Money strike"
          >
            <Crosshair className="sm-icon" aria-hidden />
            <span>ATM</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
