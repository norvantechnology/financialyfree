'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Info,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { TfLoadingState } from './tf-loading-state';

export interface PeadEventRow {
  symbol: string;
  name?: string;
  companyName?: string;
  surprise?: number;
  surprisePct?: number;
  yoyRev?: number;
  yoyPat?: number;
  drift20d?: number;
  dailyRet?: number;
  resultDate?: string;
  stage?: string;
  currentPe?: number | string;
  forwardPe?: number | string;
  currentPrice?: number;
  actualEps?: number;
  expectedEps?: number;
}

interface PeadCandidatesDashboardProps {
  data: PeadEventRow[] | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onHowToUse?: () => void;
  onOpenPulse?: (companyName: string, symbol: string) => void;
}

type SortCol =
  | 'company'
  | 'score'
  | 'surprise'
  | 'yoyPat'
  | 'resultDate'
  | 'currentPe'
  | 'forwardPe'
  | 'returns'
  | 'dailyRet'
  | 'cmp';

type QuickChip = 'ALL' | 'BEATS' | 'STRONG_DRIFT' | 'HIGH_SCORE' | 'BREAKOUT';

function peadScore(row: PeadEventRow): number {
  const surp = row.surprise ?? row.surprisePct ?? 0;
  return Math.round(surp * 1.6 + (row.drift20d || 0) * 1.8);
}

function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

function fmtNum(v: number | string | null | undefined, digits = 1): string {
  if (v == null || v === '' || v === '-') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  if (!Number.isFinite(n) || n === 0) return '—';
  return n.toFixed(digits);
}

function pctColor(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(Number(v))) return '#64748B';
  return Number(v) >= 0 ? '#15803D' : '#B91C1C';
}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: 4 }} />;
  return dir === 'asc' ? (
    <ArrowUp size={11} style={{ marginLeft: 4, color: '#0F766E' }} />
  ) : (
    <ArrowDown size={11} style={{ marginLeft: 4, color: '#0F766E' }} />
  );
}

export function PeadCandidatesDashboard({
  data,
  isLoading,
  onRefresh,
  onHowToUse,
  onOpenPulse,
}: PeadCandidatesDashboardProps) {
  const [quarter, setQuarter] = useState<'current' | 'previous'>('current');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [minSurprise, setMinSurprise] = useState('');
  const [maxSurprise, setMaxSurprise] = useState('');
  const [minDrift, setMinDrift] = useState('');
  const [maxDrift, setMaxDrift] = useState('');
  const [chip, setChip] = useState<QuickChip>('ALL');
  const [sortCol, setSortCol] = useState<SortCol>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const rows = data || [];

  const filtered = useMemo(() => {
    return rows.filter((s) => {
      const days = daysSince(s.resultDate);
      if (days != null) {
        if (quarter === 'current' && days > 65) return false;
        if (quarter === 'previous' && days <= 65) return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sym = (s.symbol || '').toLowerCase();
        const name = (s.name || s.companyName || '').toLowerCase();
        if (!sym.includes(q) && !name.includes(q)) return false;
      }

      if (stageFilter !== 'All' && !s.stage?.toLowerCase().includes(stageFilter.toLowerCase())) {
        return false;
      }

      const surpriseVal = s.surprise ?? s.surprisePct ?? 0;
      if (minSurprise !== '' && surpriseVal < parseFloat(minSurprise)) return false;
      if (maxSurprise !== '' && surpriseVal > parseFloat(maxSurprise)) return false;

      const driftVal = s.drift20d ?? 0;
      if (minDrift !== '' && driftVal < parseFloat(minDrift)) return false;
      if (maxDrift !== '' && driftVal > parseFloat(maxDrift)) return false;

      const score = peadScore(s);
      if (chip === 'BEATS' && surpriseVal < 5) return false;
      if (chip === 'STRONG_DRIFT' && driftVal < 5) return false;
      if (chip === 'HIGH_SCORE' && score < 30) return false;
      if (chip === 'BREAKOUT' && !/breakout/i.test(s.stage || '')) return false;

      return true;
    });
  }, [rows, quarter, search, stageFilter, minSurprise, maxSurprise, minDrift, maxDrift, chip]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const surpA = a.surprise ?? a.surprisePct ?? 0;
      const surpB = b.surprise ?? b.surprisePct ?? 0;
      let cmp = 0;
      switch (sortCol) {
        case 'company':
          cmp = (a.symbol || '').localeCompare(b.symbol || '');
          break;
        case 'score':
          cmp = peadScore(a) - peadScore(b);
          break;
        case 'surprise':
          cmp = surpA - surpB;
          break;
        case 'yoyPat':
          cmp = (a.yoyPat ?? 0) - (b.yoyPat ?? 0);
          break;
        case 'resultDate':
          cmp = new Date(a.resultDate || 0).getTime() - new Date(b.resultDate || 0).getTime();
          break;
        case 'currentPe':
          cmp = (parseFloat(String(a.currentPe || '')) || 0) - (parseFloat(String(b.currentPe || '')) || 0);
          break;
        case 'forwardPe':
          cmp = (parseFloat(String(a.forwardPe || '')) || 0) - (parseFloat(String(b.forwardPe || '')) || 0);
          break;
        case 'returns':
          cmp = (a.drift20d ?? 0) - (b.drift20d ?? 0);
          break;
        case 'dailyRet':
          cmp = (a.dailyRet ?? 0) - (b.dailyRet ?? 0);
          break;
        case 'cmp':
          cmp = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortCol, sortDir]);

  const kpis = useMemo(() => {
    if (sorted.length === 0) {
      return { avgSurprise: 0, posDrift: 0, highScore: 0, avgDrift: 0 };
    }
    const avgSurprise =
      sorted.reduce((a, r) => a + (r.surprise ?? r.surprisePct ?? 0), 0) / sorted.length;
    const avgDrift = sorted.reduce((a, r) => a + (r.drift20d ?? 0), 0) / sorted.length;
    const posDrift = sorted.filter((r) => (r.drift20d ?? 0) > 0).length;
    const highScore = sorted.filter((r) => peadScore(r) >= 30).length;
    return { avgSurprise, posDrift, highScore, avgDrift };
  }, [sorted]);

  const toggleSort = (col: SortCol, defaultDir: 'asc' | 'desc' = 'desc') => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir(defaultDir);
    }
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    stageFilter !== 'All' ||
    minSurprise !== '' ||
    maxSurprise !== '' ||
    minDrift !== '' ||
    maxDrift !== '' ||
    chip !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setStageFilter('All');
    setMinSurprise('');
    setMaxSurprise('');
    setMinDrift('');
    setMaxDrift('');
    setChip('ALL');
  };

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading PEAD Screener…"
        subtitle="Fetching post-earnings surprises and 20-day price drift from live filings."
        variant="table"
        rows={8}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="pead-empty">
        <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
        <h3>No PEAD Drift Data Available</h3>
        <p>No active quarterly earnings drift setups found in the current feed.</p>
        {onRefresh && (
          <button type="button" className="pead-primary-btn" onClick={onRefresh}>
            <RefreshCw size={14} /> Retry / Reconnect Feed
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pead-dash">
      {/* Title + quarter */}
      <div className="pead-dash-top">
        <div>
          <h3 className="pead-dash-title">PEAD Candidates</h3>
          <p className="pead-dash-sub">
            Post-earnings announcement drift — surprise, fundamentals &amp; 20-day price reaction
          </p>
        </div>
        <div className="pead-dash-top-actions">
          <div className="pead-seg">
            <button
              type="button"
              className={quarter === 'current' ? 'pead-seg-active' : ''}
              onClick={() => setQuarter('current')}
            >
              Current Q
            </button>
            <button
              type="button"
              className={quarter === 'previous' ? 'pead-seg-active' : ''}
              onClick={() => setQuarter('previous')}
            >
              Previous Q
            </button>
          </div>
          {onHowToUse && (
            <button type="button" className="pead-ghost-btn" onClick={onHowToUse}>
              <Info size={13} /> How it works
            </button>
          )}
          {onRefresh && (
            <button type="button" className="pead-ghost-btn" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw size={13} className={isLoading ? 'pead-spin' : undefined} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* KPI strip — Screener-style summary */}
      <div className="pead-kpi-strip">
        <div className="pead-kpi">
          <span className="pead-kpi-label">Screened</span>
          <span className="pead-kpi-val">{sorted.length}</span>
        </div>
        <div className="pead-kpi">
          <span className="pead-kpi-label">Avg Surprise</span>
          <span className="pead-kpi-val" style={{ color: pctColor(kpis.avgSurprise) }}>
            {fmtPct(kpis.avgSurprise)}
          </span>
        </div>
        <div className="pead-kpi">
          <span className="pead-kpi-label">Avg 20D Drift</span>
          <span className="pead-kpi-val" style={{ color: pctColor(kpis.avgDrift) }}>
            {fmtPct(kpis.avgDrift)}
          </span>
        </div>
        <div className="pead-kpi">
          <span className="pead-kpi-label">Positive Drift</span>
          <span className="pead-kpi-val">
            {kpis.posDrift}
            <span className="pead-kpi-muted">/{sorted.length}</span>
          </span>
        </div>
        <div className="pead-kpi">
          <span className="pead-kpi-label">High Score (≥30)</span>
          <span className="pead-kpi-val" style={{ color: '#0F766E' }}>
            {kpis.highScore}
          </span>
        </div>
      </div>

      {/* Always-visible query bar */}
      <div className="pead-query-bar">
        <div className="pead-search-wrap">
          <Search size={14} className="pead-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or NSE symbol…"
            aria-label="Search PEAD candidates"
          />
          {search && (
            <button type="button" className="pead-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="pead-chips">
          {(
            [
              { id: 'ALL' as const, label: 'All' },
              { id: 'BEATS' as const, label: 'Beats ≥5%' },
              { id: 'STRONG_DRIFT' as const, label: 'Drift ≥5%' },
              { id: 'HIGH_SCORE' as const, label: 'Score ≥30' },
              { id: 'BREAKOUT' as const, label: 'Breakout' },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`pead-chip ${chip === c.id ? 'pead-chip-active' : ''}`}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`pead-ghost-btn ${showAdvanced ? 'pead-ghost-btn-on' : ''}`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <Filter size={13} />
          Filters
        </button>

        {hasActiveFilters && (
          <button type="button" className="pead-reset-btn" onClick={resetFilters}>
            Clear
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="pead-advanced">
          <label className="pead-field">
            <span>Stage</span>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="All">All stages</option>
              <option value="Breakout">Stage 2 Breakout</option>
              <option value="Consolidating">Consolidating</option>
            </select>
          </label>
          <label className="pead-field">
            <span>Surprise %</span>
            <div className="pead-range">
              <input type="number" placeholder="Min" value={minSurprise} onChange={(e) => setMinSurprise(e.target.value)} />
              <span>–</span>
              <input type="number" placeholder="Max" value={maxSurprise} onChange={(e) => setMaxSurprise(e.target.value)} />
            </div>
          </label>
          <label className="pead-field">
            <span>20D Drift %</span>
            <div className="pead-range">
              <input type="number" placeholder="Min" value={minDrift} onChange={(e) => setMinDrift(e.target.value)} />
              <span>–</span>
              <input type="number" placeholder="Max" value={maxDrift} onChange={(e) => setMaxDrift(e.target.value)} />
            </div>
          </label>
        </div>
      )}

      {/* Mobile cards */}
      <div className="tf-mobile-only pead-mobile-list">
        <div className="pead-mobile-sort">
          <span>Sort</span>
          <select value={sortCol} onChange={(e) => setSortCol(e.target.value as SortCol)}>
            <option value="score">PEAD Score</option>
            <option value="surprise">Surprise %</option>
            <option value="returns">20D Drift</option>
            <option value="yoyPat">YoY PAT</option>
            <option value="company">Name</option>
            <option value="resultDate">Result Date</option>
          </select>
          <button type="button" className="pead-ghost-btn" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
            <ArrowUpDown size={12} /> {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        {sorted.map((s) => {
          const name = s.name || s.companyName || s.symbol;
          const surp = s.surprise ?? s.surprisePct ?? 0;
          const score = peadScore(s);
          const days = daysSince(s.resultDate);
          return (
            <article key={s.symbol} className="pead-card">
              <header className="pead-card-head">
                <div>
                  <a
                    className="pead-name-link"
                    href={`https://www.screener.in/company/${encodeURIComponent(s.symbol)}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {name}
                  </a>
                  <div className="pead-sym-row">
                    <span className="pead-sym">{s.symbol}</span>
                    {s.stage && <span className="pead-stage-pill">{s.stage}</span>}
                  </div>
                </div>
                <div className="pead-score-badge" data-tone={score >= 30 ? 'good' : score >= 0 ? 'mid' : 'bad'}>
                  {score > 0 ? `+${score}` : score}
                </div>
              </header>
              <div className="pead-card-grid">
                <div>
                  <span>CMP</span>
                  <strong>₹{fmtNum(s.currentPrice, 2)}</strong>
                </div>
                <div>
                  <span>Surprise</span>
                  <strong style={{ color: pctColor(surp) }}>{fmtPct(surp)}</strong>
                </div>
                <div>
                  <span>YoY PAT</span>
                  <strong style={{ color: pctColor(s.yoyPat) }}>{fmtPct(s.yoyPat)}</strong>
                </div>
                <div>
                  <span>20D Drift</span>
                  <strong style={{ color: pctColor(s.drift20d) }}>{fmtPct(s.drift20d)}</strong>
                </div>
                <div>
                  <span>PE / Fwd</span>
                  <strong>
                    {fmtNum(s.currentPe)} / {fmtNum(s.forwardPe)}
                  </strong>
                </div>
                <div>
                  <span>Days</span>
                  <strong>{days != null ? days : '—'}</strong>
                </div>
              </div>
              {onOpenPulse && (
                <button type="button" className="pead-pulse-btn" onClick={() => onOpenPulse(name, s.symbol)}>
                  <TrendingUp size={12} /> Earnings Pulse
                </button>
              )}
            </article>
          );
        })}
        {sorted.length === 0 && <div className="pead-no-rows">No candidates match these filters.</div>}
      </div>

      {/* Desktop Screener-style table */}
      <div className="pead-table-wrap tf-desktop-only">
        <table className="pead-table">
          <thead>
            <tr>
              <th className="pead-th-sticky pead-th-sortable" onClick={() => toggleSort('company', 'asc')}>
                Name
                <SortIcon active={sortCol === 'company'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('cmp')}>
                CMP
                <SortIcon active={sortCol === 'cmp'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('surprise')}>
                Surprise %
                <SortIcon active={sortCol === 'surprise'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('yoyPat')}>
                YoY PAT %
                <SortIcon active={sortCol === 'yoyPat'} dir={sortDir} />
              </th>
              <th className="pead-th-num">YoY Sales %</th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('currentPe', 'asc')}>
                PE
                <SortIcon active={sortCol === 'currentPe'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('forwardPe', 'asc')}>
                Fwd PE
                <SortIcon active={sortCol === 'forwardPe'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('returns')}>
                20D Drift
                <SortIcon active={sortCol === 'returns'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('dailyRet')}>
                Day %
                <SortIcon active={sortCol === 'dailyRet'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('score')}>
                Score
                <SortIcon active={sortCol === 'score'} dir={sortDir} />
              </th>
              <th className="pead-th-num pead-th-sortable" onClick={() => toggleSort('resultDate')}>
                Result
                <SortIcon active={sortCol === 'resultDate'} dir={sortDir} />
              </th>
              <th>Stage</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const name = s.name || s.companyName || s.symbol;
              const surp = s.surprise ?? s.surprisePct ?? 0;
              const score = peadScore(s);
              const days = daysSince(s.resultDate);
              const resultLabel = s.resultDate
                ? String(s.resultDate).includes('T')
                  ? String(s.resultDate).split('T')[0]
                  : String(s.resultDate)
                : '—';

              return (
                <tr key={s.symbol}>
                  <td className="pead-td-sticky">
                    <a
                      className="pead-name-link"
                      href={`https://www.screener.in/company/${encodeURIComponent(s.symbol)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${s.symbol} on Screener`}
                    >
                      {name}
                    </a>
                    <div className="pead-sym-row">
                      <span className="pead-sym">{s.symbol}</span>
                      {days != null && <span className="pead-days">{days}d ago</span>}
                    </div>
                  </td>
                  <td className="pead-td-num">{s.currentPrice ? `₹${fmtNum(s.currentPrice, 2)}` : '—'}</td>
                  <td className="pead-td-num" style={{ color: pctColor(surp), fontWeight: 700 }}>
                    {fmtPct(surp)}
                  </td>
                  <td className="pead-td-num" style={{ color: pctColor(s.yoyPat), fontWeight: 650 }}>
                    {fmtPct(s.yoyPat)}
                  </td>
                  <td className="pead-td-num" style={{ color: pctColor(s.yoyRev) }}>
                    {fmtPct(s.yoyRev)}
                  </td>
                  <td className="pead-td-num">{fmtNum(s.currentPe)}</td>
                  <td className="pead-td-num" style={{ color: '#0F766E', fontWeight: 650 }}>
                    {fmtNum(s.forwardPe)}
                  </td>
                  <td className="pead-td-num" style={{ color: pctColor(s.drift20d), fontWeight: 700 }}>
                    {fmtPct(s.drift20d)}
                  </td>
                  <td className="pead-td-num" style={{ color: pctColor(s.dailyRet), fontWeight: 650 }}>
                    {fmtPct(s.dailyRet)}
                  </td>
                  <td className="pead-td-num">
                    <span
                      className="pead-score-badge"
                      data-tone={score >= 30 ? 'good' : score >= 0 ? 'mid' : 'bad'}
                    >
                      {score > 0 ? `+${score}` : score}
                    </span>
                  </td>
                  <td className="pead-td-num pead-td-muted">{resultLabel}</td>
                  <td>
                    {s.stage ? <span className="pead-stage-pill">{s.stage.replace('Stage 2 ', '')}</span> : '—'}
                  </td>
                  <td>
                    {onOpenPulse && (
                      <button
                        type="button"
                        className="pead-pulse-btn pead-pulse-btn-sm"
                        onClick={() => onOpenPulse(name, s.symbol)}
                      >
                        Pulse
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={13} className="pead-no-rows">
                  No candidates match these filters. Try clearing chips or widening ranges.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="pead-footnote">
        Company names link to Screener.in for deeper ratios. PEAD score = Surprise×1.6 + 20D Drift×1.8. Live CMP &amp;
        drift from exchange/Yahoo quotes where available.
      </p>
    </div>
  );
}
