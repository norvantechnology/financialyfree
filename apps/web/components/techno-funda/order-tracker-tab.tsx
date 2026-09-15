'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Briefcase,
  Building2,
  Calendar,
  RotateCcw,
  X,
} from 'lucide-react';
import { TfLoadingState } from './tf-loading-state';

export interface SingleOrder {
  id: string;
  companyName: string;
  symbol: string;
  customer: string;
  orderType: 'Purchase Order' | 'Contract' | 'Work Order' | 'MoU' | 'Long-term supply' | string;
  date: string;
  contractValueCr: number;
  contractValueFormatted: string;
  durationMonths?: number;
  durationText: string;
  annualValueCr: number;
  annualValueFormatted: string;
  orderSizePct: number;
  companyRevenueCr: number;
  companyRevenueFormatted: string;
  pdfUrl: string;
}

export interface ConsolidatedCompanyOrders {
  companyName: string;
  symbol: string;
  totalOrderValueCr: number;
  totalOrderValueFormatted: string;
  orderCount: number;
  ordersAsRevenuePct: number;
  companyRevenueCr: number;
  companyRevenueFormatted: string;
  orders: SingleOrder[];
}

export const INITIAL_ORDERS: SingleOrder[] = [];

interface OrderTrackerTabProps {
  liveOrders?: SingleOrder[];
  liveConsolidated?: ConsolidatedCompanyOrders[];
  isLoading?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function OrderTrackerTab({
  liveOrders,
  liveConsolidated,
  isLoading = false,
  lastUpdated: _lastUpdated,
  onRefresh,
}: OrderTrackerTabProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'company'>('company');
  const [orders, setOrders] = useState<SingleOrder[]>(liveOrders || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'6 months' | '1 year' | '2 years' | 'All'>('6 months');
  const [minRevPct, setMinRevPct] = useState('0');
  const [minRevenueCr, setMinRevenueCr] = useState('0');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({
    'Larsen & Toubro Ltd': true,
    'Supreme Power Equipment Ltd': true,
  });

  // Filters for 'All Orders' view
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All');
  const [minOrderSizeFilter, setMinOrderSizeFilter] = useState('');

  // Helper to dynamically filter orders by timeframe against reference anchor
  const isOrderWithinTimeframe = (orderDateStr: string, tf: string): boolean => {
    if (!orderDateStr || tf === 'All') return true;
    const orderTime = new Date(orderDateStr).getTime();
    if (isNaN(orderTime)) return true;

    // Use current time or reference baseline date 2026-09-09
    const refTime = Math.max(Date.now(), new Date('2026-09-09T00:00:00Z').getTime());
    const diffDays = (refTime - orderTime) / (1000 * 60 * 60 * 24);

    if (tf === '6 months') {
      return diffDays <= 185;
    }
    if (tf === '1 year') {
      return diffDays <= 370;
    }
    if (tf === '2 years') {
      return diffDays <= 740;
    }
    return true;
  };

  // Sorting state for Consolidated View
  type ConsSortCol = 'company' | 'ordersAsRevenuePct' | 'orderCount' | 'totalOrderValue' | 'companyRevenue';
  const [consSortCol, setConsSortCol] = useState<ConsSortCol>('ordersAsRevenuePct');
  const [consSortDir, setConsSortDir] = useState<'asc' | 'desc'>('desc');

  const handleConsSort = (col: ConsSortCol) => {
    if (consSortCol === col) {
      setConsSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setConsSortCol(col);
      setConsSortDir(col === 'company' ? 'asc' : 'desc');
    }
  };

  const renderConsSortIndicator = (col: ConsSortCol) => {
    if (consSortCol !== col) {
      return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    return (
      <span style={{ marginLeft: '4px', color: '#0F766E', display: 'inline-flex', verticalAlign: 'middle' }}>
        {consSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    );
  };

  // Sorting state for All Orders View
  type AllOrdersSortCol = 'company' | 'customer' | 'orderType' | 'date' | 'contractValue' | 'duration' | 'annualValue' | 'orderSizePct' | 'companyRevenue';
  const [allSortCol, setAllSortCol] = useState<AllOrdersSortCol>('date');
  const [allSortDir, setAllSortDir] = useState<'asc' | 'desc'>('desc');

  const handleAllSort = (col: AllOrdersSortCol) => {
    if (allSortCol === col) {
      setAllSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setAllSortCol(col);
      setAllSortDir(col === 'company' || col === 'customer' || col === 'orderType' ? 'asc' : 'desc');
    }
  };

  const renderAllSortIndicator = (col: AllOrdersSortCol) => {
    if (allSortCol !== col) {
      return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    return (
      <span style={{ marginLeft: '4px', color: '#0F766E', display: 'inline-flex', verticalAlign: 'middle' }}>
        {allSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    );
  };

  // Sync live orders from backend
  React.useEffect(() => {
    if (liveOrders) {
      setOrders(liveOrders);
    }
  }, [liveOrders]);

  const toggleCompanyAccordion = (company: string) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [company]: !prev[company],
    }));
  };

  // Group orders by company for Consolidated Company View with dynamic timeframe re-aggregation
  const consolidatedList: ConsolidatedCompanyOrders[] = useMemo(() => {
    let sourceList: ConsolidatedCompanyOrders[] = [];

    if (liveConsolidated && liveConsolidated.length > 0) {
      sourceList = liveConsolidated.map((item) => {
        // Collect orders for this company, checking item.orders or matching from orders
        const companyOrders = (item.orders && item.orders.length > 0)
          ? item.orders
          : orders.filter((o) => o.symbol === item.symbol || o.companyName === item.companyName);

        const matchingOrders = companyOrders.filter(
          (o) => o.companyName !== 'COMPANY' && o.symbol !== 'COMPANY' && isOrderWithinTimeframe(o.date, timeframe)
        );

        const totalOrderValueCr = matchingOrders.reduce((sum, o) => sum + (o.contractValueCr || 0), 0);
        const rev = item.companyRevenueCr || 1;
        const pct = (totalOrderValueCr / rev) * 100;

        return {
          ...item,
          totalOrderValueCr: Math.round(totalOrderValueCr * 10) / 10,
          totalOrderValueFormatted: `₹${Math.round(totalOrderValueCr).toLocaleString('en-IN')} Cr`,
          orderCount: matchingOrders.length,
          ordersAsRevenuePct: parseFloat(pct.toFixed(2)),
          orders: matchingOrders,
        };
      });
    } else {
      const map: Record<string, ConsolidatedCompanyOrders> = {};

      orders.forEach((ord) => {
        if (ord.companyName === 'COMPANY' || ord.symbol === 'COMPANY') return;
        if (!map[ord.companyName]) {
          map[ord.companyName] = {
            companyName: ord.companyName,
            symbol: ord.symbol,
            totalOrderValueCr: 0,
            totalOrderValueFormatted: '',
            orderCount: 0,
            ordersAsRevenuePct: 0,
            companyRevenueCr: ord.companyRevenueCr || 1,
            companyRevenueFormatted: ord.companyRevenueFormatted || `₹${ord.companyRevenueCr} Cr`,
            orders: [],
          };
        }
        if (isOrderWithinTimeframe(ord.date, timeframe)) {
          map[ord.companyName].orders.push(ord);
          map[ord.companyName].totalOrderValueCr += ord.contractValueCr;
          map[ord.companyName].orderCount += 1;
        }
      });

      sourceList = Object.values(map).map((item) => {
        const rev = item.companyRevenueCr || 1;
        const pct = (item.totalOrderValueCr / rev) * 100;
        return {
          ...item,
          totalOrderValueCr: Math.round(item.totalOrderValueCr * 10) / 10,
          totalOrderValueFormatted: `₹${Math.round(item.totalOrderValueCr).toLocaleString('en-IN')} Cr`,
          ordersAsRevenuePct: parseFloat(pct.toFixed(2)),
        };
      });
    }

    const q = searchQuery.trim().toLowerCase();
    const parsedMinRevPct = parseFloat(minRevPct);
    const parsedMinRevenueCr = parseFloat(minRevenueCr);

    const filtered = sourceList.filter((item) => {
      // Never display placeholder/dummy company rows
      if (item.companyName === 'COMPANY' || item.symbol === 'COMPANY') return false;

      // When a timeframe is selected, hide companies that have 0 order wins in that timeframe
      if (item.orderCount === 0) return false;

      if (q && !item.companyName.toLowerCase().includes(q) && !item.symbol.toLowerCase().includes(q)) {
        return false;
      }
      if (!isNaN(parsedMinRevPct) && parsedMinRevPct > 0 && item.ordersAsRevenuePct < parsedMinRevPct) {
        return false;
      }
      if (!isNaN(parsedMinRevenueCr) && parsedMinRevenueCr > 0 && item.companyRevenueCr < parsedMinRevenueCr) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (consSortCol) {
        case 'company':
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case 'ordersAsRevenuePct':
          cmp = a.ordersAsRevenuePct - b.ordersAsRevenuePct;
          break;
        case 'orderCount':
          cmp = a.orderCount - b.orderCount;
          break;
        case 'totalOrderValue':
          cmp = a.totalOrderValueCr - b.totalOrderValueCr;
          break;
        case 'companyRevenue':
          cmp = (a.companyRevenueCr || 0) - (b.companyRevenueCr || 0);
          break;
      }
      return consSortDir === 'asc' ? cmp : -cmp;
    });
  }, [orders, liveConsolidated, searchQuery, timeframe, minRevPct, minRevenueCr, consSortCol, consSortDir]);

  // Filtered list for 'All Orders' view with dynamic timeframe and search filtering
  const filteredAllOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const parsedMinSize = parseFloat(minOrderSizeFilter);

    return orders.filter((ord) => {
      if (ord.companyName === 'COMPANY' || ord.symbol === 'COMPANY') return false;
      if (!isOrderWithinTimeframe(ord.date, timeframe)) return false;
      if (selectedCompanyFilter !== 'All' && ord.companyName !== selectedCompanyFilter) return false;
      if (selectedCustomerFilter !== 'All' && ord.customer !== selectedCustomerFilter) return false;
      if (!isNaN(parsedMinSize) && parsedMinSize > 0 && ord.orderSizePct < parsedMinSize) return false;
      if (q) {
        const matchesQuery =
          ord.companyName.toLowerCase().includes(q) ||
          ord.symbol.toLowerCase().includes(q) ||
          ord.customer.toLowerCase().includes(q) ||
          ord.orderType.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [orders, timeframe, selectedCompanyFilter, selectedCustomerFilter, minOrderSizeFilter, searchQuery]);

  const sortedAllOrders = useMemo(() => {
    const list = [...filteredAllOrders];
    list.sort((a, b) => {
      let cmp = 0;
      switch (allSortCol) {
        case 'company':
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case 'customer':
          cmp = a.customer.localeCompare(b.customer);
          break;
        case 'orderType':
          cmp = a.orderType.localeCompare(b.orderType);
          break;
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'contractValue':
          cmp = a.contractValueCr - b.contractValueCr;
          break;
        case 'duration':
          cmp = (a.durationMonths || 0) - (b.durationMonths || 0);
          break;
        case 'annualValue':
          cmp = a.annualValueCr - b.annualValueCr;
          break;
        case 'orderSizePct':
          cmp = a.orderSizePct - b.orderSizePct;
          break;
        case 'companyRevenue':
          cmp = a.companyRevenueCr - b.companyRevenueCr;
          break;
      }
      return allSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredAllOrders, allSortCol, allSortDir]);

  const uniqueCompanies = useMemo(() => {
    return ['All', ...Array.from(new Set(orders.filter((o) => o.companyName !== 'COMPANY' && o.symbol !== 'COMPANY').map((o) => o.companyName)))];
  }, [orders]);

  const uniqueCustomers = useMemo(() => {
    return ['All', ...Array.from(new Set(orders.filter((o) => o.companyName !== 'COMPANY' && o.symbol !== 'COMPANY').map((o) => o.customer)))];
  }, [orders]);

  const getOrderSizeBadgeBg = (pct: number) => {
    if (pct >= 15) return '#DCFCE7';
    if (pct >= 5) return '#CCFBF1';
    if (pct >= 1) return '#FEF3C7';
    return '#F1F5F9';
  };

  const getOrderSizeBadgeColor = (pct: number) => {
    if (pct >= 15) return '#166534';
    if (pct >= 5) return '#0F766E';
    if (pct >= 1) return '#92400E';
    return '#334155';
  };

  const getOrderSizeBadgeBorder = (pct: number) => {
    if (pct >= 15) return '#86EFAC';
    if (pct >= 5) return '#99F6E4';
    if (pct >= 1) return '#FDE68A';
    return '#CBD5E1';
  };

  if (isLoading && orders.length === 0) {
    return (
      <TfLoadingState
        title="Loading Order Tracker…"
        subtitle="Fetching SEBI LODR order-win disclosures from exchange filings."
        variant="table"
        rows={5}
      />
    );
  }

  if (!isLoading && orders.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
        <Briefcase size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Order Inflows Available</h3>
        <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '440px', margin: '0 auto 16px' }}>
          No material order wins or contract disclosures detected in current period.
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
    <div className="space-y-2.5">
      {/* ── Sleek Unified Header & View Switcher ──── */}
      <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={16} color="#0F766E" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Order Inflows &amp; Contract Tracker
                </h2>
              </div>
              <p className="tf-desktop-only" style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                {activeSubTab === 'company'
                  ? 'Consolidated order inflows and contracts for companies as a percentage of annual revenue.'
                  : 'Individual contract disclosures, customer details, and execution timelines.'}
              </p>
            </div>
          </div>

          {/* Segmented View Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', padding: '2px', borderRadius: '7px', border: '1px solid #CBD5E1', height: '32px' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('company')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 11px',
                borderRadius: '5px',
                border: 'none',
                background: activeSubTab === 'company' ? '#0F766E' : 'transparent',
                color: activeSubTab === 'company' ? '#FFFFFF' : '#334155',
                fontSize: '12px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeSubTab === 'company' ? '0 1px 3px rgba(15, 118, 110, 0.3)' : 'none',
              }}
            >
              <Building2 size={13} />
              <span>Company View</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeSubTab === 'company' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                  color: activeSubTab === 'company' ? '#FFFFFF' : '#1E293B',
                  border: activeSubTab === 'company' ? 'none' : '1px solid #CBD5E1',
                }}
              >
                {consolidatedList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 11px',
                borderRadius: '5px',
                border: 'none',
                background: activeSubTab === 'all' ? '#0F766E' : 'transparent',
                color: activeSubTab === 'all' ? '#FFFFFF' : '#334155',
                fontSize: '12px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeSubTab === 'all' ? '0 1px 3px rgba(15, 118, 110, 0.3)' : 'none',
              }}
            >
              <FileText size={13} />
              <span>All Orders</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeSubTab === 'all' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                  color: activeSubTab === 'all' ? '#FFFFFF' : '#1E293B',
                  border: activeSubTab === 'all' ? 'none' : '1px solid #CBD5E1',
                }}
              >
                {filteredAllOrders.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── View 1: Consolidated Company View ─────────────────────── */}
      {activeSubTab === 'company' && (
        <div className="space-y-2.5">
          <div className="card" style={{ padding: 'clamp(12px, 3vw, 16px)', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Row 1: Search + Result count + Reset */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 'min(100%, 260px)' }}>
                  <Search
                    size={15}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company or symbol..."
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 30px 0 36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: '#94A3B8',
                      }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {(searchQuery || minRevPct !== '0' || minRevenueCr !== '0' || timeframe !== '6 months') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setTimeframe('6 months');
                        setMinRevPct('0');
                        setMinRevenueCr('0');
                      }}
                      title="Reset all filters to default"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#DC2626',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Reset Filters</span>
                    </button>
                  )}
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                    Showing <strong style={{ color: '#0F172A' }}>{consolidatedList.length}</strong> companies
                  </span>
                </div>
              </div>

              {/* Row 2: Secondary Filter Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                {/* Timeframe Segmented Quick-Pills */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} color="#0F766E" />
                    Timeframe:
                  </span>
                  <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', border: '1px solid #CBD5E1', height: '34px' }}>
                    {(['6 months', '1 year', '2 years', 'All'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: timeframe === tf ? '#0F766E' : 'transparent',
                          color: timeframe === tf ? '#FFFFFF' : '#334155',
                          fontSize: '12.5px',
                          fontWeight: timeframe === tf ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {tf === '6 months' ? '6M' : tf === '1 year' ? '1Y' : tf === '2 years' ? '2Y' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Revenue % Styled Input */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650 }}>Min Rev %:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', height: '34px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '7px', overflow: 'hidden' }}>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={minRevPct}
                      onChange={(e) => setMinRevPct(e.target.value)}
                      style={{
                        width: '50px',
                        height: '100%',
                        padding: '0 6px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 650,
                        color: '#0F172A',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                    <span style={{ padding: '0 8px', fontSize: '12px', color: '#334155', fontWeight: 700, background: '#F1F5F9', height: '100%', display: 'flex', alignItems: 'center', borderLeft: '1px solid #E2E8F0' }}>%</span>
                  </div>
                </div>

                {/* Min Revenue (Cr) Styled Input */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650 }}>Min Rev:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', height: '34px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '7px', overflow: 'hidden' }}>
                    <span style={{ padding: '0 6px 0 8px', fontSize: '12px', color: '#334155', fontWeight: 700, background: '#F1F5F9', height: '100%', display: 'flex', alignItems: 'center', borderRight: '1px solid #E2E8F0' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      value={minRevenueCr}
                      onChange={(e) => setMinRevenueCr(e.target.value)}
                      style={{
                        width: '60px',
                        height: '100%',
                        padding: '0 6px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 650,
                        color: '#0F172A',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                    <span style={{ padding: '0 8px', fontSize: '12px', color: '#64748B', fontWeight: 650, background: '#F1F5F9', height: '100%', display: 'flex', alignItems: 'center', borderLeft: '1px solid #E2E8F0' }}>Cr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Screen Cards for Consolidated View */}
          <div className="tf-mobile-only">
            {consolidatedList.map((c) => {
              const isExpanded = Boolean(expandedCompanies[c.companyName]);
              return (
                <div
                  key={c.companyName}
                  className="card"
                  style={{
                    padding: '10px 12px',
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{c.companyName}</strong>
                      {c.symbol && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: '#0F172A', fontWeight: 700, background: '#E2E8F0', border: '1px solid #CBD5E1', padding: '1.5px 6px', borderRadius: '4px' }}>
                          {c.symbol}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        background: getOrderSizeBadgeBg(c.ordersAsRevenuePct),
                        color: getOrderSizeBadgeColor(c.ordersAsRevenuePct),
                        border: `1px solid ${getOrderSizeBadgeBorder(c.ordersAsRevenuePct)}`,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 750,
                        fontSize: '11.5px',
                      }}
                    >
                      {c.ordersAsRevenuePct}% Rev
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#475569', fontSize: '11px', fontWeight: 550 }}>Total Orders: </span>
                      <strong style={{ color: '#0F766E' }}>{c.totalOrderValueFormatted}</strong>
                      <span style={{ color: '#475569', fontSize: '11px' }}> ({c.orderCount} orders)</span>
                    </div>
                    <div>
                      <span style={{ color: '#475569', fontSize: '11px', fontWeight: 550 }}>Annual Rev: </span>
                      <span style={{ color: '#0F172A', fontWeight: 650 }}>{c.companyRevenueFormatted}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCompanyAccordion(c.companyName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: '#F0FDFA',
                      border: '1px solid #CCFBF1',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#0F766E',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{isExpanded ? 'Hide' : 'View'} {c.orders.length} Disclosed Orders</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {c.orders.map((ord) => (
                        <div key={ord.id} style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: '#0F172A' }}>{ord.customer}</strong>
                            <span style={{ color: '#0F766E', fontWeight: 700 }}>{ord.contractValueFormatted}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '11px' }}>
                            <span>{ord.orderType} • {ord.date}</span>
                            <span>{ord.durationText}</span>
                          </div>
                          {ord.pdfUrl && (
                            <div style={{ marginTop: '6px', textAlign: 'right' }}>
                              <a
                                href={ord.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 6px',
                                  background: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '4px',
                                  color: '#0F766E',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                <FileText size={10} />
                                <span>Order PDF</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Consolidated Table with Expandable Order Drawer */}
          <div className="tf-table-container tf-desktop-only">
            <div style={{ margin: 0, overflowX: 'auto' }}>
              <table className="tf-table" style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ width: '36px', minWidth: '36px', padding: '8px 6px' }}></th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleConsSort('company')}
                      style={{ minWidth: '220px', padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: consSortCol === 'company' ? '#0F766E' : '#1E293B', whiteSpace: 'nowrap' }}
                    >
                      Company Name
                      {renderConsSortIndicator('company')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleConsSort('ordersAsRevenuePct')}
                      style={{ minWidth: '175px', padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: consSortCol === 'ordersAsRevenuePct' ? '#0F766E' : '#1E293B', whiteSpace: 'nowrap' }}
                    >
                      Orders as % of Revenue
                      {renderConsSortIndicator('ordersAsRevenuePct')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleConsSort('orderCount')}
                      style={{ minWidth: '120px', padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: consSortCol === 'orderCount' ? '#0F766E' : '#1E293B', whiteSpace: 'nowrap' }}
                    >
                      Order Count
                      {renderConsSortIndicator('orderCount')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleConsSort('totalOrderValue')}
                      style={{ minWidth: '150px', padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: consSortCol === 'totalOrderValue' ? '#0F766E' : '#1E293B', whiteSpace: 'nowrap' }}
                    >
                      Total Order Value
                      {renderConsSortIndicator('totalOrderValue')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleConsSort('companyRevenue')}
                      style={{ minWidth: '150px', padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: consSortCol === 'companyRevenue' ? '#0F766E' : '#1E293B', whiteSpace: 'nowrap' }}
                    >
                      Company Revenue
                      {renderConsSortIndicator('companyRevenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedList.map((c) => {
                    const isExpanded = Boolean(expandedCompanies[c.companyName]);

                    return (
                      <React.Fragment key={c.companyName}>
                        <tr
                          onClick={() => toggleCompanyAccordion(c.companyName)}
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          <td style={{ padding: '8px 6px', textAlign: 'center', color: '#475569' }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 650, color: '#0F172A', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '13px' }}>{c.companyName}</span>
                            {c.symbol && (
                              <span style={{ marginLeft: '6px', fontSize: '11px', color: '#0F172A', fontWeight: 700, background: '#E2E8F0', border: '1px solid #CBD5E1', padding: '1.5px 6px', borderRadius: '4px', letterSpacing: '0.2px' }}>
                                {c.symbol}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                background: getOrderSizeBadgeBg(c.ordersAsRevenuePct),
                                color: getOrderSizeBadgeColor(c.ordersAsRevenuePct),
                                border: `1px solid ${getOrderSizeBadgeBorder(c.ordersAsRevenuePct)}`,
                                padding: '2.5px 8px',
                                borderRadius: '12px',
                                fontWeight: 750,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {c.ordersAsRevenuePct}%
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#0F172A', fontWeight: 650, whiteSpace: 'nowrap' }}>
                            {c.orderCount} orders
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F766E', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {c.totalOrderValueFormatted}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#1E293B', fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {c.companyRevenueFormatted}
                          </td>
                        </tr>

                        {/* Expandable Drawer: Individual Orders */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0, background: '#F8FAFC' }}>
                              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                                  Individual Disclosed Orders for {c.companyName}
                                </div>
                                <div className="table-scroll-container" style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '6px', overflowX: 'auto' }}>
                                  <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Date</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Customer</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Order Type</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Contract Value</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Duration</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Annual Value</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Revenue %</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>Document</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {c.orders.map((ord) => (
                                        <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                          <td style={{ padding: '8px 10px', color: '#1E293B', whiteSpace: 'nowrap' }}>{ord.date}</td>
                                          <td style={{ padding: '8px 10px', fontWeight: 650, color: '#0F172A' }}>{ord.customer}</td>
                                          <td style={{ padding: '8px 10px', color: '#334155' }}>{ord.orderType}</td>
                                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0F766E', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                            {ord.contractValueFormatted}
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', whiteSpace: 'nowrap' }}>
                                            {ord.durationText}
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 650, color: '#1E293B', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                            {ord.annualValueFormatted}
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <span
                                              style={{
                                                background: getOrderSizeBadgeBg(ord.orderSizePct),
                                                color: getOrderSizeBadgeColor(ord.orderSizePct),
                                                border: `1px solid ${getOrderSizeBadgeBorder(ord.orderSizePct)}`,
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '11px',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              {ord.orderSizePct}%
                                            </span>
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <a
                                              href={ord.pdfUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                padding: '2px 7px',
                                                background: '#F0FDFA',
                                                border: '1px solid #99F6E4',
                                                borderRadius: '4px',
                                                color: '#0F766E',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                              }}
                                            >
                                              <FileText size={11} />
                                              <span>PDF</span>
                                            </a>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── View 2: All Orders View matching Reference Screenshot ─── */}
      {activeSubTab === 'all' && (
        <div className="space-y-2.5">
          <div className="card" style={{ padding: 'clamp(12px, 3vw, 16px)', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                {/* Timeframe Selector */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} color="#0F766E" />
                    Timeframe:
                  </span>
                  <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '7px', border: '1px solid #CBD5E1', height: '34px' }}>
                    {(['6 months', '1 year', '2 years', 'All'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        style={{
                          height: '28px',
                          padding: '0 9px',
                          borderRadius: '5px',
                          border: 'none',
                          background: timeframe === tf ? '#0F766E' : 'transparent',
                          color: timeframe === tf ? '#FFFFFF' : '#334155',
                          fontSize: '12px',
                          fontWeight: timeframe === tf ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {tf === '6 months' ? '6M' : tf === '1 year' ? '1Y' : tf === '2 years' ? '2Y' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Filter */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={13} />
                    Company:
                  </span>
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 550,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {uniqueCompanies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Filter */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={13} />
                    Customer:
                  </span>
                  <select
                    value={selectedCustomerFilter}
                    onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 550,
                      outline: 'none',
                      maxWidth: '240px',
                      cursor: 'pointer',
                    }}
                  >
                    {uniqueCustomers.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Order Size % */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650 }}>Min Size:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', height: '36px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minOrderSizeFilter}
                      onChange={(e) => setMinOrderSizeFilter(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '50px',
                        height: '100%',
                        padding: '0 6px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 650,
                        color: '#0F172A',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                    <span style={{ padding: '0 8px', fontSize: '12px', color: '#64748B', fontWeight: 650, background: '#F1F5F9', height: '100%', display: 'flex', alignItems: 'center', borderLeft: '1px solid #E2E8F0' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Actions & Result Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(selectedCompanyFilter !== 'All' || selectedCustomerFilter !== 'All' || minOrderSizeFilter !== '' || timeframe !== '6 months' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyFilter('All');
                      setSelectedCustomerFilter('All');
                      setMinOrderSizeFilter('');
                      setTimeframe('6 months');
                      setSearchQuery('');
                    }}
                    title="Reset all filters to default"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Filters</span>
                  </button>
                )}
                <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                  Showing <strong style={{ color: '#0F172A' }}>{filteredAllOrders.length}</strong> orders
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Screen Cards for All Orders View */}
          <div className="tf-mobile-only">
            {/* Mobile sort strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 600, color: '#475569' }}>Sort orders:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={allSortCol}
                  onChange={(e) => handleAllSort(e.target.value as AllOrdersSortCol)}
                  style={{
                    height: '32px',
                    padding: '0 26px 0 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="date">Date</option>
                  <option value="contractValue">Contract Value</option>
                  <option value="orderSizePct">Order Size %</option>
                  <option value="company">Company</option>
                  <option value="customer">Customer</option>
                  <option value="annualValue">Annual Value</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAllSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
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
                  <span>{allSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                </button>
              </div>
            </div>

            {sortedAllOrders.map((ord) => (
              <div
                key={ord.id}
                className="card"
                style={{
                  padding: '10px 12px',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{ord.companyName}</strong>
                    {ord.symbol && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#0F172A', fontWeight: 700, background: '#E2E8F0', border: '1px solid #CBD5E1', padding: '1.5px 6px', borderRadius: '4px' }}>
                        {ord.symbol}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      background: getOrderSizeBadgeBg(ord.orderSizePct),
                      color: getOrderSizeBadgeColor(ord.orderSizePct),
                      border: `1px solid ${getOrderSizeBadgeBorder(ord.orderSizePct)}`,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 750,
                      fontSize: '11px',
                    }}
                  >
                    {ord.orderSizePct}% Size
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#1E293B' }}>
                  <strong style={{ color: '#0F172A' }}>Client: </strong>{ord.customer}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 650, textTransform: 'uppercase' }}>Contract Value</div>
                    <strong style={{ color: '#0F766E', fontSize: '14px' }}>{ord.contractValueFormatted}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 650, textTransform: 'uppercase' }}>Duration</div>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{ord.durationText}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 650, textTransform: 'uppercase' }}>Date</div>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{ord.date}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                  <span style={{ fontWeight: 550 }}>{ord.orderType}</span>
                  {ord.pdfUrl && (
                    <a
                      href={ord.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#F0FDFA',
                        border: '1px solid #99F6E4',
                        color: '#0F766E',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <FileText size={11} />
                      <span>Order PDF</span>
                    </a>
                  )}
                </div>
              </div>
            ))}

            {sortedAllOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                No orders found matching the filter criteria.
              </div>
            )}
          </div>

          <div className="tf-table-container tf-desktop-only">
            <div style={{ margin: 0, overflowX: 'auto' }}>
              <table className="tf-table" style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('company')}
                      style={{ minWidth: '170px', padding: '8px 12px', textAlign: 'left', color: allSortCol === 'company' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Company
                      {renderAllSortIndicator('company')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('customer')}
                      style={{ minWidth: '150px', padding: '8px 12px', textAlign: 'left', color: allSortCol === 'customer' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Customer
                      {renderAllSortIndicator('customer')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('orderType')}
                      style={{ minWidth: '130px', padding: '8px 12px', textAlign: 'left', color: allSortCol === 'orderType' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Order Type
                      {renderAllSortIndicator('orderType')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('date')}
                      style={{ minWidth: '105px', padding: '8px 12px', textAlign: 'left', color: allSortCol === 'date' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Date
                      {renderAllSortIndicator('date')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('contractValue')}
                      style={{ minWidth: '130px', padding: '8px 12px', textAlign: 'right', color: allSortCol === 'contractValue' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Contract Value
                      {renderAllSortIndicator('contractValue')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('duration')}
                      style={{ minWidth: '100px', padding: '8px 12px', textAlign: 'center', color: allSortCol === 'duration' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Duration
                      {renderAllSortIndicator('duration')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('annualValue')}
                      style={{ minWidth: '120px', padding: '8px 12px', textAlign: 'right', color: allSortCol === 'annualValue' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Annual Value
                      {renderAllSortIndicator('annualValue')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('orderSizePct')}
                      style={{ minWidth: '110px', padding: '8px 12px', textAlign: 'center', color: allSortCol === 'orderSizePct' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Order Size %
                      {renderAllSortIndicator('orderSizePct')}
                    </th>
                    <th
                      className="tf-sortable-th"
                      onClick={() => handleAllSort('companyRevenue')}
                      style={{ minWidth: '140px', padding: '8px 12px', textAlign: 'right', color: allSortCol === 'companyRevenue' ? '#0F766E' : '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Company Revenue
                      {renderAllSortIndicator('companyRevenue')}
                    </th>
                    <th style={{ minWidth: '70px', padding: '8px 12px', textAlign: 'center', color: '#1E293B', fontWeight: 700, whiteSpace: 'nowrap' }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllOrders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 650, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        <span>{ord.companyName}</span>
                        {ord.symbol && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: '#0F172A', fontWeight: 700, background: '#E2E8F0', border: '1px solid #CBD5E1', padding: '1.5px 6px', borderRadius: '4px', letterSpacing: '0.2px' }}>
                            {ord.symbol}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#0F172A', fontWeight: 550, whiteSpace: 'nowrap' }}>{ord.customer}</td>
                      <td style={{ padding: '8px 12px', color: '#334155', whiteSpace: 'nowrap' }}>{ord.orderType}</td>
                      <td style={{ padding: '8px 12px', color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>{ord.date}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F766E', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {ord.contractValueFormatted}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#334155', whiteSpace: 'nowrap' }}>{ord.durationText}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 650, color: '#1E293B', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {ord.annualValueFormatted}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: getOrderSizeBadgeBg(ord.orderSizePct),
                            color: getOrderSizeBadgeColor(ord.orderSizePct),
                            border: `1px solid ${getOrderSizeBadgeBorder(ord.orderSizePct)}`,
                            padding: '2.5px 8px',
                            borderRadius: '12px',
                            fontWeight: 750,
                            fontSize: '11.5px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ord.orderSizePct}%
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#1E293B', fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {ord.companyRevenueFormatted}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <a
                          href={ord.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            background: '#F0FDFA',
                            border: '1px solid #99F6E4',
                            borderRadius: '4px',
                            color: '#0F766E',
                            fontSize: '11px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <FileText size={11} />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
