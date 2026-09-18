'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, X, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface IpoItem {
  id: string;
  companyName: string;
  symbol: string;
  series: 'Mainboard' | 'SME';
  priceBand: string;
  lotSize: number;
  issueSizeCr: number;
  openDate: string;
  closeDate: string;
  listingDate?: string;
  status: 'Upcoming' | 'Live Bidding' | 'Closed' | 'Listed';
  subscriptionMultiples: {
    qib: number;
    niiHni: number;
    retail: number;
    total: number;
  };
  listingGainPct?: number;
  currentPrice?: number;
  gmpEstimate?: string;
}

export interface IpoTrackerData {
  lastUpdated: string;
  source: string;
  totalIpos: number;
  counts?: {
    liveBidding?: number;
    upcoming?: number;
    listed?: number;
    closed?: number;
  };
  ipos: IpoItem[];
  message?: string;
}

interface IpoTrackerTabProps {
  data: IpoTrackerData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

function normalizeIpoStatus(status: string): IpoItem['status'] {
  const s = String(status || '');
  if (/active|open|live|bid/i.test(s)) return 'Live Bidding';
  if (/upcom|forthcoming/i.test(s)) return 'Upcoming';
  if (/list/i.test(s)) return 'Listed';
  if (/close|past/i.test(s)) return 'Closed';
  return (s as IpoItem['status']) || 'Upcoming';
}

export function IpoTrackerTab({ data, isLoading, onRefresh }: IpoTrackerTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Live Bidding' | 'Upcoming' | 'Listed' | 'Closed'>('ALL');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'OVER_SUBSCRIBED' | 'HIGH_GMP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const ipos = data?.ipos || [];

  const statusCounts = useMemo(() => {
    const counts = { live: 0, upcoming: 0, listed: 0, closed: 0 };
    for (const ipo of ipos) {
      const s = normalizeIpoStatus(ipo.status);
      if (s === 'Live Bidding') counts.live++;
      else if (s === 'Upcoming') counts.upcoming++;
      else if (s === 'Listed') counts.listed++;
      else if (s === 'Closed') counts.closed++;
    }
    return counts;
  }, [ipos]);

  const filteredIpos = useMemo(() => {
    return ipos.filter((ipo) => {
      const matchesSearch =
        (ipo.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ipo.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
      const normalizedStatus = normalizeIpoStatus(ipo.status);
      const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;

      let matchesPreset = true;
      if (presetFilter === 'OVER_SUBSCRIBED') {
        matchesPreset = (ipo.subscriptionMultiples?.total ?? 0) >= 5.0;
      } else if (presetFilter === 'HIGH_GMP') {
        matchesPreset =
          (Boolean(ipo.gmpEstimate) && ipo.gmpEstimate !== '-' && !/^at par$/i.test(ipo.gmpEstimate || '')) ||
          (ipo.listingGainPct ?? 0) >= 20;
      }

      return matchesSearch && matchesStatus && matchesPreset;
    });
  }, [ipos, searchQuery, statusFilter, presetFilter]);

  const handleExportCsv = () => {
    const headers = ['Company', 'Symbol', 'Series', 'Status', 'Price Band', 'Lot Size', 'Issue Size (₹ Cr)', 'Open Date', 'Close Date', 'Listing Date', 'QIB Sub', 'NII Sub', 'Retail Sub', 'Total Sub (x)', 'GMP / Listing Gain'];
    const rows = filteredIpos.map((ipo) => [
      ipo.companyName,
      ipo.symbol,
      ipo.series,
      ipo.status,
      ipo.priceBand,
      ipo.lotSize,
      ipo.issueSizeCr,
      ipo.openDate,
      ipo.closeDate,
      ipo.listingDate || '-',
      `${ipo.subscriptionMultiples?.qib ?? 0}x`,
      `${ipo.subscriptionMultiples?.niiHni ?? 0}x`,
      `${ipo.subscriptionMultiples?.retail ?? 0}x`,
      `${ipo.subscriptionMultiples?.total ?? 0}x`,
      ipo.gmpEstimate || (ipo.listingGainPct ? `+${ipo.listingGainPct.toFixed(1)}%` : '-'),
    ]);
    exportTableToCsv('NSE_BSE_IPO_Tracker', headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading IPO tracker..."
        subtitle="Pulling live exchange and market data for this workspace."
        variant="table"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


      {/* ── Top Header Controls & Filter Card ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          {/* Search Box */}
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search IPO company or symbol..."
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

          {/* Segmented Status Pills */}
          <div className="tf-segmented-pills">
            {(
              [
                { id: 'ALL' as const, label: `All (${ipos.length})` },
                { id: 'Live Bidding' as const, label: `Live (${statusCounts.live})` },
                { id: 'Upcoming' as const, label: `Upcoming (${statusCounts.upcoming})` },
                { id: 'Listed' as const, label: `Listed (${statusCounts.listed})` },
                { id: 'Closed' as const, label: `Closed (${statusCounts.closed})` },
              ] as const
            ).map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '5px',
                  border: 'none',
                  background: statusFilter === status.id ? '#FFFFFF' : 'transparent',
                  color: statusFilter === status.id ? (status.id === 'Live Bidding' ? '#059669' : '#0F172A') : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: statusFilter === status.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap' }}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="tf-filter-actions">
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download IPO dataset to CSV"
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
            All Issues
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('OVER_SUBSCRIBED')}
            className={`tf-preset-chip ${presetFilter === 'OVER_SUBSCRIBED' ? 'tf-preset-chip-active' : ''}`}
          >
            Heavy Demand (&ge;5x Subscribed)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('HIGH_GMP')}
            className={`tf-preset-chip ${presetFilter === 'HIGH_GMP' ? 'tf-preset-chip-active' : ''}`}
          >
            High GMP / Listing Pop (&ge;20%)
          </button>
        </div>

        {/* Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', paddingTop: '2px' }}>
          <span>
            Showing <strong>{filteredIpos.length}</strong> of {ipos.length} IPOs
          </span>
          {(searchQuery || statusFilter !== 'ALL' || presetFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
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

      {/* ── IPO Cards Grid (Fluid Responsive) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '14px' }}>
        {filteredIpos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '44px 24px', textAlign: 'center', color: '#94A3B8', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            No IPOs match the active search and filter criteria.
          </div>
        ) : (
          filteredIpos.map((ipo) => {
            const isLive = ipo.status === 'Live Bidding';
            const isListed = ipo.status === 'Listed';
            return (
              <div
                key={ipo.id}
                style={{
                  background: '#FFFFFF',
                  border: isLive ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isLive ? '0 4px 14px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                {/* Header: Name & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 750, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                      {ipo.companyName}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{ipo.symbol}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{ipo.series}</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: isLive ? '#DCFCE7' : isListed ? '#EEF2FF' : '#F1F5F9',
                    color: isLive ? '#15803D' : isListed ? '#4338CA' : '#475569',
                    border: isLive ? '1px solid #86EFAC' : isListed ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                    whiteSpace: 'nowrap',
                    flexShrink: 0 }}>
                    {ipo.status}
                  </span>
                </div>

                {/* Price Band & Issue Size */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  background: '#F8FAFC',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Price Band</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0F172A', marginTop: '2px' }}>
                      {ipo.priceBand}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Lot Size</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0F172A', marginTop: '2px' }}>
                      {ipo.lotSize} sh
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Issue Size</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0F172A', marginTop: '2px' }}>
                      ₹{ipo.issueSizeCr} Cr
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', flexWrap: 'wrap', gap: '4px' }}>
                  <div>Open: <strong style={{ color: '#0F172A' }}>{ipo.openDate}</strong></div>
                  <div>Close: <strong style={{ color: '#0F172A' }}>{ipo.closeDate}</strong></div>
                  {ipo.listingDate && <div>List: <strong style={{ color: '#4338CA' }}>{ipo.listingDate}</strong></div>}
                </div>

                {/* Subscription Multiples Status */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 650, color: '#475569' }}>
                      Subscription Demand:
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>
                      Total {ipo.subscriptionMultiples?.total ?? 0}x
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>QIB (Inst.)</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples?.qib ?? 0}x
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>NII (HNI)</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples?.niiHni ?? 0}x
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>Retail</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples?.retail ?? 0}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* GMP / Listing Gain Footer */}
                {ipo.gmpEstimate && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '11.5px' }}>
                    <span style={{ color: '#64748B' }}>Grey Market Premium (GMP):</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>
                      {ipo.gmpEstimate}
                    </span>
                  </div>
                )}

                {isListed && ipo.listingGainPct !== undefined && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '11.5px' }}>
                    <span style={{ color: '#64748B' }}>Listing Day Gain:</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>
                      +{ipo.listingGainPct.toFixed(1)}% (CMP: ₹{ipo.currentPrice})
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
