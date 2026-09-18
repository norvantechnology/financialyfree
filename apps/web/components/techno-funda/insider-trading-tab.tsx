'use client';

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, X, Download} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = data?.transactions || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (t.symbol || '').toLowerCase().includes(q) ||
        (t.companyName || '').toLowerCase().includes(q) ||
        (t.personName || '').toLowerCase().includes(q);

      const txType = t.transactionType || '';
      const category = t.personCategory || '';
      const mode = t.modeOfAcquisition || '';

      let matchesType = true;
      if (typeFilter === 'BUY') {
        matchesType = /buy|purchas|acqui|subscri/i.test(txType);
      } else if (typeFilter === 'SELL') {
        matchesType = /sell|sale|dispos/i.test(txType) && !/pledge/i.test(txType);
      } else if (typeFilter === 'PLEDGE') {
        matchesType = /pledge/i.test(txType);
      }

      let matchesPreset = true;
      if (presetFilter === 'PROMOTER_BUYS') {
        matchesPreset = /promoter/i.test(category) && /buy|purchas|acqui|subscri/i.test(txType);
      } else if (presetFilter === 'PLEDGES') {
        matchesPreset = /pledge/i.test(txType);
      } else if (presetFilter === 'MARKET_ONLY') {
        matchesPreset = /market/i.test(mode) || /market/i.test(txType);
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
        title="Loading insider trading disclosures..."
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
        <div className="tf-filter-bar">
          <div className="tf-search-input-wrap">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search promoter, director, or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search insider filings"
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

          <div className="tf-segmented-pills">
            {(['ALL', 'BUY', 'SELL', 'PLEDGE'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTypeFilter(mode)}
                className={typeFilter === mode ? 'is-active' : undefined}
              >
                {mode === 'ALL' ? 'All' : mode === 'BUY' ? 'Buys' : mode === 'SELL' ? 'Sells' : 'Pledges'}
              </button>
            ))}
          </div>

          <div className="tf-filter-actions">
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
            All Filings
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('PROMOTER_BUYS')}
            className={`tf-preset-chip ${presetFilter === 'PROMOTER_BUYS' ? 'tf-preset-chip-active' : ''}`}
          >
            Promoter Buys
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
            Open Market
          </button>
        </div>

        <div className="tf-filter-meta">
          <span>
            Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} filings
          </span>
          {(searchQuery || typeFilter !== 'ALL' || presetFilter !== 'ALL') && (
            <button
              type="button"
              className="tf-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setPresetFilter('ALL');
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
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
                      {transactions.length === 0
                        ? ((data as any)?.message || 'No insider filings available from NSE PIT right now. Try Refresh.')
                        : 'No filings match the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isBuy = /buy|purchas|acqui|subscri/i.test(tx.transactionType || '');
                    const isPledge = /pledge/i.test(tx.transactionType || '');
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
                            whiteSpace: 'nowrap' }}>
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
                            whiteSpace: 'nowrap' }}>
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
