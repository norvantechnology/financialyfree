'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, X, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface CorporateActionItem {
  id: string;
  symbol: string;
  companyName: string;
  actionType: 'Dividend' | 'Bonus Issue' | 'Stock Split' | 'Rights Issue';
  exDate: string;
  recordDate: string;
  details: string;
  dividendPerShare?: number;
  dividendYieldPct?: number;
  ratio?: string;
}

export interface DividendsCalendarData {
  lastUpdated: string;
  source: string;
  totalActions: number;
  corporateActions: CorporateActionItem[];
}

interface DividendsCalendarTabProps {
  data: DividendsCalendarData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function DividendsCalendarTab({ data, isLoading, onRefresh }: DividendsCalendarTabProps) {
  const [actionTypeFilter, setActionTypeFilter] = useState<'ALL' | 'Dividend' | 'Bonus Issue' | 'Stock Split'>('ALL');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'HIGH_YIELD' | 'SPLITS_BONUSES'>('ALL');
  const [highYieldOnly, setHighYieldOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const actions = data?.corporateActions || [];

  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      const matchesSearch =
        act.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = actionTypeFilter === 'ALL' || act.actionType === actionTypeFilter;
      const matchesYield =
        !highYieldOnly ||
        (act.dividendYieldPct != null
          ? act.dividendYieldPct >= 1.0
          : (act.dividendPerShare ?? 0) >= 5);
      let matchesPreset = true;
      if (presetFilter === 'HIGH_YIELD') {
        matchesPreset =
          act.dividendYieldPct != null
            ? act.dividendYieldPct >= 1.0
            : (act.dividendPerShare ?? 0) >= 5;
      } else if (presetFilter === 'SPLITS_BONUSES') {
        matchesPreset = act.actionType === 'Bonus Issue' || act.actionType === 'Stock Split';
      }
      return matchesSearch && matchesType && matchesYield && matchesPreset;
    });
  }, [actions, searchQuery, actionTypeFilter, highYieldOnly, presetFilter]);

  const handleExportCsv = () => {
    const headers = ['Symbol', 'Company', 'Ex-Date', 'Record Date', 'Corporate Action', 'Details', 'Dividend / Ratio', 'Annual Yield %'];
    const rows = filteredActions.map((act) => [
      act.symbol,
      act.companyName,
      act.exDate,
      act.recordDate,
      act.actionType,
      act.details,
      act.dividendPerShare ? `₹${act.dividendPerShare.toFixed(2)}` : act.ratio || '-',
      act.dividendYieldPct ? `${act.dividendYieldPct.toFixed(2)}%` : '-',
    ]);
    exportTableToCsv('NSE_Corporate_Actions_Dividends', headers, rows);
  };

  const dividendCount = actions.filter((a) => a.actionType === 'Dividend').length;
  const bonusCount = actions.filter((a) => a.actionType === 'Bonus Issue' || a.actionType === 'Stock Split').length;

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading dividend calendar..."
        subtitle="Pulling live exchange and market data for this workspace."
        variant="table"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


      {/* ── Summary Statistics ── */}
      <div className="tf-kpi-grid-responsive">
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Upcoming Actions
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {data?.totalActions ?? 0}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            NSE &amp; BSE declarations
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Upcoming Dividends
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {dividendCount}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Interim &amp; final payouts
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Bonuses &amp; Splits
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#4338CA', marginTop: '4px' }}>
            {bonusCount}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Capital restructuring events
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search company, symbol, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              
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
                  padding: '2px' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tf-segmented-pills">
            {(['ALL', 'Dividend', 'Bonus Issue', 'Stock Split'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActionTypeFilter(type)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: actionTypeFilter === type ? '#FFFFFF' : 'transparent',
                  color: actionTypeFilter === type ? '#0F172A' : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: actionTypeFilter === type ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}
              >
                {type === 'ALL' ? 'All Actions' : type}
              </button>
            ))}
          </div>

          <div className="tf-filter-actions">
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download corporate actions to CSV"
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

        {/* Preset Chips Row */}
        <div className="tf-preset-chips-wrap">
          <span className="tf-filter-label">Presets</span>
          <button
            type="button"
            onClick={() => setPresetFilter('ALL')}
            className={`tf-preset-chip ${presetFilter === 'ALL' ? 'tf-preset-chip-active' : ''}`}
          >
            All Corporate Actions
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('HIGH_YIELD')}
            className={`tf-preset-chip ${presetFilter === 'HIGH_YIELD' ? 'tf-preset-chip-active' : ''}`}
          >
            High Dividend Yield (&ge;3.0%)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('SPLITS_BONUSES')}
            className={`tf-preset-chip ${presetFilter === 'SPLITS_BONUSES' ? 'tf-preset-chip-active' : ''}`}
          >
            Bonuses &amp; Stock Splits
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={highYieldOnly}
                onChange={(e) => setHighYieldOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              High Yield (&ge;2.5%) Only
            </label>

            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              Showing <strong>{filteredActions.length}</strong> of {actions.length} corporate actions
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(searchQuery || actionTypeFilter !== 'ALL' || highYieldOnly || presetFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActionTypeFilter('ALL');
                  setHighYieldOnly(false);
                  setPresetFilter('ALL');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0F766E',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '11.5px',
                  padding: 0 }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table Grid ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for dates and yields →</span>
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
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '110px' }}>Action Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '100px' }}>Ex-Date</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '100px' }}>Record Date</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '180px' }}>Details</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '120px' }}>Dividend / Ratio</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Yield %</th>
                </tr>
              </thead>
              <tbody>
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No corporate actions found for the active filter.
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((act) => {
                    const isDividend = act.actionType === 'Dividend';
                    const isBonus = act.actionType === 'Bonus Issue';
                    return (
                      <tr key={act.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A' }}>{act.symbol}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 750,
                            background: isDividend ? '#DCFCE7' : isBonus ? '#EEF2FF' : '#FEF3C7',
                            color: isDividend ? '#15803D' : isBonus ? '#4338CA' : '#B45309',
                            border: isDividend ? '1px solid #86EFAC' : isBonus ? '1px solid #C7D2FE' : '1px solid #FDE68A',
                            whiteSpace: 'nowrap' }}>
                            {act.actionType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {act.exDate}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {act.recordDate}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 550, whiteSpace: 'nowrap' }}>
                          {act.details}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {act.dividendPerShare ? `₹${act.dividendPerShare.toFixed(2)}` : act.ratio || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: (act.dividendYieldPct ?? 0) >= 2.5 ? '#059669' : '#64748B', whiteSpace: 'nowrap' }}>
                          {act.dividendYieldPct ? `${act.dividendYieldPct.toFixed(2)}%` : '-'}
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
