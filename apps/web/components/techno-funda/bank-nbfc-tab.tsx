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

/** Screener sector strings are unreliable ([1], Website, etc.) — classify by ticker/name */
const PSU_BANK_TICKERS = new Set([
  'SBIN',
  'BANKBARODA',
  'PNB',
  'CANBK',
  'UNIONBANK',
  'INDIANB',
  'MAHABANK',
  'BANKINDIA',
  'CENTRALBK',
  'IOB',
  'UCOBANK',
  'PSB',
  'JKBANK',
]);

function classifyBankOwnership(ticker?: string, bankName?: string, rawSector?: string): 'Private' | 'PSU' {
  const sym = (ticker || '').toUpperCase().replace(/\.(NS|BO)$/i, '').trim();
  if (sym && PSU_BANK_TICKERS.has(sym)) return 'PSU';
  const blob = `${bankName || ''} ${rawSector || ''}`.toLowerCase();
  if (
    /state bank|bank of baroda|punjab national|canara|union bank|indian bank|bank of india|uco bank|central bank|psu|public sector/.test(
      blob,
    )
  ) {
    return 'PSU';
  }
  if (rawSector === 'PSU' || rawSector === 'Private') return rawSector;
  return 'Private';
}
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
    pat?: BankMetricRow[];
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
    metricLabels?: {
      costOfFunds?: string;
      roa?: string;
      deposits?: string;
      pat?: string;
    };
    message?: string;
    dataSource?: string;
    lastUpdated?: string;
  };
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function BankNbfcTab({ liveData, isLoading = false, onRefresh }: BankNbfcTabProps = {}) {
  const [selectedProperty, setSelectedProperty] = useState('Net Profit Margin');
  const [selectedBank, setSelectedBank] = useState('All');
  const [bankSearch, setBankSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'All' | 'Private' | 'PSU'>('All');

  const periods = liveData?.periods && liveData.periods.length > 0 ? liveData.periods : YEARS;

  const hasNumericValues = (rows?: BankMetricRow[]) =>
    Boolean(rows?.some((r) => (r.values || []).some((v) => v != null && !Number.isNaN(Number(v)))));

  // Prefer dedicated metric grids when they contain real numbers; else derive from banks[]
  const costOfFundsData = useMemo(() => {
    const rows = hasNumericValues(liveData?.costOfFunds)
      ? liveData!.costOfFunds!
      : (liveData?.banks || []).map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: (b.opmPct || []).map((v, i) => {
            if (v != null) return Number(v);
            const rev = b.revenue?.[i];
            const pat = b.pat?.[i];
            if (rev && pat != null && Number(rev) !== 0) {
              return Math.round((Number(pat) / Number(rev)) * 1000) / 10;
            }
            return null;
          }),
        }));
    return rows.map((r) => ({
      ...r,
      sector: classifyBankOwnership(r.ticker, r.bankName, r.sector),
    }));
  }, [liveData]);

  const roaData = useMemo(() => {
    const rows = hasNumericValues(liveData?.roa)
      ? liveData!.roa!
      : (liveData?.banks || []).map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: (b.eps || []).map((v) => (v == null ? null : Number(v))),
        }));
    return rows.map((r) => ({
      ...r,
      sector: classifyBankOwnership(r.ticker, r.bankName, r.sector),
    }));
  }, [liveData]);

  const depositsData = useMemo(() => {
    const rows = hasNumericValues(liveData?.deposits)
      ? liveData!.deposits!
      : (liveData?.banks || []).map((b) => ({
          bankName: b.bankName,
          ticker: b.ticker,
          sector: b.sector,
          values: (b.revenue || []).map((v) => (v == null ? null : Number(v))),
        }));
    return rows.map((r) => ({
      ...r,
      sector: classifyBankOwnership(r.ticker, r.bankName, r.sector),
    }));
  }, [liveData]);

  const banks = useMemo(() => {
    return ['All', ...costOfFundsData.map((b) => b.bankName)];
  }, [costOfFundsData]);

  const ownershipCounts = useMemo(() => {
    let privateCount = 0;
    let psuCount = 0;
    for (const r of costOfFundsData) {
      if (r.sector === 'PSU') psuCount++;
      else privateCount++;
    }
    return { all: costOfFundsData.length, private: privateCount, psu: psuCount };
  }, [costOfFundsData]);

  // NPM % — higher is better
  const getMarginCellBg = (val: number | null) => {
    if (val === null) return '#F8FAFC';
    if (val >= 25) return '#DCFCE7';
    if (val >= 18) return '#ECFDF5';
    if (val >= 12) return '#FEF3C7';
    if (val >= 6) return '#FFEDD5';
    return '#FEE2E2';
  };

  const getMarginColor = (val: number | null) => {
    if (val === null) return '#94A3B8';
    if (val >= 25) return '#15803D';
    if (val >= 18) return '#0F766E';
    if (val >= 12) return '#92400E';
    if (val >= 6) return '#C2410C';
    return '#B91C1C';
  };

  const getRoaCellBg = (val: number | null) => {
    if (val === null) return '#F8FAFC';
    // EPS ₹ — relative green scale
    if (val >= 40) return '#DCFCE7';
    if (val >= 25) return '#ECFDF5';
    if (val >= 15) return '#FEF3C7';
    if (val >= 5) return '#FFEDD5';
    return '#FEE2E2';
  };

  const getRoaColor = (val: number | null) => {
    if (val === null) return '#94A3B8';
    if (val >= 40) return '#15803D';
    if (val >= 25) return '#0F766E';
    if (val >= 15) return '#92400E';
    if (val >= 5) return '#C2410C';
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
      const ownership = classifyBankOwnership(r.ticker, r.bankName, r.sector);
      if (sectorFilter !== 'All' && ownership !== sectorFilter) return false;
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
    selectedProperty !== 'Net Profit Margin' ||
    selectedBank !== 'All' ||
    sectorFilter !== 'All';

  const handleResetFilters = () => {
    setBankSearch('');
    setSelectedProperty('Net Profit Margin');
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
                Interest Income, Net Profit Margin, and EPS trends from free Screener.in bank P&L (not statutory CoF/ROA).
              </div>
            </div>
          </div>

          {/* Sector Segmented Pills (Mobile 100% width, desktop compact) */}
          <div className="bank-nbfc-sector-pills" role="group" aria-label="Bank ownership filter">
            {([
              { id: 'All' as const, label: `All banks (${ownershipCounts.all})` },
              { id: 'Private' as const, label: `Private (${ownershipCounts.private})` },
              { id: 'PSU' as const, label: `PSU (${ownershipCounts.psu})` },
            ]).map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSectorFilter(sec.id)}
                title={
                  sec.id === 'All'
                    ? 'Show all lenders'
                    : sec.id === 'Private'
                      ? 'Private-sector banks (HDFC, ICICI, Axis, Kotak…)'
                      : 'Public-sector banks (SBI, PNB, Bank of Baroda…)'
                }
                style={{
                  background: sectorFilter === sec.id ? '#0F766E' : 'transparent',
                  color: sectorFilter === sec.id ? '#FFFFFF' : '#475569',
                  fontWeight: sectorFilter === sec.id ? 700 : 500,
                  boxShadow: sectorFilter === sec.id ? '0 1px 3px rgba(15, 118, 110, 0.25)' : 'none',
                }}
              >
                {sec.label}
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 650, color: '#64748B', marginBottom: '4px' }}>
                Metric
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                aria-label="Metric to display"
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
                <option value="All">Show all 3 tables</option>
                <option value="Net Profit Margin">Net Profit Margin (%)</option>
                <option value="EPS">EPS (₹)</option>
                <option value="Interest Income">Interest Income (₹ Cr)</option>
              </select>
            </div>

            {/* Bank Selector */}
            <div className="bank-nbfc-dropdown-col">
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 650, color: '#64748B', marginBottom: '4px' }}>
                Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                aria-label="Bank to focus"
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
                {sectorFilter === 'Private' ? 'Private banks' : sectorFilter === 'PSU' ? 'PSU banks' : sectorFilter}
              </span>
            )}
            {selectedProperty !== 'All' && selectedProperty !== 'Net Profit Margin' && (
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
      {(selectedProperty === 'All' || selectedProperty === 'Net Profit Margin') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Net Profit Margin (%) — PAT / Interest Income
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Free Screener.in bank P&L. Green = higher margin. Statutory Cost of Funds is not in this free feed.
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Annual Margin Trend</div>
          </div>

          <div className="bank-nbfc-scroll-hint">
            <span>&larr; Swipe table horizontally to view history &rarr;</span>
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
                          background: getMarginCellBg(val),
                          color: getMarginColor(val),
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

      {/* ── Section 2: EPS Heatmap ──────────────────── */}
      {(selectedProperty === 'All' || selectedProperty === 'EPS') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Earnings Per Share (₹)
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Annual EPS from Screener.in. Green cells indicate stronger per-share earnings. Click headers to sort.
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Annual EPS Trend</div>
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

      {/* ── Section 3: Interest Income (Screener Sales for banks) ─────── */}
      {(selectedProperty === 'All' || selectedProperty === 'Interest Income') && (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Interest Income / Sales (₹ Cr)
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Screener.in “Sales” line for banks (interest earned). Not statutory deposit balances. Click headers to sort.
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
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto 12px' }}>
            {sectorFilter !== 'All'
              ? `No ${sectorFilter === 'PSU' ? 'PSU' : 'private'} banks match the current search. Try “All banks” or clear search.`
              : bankSearch.trim()
                ? `No lenders match “${bankSearch.trim()}”. Try another ticker (e.g. HDFC, SBIN).`
                : 'No lenders match the active filters.'}
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
