'use client';

import React, { useState } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface StrikeOiItem {
  strikePrice: number;
  callOi: number;
  putOi: number;
  callOiChange: number;
  putOiChange: number;
}

export interface FnoIndexItem {
  symbol: string;
  name: string;
  spotPrice: number;
  pcr: number;
  pcrSentiment: string;
  maxPainStrike: number;
  totalCallOi: number;
  totalPutOi: number;
  highestCallOiStrike: number;
  highestPutOiStrike: number;
  rolloverPct: number;
  expiryDate: string;
  strikes: StrikeOiItem[];
}

export interface FnoOiGainerItem {
  symbol: string;
  cmp: number;
  oiChangePct: number;
  priceChangePct: number;
  interpretation: string;
}

export interface FnoAnalyticsData {
  lastUpdated: string;
  source: string;
  indices: FnoIndexItem[];
  topOiGainers: FnoOiGainerItem[];
}

interface FnoAnalyticsTabProps {
  data: FnoAnalyticsData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function FnoAnalyticsTab({ data, isLoading, onRefresh }: FnoAnalyticsTabProps) {
  const [selectedIndex, setSelectedIndex] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');

  const currentIndex = data?.indices.find((i) => i.symbol === selectedIndex) || data?.indices[0];

  const handleExportCsv = () => {
    const headers = ['Symbol', 'CMP (₹)', 'Price Chg %', 'OI Chg %', 'Derivative Signal'];
    const rows = (data?.topOiGainers || []).map((stock) => [
      stock.symbol,
      stock.cmp,
      `${stock.priceChangePct >= 0 ? '+' : ''}${stock.priceChangePct.toFixed(2)}%`,
      `+${stock.oiChangePct != null ? stock.oiChangePct.toFixed(1) : '—'}%`,
      stock.interpretation,
    ]);
    exportTableToCsv(`NSE_FNO_DERIVATIVE_SIGNALS_${selectedIndex}`, headers, rows);
  };

  const maxOiInStrikes = Math.max(
    ...(currentIndex?.strikes.map((s) => Math.max(s.callOi, s.putOi)) || [1])
  );

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading F&O open interest…"
        subtitle="Pulling live exchange and market data for this workspace."
        variant="cards"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


      {/* ── Top Index Selector & Refresh Bar ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          <div className="tf-segmented-pills">
            {(['NIFTY', 'BANKNIFTY'] as const).map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={selectedIndex === idx ? 'is-active' : undefined}
                style={
                  selectedIndex === idx
                    ? { background: '#0F172A', color: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                    : undefined
                }
              >
                {idx === 'NIFTY' ? 'Nifty 50 F&O' : 'Bank Nifty F&O'}
              </button>
            ))}
          </div>

          <div className="tf-filter-actions">
            <span style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
              Expiry: <strong style={{ color: '#0F172A' }}>{currentIndex?.expiryDate || 'Near Monthly'}</strong>
            </span>
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
      </div>

      {/* ── Metrics Grid (2x2 on Mobile, 4-col on Desktop) ── */}
      <div className="tf-kpi-grid-responsive">
        {/* Put-Call Ratio (PCR) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Put-Call Ratio (PCR)
            </span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: (currentIndex?.pcr ?? 1) >= 1.0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: (currentIndex?.pcr ?? 1) >= 1.0 ? '#059669' : '#DC2626' }}>
              {currentIndex?.pcrSentiment}
            </span>
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            {currentIndex?.pcr != null ? currentIndex.pcr.toFixed(2) : '—'}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {currentIndex?.pcr && currentIndex.pcr > 1.15
              ? 'Bullish: Put writing support'
              : currentIndex?.pcr && currentIndex.pcr < 0.85
              ? 'Bearish: Heavy call writing'
              : 'Neutral balanced open interest'}
          </div>
        </div>

        {/* Max Pain Strike */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Max Pain Strike
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#4338CA', marginTop: '6px' }}>
            {currentIndex?.maxPainStrike != null ? currentIndex.maxPainStrike.toLocaleString('en-IN') : '—'}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            Least option seller loss strike
          </div>
        </div>

        {/* Key Resistance (Highest Call OI) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Resistance (Call Wall)
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
            {currentIndex?.highestCallOiStrike != null ? currentIndex.highestCallOiStrike.toLocaleString('en-IN') : '—'}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            Highest Call concentration
          </div>
        </div>

        {/* Key Support (Highest Put OI) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Support (Put Base)
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {currentIndex?.highestPutOiStrike != null ? currentIndex.highestPutOiStrike.toLocaleString('en-IN') : '—'}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            Highest Put concentration
          </div>
        </div>
      </div>

      {/* ── Visual Strike Open Interest Distribution ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              Strike-Wise Open Interest Distribution
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Green = Put OI (Support Floor) | Red = Call OI (Resistance Ceiling)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10B981' }} />
              Put OI
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#DC2626' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#EF4444' }} />
              Call OI
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentIndex?.strikes.map((s) => {
            const putPct = (s.putOi / maxOiInStrikes) * 100;
            const callPct = (s.callOi / maxOiInStrikes) * 100;
            const isAtMaxPain = s.strikePrice === currentIndex.maxPainStrike;
            return (
              <div key={s.strikePrice} style={{ display: 'grid', gridTemplateColumns: '1fr minmax(64px, 80px) 1fr', alignItems: 'center', gap: '8px' }}>
                {/* Left: Put OI Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, minWidth: '34px', textAlign: 'right' }}>
                    {(s.putOi / 100000).toFixed(1)}L
                  </span>
                  <div style={{ width: '100%', maxWidth: '200px', background: '#F1F5F9', height: '16px', borderRadius: '3px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: `${putPct}%`, background: '#10B981', height: '100%', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Center: Strike Price */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: isAtMaxPain ? '#4338CA' : '#0F172A',
                  background: isAtMaxPain ? '#EEF2FF' : '#F8FAFC',
                  padding: '3px 4px',
                  borderRadius: '5px',
                  border: isAtMaxPain ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                  whiteSpace: 'nowrap' }}>
                  {s.strikePrice}
                </div>

                {/* Right: Call OI Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '100%', maxWidth: '200px', background: '#F1F5F9', height: '16px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${callPct}%`, background: '#EF4444', height: '100%', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, minWidth: '34px' }}>
                    {(s.callOi / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top OI Gainers & Technical Signals Table ── */}
      <div>
        <div className="tf-mobile-scroll-hint">
          <span>← Swipe table horizontally for F&O buidups →</span>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
                Top F&O Open Interest Buildups
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                Price + OI correlation signals: Long Buildup, Short Covering, or Aggressive Shorting
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download F&O Signals to Excel/CSV"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '110px' }}>Symbol</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>CMP (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '110px' }}>Price Chg %</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>OI Chg %</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '140px' }}>Derivative Signal</th>
                </tr>
              </thead>
              <tbody>
                {data?.topOiGainers.map((stock) => {
                  const isPriceUp = stock.priceChangePct >= 0;
                  let bg = '#F1F5F9';
                  let color = '#475569';
                  let border = '#E2E8F0';
                  if (stock.interpretation === 'Long Buildup') {
                    bg = '#DCFCE7';
                    color = '#15803D';
                    border = '#86EFAC';
                  } else if (stock.interpretation === 'Short Covering') {
                    bg = '#EEF2FF';
                    color = '#4338CA';
                    border = '#C7D2FE';
                  } else if (stock.interpretation === 'Short Buildup') {
                    bg = '#FEE2E2';
                    color = '#991B1B';
                    border = '#FECACA';
                  }

                  return (
                    <tr key={stock.symbol} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                      <td className="tf-sticky-symbol-cell" style={{ padding: '12px 16px', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {stock.symbol}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 650, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        ₹{(stock.cmp ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: isPriceUp ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                          {isPriceUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isPriceUp ? `+${stock.priceChangePct.toFixed(2)}%` : `${stock.priceChangePct.toFixed(2)}%`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {stock.oiChangePct != null ? `+${stock.oiChangePct.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 750,
                          background: bg,
                          color: color,
                          border: `1px solid ${border}` }}>
                          {stock.interpretation}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
