'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, X, Download, Info } from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';

export interface DeliveryStockItem {
  symbol: string;
  companyName: string;
  sector: string;
  cmp: number;
  dayChangePct: number;
  distFromHighPct: number | null;
  deliveryPct: number | null;
  tradedVolume: number;
  deliveryVolume: number | null;
  deliveryTo30dAvgRatio: number | null;
  verdict: string | null;
}

export interface DeliveryMomentumData {
  lastUpdated: string;
  source: string;
  totalStocks: number;
  stocks: DeliveryStockItem[];
}

interface DeliveryMomentumTabProps {
  data: DeliveryMomentumData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function DeliveryMomentumTab({ data, isLoading, onRefresh }: DeliveryMomentumTabProps) {
  const [minDeliveryPct, setMinDeliveryPct] = useState<number>(0);
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'HIGH_DELIVERY_70' | 'SPIKE_2X'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stocks = data?.stocks || [];

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDelivery =
        minDeliveryPct <= 0
          ? true
          : stock.deliveryPct != null && stock.deliveryPct >= minDeliveryPct;

      let matchesPreset = true;
      if (presetFilter === 'HIGH_DELIVERY_70')
        matchesPreset = stock.deliveryPct != null && stock.deliveryPct >= 70;
      else if (presetFilter === 'SPIKE_2X')
        matchesPreset = stock.deliveryTo30dAvgRatio != null && stock.deliveryTo30dAvgRatio >= 2.0;

      return matchesSearch && matchesDelivery && matchesPreset;
    });
  }, [stocks, searchQuery, minDeliveryPct, presetFilter]);

  const handleExportCsv = () => {
    const headers = ['Symbol', 'Company', 'Sector', 'CMP (₹)', 'Day Chg %', '52W Dist %', 'Delivery %', 'Delivery Vol (L)', '30D Vol Spike', 'Verdict'];
    const rows = filteredStocks.map((s) => [
      s.symbol,
      s.companyName,
      s.sector,
      s.cmp,
      `${s.dayChangePct >= 0 ? '+' : ''}${s.dayChangePct.toFixed(2)}%`,
      s.distFromHighPct != null ? `${s.distFromHighPct.toFixed(2)}%` : '—',
      s.deliveryPct != null ? `${s.deliveryPct.toFixed(1)}%` : '—',
      s.deliveryVolume != null ? (s.deliveryVolume / 100000).toFixed(2) : '—',
      s.deliveryTo30dAvgRatio != null ? `${s.deliveryTo30dAvgRatio.toFixed(2)}x` : '—',
      s.verdict || '—',
    ]);
    exportTableToCsv('NSE_Delivery_Momentum_Screener', headers, rows);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Contextual Methodology Guide ── */}
      <div className="tf-methodology-card">
        <div className="tf-methodology-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <div className="tf-methodology-title">
            <Info size={14} />
            <span>High Delivery Volume Accumulation (Smart Money Footprint)</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Delivery % vs Intraday Churn:</strong> High delivery percentage (&gt;65%) indicates actual physical transfer of shares to Demat accounts rather than intraday noise/scalping.</p>
            <p><strong>Volume Spike Ratio:</strong> Ratio &ge; 2.0x vs 30-day average delivery confirms institutional accumulation pockets before major fundamental expansions or quarterly results.</p>
            <p><strong>Breakout Conviction:</strong> When a stock approaches 52-week highs (&lt;5% away) coupled with delivery &gt;70%, it signals strong institutional backing for the breakout.</p>
          </div>
        )}
      </div>

      {/* ── Educational Explainer Banner ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 800,
            background: '#EEF2FF',
            color: '#4338CA',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid #C7D2FE',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            Institutional Delivery Radar
          </span>
          <h4 style={{ fontSize: '13.5px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
            High Delivery % Momentum Filter
          </h4>
        </div>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          Filters for stocks trading within 5% of their 52-Week High where <strong>delivery volume exceeds 50–70%</strong>. This separates genuine long-term institutional accumulation (investors taking physical custody into Demat accounts) from speculative intraday churn.
        </p>
      </div>

      {/* ── Filter & Search Controls ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-row-top">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search symbol, company, or sector..."
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

          {/* Min Delivery Threshold */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Min Delivery:
            </span>
            <div className="tf-segmented-pills">
              {[0, 50, 60, 65, 70].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setMinDeliveryPct(pct)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '5px',
                    border: 'none',
                    background: minDeliveryPct === pct ? '#0F172A' : 'transparent',
                    color: minDeliveryPct === pct ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: minDeliveryPct === pct ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {pct === 0 ? 'All' : <>&ge;{pct}%</>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download delivery screener to CSV"
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
            All Stocks
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('HIGH_DELIVERY_70')}
            className={`tf-preset-chip ${presetFilter === 'HIGH_DELIVERY_70' ? 'tf-preset-chip-active' : ''}`}
          >
            Ultra High Delivery (&ge;70%)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('SPIKE_2X')}
            className={`tf-preset-chip ${presetFilter === 'SPIKE_2X' ? 'tf-preset-chip-active' : ''}`}
          >
            Volume Spike (&ge;2.0x 30D Avg)
          </button>
        </div>

        {/* Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', paddingTop: '2px' }}>
          <span>
            Showing <strong>{filteredStocks.length}</strong> of {stocks.length} high-delivery stocks
          </span>
          {(searchQuery || minDeliveryPct !== 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setMinDeliveryPct(60);
              }}
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
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table Grid ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for delivery metrics →</span>
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
                  <th className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '140px' }}>Symbol &amp; Company</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '110px' }}>Sector</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>CMP (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '90px' }}>52W Dist</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '110px' }}>Delivery %</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>Delivery Vol</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>30D Vol Spike</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '130px' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No stocks match the delivery filter threshold of &ge;{minDeliveryPct}%.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    return (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A' }}>{stock.symbol}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                          <span style={{ background: '#F1F5F9', padding: '3px 7px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {stock.sector}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{(stock.cmp ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          <div style={{ fontSize: '10.5px', fontWeight: 650, color: stock.dayChangePct >= 0 ? '#16A34A' : '#DC2626', marginTop: '1px', whiteSpace: 'nowrap' }}>
                            {stock.dayChangePct >= 0 ? `+${stock.dayChangePct.toFixed(2)}%` : `${stock.dayChangePct.toFixed(2)}%`}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                          {stock.distFromHighPct != null ? `${stock.distFromHighPct.toFixed(2)}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', whiteSpace: 'nowrap' }}>
                            <div style={{ width: '50px', background: '#E2E8F0', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${stock.deliveryPct != null ? Math.min(100, stock.deliveryPct) : 0}%`, background: (stock.deliveryPct ?? 0) >= 65 ? '#10B981' : '#F59E0B', height: '100%' }} />
                            </div>
                            <span style={{ fontWeight: 800, color: (stock.deliveryPct ?? 0) >= 65 ? '#059669' : '#0F172A', whiteSpace: 'nowrap' }}>
                              {stock.deliveryPct != null ? `${stock.deliveryPct.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                          {stock.deliveryVolume != null ? `${(stock.deliveryVolume / 100000).toFixed(2)} L` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: (stock.deliveryTo30dAvgRatio ?? 0) >= 2.0 ? '#4338CA' : '#334155', whiteSpace: 'nowrap' }}>
                          {stock.deliveryTo30dAvgRatio != null ? `${stock.deliveryTo30dAvgRatio.toFixed(2)}x` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 750,
                            background: (stock.verdict || '').includes('Breakout') ? '#DCFCE7' : '#EEF2FF',
                            color: (stock.verdict || '').includes('Breakout') ? '#15803D' : '#4338CA',
                            border: (stock.verdict || '').includes('Breakout') ? '1px solid #86EFAC' : '1px solid #C7D2FE',
                            whiteSpace: 'nowrap',
                          }}>
                            {stock.verdict || 'Live'}
                          </span>
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
