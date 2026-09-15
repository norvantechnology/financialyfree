'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, X, Download, Info } from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface CircuitStockItem {
  symbol: string;
  companyName: string;
  cmp: number;
  circuitBandPct: number;
  dayChangePct: number;
  pendingBuyQty?: number;
  pendingSellQty?: number;
  consecutiveDays: number;
  turnoverCr: number;
}

export interface CircuitBreakersData {
  lastUpdated: string;
  source: string;
  upperCircuitsCount: number;
  lowerCircuitsCount: number;
  upperCircuits: CircuitStockItem[];
  lowerCircuits: CircuitStockItem[];
}

interface CircuitBreakersTabProps {
  data: CircuitBreakersData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function CircuitBreakersTab({ data, isLoading, onRefresh }: CircuitBreakersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upper' | 'lower'>('upper');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'BAND_20' | 'MULTI_DAY'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rawStocks = activeSubTab === 'upper' ? data?.upperCircuits || [] : data?.lowerCircuits || [];

  const stocks = useMemo(() => {
    return rawStocks.filter((s) => {
      const matchesSearch =
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesPreset = true;
      if (presetFilter === 'BAND_20') matchesPreset = (s.circuitBandPct || 0) >= 20;
      else if (presetFilter === 'MULTI_DAY') {
        // NSE free feed often reports consecutiveDays=1; use turnover as a useful live proxy
        matchesPreset = (s.consecutiveDays || 0) >= 2 || (s.turnoverCr || 0) >= 50;
      }

      return matchesSearch && matchesPreset;
    });
  }, [rawStocks, searchQuery, presetFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Symbol',
      'Company Name',
      'Locked Price (₹)',
      'Band %',
      'Day Change %',
      activeSubTab === 'upper' ? 'Pending Buy Qty' : 'Pending Sell Qty',
      'Consecutive Days Locked',
      'Turnover (₹ Cr)',
    ];
    const rows = stocks.map((s) => [
      s.symbol,
      s.companyName,
      s.cmp,
      `${s.circuitBandPct}%`,
      `${s.dayChangePct >= 0 ? '+' : ''}${s.dayChangePct.toFixed(2)}%`,
      activeSubTab === 'upper' ? (s.pendingBuyQty ?? '-') : (s.pendingSellQty ?? '-'),
      s.consecutiveDays,
      s.turnoverCr,
    ]);
    exportTableToCsv(`NSE_${activeSubTab.toUpperCase()}_CIRCUITS`, headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading circuit breaker watch…"
        subtitle="Pulling live exchange and market data for this workspace."
        variant="table"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Contextual Methodology Guide ── */}
      <div className="tf-methodology-card">
        <div className="tf-methodology-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <div className="tf-methodology-title">
            <Info size={14} />
            <span>Exchange Circuit Filter &amp; Price Band Mechanics</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Circuit Bands:</strong> SEBI/NSE applies daily price bands of 2%, 5%, 10%, or 20% to prevent excessive intraday volatility. F&amp;O stocks do not have fixed circuit limits (only dynamic flexed bands).</p>
            <p><strong>Upper Circuit (Locked):</strong> Buyers only with 0 active sellers. High pending buy quantities reflect aggressive institutional or retail demand.</p>
            <p><strong>Surveillance Warning:</strong> Consecutive circuit locks (3+ days) trigger regulatory surveillance frameworks (ASM / ESM stages) with 100% margin requirements.</p>
          </div>
        )}
      </div>

      {/* ── Summary Counters ── */}
      <div className="tf-kpi-grid-responsive">
        <div
          onClick={() => setActiveSubTab('upper')}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
            border: activeSubTab === 'upper' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'upper' ? '0 4px 14px rgba(16, 185, 129, 0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Upper Circuit Stocks (Locked)
            </div>
            <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#065F46', marginTop: '4px' }}>
              {data?.upperCircuitsCount ?? 0}
            </div>
            <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              100% Buyers, zero sellers in book
            </div>
          </div>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 800,
            background: '#DCFCE7',
            color: '#15803D',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid #86EFAC',
            whiteSpace: 'nowrap',
          }}>
            LOCKED
          </span>
        </div>

        <div
          onClick={() => setActiveSubTab('lower')}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
            border: activeSubTab === 'lower' ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'lower' ? '0 4px 14px rgba(239, 68, 68, 0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lower Circuit Stocks (Locked)
            </div>
            <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#991B1B', marginTop: '4px' }}>
              {data?.lowerCircuitsCount ?? 0}
            </div>
            <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              100% Sellers, zero buyers
            </div>
          </div>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 800,
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid #FECACA',
            whiteSpace: 'nowrap',
          }}>
            LOCKED
          </span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-row-top">
          {/* Search Input */}
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search locked symbol or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 30px 7px 32px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                outline: 'none',
                color: '#0F172A',
                background: '#FFFFFF',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tf-segmented-pills">
            <button
              onClick={() => setActiveSubTab('upper')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeSubTab === 'upper' ? '#FFFFFF' : 'transparent',
                color: activeSubTab === 'upper' ? '#059669' : '#64748B',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'upper' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Upper Circuits ({data?.upperCircuitsCount ?? 0})
            </button>
            <button
              onClick={() => setActiveSubTab('lower')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeSubTab === 'lower' ? '#FFFFFF' : 'transparent',
                color: activeSubTab === 'lower' ? '#DC2626' : '#64748B',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'lower' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Lower Circuits ({data?.lowerCircuitsCount ?? 0})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download circuit table to CSV"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Preset Chips Row */}
        <div className="tf-preset-chips-wrap">
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Presets:</span>
          <button
            type="button"
            onClick={() => setPresetFilter('ALL')}
            className={`tf-preset-chip ${presetFilter === 'ALL' ? 'tf-preset-chip-active' : ''}`}
          >
            All Circuit Locks
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('BAND_20')}
            className={`tf-preset-chip ${presetFilter === 'BAND_20' ? 'tf-preset-chip-active' : ''}`}
          >
            20% Circuit Limit
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('MULTI_DAY')}
            className={`tf-preset-chip ${presetFilter === 'MULTI_DAY' ? 'tf-preset-chip-active' : ''}`}
          >
            Multi-Day / High Turnover
          </button>
        </div>

        {/* Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', paddingTop: '2px' }}>
          <span>
            Showing <strong>{stocks.length}</strong> of {rawStocks.length} {activeSubTab === 'upper' ? 'upper circuit' : 'lower circuit'} stocks
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F766E',
                cursor: 'pointer',
                fontWeight: 650,
                fontSize: '11.5px',
                padding: 0,
              }}
            >
              Reset Search
            </button>
          )}
        </div>
      </div>

      {/* ── Circuits Table ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for order book depth →</span>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '150px' }}>Symbol &amp; Company</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>Locked Price</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '85px' }}>Band %</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Day Chg</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '120px' }}>
                    {activeSubTab === 'upper' ? 'Pending Buy Qty' : 'Pending Sell Qty'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '85px' }}>Streak</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>Turnover</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No stocks currently locked in circuit for this filter.
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => {
                    const qty = activeSubTab === 'upper' ? stock.pendingBuyQty : stock.pendingSellQty;
                    return (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A' }}>{stock.symbol}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{(stock.cmp ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                            whiteSpace: 'nowrap',
                          }}>
                            {stock.circuitBandPct}% Band
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: activeSubTab === 'upper' ? '#059669' : '#DC2626', whiteSpace: 'nowrap' }}>
                          {activeSubTab === 'upper' ? `+${stock.dayChangePct.toFixed(2)}%` : `${stock.dayChangePct.toFixed(2)}%`}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                          {qty ? qty.toLocaleString('en-IN') : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: stock.consecutiveDays >= 2 ? '#FEF3C7' : '#F1F5F9',
                            color: stock.consecutiveDays >= 2 ? '#B45309' : '#475569',
                            border: stock.consecutiveDays >= 2 ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                            whiteSpace: 'nowrap',
                          }}>
                            {stock.consecutiveDays} Day{stock.consecutiveDays > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{stock.turnoverCr.toFixed(1)} Cr
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
