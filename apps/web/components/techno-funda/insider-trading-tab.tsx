'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, X, Download, Info } from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface InsiderTransactionItem {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  personName: string;
  personCategory: string;
  transactionType: string;
  sharesTraded: number;
  valueLakh: number;
  postHoldingPct: number;
  modeOfAcquisition: string;
}

export interface InsiderTradingData {
  lastUpdated: string;
  source: string;
  totalTransactions: number;
  totalBuyValueLakh: number;
  totalSellValueLakh: number;
  transactions: InsiderTransactionItem[];
}

interface InsiderTradingTabProps {
  data: InsiderTradingData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function InsiderTradingTab({ data, isLoading, onRefresh }: InsiderTradingTabProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'PLEDGE'>('ALL');
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'PROMOTER_BUYS' | 'PLEDGES' | 'MARKET_ONLY'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = data?.transactions || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.personName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesType = true;
      if (typeFilter === 'BUY') {
        matchesType = t.transactionType.includes('Purchase');
      } else if (typeFilter === 'SELL') {
        matchesType = t.transactionType.includes('Sale');
      } else if (typeFilter === 'PLEDGE') {
        matchesType = t.transactionType.includes('Pledge');
      }

      let matchesPreset = true;
      if (presetFilter === 'PROMOTER_BUYS') {
        matchesPreset = t.personCategory.includes('Promoter') && t.transactionType.includes('Purchase');
      } else if (presetFilter === 'PLEDGES') {
        matchesPreset = t.transactionType.includes('Pledge');
      } else if (presetFilter === 'MARKET_ONLY') {
        matchesPreset = t.modeOfAcquisition.includes('Market');
      }

      return matchesSearch && matchesType && matchesPreset;
    });
  }, [transactions, searchQuery, typeFilter, presetFilter]);

  const handleExportCsv = () => {
    const headers = ['Date', 'Symbol', 'Company', 'Insider Name', 'Role / Category', 'Transaction', 'Mode', 'Shares Traded', 'Value (₹ Lakh)', 'Post-Holding %'];
    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.symbol,
      tx.companyName,
      tx.personName,
      tx.personCategory,
      tx.transactionType,
      tx.modeOfAcquisition,
      tx.sharesTraded,
      tx.valueLakh,
      tx.postHoldingPct,
    ]);
    exportTableToCsv('SEBI_PIT_Insider_Disclosures', headers, rows);
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading insider trading disclosures…"
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
            <span>Understanding SEBI PIT Insider Trading Disclosures (Skin-in-the-Game Edge)</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Regulatory Context:</strong> SEBI (Prohibition of Insider Trading) Regulations mandate disclosure within 2 trading days when promoters, key management, or directors trade &gt; ₹10 Lakh in value.</p>
            <p><strong>High-Conviction Signals:</strong> Open market purchases by founders and promoters indicate strong conviction in business prospects. Distinguish these from routine employee ESOP allotments.</p>
            <p><strong>Pledge Watch:</strong> Creation of promoter share pledges can indicate working capital stress, while pledge revocation/release is a major balance-sheet catalyst.</p>
          </div>
        )}
      </div>

      {/* ── Summary Statistics ── */}
      <div className="tf-kpi-grid-responsive">
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Disclosures
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {data?.totalTransactions ?? 0}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            SEBI PIT Reg 7(2) filings
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Promoter & Insider Buys
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            ₹{((data?.totalBuyValueLakh ?? 0) / 100).toFixed(2)} Cr
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Open market skin-in-the-game
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Insider Disposals / Sales
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
            ₹{((data?.totalSellValueLakh ?? 0) / 100).toFixed(2)} Cr
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            KMP and designated person sales
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-row-top">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search promoter, director, or symbol..."
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

          <div className="tf-segmented-pills">
            {(['ALL', 'BUY', 'SELL', 'PLEDGE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTypeFilter(mode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: typeFilter === mode ? '#FFFFFF' : 'transparent',
                  color: typeFilter === mode ? '#0F172A' : '#64748B',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: typeFilter === mode ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {mode === 'ALL' ? 'All Disclosures' : mode === 'BUY' ? 'Insider Buys' : mode === 'SELL' ? 'Insider Sells' : 'Pledges'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download insider filings to CSV"
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
            All Filings
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('PROMOTER_BUYS')}
            className={`tf-preset-chip ${presetFilter === 'PROMOTER_BUYS' ? 'tf-preset-chip-active' : ''}`}
          >
            Promoter Buys Only
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('PLEDGES')}
            className={`tf-preset-chip ${presetFilter === 'PLEDGES' ? 'tf-preset-chip-active' : ''}`}
          >
            Pledges
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('MARKET_ONLY')}
            className={`tf-preset-chip ${presetFilter === 'MARKET_ONLY' ? 'tf-preset-chip-active' : ''}`}
          >
            Open Market Trades
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', paddingTop: '2px' }}>
          <span>
            Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} filings
          </span>
          {(searchQuery || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
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

      {/* ── Transactions Table ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for insider details →</span>
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
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '170px' }}>Insider / Person Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '130px' }}>Role / Category</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '140px' }}>Transaction</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Shares</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>Value</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '115px' }}>Post-Holding %</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '44px 24px', textAlign: 'center', color: '#94A3B8' }}>
                      No insider transactions found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isBuy = tx.transactionType.includes('Purchase');
                    const isPledge = tx.transactionType.includes('Pledge');
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 750, color: '#0F172A' }}>{tx.symbol}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{tx.date}</div>
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 650, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {tx.personName}
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 650,
                            background: '#F1F5F9',
                            color: '#334155',
                            whiteSpace: 'nowrap',
                          }}>
                            {tx.personCategory}
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
                            background: isBuy ? 'rgba(16, 185, 129, 0.12)' : isPledge ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isBuy ? '#059669' : isPledge ? '#D97706' : '#DC2626',
                            whiteSpace: 'nowrap',
                          }}>
                            {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {tx.transactionType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                          {(tx.sharesTraded ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: isBuy ? '#059669' : '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{(tx.valueLakh >= 100 ? `${(tx.valueLakh / 100).toFixed(2)} Cr` : `${tx.valueLakh.toFixed(1)} L`)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {tx.postHoldingPct.toFixed(2)}%
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
