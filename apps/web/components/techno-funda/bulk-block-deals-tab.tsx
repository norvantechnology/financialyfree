'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, X, Download, Info } from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';

export interface BulkBlockDealItem {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  dealType: 'BUY' | 'SELL';
  dealMarket: 'BULK' | 'BLOCK';
  clientName: string;
  quantity: number;
  tradePrice: number;
  valueCr: number;
  isMarqueeInvestor: boolean;
  marqueeTag?: string;
}

export interface BulkBlockDealsData {
  lastUpdated: string;
  source: string;
  totalDeals: number;
  totalValueCr: number;
  deals: BulkBlockDealItem[];
}

interface BulkBlockDealsTabProps {
  data: BulkBlockDealsData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function BulkBlockDealsTab({ data, isLoading, onRefresh }: BulkBlockDealsTabProps) {
  const [dealTypeFilter, setDealTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'BULK' | 'BLOCK'>('ALL');
  const [marqueeOnly, setMarqueeOnly] = useState(false);
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'MARQUEE' | 'BUYS_ONLY' | 'OVER_100CR'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deals = data?.deals || [];

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        deal.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = dealTypeFilter === 'ALL' || deal.dealType === dealTypeFilter;
      const matchesMarket = marketFilter === 'ALL' || deal.dealMarket === marketFilter;
      const matchesMarquee = !marqueeOnly || deal.isMarqueeInvestor;

      let matchesPreset = true;
      if (presetFilter === 'MARQUEE') matchesPreset = deal.isMarqueeInvestor;
      else if (presetFilter === 'BUYS_ONLY') matchesPreset = deal.dealType === 'BUY';
      else if (presetFilter === 'OVER_100CR') matchesPreset = deal.valueCr >= 100;

      return matchesSearch && matchesType && matchesMarket && matchesMarquee && matchesPreset;
    });
  }, [deals, searchQuery, dealTypeFilter, marketFilter, marqueeOnly, presetFilter]);

  const handleExportCsv = () => {
    const headers = ['Date', 'Symbol', 'Company', 'Client / Investor Name', 'Market', 'Action', 'Quantity', 'Trade Price (₹)', 'Value (₹ Cr)', 'Marquee Tag'];
    const rows = filteredDeals.map((d) => [
      d.date,
      d.symbol,
      d.companyName,
      d.clientName,
      d.dealMarket,
      d.dealType,
      d.quantity,
      d.tradePrice,
      d.valueCr,
      d.marqueeTag || (d.isMarqueeInvestor ? 'MARQUEE' : 'STANDARD'),
    ]);
    exportTableToCsv('NSE_BSE_Bulk_Block_Deals', headers, rows);
  };

  const buyVolumeCr = useMemo(() => {
    return deals.filter((d) => d.dealType === 'BUY').reduce((a, b) => a + b.valueCr, 0);
  }, [deals]);

  const sellVolumeCr = useMemo(() => {
    return deals.filter((d) => d.dealType === 'SELL').reduce((a, b) => a + b.valueCr, 0);
  }, [deals]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Contextual Methodology Guide ── */}
      <div className="tf-methodology-card">
        <div className="tf-methodology-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <div className="tf-methodology-title">
            <Info size={14} />
            <span>How to Track Institutional Smart Money (Bulk vs. Block Deal Mechanics)</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Block Deal:</strong> Minimum transaction value of &ge; ₹10 Cr or 0.5% equity, executed during designated 15-minute exchange windows at &plusmn;0.5% price collar.</p>
            <p><strong>Bulk Deal:</strong> Open market transaction where total quantity bought or sold exceeds 0.5% of total equity shares of the company on the exchange.</p>
            <p><strong>Smart Money Edge:</strong> Sustained accumulation by marquee FIIs (e.g. GQG, Vanguard) or superstar domestic investors (e.g. Ashish Kacholia, Mukul Agrawal) often signals institutional re-rating.</p>
          </div>
        )}
      </div>

      {/* ── Summary Statistics ── */}
      <div className="tf-kpi-grid-responsive">
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Tracked Volume
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            ₹{(data?.totalValueCr ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            {data?.totalDeals ?? 0} institutional deals
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Institutional Buys
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            ₹{buyVolumeCr.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Smart money accumulation
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Institutional Sells
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
            ₹{sellVolumeCr.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Institutional distribution / exits
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="tf-filter-card">
        {/* Row 1: Search, Type Pills, Market Pills & Actions */}
        <div className="tf-filter-row-top">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search investor (e.g. Ashish Kacholia, GQG), symbol..."
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

          {/* Deal Type Pills */}
          <div className="tf-segmented-pills">
            {(['ALL', 'BUY', 'SELL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDealTypeFilter(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: dealTypeFilter === t ? '#FFFFFF' : 'transparent',
                  color: dealTypeFilter === t ? (t === 'BUY' ? '#059669' : t === 'SELL' ? '#DC2626' : '#0F172A') : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: dealTypeFilter === t ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Market Pills */}
          <div className="tf-segmented-pills">
            {(['ALL', 'BULK', 'BLOCK'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: marketFilter === m ? '#FFFFFF' : 'transparent',
                  color: marketFilter === m ? '#0F172A' : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: marketFilter === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {m === 'ALL' ? 'Bulk & Block' : `${m} Only`}
              </button>
            ))}
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
            All Deals
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('MARQUEE')}
            className={`tf-preset-chip ${presetFilter === 'MARQUEE' ? 'tf-preset-chip-active' : ''}`}
          >
            Marquee FII / DII
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('BUYS_ONLY')}
            className={`tf-preset-chip ${presetFilter === 'BUYS_ONLY' ? 'tf-preset-chip-active' : ''}`}
          >
            Buys Only
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('OVER_100CR')}
            className={`tf-preset-chip ${presetFilter === 'OVER_100CR' ? 'tf-preset-chip-active' : ''}`}
          >
            Mega Trades (&ge;₹100 Cr)
          </button>
        </div>

        {/* Row 2: Marquee Toggle, Counter & Refresh */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={marqueeOnly}
                onChange={(e) => setMarqueeOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{
                fontSize: '10.5px',
                fontWeight: 750,
                background: marqueeOnly ? '#FEF3C7' : '#F1F5F9',
                color: marqueeOnly ? '#B45309' : '#64748B',
                padding: '2px 6px',
                borderRadius: '4px',
                border: marqueeOnly ? '1px solid #FDE68A' : '1px solid #E2E8F0',
              }}>
                MARQUEE
              </span>
              Investors Only
            </label>

            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              Showing <strong>{filteredDeals.length}</strong> of {deals.length} deals
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(searchQuery || dealTypeFilter !== 'ALL' || marketFilter !== 'ALL' || marqueeOnly) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDealTypeFilter('ALL');
                  setMarketFilter('ALL');
                  setMarqueeOnly(false);
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

            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download bulk/block deals to CSV"
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
                  padding: '5px 12px',
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
      </div>

      {/* ── Deals Table ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for full deal details →</span>
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
                  <th className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '140px' }}>Date &amp; Symbol</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '180px' }}>Client / Investor Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '90px' }}>Market</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '90px' }}>Action</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>Quantity</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '100px' }}>Trade Price</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '115px' }}>Value (₹ Cr)</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No bulk or block deals match the specified criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const isBuy = deal.dealType === 'BUY';
                    return (
                      <tr key={deal.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A' }}>{deal.symbol}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{deal.date}</div>
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 650, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {deal.clientName}
                            {deal.isMarqueeInvestor && (
                              <span style={{ fontSize: '9.5px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 5px', borderRadius: '4px', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                {deal.marqueeTag || 'MARQUEE'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: deal.dealMarket === 'BLOCK' ? '#EEF2FF' : '#F1F5F9',
                            color: deal.dealMarket === 'BLOCK' ? '#4338CA' : '#475569',
                            border: deal.dealMarket === 'BLOCK' ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                            whiteSpace: 'nowrap',
                          }}>
                            {deal.dealMarket}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 750,
                            background: isBuy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isBuy ? '#059669' : '#DC2626',
                            whiteSpace: 'nowrap',
                          }}>
                            {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {deal.dealType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                          {deal.quantity.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{deal.tradePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: isBuy ? '#059669' : '#0F172A', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                          ₹{deal.valueCr.toFixed(2)} Cr
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
