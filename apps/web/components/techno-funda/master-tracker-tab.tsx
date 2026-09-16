'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Calculator,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  ArrowUpDown,
  Award,
  LayoutGrid,
  List,
  ShieldCheck,
  Bookmark,
} from 'lucide-react';
import { WatchlistButton } from '../watchlist-button';
import { AureusScoreBadge } from './aureus-score-badge';
import { fmtInr, fmtNum } from '../../lib/format-number';
import { TfLoadingState } from './tf-loading-state';

export interface StockPulseData {
  quarterLabel: string;
  pulseRating: 'Good' | 'Neutral' | 'Weak' | 'Exceptional';
  cmp: number;
  marketCapText: string;
  peRatio: number;
  metrics: {
    sales: { qoq: number; yoy: number; cur: number; prev: number; prevYear: number };
    otherInc: { cur: number; prev: number; prevYear: number };
    op: { qoq: number; yoy: number; cur: number; prev: number; prevYear: number };
    opmBps: { qoq: number; yoy: number; cur: number; prev: number; prevYear: number };
    pat: { qoq: number; yoy: number; cur: number; prev: number; prevYear: number };
    eps: { qoq: number; yoy: number; cur: number; prev: number; prevYear: number };
  };
  labels: { cur: string; prev: string; prevYear: string };
}

export interface MasterStockItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  sector: string;
  marketCapCr: number;
  lastUpdated: string;
  isWatchlisted?: boolean;
  keyTriggers: string[];
  pulseData?: StockPulseData;
  quarterly: {
    q2fy26: { status: 'Beat' | 'Neutral' | 'Miss'; guidance?: string; actual?: string };
    q3fy26: { status: 'Beat' | 'Neutral' | 'Miss'; guidance?: string; actual?: string };
    q4fy26: { status: 'Beat' | 'Neutral' | 'Miss'; guidance?: string; actual?: string };
    q1fy27: { status: 'Beat' | 'Neutral' | 'Miss'; guidance?: string; actual?: string };
  };
  technicals: {
    above20Dma: boolean;
    above100Dma: boolean;
    week52High: number;
    week52Low: number;
    expectedEpsFy27: number;
  };
}

export const INITIAL_MASTER_STOCKS: MasterStockItem[] = [];

/** Map API company/quote payloads (cmp, dayChangePct) into MasterStockItem shape */
export function normalizeMasterStock(raw: any): MasterStockItem {
  const price = Number(raw?.price ?? raw?.cmp ?? 0);
  const changePct = Number(raw?.changePct ?? raw?.dayChangePct ?? 0);
  const week52High = Number(raw?.technicals?.week52High ?? raw?.week52High ?? 0);
  const week52Low = Number(raw?.technicals?.week52Low ?? raw?.week52Low ?? 0);
  const neutralQ = { status: 'Neutral' as const };
  const q = raw?.quarterly;
  return {
    id: String(raw?.id || raw?.symbol || '').toLowerCase() || 'unknown',
    symbol: String(raw?.symbol || '').toUpperCase(),
    name: String(raw?.name || raw?.companyName || raw?.symbol || '—'),
    price: Number.isFinite(price) ? price : 0,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    sector: String(raw?.sector || 'Equities'),
    marketCapCr: Number(raw?.marketCapCr ?? 0) || 0,
    lastUpdated: String(raw?.lastUpdated || new Date().toISOString()),
    isWatchlisted: Boolean(raw?.isWatchlisted),
    keyTriggers: Array.isArray(raw?.keyTriggers) ? raw.keyTriggers : [],
    pulseData: raw?.pulseData,
    quarterly: {
      q2fy26: q?.q2fy26 || neutralQ,
      q3fy26: q?.q3fy26 || neutralQ,
      q4fy26: q?.q4fy26 || neutralQ,
      q1fy27: q?.q1fy27 || neutralQ,
    },
    technicals: {
      above20Dma: Boolean(raw?.technicals?.above20Dma),
      above100Dma: Boolean(raw?.technicals?.above100Dma),
      week52High: Number.isFinite(week52High) ? week52High : 0,
      week52Low: Number.isFinite(week52Low) ? week52Low : 0,
      expectedEpsFy27: Number(raw?.technicals?.expectedEpsFy27 ?? raw?.expectedEpsFy27 ?? 0) || 0,
    },
  };
}

interface MasterTrackerTabProps {
  onSelectValuation?: (symbol: string) => void;
  onOpenPulse?: (stock: MasterStockItem) => void;
  liveStocks?: MasterStockItem[];
  isLoading?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function MasterTrackerTab({
  onSelectValuation,
  onOpenPulse,
  liveStocks,
  isLoading = false,
  lastUpdated: _lastUpdated,
  onRefresh,
}: MasterTrackerTabProps) {
  const [stocks, setStocks] = useState<MasterStockItem[]>(
    (liveStocks || []).map(normalizeMasterStock),
  );
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [signalFilter, setSignalFilter] = useState<'All' | 'gainers' | 'near52High' | 'watchlist'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedQuarterId, setExpandedQuarterId] = useState<string | null>(null);
  const [expandedTriggerId, setExpandedTriggerId] = useState<string | null>(null);

  // Sorting state
  type MasterSortCol = 'marketCap' | 'price' | 'changePct' | 'stock' | 'beats' | 'week52High' | 'eps';
  const [sortColumn, setSortColumn] = useState<MasterSortCol>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sync with live data from backend when available
  React.useEffect(() => {
    if (liveStocks) {
      setStocks(liveStocks.map(normalizeMasterStock));
    }
  }, [liveStocks]);

  // Prefer cards on small screens — table stays available when user switches
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => {
      if (mq.matches) setViewMode('cards');
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  React.useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.symbol) {
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol.toUpperCase() === e.detail.symbol.toUpperCase()
              ? { ...s, isWatchlisted: e.detail.isWatchlisted }
              : s
          )
        );
      }
    };
    window.addEventListener('ff_watchlist_changed', handleSync as EventListener);
    return () => window.removeEventListener('ff_watchlist_changed', handleSync as EventListener);
  }, []);

  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector));
    return ['All', ...Array.from(set)];
  }, [stocks]);

  // Sector counts mapping
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { All: stocks.length };
    stocks.forEach((s) => {
      counts[s.sector] = (counts[s.sector] || 0) + 1;
    });
    return counts;
  }, [stocks]);

  // Executive Summary Stats (Also act as 1-tap fast filters)
  const summaryStats = useMemo(() => {
    const total = stocks.length;
    const gainers = stocks.filter((s) => (s.changePct || 0) > 0);
    const near52High = stocks.filter((s) => {
      if (!s.technicals?.week52High || !s.price) return false;
      return s.price / s.technicals.week52High >= 0.88;
    });
    const avgChange =
      total > 0 ? stocks.reduce((acc, s) => acc + (s.changePct || 0), 0) / total : 0;
    const watchlistCount = stocks.filter((s) => s.isWatchlisted).length;

    return {
      total,
      gainersCount: gainers.length,
      near52HighCount: near52High.length,
      avgChange,
      watchlistCount,
    };
  }, [stocks]);

  const handleSort = (col: MasterSortCol) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'stock' ? 'asc' : 'desc');
    }
  };

  const renderSortIndicator = (col: MasterSortCol) => {
    if (sortColumn !== col) {
      return (
        <ArrowUpDown
          size={11}
          style={{ opacity: 0.35, marginLeft: '4px', verticalAlign: 'middle' }}
        />
      );
    }
    return (
      <span
        style={{
          marginLeft: '4px',
          color: '#0F766E',
          display: 'inline-flex',
          verticalAlign: 'middle',
        }}
      >
        {sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    );
  };

  // Filter logic
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matchSymbol = s.symbol.toLowerCase().includes(q);
        const matchName = s.name.toLowerCase().includes(q);
        const matchSector = s.sector.toLowerCase().includes(q);
        const matchTriggers = s.keyTriggers?.some((t) => t.toLowerCase().includes(q));
        if (!matchSymbol && !matchName && !matchSector && !matchTriggers) return false;
      }
      if (sectorFilter !== 'All' && s.sector !== sectorFilter) return false;

      if (signalFilter === 'gainers') {
        if (!(s.changePct > 0)) return false;
      } else if (signalFilter === 'near52High') {
        const high = s.technicals?.week52High || 0;
        if (!high || !s.price || s.price / high < 0.88) return false;
      } else if (signalFilter === 'watchlist') {
        if (!s.isWatchlisted) return false;
      }
      return true;
    });
  }, [stocks, search, sectorFilter, signalFilter]);

  // Sort logic
  const sortedFilteredStocks = useMemo(() => {
    const list = [...filteredStocks];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'stock':
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'changePct':
          cmp = a.changePct - b.changePct;
          break;
        case 'marketCap':
          cmp = (a.marketCapCr || 0) - (b.marketCapCr || 0);
          break;
        case 'beats': {
          const beatsA = Object.values(a.quarterly || {}).filter((q) => q?.status === 'Beat').length;
          const beatsB = Object.values(b.quarterly || {}).filter((q) => q?.status === 'Beat').length;
          cmp = beatsA - beatsB;
          break;
        }
        case 'week52High':
          cmp = (a.technicals?.week52High || 0) - (b.technicals?.week52High || 0);
          break;
        case 'eps':
          cmp = (a.technicals?.expectedEpsFy27 || 0) - (b.technicals?.expectedEpsFy27 || 0);
          break;
        default:
          cmp = 0;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredStocks, sortColumn, sortDirection]);

  const getStatusBadge = (status: 'Beat' | 'Neutral' | 'Miss') => {
    const isBeat = status === 'Beat';
    const isMiss = status === 'Miss';
    return (
      <span
        style={{
          background: isBeat ? '#ECFDF5' : isMiss ? '#FEF2F2' : '#FFFBEB',
          color: isBeat ? '#065F46' : isMiss ? '#991B1B' : '#92400E',
          border: `1px solid ${isBeat ? '#A7F3D0' : isMiss ? '#FECACA' : '#FDE68A'}`,
          width: '46px',
          minWidth: '46px',
          maxWidth: '46px',
          height: '22px',
          minHeight: '22px',
          maxHeight: '22px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          wordBreak: 'keep-all',
          overflowWrap: 'normal',
          hyphens: 'none',
          boxSizing: 'border-box',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {isBeat ? 'Beat' : isMiss ? 'Miss' : 'In-line'}
      </span>
    );
  };

  const formatMarketCap = (cr: number | null | undefined) => {
    if (cr == null || !Number.isFinite(cr) || cr <= 0) return '-';
    if (cr >= 100000) {
      return `₹${(cr / 100000).toFixed(2)}L Cr`;
    }
    return `${fmtInr(cr)} Cr`;
  };

  const quartersKeys: Array<{ key: 'q2fy26' | 'q3fy26' | 'q4fy26' | 'q1fy27'; label: string }> = [
    { key: 'q2fy26', label: 'Q2 FY26' },
    { key: 'q3fy26', label: 'Q3 FY26' },
    { key: 'q4fy26', label: 'Q4 FY26' },
    { key: 'q1fy27', label: 'Q1 FY27' },
  ];

  const hasActiveFilters =
    search !== '' || sectorFilter !== 'All' || signalFilter !== 'All';

  if (isLoading && stocks.length === 0) {
    return (
      <TfLoadingState
        title="Loading Master Tracker…"
        subtitle="Fetching live NSE quotes and technicals for the tracked universe."
        variant="cards"
        rows={6}
      />
    );
  }

  if (!isLoading && stocks.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
        <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Master Tracker Data Available</h3>
        <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '440px', margin: '0 auto 16px' }}>
          Backend exchange tracker feed is empty or currently unavailable.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '8px 18px',
              background: '#2563EB',
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
    <div className="mt-dash">
      {/* ── 1. Executive Summary & Quick-Sort Metric Cards ─────────────────── */}
      <div className="mt-kpi-grid">
        {/* Card 1: Total Universe */}
        <div
          onClick={() => {
            setSignalFilter('All');
            setSectorFilter('All');
          }}
          className="tf-kpi-card"
          style={{
            background: signalFilter === 'All' ? '#F0FDFA' : '#FFFFFF',
            border: signalFilter === 'All' ? '1.5px solid #0F766E' : '1px solid #E2E8F0',
            boxShadow: signalFilter === 'All' ? '0 1px 4px rgba(15, 118, 110, 0.12)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span className="tf-kpi-title">
              Tracked Companies
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
            <span className="tf-kpi-val" style={{ color: '#0F172A' }}>
              {summaryStats.total}
            </span>
            <span
              className="tf-kpi-subval"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: summaryStats.avgChange >= 0 ? '#16A34A' : '#DC2626',
              }}
            >
              Avg {summaryStats.avgChange >= 0 ? '+' : ''}
              {summaryStats.avgChange.toFixed(2)}%
              <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#E2E8F0', color: '#475569', padding: '1px 3px', borderRadius: '3px', letterSpacing: '0.02em' }}>1D</span>
            </span>
          </div>
          <p className="tf-kpi-desc tf-desktop-only">
            High-conviction growth compounders
          </p>
        </div>

        {/* Card 2: Day Gainers (live quote field — always available) */}
        <div
          onClick={() => setSignalFilter(signalFilter === 'gainers' ? 'All' : 'gainers')}
          className="tf-kpi-card"
          style={{
            background: signalFilter === 'gainers' ? '#ECFDF5' : '#FFFFFF',
            border: signalFilter === 'gainers' ? '1.5px solid #059669' : '1px solid #E2E8F0',
            boxShadow: signalFilter === 'gainers' ? '0 1px 4px rgba(5, 150, 105, 0.12)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span className="tf-kpi-title">
              Day Gainers
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Award size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
            <span className="tf-kpi-val" style={{ color: '#065F46' }}>
              {summaryStats.gainersCount}
            </span>
            <span className="tf-kpi-subval" style={{ color: '#059669', background: '#DCFCE7', padding: '1px 6px', borderRadius: '8px' }}>
              {summaryStats.total > 0 ? Math.round((summaryStats.gainersCount / summaryStats.total) * 100) : 0}% of list
            </span>
          </div>
          <p className="tf-kpi-desc tf-desktop-only">
            Positive day change from live quotes
          </p>
        </div>

        {/* Card 3: Near 52W High */}
        <div
          onClick={() => setSignalFilter(signalFilter === 'near52High' ? 'All' : 'near52High')}
          className="tf-kpi-card"
          style={{
            background: signalFilter === 'near52High' ? '#EFF6FF' : '#FFFFFF',
            border: signalFilter === 'near52High' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            boxShadow: signalFilter === 'near52High' ? '0 1px 4px rgba(37, 99, 235, 0.12)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span className="tf-kpi-title">
              Near 52W High
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Target size={14} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
            <span className="tf-kpi-val" style={{ color: '#1E40AF' }}>
              {summaryStats.near52HighCount}
            </span>
            <span className="tf-kpi-subval" style={{ color: '#2563EB', background: '#DBEAFE', padding: '1px 6px', borderRadius: '8px' }}>
              Breakout Zone
            </span>
          </div>
          <p className="tf-kpi-desc tf-desktop-only">
            Within 12% of 52-week peak
          </p>
        </div>
      </div>

      {/* ── 2. Smart Fast-Finder Toolbar ──────────────────────────────────── */}
      <div className="mt-toolbar">
        {/* Top Controls Row */}
        <div className="mt-toolbar-top">
          {/* Always Visible Search Bar */}
          <div className="mt-search">
            <Search size={15} className="mt-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock, company, or sector…"
              aria-label="Search Master Tracker"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: '#94A3B8',
                }}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right Controls: Sort + View Mode Switcher */}
          <div className="mt-toolbar-controls">
            {/* Sort Selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: '1 1 auto' }}>
              <span className="mt-pill-label">Sort</span>
              <select
                value={sortColumn}
                onChange={(e) => handleSort(e.target.value as MasterSortCol)}
                style={{
                  height: '36px',
                  flex: 1,
                  minWidth: 0,
                  padding: '0 28px 0 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12.5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="marketCap">Market Cap</option>
                <option value="price">Stock Price</option>
                <option value="changePct">1-Day Change</option>
                <option value="week52High">52W High</option>
                <option value="eps">FY27 (E) EPS</option>
                <option value="stock">Symbol (A-Z)</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                title={`Order: ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F766E',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                <ArrowUpDown size={13} />
                <span>{sortDirection === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>

            {/* View Mode Switcher — available on mobile too */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', height: '36px', padding: '3px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="tf-desktop-only"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#0F766E' : '#64748B',
                  fontSize: '12.5px',
                  fontWeight: 650,
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <List size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'cards' ? '#0F766E' : '#64748B',
                  fontSize: '12.5px',
                  fontWeight: 650,
                  boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSectorFilter('All');
                  setSignalFilter('All');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '12.5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scrolling Sector Pills */}
        <div className="mt-pill-row">
          <span className="mt-pill-label">Sector</span>
          {sectors.map((sec) => {
            const isSelected = sectorFilter === sec;
            const count = sectorCounts[sec] || 0;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '28px',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #0F766E' : '1px solid #E2E8F0',
                  background: isSelected ? '#0F766E' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{sec}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Signal Quick Filter Chips */}
        <div className="mt-pill-row">
          <span className="mt-pill-label">Signal</span>
          {[
            { id: 'All', label: 'All' },
            { id: 'gainers', label: 'Gainers' },
            { id: 'near52High', label: 'Near 52W' },
            { id: 'watchlist', label: `Watchlist (${summaryStats.watchlistCount})` },
          ].map((sig) => {
            const isSelected = signalFilter === sig.id;
            return (
              <button
                key={sig.id}
                type="button"
                onClick={() => setSignalFilter(sig.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '28px',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: isSelected ? '#F0FDFA' : '#FFFFFF',
                  color: isSelected ? '#0F766E' : '#475569',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {sig.id === 'watchlist' && <Bookmark size={11} />}
                <span>{sig.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Mobile Cards View (< 768px always, or Cards View on Desktop) ── */}
      {(viewMode === 'cards' || true) && (
        <div className={viewMode === 'table' ? 'tf-mobile-only' : ''}>
          {/* Quick Mobile Sort Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              marginBottom: '10px',
              fontSize: '11.5px',
            }}
          >
            <span style={{ fontWeight: 600, color: '#475569' }}>
              Showing {sortedFilteredStocks.length} of {stocks.length} Stocks:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={sortColumn}
                onChange={(e) => handleSort(e.target.value as MasterSortCol)}
                style={{
                  height: '32px',
                  padding: '0 26px 0 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '11.5px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="marketCap">Market Cap</option>
                <option value="price">Price</option>
                <option value="changePct">Day Change</option>
                <option value="week52High">52W High</option>
                <option value="eps">FY27 EPS</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                style={{
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '11px',
                  fontWeight: 650,
                  color: '#0F766E',
                  cursor: 'pointer',
                }}
              >
                <ArrowUpDown size={12} />
                <span>{sortDirection === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                viewMode === 'cards'
                  ? 'repeat(auto-fill, minmax(320px, 1fr))'
                  : '1fr',
              gap: '8px',
            }}
          >
            {sortedFilteredStocks.map((stock) => {
              const isPos = stock.changePct >= 0;
              const isQuarterExpanded = expandedQuarterId === stock.id;
              const isTriggerExpanded = expandedTriggerId === stock.id;
              const beatsCount = Object.values(stock.quarterly || {}).filter(
                (q) => q?.status === 'Beat'
              ).length;

              // 52W range calculation
              const low = stock.technicals?.week52Low || 1;
              const high = stock.technicals?.week52High || 1;
              const rangeSpan = Math.max(1, high - low);
              const pctFromLow = Math.min(
                100,
                Math.max(0, ((stock.price - low) / rangeSpan) * 100)
              );

              return (
                <div
                  key={stock.id}
                  className="card"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(15,118,110,0.10)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* ─── TOP ACCENT BAR with beat colour ─────────── */}
                  <div style={{
                    height: '3px',
                    background: beatsCount >= 3
                      ? 'linear-gradient(90deg, #059669, #10B981)'
                      : beatsCount >= 2
                        ? 'linear-gradient(90deg, #2563EB, #60A5FA)'
                        : 'linear-gradient(90deg, #94A3B8, #CBD5E1)',
                  }} />

                  {/* ─── CARD BODY ────────────────────────────────── */}
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    {/* ── ROW 1: Identity + Price ─────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                      {/* Left: Symbol, Sector, Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '2px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                            {stock.symbol}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 650,
                            padding: '1px 6px',
                            borderRadius: '12px',
                            background: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            whiteSpace: 'nowrap',
                          }}>
                            {stock.sector}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, lineHeight: 1.25 }}>
                          {stock.name}
                        </div>
                      </div>

                      {/* Right: Price block */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          ₹{fmtNum(stock.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '2px' }}>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 750,
                            color: isPos ? '#16A34A' : '#DC2626',
                            background: isPos ? '#DCFCE7' : '#FEE2E2',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}>
                            {isPos ? '+' : ''}{fmtNum(stock.changePct, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </span>
                          <span style={{
                            fontSize: '9.5px', fontWeight: 750, background: '#F1F5F9',
                            color: '#64748B', padding: '1px 4px', borderRadius: '3px',
                          }}>1D</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '1px' }}>
                          Cap: <strong style={{ color: '#475569' }}>{formatMarketCap(stock.marketCapCr)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* ── ROW 2: Watchlist + Actions ──────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <WatchlistButton
                        symbol={stock.symbol}
                        companyName={stock.name}
                        initialWatchlisted={stock.isWatchlisted}
                      />
                      <AureusScoreBadge
                        scoreResult={(stock as any).aureusScore}
                        inputs={(stock as any).fundamentals ? { symbol: stock.symbol, companyName: stock.name, ...(stock as any).fundamentals } : undefined}
                        size="sm"
                      />

                      <div style={{ flex: 1 }} />

                      {onSelectValuation && (
                        <button
                          type="button"
                          onClick={() => onSelectValuation(stock.symbol)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700,
                            border: '1px solid #CCFBF1', background: '#F0FDFA', color: '#0F766E', cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          <Calculator size={12} />
                          <span>DCF Lab</span>
                        </button>
                      )}
                      {onOpenPulse && (
                        <button
                          type="button"
                          onClick={() => onOpenPulse(stock)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700,
                            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1E40AF', cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          <Activity size={12} />
                          <span>Pulse</span>
                        </button>
                      )}
                    </div>

                    {/* ── DIVIDER ─────────────────────────────────── */}
                    <div style={{ height: '1px', background: '#F1F5F9' }} />

                    {/* ── ROW 3: Key Growth Catalyst ──────────────── */}
                    <div style={{ padding: '6px 9px', background: '#F0FDFA', borderRadius: '6px', border: '1px solid #CCFBF1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Target size={11} color="#0F766E" />
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Key Growth Trigger
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#0F172A', lineHeight: 1.35, margin: 0, fontWeight: 500 }}>
                        {stock.keyTriggers?.[0] || 'Executing long-term corporate growth milestones.'}
                      </p>
                      {stock.keyTriggers && stock.keyTriggers.length > 1 && (
                        <div style={{ marginTop: '3px' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedTriggerId(isTriggerExpanded ? null : stock.id)}
                            style={{
                              background: 'none', border: 'none', color: '#0F766E',
                              fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', gap: '2px',
                            }}
                          >
                            {isTriggerExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            <span>{isTriggerExpanded ? 'Hide catalysts' : `+${stock.keyTriggers.length - 1} more catalysts`}</span>
                          </button>
                          {isTriggerExpanded && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: '14px', fontSize: '11.5px', color: '#334155', lineHeight: 1.35 }}>
                              {stock.keyTriggers.slice(1).map((t, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>{t}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── ROW 4: Quarterly Scorecard ──────────────── */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>Quarterly Scorecard</span>
                        <span style={{
                          fontSize: '11.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                          background: beatsCount >= 3 ? '#ECFDF5' : beatsCount >= 2 ? '#EFF6FF' : '#FEF3C7',
                          color: beatsCount >= 3 ? '#065F46' : beatsCount >= 2 ? '#1E40AF' : '#92400E',
                          border: `1px solid ${beatsCount >= 3 ? '#A7F3D0' : beatsCount >= 2 ? '#BFDBFE' : '#FDE68A'}`,
                        }}>
                          {beatsCount}/4 Beats
                        </span>
                      </div>

                      {/* Quarter Pills — compact horizontal strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                        {quartersKeys.map(({ key, label }) => {
                          const q = stock.quarterly?.[key];
                          const s = q?.status || 'Neutral';
                          const isBeat = s === 'Beat';
                          const isMiss = s === 'Miss';
                          return (
                            <div
                              key={key}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                padding: '4px 2px',
                                minHeight: '38px',
                                borderRadius: '6px',
                                background: isBeat ? '#ECFDF5' : isMiss ? '#FEF2F2' : '#F8FAFC',
                                border: `1px solid ${isBeat ? '#A7F3D0' : isMiss ? '#FECACA' : '#E2E8F0'}`,
                                boxSizing: 'border-box',
                              }}
                            >
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                {label.replace(' FY', '').replace('Q', 'Q').replace('27', "'27").replace('26', "'26")}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: isBeat ? '#059669' : isMiss ? '#DC2626' : '#64748B',
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all',
                                hyphens: 'none',
                                lineHeight: 1,
                              }}>
                                {isBeat ? 'Beat' : isMiss ? 'Miss' : 'In-line'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expandable guidance drawer */}
                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedQuarterId(isQuarterExpanded ? null : stock.id)}
                          style={{
                            background: 'none', border: 'none', fontSize: '12.5px',
                            color: '#2563EB', fontWeight: 650, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px',
                          }}
                        >
                          {isQuarterExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>{isQuarterExpanded ? 'Hide guidance & results' : 'Guidance vs Actuals'}</span>
                        </button>
                        {isQuarterExpanded && (
                          <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr', gap: '6px', textAlign: 'left' }}>
                            {quartersKeys.map(({ key, label }) => {
                              const q = stock.quarterly?.[key];
                              const s = q?.status || 'Neutral';
                              const isBeat = s === 'Beat'; const isMiss = s === 'Miss';
                              return (
                                <div key={key} style={{
                                  padding: '9px 12px', borderRadius: '7px', fontSize: '13px',
                                  background: isBeat ? '#ECFDF5' : isMiss ? '#FEF2F2' : '#F8FAFC',
                                  border: `1px solid ${isBeat ? '#A7F3D0' : isMiss ? '#FECACA' : '#E2E8F0'}`,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <strong style={{ color: '#0F172A', fontSize: '13px' }}>{label}</strong>
                                    <span style={{
                                      fontSize: '11.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
                                      background: isBeat ? '#059669' : isMiss ? '#DC2626' : '#64748B', color: '#fff',
                                    }}>{s}</span>
                                  </div>
                                  {q?.guidance && (
                                    <div style={{ color: '#475569', marginBottom: '3px', lineHeight: 1.4, fontSize: '12.5px' }}>
                                      <span style={{ color: '#2563EB', fontWeight: 700 }}>Target: </span>{q.guidance}
                                    </div>
                                  )}
                                  {q?.actual && (
                                    <div style={{ color: '#1E293B', lineHeight: 1.4, fontSize: '12.5px' }}>
                                      <span style={{ color: '#059669', fontWeight: 700 }}>Result: </span>{q.actual}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── ROW 5: Technicals Row ───────────────────── */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      {/* DMA badges */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '0 8px',
                        height: '24px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: stock.technicals?.above20Dma ? '#DCFCE7' : '#FEE2E2',
                        color: stock.technicals?.above20Dma ? '#15803D' : '#B91C1C',
                        border: `1px solid ${stock.technicals?.above20Dma ? '#86EFAC' : '#FECACA'}`,
                        whiteSpace: 'nowrap',
                        wordBreak: 'keep-all',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        lineHeight: 1,
                      }}>
                        {stock.technicals?.above20Dma ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}
                        <span>20 DMA</span>
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '0 8px',
                        height: '24px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: stock.technicals?.above100Dma ? '#CCFBF1' : '#FEE2E2',
                        color: stock.technicals?.above100Dma ? '#0F766E' : '#B91C1C',
                        border: `1px solid ${stock.technicals?.above100Dma ? '#5EEAD4' : '#FECACA'}`,
                        whiteSpace: 'nowrap',
                        wordBreak: 'keep-all',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        lineHeight: 1,
                      }}>
                        {stock.technicals?.above100Dma ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}
                        <span>100 DMA</span>
                      </span>
                      <span style={{ flex: 1 }} />
                      {stock.technicals?.expectedEpsFy27 && (
                        <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                          FY27 EPS: <strong style={{ color: '#0F766E', fontSize: '14px' }}>₹{stock.technicals.expectedEpsFy27}</strong>
                        </span>
                      )}
                    </div>

                    {/* ── ROW 6: 52W Range Bar ────────────────────── */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94A3B8', marginBottom: '5px' }}>
                        <span>52W Low: <strong style={{ color: '#64748B' }}>{fmtInr(low)}</strong></span>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>
                          {fmtNum(pctFromLow, { maximumFractionDigits: 0 })}% from Low
                        </span>
                        <span>52W High: <strong style={{ color: '#64748B' }}>{fmtInr(high)}</strong></span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: '#F1F5F9', borderRadius: '4px', position: 'relative' }}>
                        <div style={{
                          width: `${pctFromLow}%`, height: '100%',
                          background: pctFromLow >= 88
                            ? 'linear-gradient(90deg, #10B981, #059669)'
                            : 'linear-gradient(90deg, #0F766E, #10B981)',
                          borderRadius: '4px', transition: 'width 0.4s ease',
                        }} />
                        {/* Marker dot */}
                        <div style={{
                          position: 'absolute', top: '-3px',
                          left: `calc(${pctFromLow}% - 6px)`,
                          width: '13px', height: '13px', borderRadius: '50%',
                          background: '#0F766E', border: '2px solid #FFFFFF',
                          boxShadow: '0 1px 3px rgba(15,118,110,0.3)',
                        }} />
                      </div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '5px', textAlign: 'right' }}>
                        Last sync: {stock.lastUpdated || 'Real-time'}
                      </div>
                    </div>

                  </div>{/* end card body */}
                </div>
              );
            })}

            {sortedFilteredStocks.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: '#94A3B8',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px dashed #D1D5DB',
                }}
              >
                No companies found matching the search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Balanced Streamlined Table View (Desktop & Laptop) ─────────── */}
      {viewMode === 'table' && (
        <div className="tf-table-container tf-desktop-only" style={{ marginBottom: '14px' }}>
          <div style={{ margin: 0 }}>
            <table className="tf-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th
                    className="tf-sortable-th"
                    onClick={() => handleSort('stock')}
                    style={{ width: '220px', padding: '8px 14px', textAlign: 'left', color: sortColumn === 'stock' ? '#0F766E' : '#475569' }}
                  >
                    Company &amp; Sector
                    {renderSortIndicator('stock')}
                  </th>
                  <th
                    className="tf-sortable-th"
                    onClick={() => handleSort('price')}
                    style={{ width: '150px', padding: '8px 12px', textAlign: 'left', color: sortColumn === 'price' || sortColumn === 'changePct' ? '#0F766E' : '#475569' }}
                  >
                    Price &amp; Change
                    {renderSortIndicator('price')}
                  </th>
                  <th
                    className="tf-sortable-th"
                    onClick={() => handleSort('beats')}
                    style={{ width: '230px', minWidth: '220px', padding: '8px 12px', textAlign: 'center', color: sortColumn === 'beats' ? '#0F766E' : '#475569' }}
                  >
                    Quarterly Scorecard
                    {renderSortIndicator('beats')}
                  </th>
                  <th style={{ minWidth: '240px', padding: '8px 12px', textAlign: 'left' }}>
                    Primary Growth Catalyst
                  </th>
                  <th
                    className="tf-sortable-th"
                    onClick={() => handleSort('week52High')}
                    style={{ width: '190px', minWidth: '185px', padding: '8px 12px', textAlign: 'left', color: sortColumn === 'week52High' ? '#0F766E' : '#475569' }}
                  >
                    Technicals &amp; Range
                    {renderSortIndicator('week52High')}
                  </th>
                  <th
                    className="tf-sortable-th"
                    onClick={() => handleSort('eps')}
                    style={{ width: '120px', padding: '8px 14px', textAlign: 'right', color: sortColumn === 'eps' ? '#0F766E' : '#475569' }}
                  >
                    FY27 EPS
                    {renderSortIndicator('eps')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredStocks.map((stock) => {
                  const isPos = stock.changePct >= 0;
                  const isQuarterExpanded = expandedQuarterId === stock.id;
                  const isTriggerExpanded = expandedTriggerId === stock.id;
                  const beatsCount = Object.values(stock.quarterly || {}).filter(
                    (q) => q?.status === 'Beat'
                  ).length;

                  // 52W range calculation
                  const low = stock.technicals?.week52Low || 1;
                  const high = stock.technicals?.week52High || 1;
                  const rangeSpan = Math.max(1, high - low);
                  const pctFromLow = Math.min(
                    100,
                    Math.max(0, ((stock.price - low) / rangeSpan) * 100)
                  );

                  return (
                    <React.Fragment key={stock.id}>
                      <tr style={{ borderBottom: isQuarterExpanded ? 'none' : '1px solid #F1F5F9' }}>
                        {/* 1. Company & Sector */}
                        <td style={{ verticalAlign: 'top', padding: '8px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                            <WatchlistButton
                              symbol={stock.symbol}
                              companyName={stock.name}
                              variant="icon"
                              size="sm"
                              initialWatchlisted={stock.isWatchlisted}
                            />
                            <strong style={{ color: '#0F172A', fontSize: '14.5px' }}>{stock.symbol}</strong>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#475569',
                                background: '#F1F5F9',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {stock.sector}
                            </span>
                            <AureusScoreBadge
                              scoreResult={(stock as any).aureusScore}
                              inputs={(stock as any).fundamentals ? { symbol: stock.symbol, companyName: stock.name, ...(stock as any).fundamentals } : undefined}
                              size="sm"
                            />
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '4px', lineHeight: 1.3, fontWeight: 500 }}>
                            {stock.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {onSelectValuation && (
                              <button
                                type="button"
                                onClick={() => onSelectValuation(stock.symbol)}
                                title="Calculate Fair Value in DCF Lab"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: '#F0FDFA',
                                  border: '1px solid #CCFBF1',
                                  color: '#0F766E',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Calculator size={11} />
                                <span>Val</span>
                              </button>
                            )}
                            {onOpenPulse && (
                              <button
                                type="button"
                                onClick={() => onOpenPulse(stock)}
                                title="Inspect Earnings Pulse"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#1E40AF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Activity size={11} />
                                <span>Pulse</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 2. Price & Market Cap */}
                        <td style={{ verticalAlign: 'top', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                              ₹{fmtNum(stock.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: isPos ? '#16A34A' : '#DC2626',
                                background: isPos ? '#DCFCE7' : '#FEE2E2',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              {isPos ? '+' : ''}
                              {fmtNum(stock.changePct, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: '#E2E8F0',
                                color: '#475569',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                letterSpacing: '0.02em',
                              }}
                              title="1-Day price change (intraday)"
                            >
                              1D
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', fontWeight: 500 }}>
                            Mkt Cap: <strong style={{ color: '#334155' }}>{formatMarketCap(stock.marketCapCr)}</strong>
                          </div>
                        </td>

                        {/* 3. 4-Quarter Scorecard */}
                        <td style={{ verticalAlign: 'top', padding: '8px 12px', textAlign: 'center', width: '230px', minWidth: '220px' }}>
                          {/* 4 Mini Period Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'nowrap' }}>
                            {quartersKeys.map(({ key, label }) => {
                              const q = stock.quarterly?.[key];
                              return (
                                <div key={key} title={`${label}: ${q?.status || 'Neutral'}`} style={{ flexShrink: 0 }}>
                                  {getStatusBadge(q?.status || 'Neutral')}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: beatsCount >= 2 ? '#065F46' : '#92400E', whiteSpace: 'nowrap' }}>
                              {beatsCount}/4 Beats
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedQuarterId(isQuarterExpanded ? null : stock.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2563EB',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span>{isQuarterExpanded ? 'Hide' : 'Details'}</span>
                              {isQuarterExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                        </td>

                        {/* 4. Primary Growth Catalyst */}
                        <td style={{ verticalAlign: 'top', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Target size={12} color="#0F766E" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Key Catalyst
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.4, fontWeight: 500 }}>
                            {stock.keyTriggers?.[0] || 'High operational earnings growth.'}
                          </div>
                          {stock.keyTriggers && stock.keyTriggers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setExpandedTriggerId(isTriggerExpanded ? null : stock.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0F766E',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <span>{isTriggerExpanded ? 'Hide' : `+${stock.keyTriggers.length - 1} more catalysts`}</span>
                              {isTriggerExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          )}
                          {isTriggerExpanded && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: '14px', fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                              {stock.keyTriggers.slice(1).map((t, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>

                        {/* 5. Technicals & 52-Week Range */}
                        <td style={{ verticalAlign: 'top', padding: '8px 12px', width: '190px', minWidth: '185px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'nowrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                padding: '0 8px',
                                height: '22px',
                                minHeight: '22px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all',
                                flexShrink: 0,
                                boxSizing: 'border-box',
                                background: stock.technicals?.above20Dma ? '#DCFCE7' : '#FEE2E2',
                                color: stock.technicals?.above20Dma ? '#15803D' : '#B91C1C',
                                border: `1px solid ${stock.technicals?.above20Dma ? '#86EFAC' : '#FECACA'}`,
                                lineHeight: 1,
                              }}
                            >
                              {stock.technicals?.above20Dma ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
                              <span>20 DMA</span>
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                padding: '0 8px',
                                height: '22px',
                                minHeight: '22px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all',
                                flexShrink: 0,
                                boxSizing: 'border-box',
                                background: stock.technicals?.above100Dma ? '#CCFBF1' : '#FEE2E2',
                                color: stock.technicals?.above100Dma ? '#0F766E' : '#B91C1C',
                                border: `1px solid ${stock.technicals?.above100Dma ? '#5EEAD4' : '#FECACA'}`,
                                lineHeight: 1,
                              }}
                            >
                              {stock.technicals?.above100Dma ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
                              <span>100 DMA</span>
                            </span>
                          </div>

                          {/* 52W Range Progress Bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '2px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              <span>₹{low}</span>
                              <span style={{ fontWeight: 700, color: '#334155' }}>52W Range</span>
                              <span>₹{high}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pctFromLow}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #0F766E, #10B981)',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 6. FY27 EPS */}
                        <td style={{ verticalAlign: 'top', padding: '8px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F766E', display: 'block' }}>
                            {stock.technicals?.expectedEpsFy27 ? `₹${stock.technicals.expectedEpsFy27}` : '-'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                            Expected
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Guidance vs Actuals Table Row */}
                      {isQuarterExpanded && (
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td colSpan={6} style={{ padding: '8px 14px' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                              {stock.symbol} Quarterly Guidance Target vs Actuals:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                              {quartersKeys.map(({ key, label }) => {
                                const q = stock.quarterly?.[key];
                                return (
                                  <div
                                    key={key}
                                    style={{
                                      padding: '8px 10px',
                                      background: '#FFFFFF',
                                      borderRadius: '6px',
                                      border: '1px solid #CBD5E1',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>{label}</strong>
                                      {getStatusBadge(q?.status || 'Neutral')}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '2px', lineHeight: 1.3 }}>
                                      <span style={{ color: '#2563EB', fontWeight: 700 }}>Target:</span> {q?.guidance || '-'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.3 }}>
                                      <span style={{ color: '#16A34A', fontWeight: 700 }}>Result:</span> {q?.actual || '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {sortedFilteredStocks.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No companies found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
