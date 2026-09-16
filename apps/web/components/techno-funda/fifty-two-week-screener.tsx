import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Search, RefreshCw, ArrowUpRight, ArrowDownRight, X, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface FiftyTwoWeekItem {
  symbol: string;
  companyName: string;
  sector: string;
  cmp: number;
  week52High: number;
  week52Low: number;
  distFromHighPct?: number;
  distFromLowPct?: number;
  dayChangePct: number;
  isNewAllTimeHigh?: boolean;
  isNear52WeekHigh?: boolean;
  isNew52WeekLow?: boolean;
  volume: number;
}

export interface FiftyTwoWeekData {
  lastUpdated: string;
  source: string;
  totalHighs: number;
  totalLows: number;
  highs: FiftyTwoWeekItem[];
  lows: FiftyTwoWeekItem[];
}

interface FiftyTwoWeekScreenerProps {
  data: FiftyTwoWeekData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function FiftyTwoWeekScreener({ data, isLoading, onRefresh }: FiftyTwoWeekScreenerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'highs' | 'lows'>('highs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [proximityFilter, setProximityFilter] = useState<'ALL' | 'WITHIN_2' | 'WITHIN_5'>('ALL');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'NEAR_ATH' | 'FRESH_BREAKOUT' | 'HEAVY_VOLUME'>('ALL');

  const items = activeSubTab === 'highs' ? data?.highs || [] : data?.lows || [];

  // Reset sector when switching highs/lows so sticky sectors don't empty the table
  React.useEffect(() => {
    setSelectedSector('ALL');
  }, [activeSubTab]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.sector) set.add(item.sector);
    });
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedSector === 'ALL' || item.sector === selectedSector;
      
      let matchesProximity = true;
      if (activeSubTab === 'highs' && proximityFilter === 'WITHIN_2') {
        matchesProximity = (item.distFromHighPct ?? 100) <= 2.0;
      } else if (activeSubTab === 'highs' && proximityFilter === 'WITHIN_5') {
        matchesProximity = (item.distFromHighPct ?? 100) <= 5.0;
      } else if (activeSubTab === 'lows' && proximityFilter === 'WITHIN_2') {
        matchesProximity = (item.distFromLowPct ?? 100) <= 2.0;
      } else if (activeSubTab === 'lows' && proximityFilter === 'WITHIN_5') {
        matchesProximity = (item.distFromLowPct ?? 100) <= 5.0;
      }

      let matchesPreset = true;
      if (presetFilter === 'NEAR_ATH') {
        matchesPreset = item.isNewAllTimeHigh === true || (item.distFromHighPct ?? 100) <= 2.0;
      } else if (presetFilter === 'FRESH_BREAKOUT') {
        matchesPreset = item.isNewAllTimeHigh === true || item.dayChangePct >= 2.0;
      } else if (presetFilter === 'HEAVY_VOLUME') {
        // Null volume from Yahoo = unknown, don't zero the table
        matchesPreset = item.volume == null ? true : item.volume >= 500000;
      }

      return matchesSearch && matchesSector && matchesProximity && matchesPreset;
    });
  }, [items, searchQuery, selectedSector, proximityFilter, presetFilter, activeSubTab]);

  const handleExportCsv = () => {
    const headers = [
      'Symbol',
      'Company Name',
      'Sector',
      'CMP (₹)',
      '52W High (₹)',
      '52W Low (₹)',
      'Dist from 52W High (%)',
      'Dist from 52W Low (%)',
      'Day Change (%)',
      'Volume',
      'Near 52W High',
    ];
    const rows = filteredItems.map((item) => [
      item.symbol,
      item.companyName,
      item.sector,
      item.cmp,
      item.week52High,
      item.week52Low,
      item.distFromHighPct ?? '',
      item.distFromLowPct ?? '',
      item.dayChangePct,
      item.volume,
      item.isNewAllTimeHigh || item.isNear52WeekHigh ? 'YES' : 'NO',
    ]);
    exportTableToCsv(`NSE_52W_${activeSubTab.toUpperCase()}`, headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading 52-week high/low screener…"
        subtitle="Pulling live exchange and market data for this workspace."
        variant="table"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


      {/* ── Top Header Metrics Summary ── */}
      <div className="tf-kpi-grid-responsive">
        <div
          onClick={() => setActiveSubTab('highs')}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
            border: activeSubTab === 'highs' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'highs' ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none',
            transition: 'all 0.15s ease' }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              52-Week High Breakouts
            </div>
            <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#065F46', marginTop: '4px' }}>
              {data?.totalHighs ?? 0}
            </div>
            <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Fresh annual highs today
            </div>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            flexShrink: 0 }}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('lows')}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
            border: activeSubTab === 'lows' ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'lows' ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'none',
            transition: 'all 0.15s ease' }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              52-Week Low Breakdowns
            </div>
            <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#991B1B', marginTop: '4px' }}>
              {data?.totalLows ?? 0}
            </div>
            <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Multi-month lows today
            </div>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626',
            flexShrink: 0 }}>
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Tray ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          <div className="tf-segmented-pills">
            <button
              type="button"
              onClick={() => setActiveSubTab('highs')}
              className={activeSubTab === 'highs' ? 'is-active' : undefined}
              style={
                activeSubTab === 'highs'
                  ? { color: '#059669', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : undefined
              }
            >
              52W Highs ({data?.totalHighs ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('lows')}
              className={activeSubTab === 'lows' ? 'is-active' : undefined}
              style={
                activeSubTab === 'lows'
                  ? { color: '#DC2626', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : undefined
              }
            >
              52W Lows ({data?.totalLows ?? 0})
            </button>
          </div>

          <div className="tf-filter-actions">
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download table to CSV"
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
            onClick={() => setPresetFilter('NEAR_ATH')}
            className={`tf-preset-chip ${presetFilter === 'NEAR_ATH' ? 'tf-preset-chip-active' : ''}`}
          >
            Near ATH (&le;2%)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('FRESH_BREAKOUT')}
            className={`tf-preset-chip ${presetFilter === 'FRESH_BREAKOUT' ? 'tf-preset-chip-active' : ''}`}
          >
            Fresh Breakouts (&ge;2%)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('HEAVY_VOLUME')}
            className={`tf-preset-chip ${presetFilter === 'HEAVY_VOLUME' ? 'tf-preset-chip-active' : ''}`}
          >
            Heavy Volume (&gt;500k)
          </button>
        </div>

        <div className="tf-filter-bar">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search 52W stocks"
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
                  padding: '2px' }}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            aria-label="Filter by sector"
            className="tf-filter-select"
          >
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 'ALL' ? 'All Sectors' : sec}
              </option>
            ))}
          </select>

          <div className="tf-segmented-pills">
            <button
              type="button"
              onClick={() => setProximityFilter('ALL')}
              className={proximityFilter === 'ALL' ? 'is-active' : undefined}
              style={
                proximityFilter === 'ALL'
                  ? { background: '#0F172A', color: '#FFFFFF' }
                  : undefined
              }
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setProximityFilter('WITHIN_2')}
              className={proximityFilter === 'WITHIN_2' ? 'is-active' : undefined}
              style={
                proximityFilter === 'WITHIN_2'
                  ? { background: '#0F172A', color: '#FFFFFF' }
                  : undefined
              }
            >
              Within 2%
            </button>
            <button
              type="button"
              onClick={() => setProximityFilter('WITHIN_5')}
              className={proximityFilter === 'WITHIN_5' ? 'is-active' : undefined}
              style={
                proximityFilter === 'WITHIN_5'
                  ? { background: '#0F172A', color: '#FFFFFF' }
                  : undefined
              }
            >
              Within 5%
            </button>
          </div>
        </div>

        <div className="tf-filter-meta">
          <span>
            Showing <strong>{filteredItems.length}</strong> of {items.length} stocks
          </span>
          {(searchQuery || selectedSector !== 'ALL' || proximityFilter !== 'ALL') && (
            <button
              type="button"
              className="tf-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setSelectedSector('ALL');
                setProximityFilter('ALL');
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
          <span>← Swipe table horizontally for 52W metrics →</span>
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
                  <th className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '150px' }}>Symbol &amp; Company</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '110px' }}>Sector</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>CMP (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Day Chg</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '105px' }}>52W High (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '105px' }}>52W Low (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Distance</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '130px' }}>Breakout Signal</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No matching stocks found for the active filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((stock) => {
                    const dayChg = Number(stock.dayChangePct);
                    const hasDayChg = Number.isFinite(dayChg);
                    const isPositive = !hasDayChg || dayChg >= 0;
                    const dist = activeSubTab === 'highs' ? stock.distFromHighPct : stock.distFromLowPct;
                    return (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {stock.symbol}
                            {stock.isNewAllTimeHigh && (
                              <span style={{ fontSize: '9.5px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 5px', borderRadius: '4px', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                ATH
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stock.companyName}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                          <span style={{ background: '#F1F5F9', padding: '3px 7px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {stock.sector || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {stock.cmp != null
                            ? `₹${Number(stock.cmp).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: hasDayChg ? (isPositive ? '#16A34A' : '#DC2626') : '#94A3B8', whiteSpace: 'nowrap' }}>
                          {hasDayChg ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                              {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {`${dayChg >= 0 ? '+' : ''}${dayChg.toFixed(2)}%`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#334155', fontWeight: 650, whiteSpace: 'nowrap' }}>
                          {stock.week52High != null
                            ? `₹${Number(stock.week52High).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {stock.week52Low != null
                            ? `₹${Number(stock.week52Low).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: dist !== undefined && dist <= 2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(241, 245, 249, 0.8)',
                            color: dist !== undefined && dist <= 2 ? '#059669' : '#334155',
                            fontSize: '11.5px',
                            whiteSpace: 'nowrap' }}>
                            {dist !== undefined ? `${dist.toFixed(2)}%` : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {activeSubTab === 'highs' ? (
                            <span style={{
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              background: stock.isNewAllTimeHigh ? '#DCFCE7' : '#F1F5F9',
                              color: stock.isNewAllTimeHigh ? '#15803D' : '#334155',
                              padding: '4px 9px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: stock.isNewAllTimeHigh ? '1px solid #86EFAC' : '1px solid #E2E8F0' }}>
                              {stock.isNewAllTimeHigh ? 'Fresh ATH' : '52W High'}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              background: '#FEE2E2',
                              color: '#991B1B',
                              padding: '4px 9px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: '1px solid #FECACA' }}>
                              52W Low
                            </span>
                          )}
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
