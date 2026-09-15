'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, X, Download, Info } from 'lucide-react';
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
  ipos: IpoItem[];
}

interface IpoTrackerTabProps {
  data: IpoTrackerData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function IpoTrackerTab({ data, isLoading, onRefresh }: IpoTrackerTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Live Bidding' | 'Upcoming' | 'Listed'>('ALL');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'OVER_SUBSCRIBED' | 'HIGH_GMP'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const ipos = data?.ipos || [];

  const filteredIpos = useMemo(() => {
    return ipos.filter((ipo) => {
      const matchesSearch =
        ipo.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ipo.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || ipo.status === statusFilter;

      let matchesPreset = true;
      if (presetFilter === 'OVER_SUBSCRIBED') matchesPreset = ipo.subscriptionMultiples.total >= 5.0;
      else if (presetFilter === 'HIGH_GMP') matchesPreset = (Boolean(ipo.gmpEstimate) && ipo.gmpEstimate !== '-') || (ipo.listingGainPct ?? 0) >= 20;

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
      `${ipo.subscriptionMultiples.qib}x`,
      `${ipo.subscriptionMultiples.niiHni}x`,
      `${ipo.subscriptionMultiples.retail}x`,
      `${ipo.subscriptionMultiples.total}x`,
      ipo.gmpEstimate || (ipo.listingGainPct ? `+${ipo.listingGainPct.toFixed(1)}%` : '-'),
    ]);
    exportTableToCsv('NSE_BSE_IPO_Tracker', headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading IPO tracker…"
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
            <span>IPO Subscription Dynamics, Anchor Lock-in &amp; Listing Gain Strategy</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Institutional Confirmation (QIB Multiple):</strong> Retail hype can inflate early bidding, but aggressive Qualified Institutional Buyer (QIB) bids on Day 3 signal robust institutional validation.</p>
            <p><strong>Anchor Investor Lock-in:</strong> 50% of anchor shares unlock after 30 days and the remaining 50% unlock after 90 days. Check lock-in expiry dates for potential post-listing supply overhang.</p>
            <p><strong>Grey Market Premium (GMP):</strong> Unofficial forward pricing indicating sentiment. High GMP (&gt;30%) often drives strong listing day pops, but fundamentally weak companies often see rapid post-listing distribution.</p>
          </div>
        )}
      </div>

      {/* ── Top Header Controls & Filter Card ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-row-top">
          {/* Search Box */}
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search IPO company or symbol..."
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

          {/* Segmented Status Pills */}
          <div className="tf-segmented-pills">
            {(['ALL', 'Live Bidding', 'Upcoming', 'Listed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '5px',
                  border: 'none',
                  background: statusFilter === status ? '#FFFFFF' : 'transparent',
                  color: statusFilter === status ? (status === 'Live Bidding' ? '#059669' : '#0F172A') : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: statusFilter === status ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {status === 'ALL' ? 'All IPOs' : status}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                padding: 0,
              }}
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
        gap: '14px',
      }}>
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
                  boxShadow: isLive ? '0 4px 14px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                }}
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
                    flexShrink: 0,
                  }}>
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
                  textAlign: 'center',
                }}>
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
                      Total {ipo.subscriptionMultiples.total}x
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>QIB (Inst.)</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples.qib}x
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>NII (HNI)</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples.niiHni}x
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '5px 7px', borderRadius: '5px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>Retail</div>
                      <div style={{ fontWeight: 750, color: '#0F172A', marginTop: '1px' }}>
                        {ipo.subscriptionMultiples.retail}x
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
                    fontSize: '11.5px',
                  }}>
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
                    fontSize: '11.5px',
                  }}>
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
