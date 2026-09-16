'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Compass,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface SectorItem {
  symbol: string;
  name: string;
  ticker?: string;
  current: number;
  currentPrice?: number;
  changePct1D?: number;
  changePct1W?: number;
  changePct1M?: number;
  changePctYtd?: number;
  return1D?: number;
  return1W?: number;
  return1M?: number;
  rs1D?: number;
  rs1W?: number;
  rs1M?: number;
  compositeScore?: number;
  rank?: number;
  advances?: number;
  declines?: number;
  topGainer?: { symbol: string; changePct: number };
  topLoser?: { symbol: string; changePct: number };
  peRatio?: number;
  rotationState?: 'Leading' | 'Weakening' | 'Lagging' | 'Improving';
  quadrant?: 'Leading' | 'Weakening' | 'Lagging' | 'Improving';
  quadrantLabel?: string;
  quadrantDescription?: string;
  quadrantColor?: string;
  momentumTrend?: 'ACCELERATING' | 'DECELERATING' | 'STABLE';
}

export interface SectorHeatmapData {
  lastUpdated: string;
  source: string;
  totalSectors: number;
  isLive?: boolean;
  benchmark?: {
    ticker: string;
    name: string;
    currentPrice: number;
    return1D: number;
    return1W: number;
    return1M: number;
  };
  sectors: SectorItem[];
  quadrantSummary?: {
    leadingCount: number;
    weakeningCount: number;
    laggingCount: number;
    improvingCount: number;
  };
}

interface SectorHeatmapTabProps {
  data: SectorHeatmapData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SectorHeatmapTab({ data, isLoading, onRefresh }: SectorHeatmapTabProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1M');
  const [quadrantFilter, setQuadrantFilter] = useState<'ALL' | 'Leading' | 'Weakening' | 'Lagging' | 'Improving'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const rawSectors = data?.sectors || [];

  // Normalize sectors to handle both new calculation shape and legacy shapes
  const sectors = useMemo(() => {
    return rawSectors.map((s) => {
      const current = s.currentPrice ?? s.current ?? 0;
      const ret1D = s.return1D ?? s.changePct1D ?? 0;
      const ret1W = s.return1W ?? s.changePct1W ?? 0;
      const ret1M = s.return1M ?? s.changePct1M ?? 0;
      const quadrant = s.quadrant || s.rotationState || 'Lagging';

      return {
        ...s,
        current,
        return1D: ret1D,
        return1W: ret1W,
        return1M: ret1M,
        quadrant,
        compositeScore: s.compositeScore ?? (Math.round((0.2 * (s.rs1D || 0) + 0.3 * (s.rs1W || 0) + 0.5 * (s.rs1M || 0)) * 100) / 100) };
    });
  }, [rawSectors]);

  const filteredSectors = useMemo(() => {
    return sectors.filter((sec) => {
      if (quadrantFilter !== 'ALL' && sec.quadrant !== quadrantFilter) return false;
      return true;
    });
  }, [sectors, quadrantFilter]);

  const benchmark = data?.benchmark || {
    name: 'NIFTY 50 Benchmark',
    currentPrice: 0,
    return1D: 0,
    return1W: 0,
    return1M: 0 };

  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'Sector Index',
      'Name',
      'Current Level',
      '1D Return %',
      '1W Return %',
      '1M Return %',
      'RS vs Nifty (1D)',
      'RS vs Nifty (1W)',
      'RS vs Nifty (1M)',
      'Composite RS',
      'RRG Quadrant',
    ];
    const rows = filteredSectors.map((sec) => [
      sec.rank || '—',
      sec.symbol,
      sec.name,
      sec.current,
      `${sec.return1D >= 0 ? '+' : ''}${sec.return1D.toFixed(2)}%`,
      `${sec.return1W >= 0 ? '+' : ''}${sec.return1W.toFixed(2)}%`,
      `${sec.return1M >= 0 ? '+' : ''}${sec.return1M.toFixed(2)}%`,
      sec.rs1D !== undefined ? `${sec.rs1D >= 0 ? '+' : ''}${sec.rs1D.toFixed(2)}%` : '—',
      sec.rs1W !== undefined ? `${sec.rs1W >= 0 ? '+' : ''}${sec.rs1W.toFixed(2)}%` : '—',
      sec.rs1M !== undefined ? `${sec.rs1M >= 0 ? '+' : ''}${sec.rs1M.toFixed(2)}%` : '—',
      sec.compositeScore !== undefined ? sec.compositeScore : '—',
      sec.quadrant,
    ]);
    exportTableToCsv(`NSE_Sector_Rotation_${timeframe}`, headers, rows);
  };

  const getHeatBg = (pct: number) => {
    if (pct >= 2.0) return 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.04) 100%)';
    if (pct > 0) return 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)';
    if (pct <= -2.0) return 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(239, 68, 68, 0.04) 100%)';
    return 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)';
  };

  const getHeatBorder = (pct: number) => {
    if (pct >= 2.0) return 'rgba(16, 185, 129, 0.35)';
    if (pct > 0) return 'rgba(16, 185, 129, 0.2)';
    if (pct <= -2.0) return 'rgba(239, 68, 68, 0.35)';
    return 'rgba(239, 68, 68, 0.2)';
  };

  const getQuadrantBadge = (quadrant: string) => {
    switch (quadrant) {
      case 'Leading':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Leading Leader' };
      case 'Improving':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Improving Momentum' };
      case 'Weakening':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Weakening Leader' };
      default:
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', label: 'Lagging Sector' };
    }
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading sector heatmap…"
        subtitle="Pulling live exchange and market data for this workspace."
        variant="cards"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Benchmark & Rotation Overview Bar ── */}
      <div
        style={{
          background: '#0F172A',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0F766E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center' }}
          >
            <Compass size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Benchmark Reference
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                {data?.isLive ? 'LIVE 3MO CANDLES' : 'UNAVAILABLE'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <strong style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                {benchmark.name}
              </strong>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8' }}>
                ₹{(benchmark.currentPrice ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>

        {/* Benchmark Returns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>1D Benchmark</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: benchmark.return1D >= 0 ? '#34D399' : '#F87171' }}>
              {benchmark.return1D >= 0 ? '+' : ''}{benchmark.return1D.toFixed(2)}%
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>1W Benchmark</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: benchmark.return1W >= 0 ? '#34D399' : '#F87171' }}>
              {benchmark.return1W >= 0 ? '+' : ''}{benchmark.return1W.toFixed(2)}%
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>1M Benchmark</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: benchmark.return1M >= 0 ? '#34D399' : '#F87171' }}>
              {benchmark.return1M >= 0 ? '+' : ''}{benchmark.return1M.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>


      {/* ── Header Controls & Quadrant Filters ── */}
      <div className="tf-filter-card">
        <div className="tf-filter-bar">
          <div className="tf-filter-group">
            <span className="tf-filter-label">Timeframe</span>
            <div className="tf-segmented-pills">
              {(['1D', '1W', '1M'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={timeframe === tf ? 'is-active' : undefined}
                  style={
                    timeframe === tf
                      ? { background: '#0F172A', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                      : undefined
                  }
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="tf-segmented-pills">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'is-active' : undefined}
            >
              <LayoutGrid size={13} />
              <span>Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'is-active' : undefined}
            >
              <TableIcon size={13} />
              <span>RRG Table</span>
            </button>
          </div>

          <div className="tf-filter-actions">
            <button
              type="button"
              onClick={handleExportCsv}
              className="tf-export-btn"
              title="Download sectoral rotation data to CSV"
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
          <span className="tf-filter-label">Quadrants</span>
          <button
            type="button"
            onClick={() => setQuadrantFilter('ALL')}
            className={`tf-preset-chip ${quadrantFilter === 'ALL' ? 'tf-preset-chip-active' : ''}`}
          >
            All ({sectors.length})
          </button>
          <button
            type="button"
            onClick={() => setQuadrantFilter('Leading')}
            className={`tf-preset-chip ${quadrantFilter === 'Leading' ? 'tf-preset-chip-active' : ''}`}
            style={{ color: quadrantFilter === 'Leading' ? undefined : '#15803D' }}
          >
            Leading ({sectors.filter((s) => s.quadrant === 'Leading').length})
          </button>
          <button
            type="button"
            onClick={() => setQuadrantFilter('Improving')}
            className={`tf-preset-chip ${quadrantFilter === 'Improving' ? 'tf-preset-chip-active' : ''}`}
            style={{ color: quadrantFilter === 'Improving' ? undefined : '#0369A1' }}
          >
            Improving ({sectors.filter((s) => s.quadrant === 'Improving').length})
          </button>
          <button
            type="button"
            onClick={() => setQuadrantFilter('Weakening')}
            className={`tf-preset-chip ${quadrantFilter === 'Weakening' ? 'tf-preset-chip-active' : ''}`}
            style={{ color: quadrantFilter === 'Weakening' ? undefined : '#B45309' }}
          >
            Weakening ({sectors.filter((s) => s.quadrant === 'Weakening').length})
          </button>
          <button
            type="button"
            onClick={() => setQuadrantFilter('Lagging')}
            className={`tf-preset-chip ${quadrantFilter === 'Lagging' ? 'tf-preset-chip-active' : ''}`}
            style={{ color: quadrantFilter === 'Lagging' ? undefined : '#B91C1C' }}
          >
            Lagging ({sectors.filter((s) => s.quadrant === 'Lagging').length})
          </button>
        </div>
      </div>

      {/* ── VIEW 1: Grid Mode ── */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '14px' }}
        >
          {filteredSectors.map((sector) => {
            const changeVal =
              timeframe === '1D' ? sector.return1D : timeframe === '1W' ? sector.return1W : sector.return1M;
            const isUp = changeVal >= 0;
            const rot = getQuadrantBadge(sector.quadrant);

            return (
              <div
                key={sector.symbol}
                style={{
                  background: getHeatBg(changeVal),
                  border: `1px solid ${getHeatBorder(changeVal)}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                {/* Header: Name & Rotation Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {sector.symbol}
                      </h4>
                      {sector.rank && (
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                          #{sector.rank}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                      {sector.name}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: rot.bg,
                      color: rot.text,
                      border: `1px solid ${rot.border}`,
                      whiteSpace: 'nowrap' }}
                  >
                    {sector.quadrant}
                  </span>
                </div>

                {/* Index Value & Performance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A' }}>
                    {(sector.current ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: isUp ? '#059669' : '#DC2626' }}
                    >
                      {isUp ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      {isUp ? `+${changeVal.toFixed(2)}%` : `${changeVal.toFixed(2)}%`}
                    </span>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                      {timeframe} Nominal
                    </div>
                  </div>
                </div>

                {/* Multi-Timeframe Relative Strength Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>RS 1D</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: (sector.rs1D || 0) >= 0 ? '#059669' : '#DC2626' }}>
                      {sector.rs1D !== undefined ? `${sector.rs1D >= 0 ? '+' : ''}${sector.rs1D.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>RS 1W</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: (sector.rs1W || 0) >= 0 ? '#059669' : '#DC2626' }}>
                      {sector.rs1W !== undefined ? `${sector.rs1W >= 0 ? '+' : ''}${sector.rs1W.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>RS 1M</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: (sector.rs1M || 0) >= 0 ? '#059669' : '#DC2626' }}>
                      {sector.rs1M !== undefined ? `${sector.rs1M >= 0 ? '+' : ''}${sector.rs1M.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>

                {/* Footer: Composite Relative Strength Score */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#64748B',
                    paddingTop: '4px' }}
                >
                  <span>Composite RS Score:</span>
                  <strong style={{ color: (sector.compositeScore || 0) >= 0 ? '#059669' : '#DC2626', fontSize: '12px' }}>
                    {(sector.compositeScore || 0) >= 0 ? '+' : ''}{sector.compositeScore}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 2: Table Mode ── */}
      {viewMode === 'table' && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Rank</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Sector</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Level</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>1D Ret</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>1W Ret</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>1M Ret</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>RS 1M vs Nifty</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Composite RS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>RRG Quadrant</th>
              </tr>
            </thead>
            <tbody>
              {filteredSectors.map((sec, idx) => {
                const rot = getQuadrantBadge(sec.quadrant);
                return (
                  <tr key={sec.symbol} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>
                      #{sec.rank || idx + 1}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 750, color: '#0F172A' }}>{sec.symbol}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{sec.name}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                      {(sec.current ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: sec.return1D >= 0 ? '#059669' : '#DC2626' }}>
                      {sec.return1D >= 0 ? '+' : ''}{sec.return1D.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: sec.return1W >= 0 ? '#059669' : '#DC2626' }}>
                      {sec.return1W >= 0 ? '+' : ''}{sec.return1W.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: sec.return1M >= 0 ? '#059669' : '#DC2626' }}>
                      {sec.return1M >= 0 ? '+' : ''}{sec.return1M.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: (sec.rs1M || 0) >= 0 ? '#059669' : '#DC2626' }}>
                      {sec.rs1M !== undefined ? `${sec.rs1M >= 0 ? '+' : ''}${sec.rs1M.toFixed(2)}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: (sec.compositeScore || 0) >= 0 ? '#059669' : '#DC2626' }}>
                      {(sec.compositeScore || 0) >= 0 ? '+' : ''}{sec.compositeScore}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 750,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: rot.bg,
                          color: rot.text,
                          border: `1px solid ${rot.border}` }}
                      >
                        {sec.quadrant}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
