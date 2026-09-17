'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  EyeOff,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { OptionChainRowDto, StrategyLegDto, TradeSide, OptionType } from '@ff/types';

interface FuturesItem {
  expiry: string;
  ltp: number;
  lots: string;
}

interface StockMojoChainLadderProps {
  symbol: string;
  onSymbolChange: (sym: string) => void;
  symbolList: string[];
  lotSize: number;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  vix: number;
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
}

export const StockMojoChainLadder: React.FC<StockMojoChainLadderProps> = ({
  symbol,
  onSymbolChange,
  symbolList,
  lotSize,
  spotPrice,
  spotChange,
  vix,
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
}) => {
  const [isFutDropdownOpen, setIsFutDropdownOpen] = useState(false);
  const [selectedFutIndex, setSelectedFutIndex] = useState(0);
  const [isExpiryDropdownOpen, setIsExpiryDropdownOpen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const atmRowRef = useRef<HTMLTableRowElement | null>(null);

  // Maximum OI across both CE and PE for scaling horizontal bars
  const maxOi = React.useMemo(() => {
    let max = 1;
    contracts.forEach((r) => {
      if (r.ce.oi > max) max = r.ce.oi;
      if (r.pe.oi > max) max = r.pe.oi;
    });
    return max;
  }, [contracts]);

  // Symbol cycler (< and >)
  const currentSymbolIndex = symbolList.indexOf(symbol);
  const handlePrevSymbol = () => {
    const nextIdx = (currentSymbolIndex - 1 + symbolList.length) % symbolList.length;
    onSymbolChange(symbolList[nextIdx]);
  };
  const handleNextSymbol = () => {
    const nextIdx = (currentSymbolIndex + 1) % symbolList.length;
    onSymbolChange(symbolList[nextIdx]);
  };

  // Scroll to ATM
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

  // Calculate days to expiry for each date
  const formatExpiryLabel = (dateStr: string) => {
    try {
      const target = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.max(0, Math.round((target.getTime() - now.getTime()) / 86400000));
      const day = target.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[target.getMonth()];
      return `${day} ${month} (${diffDays}d)`;
    } catch {
      return dateStr;
    }
  };

  const selectedFut = futures[selectedFutIndex] || futures[0] || {
    expiry: 'Near',
    ltp: spotPrice,
    lots: '1.8Cr',
  };

  return (
    <div className={`sm-chain-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* ── Top Row 1: Symbol Lot Pill & Ticker Bar ── */}
      <div className="sm-chain-top-header">
        <div className="sm-symbol-pill-box">
          <span className="sm-lot-badge">{lotSize}</span>
          <span className="sm-symbol-name">{symbol}</span>
          <div className="sm-symbol-arrows">
            <button
              onClick={handlePrevSymbol}
              className="sm-arrow-btn"
              title="Previous Symbol"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextSymbol}
              className="sm-arrow-btn"
              title="Next Symbol"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="sm-hide-chain-btn"
          title={isCollapsed ? 'Expand Option Chain' : 'Hide Option Chain to expand chart'}
        >
          <EyeOff className="w-3 h-3" />
          <span>{isCollapsed ? 'Show Chain' : 'Hide Chain'}</span>
        </button>
      </div>

      {/* ── Top Row 2: Micro Ticker Stats (SPOT, VIX, FUT) ── */}
      <div className="sm-chain-ticker-row">
        <div className="sm-ticker-item">
          <span className="sm-ticker-label">SPOT:</span>
          <span className="sm-ticker-value">
            {spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span className={`sm-ticker-change ${spotChange >= 0 ? 'pos' : 'neg'}`}>
            {spotChange >= 0 ? '+' : ''}{spotChange.toFixed(1)}
          </span>
        </div>

        <div className="sm-ticker-divider" />

        <div className="sm-ticker-item">
          <span className="sm-ticker-label">VIX:</span>
          <span className="sm-ticker-value">{vix.toFixed(2)}</span>
        </div>

        <div className="sm-ticker-divider" />

        {/* Futures Dropdown */}
        <div className="sm-futures-dropdown-wrapper">
          <button
            onClick={() => setIsFutDropdownOpen((p) => !p)}
            className="sm-fut-trigger-btn"
          >
            <span className="sm-ticker-label">FUT ({selectedFut.expiry}):</span>
            <span className="sm-ticker-value font-mono">
              {selectedFut.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <ChevronDown className="w-3 h-3 ml-0.5 text-slate-500" />
          </button>

          {isFutDropdownOpen && (
            <div className="sm-fut-popover">
              <div className="sm-fut-popover-header">
                <span>Expiry</span>
                <span>LTP</span>
                <span>Lots</span>
              </div>
              {futures.map((fut, idx) => (
                <div
                  key={fut.expiry}
                  onClick={() => {
                    setSelectedFutIndex(idx);
                    setIsFutDropdownOpen(false);
                  }}
                  className={`sm-fut-popover-row ${idx === selectedFutIndex ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${idx === selectedFutIndex ? 'bg-teal-600' : 'bg-slate-300'}`} />
                    {fut.expiry}
                  </span>
                  <span className="font-mono font-bold">
                    {fut.ltp.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">{fut.lots}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Row 3: Horizontal Expiry Date Tabs ── */}
      <div className="sm-chain-expiries-row">
        <div className="sm-expiry-pills-list">
          {expiryDates.slice(0, 5).map((exp) => {
            const isSelected = exp === selectedExpiry;
            return (
              <button
                key={exp}
                onClick={() => onExpiryChange(exp)}
                className={`sm-expiry-pill ${isSelected ? 'active' : ''}`}
              >
                {formatExpiryLabel(exp)}
              </button>
            );
          })}
        </div>

        {expiryDates.length > 5 && (
          <div className="relative">
            <button
              onClick={() => setIsExpiryDropdownOpen((p) => !p)}
              className="sm-expiry-more-btn"
              title="More Expiries"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isExpiryDropdownOpen && (
              <div className="sm-expiry-more-popover">
                {expiryDates.slice(5).map((exp) => (
                  <div
                    key={exp}
                    onClick={() => {
                      onExpiryChange(exp);
                      setIsExpiryDropdownOpen(false);
                    }}
                    className={`sm-expiry-more-item ${exp === selectedExpiry ? 'active' : ''}`}
                  >
                    {formatExpiryLabel(exp)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="sm-settings-gear-btn" title="Chain Settings">
          <Settings className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* ── Option Chain Table (Dual CE/PE Ladder) ── */}
      <div className="sm-chain-table-container" ref={tableContainerRef}>
        <table className="sm-ladder-table">
          <thead>
            <tr>
              <th className="th-delta">Call Δ</th>
              <th className="th-ltp">LTP</th>
              <th className="th-oi">OI</th>
              <th className="th-strike">Strike</th>
              <th className="th-oi">OI</th>
              <th className="th-ltp">LTP</th>
              <th className="th-delta">Put Δ</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((row) => {
              const isAtm = row.strike === atmStrike;
              const isCeItm = row.strike < atmStrike;
              const isPeItm = row.strike > atmStrike;

              // Check if any strategy leg is on this strike
              const activeCeLeg = activeLegs.find(
                (l) => l.strike === row.strike && l.optionType === 'CE'
              );
              const activePeLeg = activeLegs.find(
                (l) => l.strike === row.strike && l.optionType === 'PE'
              );

              const ceOiPct = Math.min(100, Math.round((row.ce.oi / maxOi) * 100));
              const peOiPct = Math.min(100, Math.round((row.pe.oi / maxOi) * 100));

              return (
                <tr
                  key={row.strike}
                  ref={isAtm ? atmRowRef : null}
                  className={`sm-ladder-row ${isAtm ? 'atm-row' : ''}`}
                >
                  {/* Call Delta */}
                  <td className={`td-delta ${isCeItm ? 'itm-call' : ''}`}>
                    {row.ce.delta != null ? row.ce.delta.toFixed(2) : '—'}
                  </td>

                  {/* Call LTP */}
                  <td
                    className={`td-ltp call ${isCeItm ? 'itm-call' : ''} ${activeCeLeg ? 'has-leg' : ''}`}
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
                    title="Click to add Call leg"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold">
                        {row.ce.ltp > 0 ? row.ce.ltp.toFixed(2) : '—'}
                      </span>
                      {activeCeLeg ? (
                        <span className={`sm-leg-badge ${activeCeLeg.side.toLowerCase()}`}>
                          {activeCeLeg.side === 'BUY' ? 'B' : 'S'}
                        </span>
                      ) : (
                        <TrendingUp className="w-2.5 h-2.5 text-slate-300 opacity-60" />
                      )}
                    </div>
                  </td>

                  {/* Call OI Bar */}
                  <td className={`td-oi ${isCeItm ? 'itm-call' : ''}`}>
                    <div className="sm-oi-bar-wrapper">
                      <div
                        className="sm-oi-bar-fill ce"
                        style={{ width: `${ceOiPct}%` }}
                      />
                    </div>
                  </td>

                  {/* Strike (Center Column) */}
                  <td className={`td-strike ${isAtm ? 'atm-cell' : ''}`}>
                    <span className="strike-text">{row.strike}</span>
                  </td>

                  {/* Put OI Bar */}
                  <td className={`td-oi ${isPeItm ? 'itm-put' : ''}`}>
                    <div className="sm-oi-bar-wrapper">
                      <div
                        className="sm-oi-bar-fill pe"
                        style={{ width: `${peOiPct}%` }}
                      />
                    </div>
                  </td>

                  {/* Put LTP */}
                  <td
                    className={`td-ltp put ${isPeItm ? 'itm-put' : ''} ${activePeLeg ? 'has-leg' : ''}`}
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
                    title="Click to add Put leg"
                  >
                    <div className="flex items-center justify-between gap-1">
                      {activePeLeg ? (
                        <span className={`sm-leg-badge ${activePeLeg.side.toLowerCase()}`}>
                          {activePeLeg.side === 'BUY' ? 'B' : 'S'}
                        </span>
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5 text-slate-300 opacity-60" />
                      )}
                      <span className="font-mono font-semibold">
                        {row.pe.ltp > 0 ? row.pe.ltp.toFixed(2) : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Put Delta */}
                  <td className={`td-delta ${isPeItm ? 'itm-put' : ''}`}>
                    {row.pe.delta != null ? row.pe.delta.toFixed(2) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Floating "Go to ATM" button */}
        <button
          onClick={scrollToAtm}
          className="sm-go-to-atm-floating-btn"
          title="Jump to current At-The-Money strike"
        >
          <Check className="w-3.5 h-3.5 text-white" />
          <span>Go to ATM</span>
        </button>
      </div>
    </div>
  );
};
