'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, X, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

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
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'HIGH_DELIVERY_70' | 'NEAR_52W_HIGH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const stocks = data?.stocks || [];

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        (stock.companyName || '').toLowerCase().includes(q) ||
        (stock.sector || '').toLowerCase().includes(q);
      const matchesDelivery =
        minDeliveryPct <= 0
          ? true
          : stock.deliveryPct != null && stock.deliveryPct >= minDeliveryPct;

      let matchesPreset = true;
      if (presetFilter === 'HIGH_DELIVERY_70') {
        const anyDelivery = stocks.some((s) => s.deliveryPct != null);
        matchesPreset = !anyDelivery ? true : stock.deliveryPct != null && stock.deliveryPct >= 70;
      } else if (presetFilter === 'NEAR_52W_HIGH') {
        const anyDist = stocks.some((s) => s.distFromHighPct != null);
        matchesPreset = !anyDist ? true : stock.distFromHighPct != null && stock.distFromHighPct <= 5;
      }

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
      s.distFromHighPct != null ? `${s.distFromHighPct.toFixed(2)}%` : '-',
      s.deliveryPct != null ? `${s.deliveryPct.toFixed(1)}%` : '-',
      s.deliveryVolume != null ? (s.deliveryVolume / 100000).toFixed(2) : '-',
      s.deliveryTo30dAvgRatio != null ? `${s.deliveryTo30dAvgRatio.toFixed(2)}x` : '-',
      s.verdict || '-',
    ]);
    exportTableToCsv('NSE_Delivery_Momentum_Screener', headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading delivery momentum screener..."
        subtitle="Pulling live exchange and market data for this workspace."
        variant="table"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


      {/* ── Filter & Search Controls ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search symbol, company, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search delivery stocks"
            />
            {searchQuery && (
              <button
                type="button"
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
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tf-filter-group">
            <span className="tf-filter-label">Min delivery</span>
            <div className="tf-segmented-pills">
              {[0, 50, 60, 65, 70].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMinDeliveryPct(pct)}
                  className={minDeliveryPct === pct ? 'is-active' : undefined}
                  style={
                    minDeliveryPct === pct
                      ? { background: '#0F172A', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : undefined
                  }
                >
                  {pct === 0 ? 'All' : <>&ge;{pct}%</>}
                </button>
              ))}
            </div>
          </div>

          <div className="tf-filter-actions">
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
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="tf-refresh-btn"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                <span className="tf-btn-label">Refresh</span>
              </button>
            )}
          </div>
        </div>

        <div className="tf-preset-chips-wrap">
          <span className="tf-filter-label">Presets</span>
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
            Ultra High (&ge;70%)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('NEAR_52W_HIGH')}
            className={`tf-preset-chip ${presetFilter === 'NEAR_52W_HIGH' ? 'tf-preset-chip-active' : ''}`}
          >
            Near 52W High (&le;5%)
          </button>
        </div>

        <div className="tf-filter-meta">
          <span>
            Showing <strong>{filteredStocks.length}</strong> of {stocks.length} high-delivery stocks
          </span>
          {(searchQuery || minDeliveryPct !== 0) && (
            <button
              type="button"
              className="tf-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setMinDeliveryPct(60);
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
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
                          {stock.distFromHighPct != null ? `${stock.distFromHighPct.toFixed(2)}%` : '-'}
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
                          {stock.deliveryVolume != null ? `${(stock.deliveryVolume / 100000).toFixed(2)} L` : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: (stock.deliveryTo30dAvgRatio ?? 0) >= 2.0 ? '#4338CA' : '#334155', whiteSpace: 'nowrap' }}>
                          {stock.deliveryTo30dAvgRatio != null ? `${stock.deliveryTo30dAvgRatio.toFixed(2)}x` : '-'}
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
                            whiteSpace: 'nowrap' }}>
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
