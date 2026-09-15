import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, RotateCcw, X, Building2 } from 'lucide-react';
import { TfLoadingState } from './tf-loading-state';

const YEARS = [
  'Mar 2014',
  'Mar 2015',
  'Mar 2016',
  'Mar 2017',
  'Mar 2018',
  'Mar 2019',
  'Mar 2020',
  'Mar 2021',
  'Mar 2022',
  'Mar 2023',
  'Mar 2024',
  'Mar 2025',
  'Sep 2025',
];

export interface BankMetricRow {
  bankName: string;
  ticker: string;
  sector?: string;
  values: (number | null)[];
}

export interface BankNbfcTabProps {
  liveData?: {
    periods?: string[];
    costOfFunds?: BankMetricRow[];
    roa?: BankMetricRow[];
    deposits?: BankMetricRow[];
    banks?: Array<{
      bankName: string;
      ticker: string;
      sector?: string;
      periods?: string[];
      revenue?: (number | null)[];
      pat?: (number | null)[];
      eps?: (number | null)[];
      opmPct?: (number | null)[];
    }>;
    lastUpdated?: string;
  };
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function BankNbfcTab({ liveData, isLoading = false, onRefresh }: BankNbfcTabProps = {}) {
  const [selectedProperty, setSelectedProperty] = useState('Cost Of Funds');
  const [selectedBank, setSelectedBank] = useState('All');
  const [bankSearch, setBankSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'All' | 'Private' | 'PSU'>('All');

  const periods = liveData?.periods && liveData.periods.length > 0 ? liveData.periods : YEARS;

  // Prefer dedicated metric grids; fall back to live banks P&L series from API
  const costOfFundsData = useMemo(() => {
    if (liveData?.costOfFunds && liveData.costOfFunds.length > 0) return liveData.costOfFunds;
    return (liveData?.banks || []).map((b) => ({
      bankName: b.bankName,
      ticker: b.ticker,
      sector: b.sector,
      values: (b.opmPct || b.revenue || []).map((v) => (v == null ? null : Number(v))),
    }));
  }, [liveData]);

  const roaData = useMemo(() => {
    if (liveData?.roa && liveData.roa.length > 0) return liveData.roa;
    return (liveData?.banks || []).map((b) => ({
      bankName: b.bankName,
      ticker: b.ticker,
      sector: b.sector,
      values: (b.eps || []).map((v) => (v == null ? null : Number(v))),
    }));
  }, [liveData]);

  const depositsData = useMemo(() => {
    if (liveData?.deposits && liveData.deposits.length > 0) return liveData.deposits;
    return (liveData?.banks || []).map((b) => ({
      bankName: b.bankName,
      ticker: b.ticker,
      sector: b.sector,
      values: (b.revenue || []).map((v) => (v == null ? null : Number(v))),
    }));
  }, [liveData]);

  const banks = useMemo(() => {
    return ['All', ...costOfFundsData.map((b) => b.bankName)];
  }, [costOfFundsData]);

  const getCostOfFundsCellBg = (val: number | null) => {
    if (val === null) return '#F8FAFC';
    // Lower is better (green for low cost of funds <= 4.5%, yellow 4.6-5.5, orange 5.6-6.5, red > 6.5)
    if (val <= 4.2) return '#DCFCE7'; // dark green
    if (val <= 5.0) return '#ECFDF5'; // light green
    if (val <= 5.8) return '#FEF3C7'; // yellow / amber
    if (val <= 6.8) return '#FFEDD5'; // orange
    return '#FEE2E2'; // light red
  };

  const getCostOfFundsColor = (val: number | null) => {
    if (val === null) return '#94A3B8';
    if (val <= 4.2) return '#15803D';
    if (val <= 5.0) return '#0F766E';
    if (val <= 5.8) return '#92400E';
    if (val <= 6.8) return '#C2410C';
    return '#B91C1C';
  };

  const getRoaCellBg = (val: number | null) => {
    if (val === null) return '#F8FAFC';
    // Higher is better for ROA
    if (val >= 2.0) return '#DCFCE7';
    if (val >= 1.2) return '#ECFDF5';
    if (val >= 0.5) return '#FEF3C7';
    if (val >= 0) return '#FFEDD5';
    return '#FEE2E2';
  };

  const getRoaColor = (val: number | null) => {
    if (val === null) return '#94A3B8';
    if (val >= 2.0) return '#15803D';
    if (val >= 1.2) return '#0F766E';
    if (val >= 0.5) return '#92400E';
    if (val >= 0) return '#C2410C';
    return '#B91C1C';
  };

  const [sortColumn, setSortColumn] = useState<string>('bankName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'bankName' ? 'asc' : 'desc');
    }
  };

  const renderSortIndicator = (col: string) => {
    if (sortColumn !== col) {
      return <ArrowUpDown size={10} style={{ opacity: 0.35, marginLeft: '3px', verticalAlign: 'middle' }} />;
    }
    return (
      <span style={{ marginLeft: '3px', color: '#0F766E', display: 'inline-flex', verticalAlign: 'middle' }}>
        {sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </span>
    );
  };

  const filterRows = (rows: BankMetricRow[]) => {
    return rows.filter((r) => {
      if (selectedBank !== 'All' && r.bankName !== selectedBank) return false;
      if (sectorFilter !== 'All' && r.sector && r.sector !== sectorFilter) return false;
      if (bankSearch.trim()) {
        const q = bankSearch.trim().toLowerCase();
        if (!r.bankName.toLowerCase().includes(q) && !r.ticker.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  };

  const getSortedRows = (rows: BankMetricRow[]) => {
    const filtered = filterRows(rows);
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortColumn === 'bankName') {
        return sortDirection === 'asc'
          ? a.bankName.localeCompare(b.bankName)
          : b.bankName.localeCompare(a.bankName);
      }
      const idx = periods.indexOf(sortColumn);
      if (idx !== -1) {
        const valA = a.values[idx];
        const valB = b.values[idx];
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
    return list;
  };

  // Hooks must run unconditionally (before any early returns) — React #310
  const sortedCostOfFunds = useMemo(
    () => getSortedRows(costOfFundsData),
    [costOfFundsData, sortColumn, sortDirection, selectedBank, sectorFilter, bankSearch, periods],
  );
  const sortedRoa = useMemo(
    () => getSortedRows(roaData),
    [roaData, sortColumn, sortDirection, selectedBank, sectorFilter, bankSearch, periods],
  );
  const sortedDeposits = useMemo(
    () => getSortedRows(depositsData),
    [depositsData, sortColumn, sortDirection, selectedBank, sectorFilter, bankSearch, periods],
  );

  const totalCount = costOfFundsData.length;
  const filteredCount = sortedCostOfFunds.length;

  const isFiltered =
    bankSearch.trim() !== '' ||
    selectedProperty !== 'All' ||
    selectedBank !== 'All' ||
    sectorFilter !== 'All';

  const handleResetFilters = () => {
    setBankSearch('');
    setSelectedProperty('All');
    setSelectedBank('All');
    setSectorFilter('All');
  };

  if (isLoading && costOfFundsData.length === 0) {
    return (
      <TfLoadingState
        title="Loading Bank & NBFC dashboard…"
        subtitle="Pulling Nifty Bank constituents and live balance-sheet series."
        variant="table"
        rows={6}
      />
    );
  }

  if (!isLoading && costOfFundsData.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
        <Building2 size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Bank & NBFC Metrics Available</h3>
        <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '440px', margin: '0 auto 16px' }}>
          Backend financial data service is currently unavailable or returning empty records.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '8px 18px',
              background: '#0F766E',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry / Reconnect Feed
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Top Header & Filter Banner (Fully Responsive & Dynamic) ── */}
      <div className="bank-nbfc-banner">
        {/* Top Header Row: Title & Sector Pills */}
        <div className="bank-nbfc-header-row">
          <div className="bank-nbfc-title-group">
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#F0FDFA',
              border: '1px solid #CCFBF1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Building2 size={19} color="#0F766E" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 750, color: '#0F172A', lineHeight: 1.3 }}>
                12-Year Ratio Heatmaps &amp; Liability Benchmarks
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                Cost of Funds, ROA quality, and deposit growth trends across Indian scheduled commercial banks.
              </div>
            </div>
          </div>

          {/* Sector Segmented Pills (Mobile 100% width, desktop compact) */}
          <div className="bank-nbfc-sector-pills">
            {(['All', 'Private', 'PSU'] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                style={{
                  background: sectorFilter === sec ? '#0F766E' : 'transparent',
                  color: sectorFilter === sec ? '#FFFFFF' : '#475569',
                  fontWeight: sectorFilter === sec ? 700 : 500,
                  boxShadow: sectorFilter === sec ? '0 1px 3px rgba(15, 118, 110, 0.25)' : 'none',
                }}
              >
                {sec === 'All' ? 'All Lenders' : `${sec} Banks`}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Row: Search Bar + Metric Dropdown + Bank Dropdown */}
        <div className="bank-nbfc-filter-row">
          {/* Search Input (Dynamic 100% on mobile, flex-grow on desktop) */}
          <div className="bank-nbfc-search-wrapper">
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search bank or ticker (e.g. HDFC, SBIN)..."
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                background: '#F8FAFC',
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
                height: '38px',
              }}
            />
            {bankSearch && (
              <button
                type="button"
                onClick={() => setBankSearch('')}
                style={{
                  position: 'absolute',
                  right: '9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Selects Group */}
          <div className="bank-nbfc-dropdowns-group">
            {/* Metric Selector */}
            <div className="bank-nbfc-dropdown-col">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 28px 8px 11px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '38px',
                }}
              >
                <option value="All">All Metrics (All 3)</option>
                <option value="Cost Of Funds">Cost Of Funds (%)</option>
                <option value="ROA">ROA Ratio (%)</option>
                <option value="Deposits">Deposits (₹ Cr)</option>
              </select>
            </div>

            {/* Bank Selector */}
            <div className="bank-nbfc-dropdown-col">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 28px 8px 11px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '38px',
                }}
              >
                <option value="All">All Banks ({banks.length - 1})</option>
                {banks.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Filter Summary & Reset Bar */}
        <div className="bank-nbfc-bottom-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              Showing <strong style={{ color: '#0F766E' }}>{filteredCount}</strong> of {totalCount} Banks
            </span>
            {sectorFilter !== 'All' && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#F0FDFA',
                color: '#0F766E',
                fontWeight: 650,
                border: '1px solid #CCFBF1',
              }}>
                {sectorFilter} Banks
              </span>
            )}
            {selectedProperty !== 'All' && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 650,
                border: '1px solid #BFDBFE',
              }}>
                {selectedProperty}
              </span>
            )}
            {selectedBank !== 'All' && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: 650,
                border: '1px solid #FDE68A',
              }}>
                {selectedBank}
              </span>
            )}
          </div>

          {/* Reset Filters CTA */}
          {isFiltered && (
            <button
              type="button"
              className="reset-btn"
              onClick={handleResetFilters}
              title="Reset all filters to default"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={12} color="#DC2626" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Section 1: Key Ratios (Cost of Funds Heatmap) ─────────── */}
      {(selectedProperty === 'All' || selectedProperty === 'Cost Of Funds') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Cost of Funds Benchmark (%)
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Green cells indicate lower cost of borrowing and higher deposit franchise strength. Click headers to sort.
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>12-Year Historical Comparison</div>
          </div>

          <div className="bank-nbfc-scroll-hint">
            <span>&larr; Swipe table horizontally to view 12-year history &rarr;</span>
          </div>

          <div className="table-scroll-container" style={{ border: 'none', margin: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="tf-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th
                    className="tf-sortable-th tf-table-sticky-col"
                    onClick={() => handleSort('bankName')}
                    style={{ width: '150px', minWidth: '140px', padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: sortColumn === 'bankName' ? '#0F766E' : '#334155' }}
                  >
                    Bank Name
                    {renderSortIndicator('bankName')}
                  </th>
                  {periods.map((yr) => (
                    <th
                      key={yr}
                      className="tf-sortable-th"
                      onClick={() => handleSort(yr)}
                      style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 600, color: sortColumn === yr ? '#0F766E' : '#475569', whiteSpace: 'nowrap' }}
                    >
                      {yr}
                      {renderSortIndicator(yr)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCostOfFunds.map((row) => (
                  <tr key={row.bankName} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="tf-table-sticky-col" style={{ padding: '6px 10px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {row.bankName}
                    </td>
                    {row.values.map((val, idx) => (
                      <td
                        key={idx}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          fontWeight: 600,
                          background: getCostOfFundsCellBg(val),
                          color: getCostOfFundsColor(val),
                          borderRadius: '2px',
                        }}
                      >
                        {val !== null ? `${val.toFixed(2)}` : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 2: More Ratios (ROA Heatmap) ──────────────────── */}
      {(selectedProperty === 'All' || selectedProperty === 'ROA') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Return on Assets (ROA %)
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Green cells indicate strong asset quality and high return generation (&gt;1.5% ROA). Click headers to sort.
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Annual ROA Trend</div>
          </div>

          <div className="bank-nbfc-scroll-hint">
            <span>&larr; Swipe table horizontally to view 12-year history &rarr;</span>
          </div>

          <div className="table-scroll-container" style={{ border: 'none', margin: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="tf-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th
                    className="tf-sortable-th tf-table-sticky-col"
                    onClick={() => handleSort('bankName')}
                    style={{ width: '150px', minWidth: '140px', padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: sortColumn === 'bankName' ? '#0F766E' : '#334155' }}
                  >
                    Bank Name
                    {renderSortIndicator('bankName')}
                  </th>
                  {periods.map((yr) => (
                    <th
                      key={yr}
                      className="tf-sortable-th"
                      onClick={() => handleSort(yr)}
                      style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 600, color: sortColumn === yr ? '#0F766E' : '#475569', whiteSpace: 'nowrap' }}
                    >
                      {yr}
                      {renderSortIndicator(yr)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRoa.map((row) => (
                  <tr key={row.bankName} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="tf-table-sticky-col" style={{ padding: '6px 10px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {row.bankName}
                    </td>
                    {row.values.map((val, idx) => (
                      <td
                        key={idx}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          fontWeight: 600,
                          background: getRoaCellBg(val),
                          color: getRoaColor(val),
                          borderRadius: '2px',
                        }}
                      >
                        {val !== null ? `${val.toFixed(2)}%` : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 3: Balance Sheet Deposits / Advances Table ─────── */}
      {(selectedProperty === 'All' || selectedProperty === 'Deposits') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Total Deposits &amp; Growth (₹ Cr)
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Historical reported deposit base across leading commercial and private scheduled banks. Click headers to sort.
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Values in ₹ Cr</div>
          </div>

          <div className="bank-nbfc-scroll-hint">
            <span>&larr; Swipe table horizontally to view 12-year history &rarr;</span>
          </div>

          <div className="table-scroll-container" style={{ border: 'none', margin: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="tf-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th
                    className="tf-sortable-th tf-table-sticky-col"
                    onClick={() => handleSort('bankName')}
                    style={{ width: '150px', minWidth: '140px', padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: sortColumn === 'bankName' ? '#0F766E' : '#334155' }}
                  >
                    Bank Name
                    {renderSortIndicator('bankName')}
                  </th>
                  {periods.map((yr) => (
                    <th
                      key={yr}
                      className="tf-sortable-th"
                      onClick={() => handleSort(yr)}
                      style={{ padding: '8px 5px', textAlign: 'right', fontWeight: 600, color: sortColumn === yr ? '#0F766E' : '#475569', whiteSpace: 'nowrap' }}
                    >
                      {yr}
                      {renderSortIndicator(yr)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDeposits.map((row) => (
                  <tr key={row.bankName} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="tf-table-sticky-col" style={{ padding: '6px 10px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {row.bankName}
                    </td>
                    {row.values.map((val, idx) => (
                      <td key={idx} style={{ padding: '6px 4px', textAlign: 'right', color: '#334155' }}>
                        {val != null && Number.isFinite(Number(val))
                          ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 1 })
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State when zero banks match */}
      {filteredCount === 0 && (
        <div style={{ padding: '36px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
          <Building2 size={32} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 650, color: '#1E293B', marginBottom: '4px' }}>No Banks Found</h4>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '380px', margin: '0 auto 12px' }}>
            No lenders match your search query &ldquo;{bankSearch}&rdquo; or the active filter criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: '6px 14px',
              background: '#0F766E',
              color: '#FFFFFF',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
