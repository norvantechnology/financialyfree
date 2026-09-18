'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  LineChart,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  OptionChainDto,
  OptionChainRowDto,
  OptionContractDto,
  OiBuildupType,
  OptionType,
  TradeSide,
} from '@ff/types';
import { NiftyCandlestickChart } from './nifty-candlestick-chart';
import '../../styles/options-lab.css';

type StrikeFilter = '10' | '15' | '20' | 'all';

type ColumnKey =
  | 'buildup'
  | 'volume'
  | 'oiChg'
  | 'oi'
  | 'ltp'
  | 'iv'
  | 'delta'
  | 'theta'
  | 'action';

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  buildup: true,
  volume: true,
  oiChg: true,
  oi: true,
  ltp: true,
  iv: true,
  delta: false,
  theta: false,
  action: true,
};

const COLUMN_LABELS: { key: ColumnKey; label: string }[] = [
  { key: 'buildup', label: 'Buildup' },
  { key: 'volume', label: 'Volume' },
  { key: 'oiChg', label: 'OI Chg%' },
  { key: 'oi', label: 'OI' },
  { key: 'ltp', label: 'LTP' },
  { key: 'iv', label: 'IV' },
  { key: 'delta', label: 'Delta' },
  { key: 'theta', label: 'Theta' },
  { key: 'action', label: 'Buy / Sell' },
];

interface OptionChainTableProps {
  chainData: OptionChainDto | null;
  symbol: string;
  selectedExpiry: string;
  isLoading?: boolean;
  onAddOrToggleLeg: (leg: {
    side: TradeSide;
    type: OptionType;
    strike: number;
    price: number;
    iv: number | null;
    expiry: string;
  }) => void;
}

function formatQty(n: number): string {
  if (!n || n <= 0) return '—';
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`;
  return n.toLocaleString('en-IN');
}

function formatLtp(n: number): string {
  if (!n || n <= 0) return '—';
  return n.toFixed(2);
}

function oiChgPct(contract: OptionContractDto): number | null {
  const oi = Number(contract.oi) || 0;
  const chg = Number(contract.oiChange) || 0;
  if (oi <= 0 && chg === 0) return null;
  const base = Math.max(oi - chg, Math.abs(chg), 1);
  return Math.round((chg / base) * 1000) / 10;
}

function buildupCode(b: OiBuildupType | string | undefined): {
  code: string;
  tone: 'long' | 'short' | 'cover' | 'unwind' | 'flat';
  title: string;
} {
  switch (b) {
    case 'Long Buildup':
      return { code: 'L', tone: 'long', title: 'Long Buildup' };
    case 'Short Buildup':
      return { code: 'S', tone: 'short', title: 'Short Buildup' };
    case 'Short Covering':
      return { code: 'SC', tone: 'cover', title: 'Short Covering' };
    case 'Long Unwinding':
      return { code: 'LU', tone: 'unwind', title: 'Long Unwinding' };
    default:
      return { code: '—', tone: 'flat', title: 'Neutral' };
  }
}

function BuildupBadge({ buildup }: { buildup: OiBuildupType | string | undefined }) {
  const { code, tone, title } = buildupCode(buildup);
  if (tone === 'flat') {
    return <span className="oc-buildup oc-buildup--flat" title={title}>—</span>;
  }
  const up = tone === 'long' || tone === 'cover';
  return (
    <span className={`oc-buildup oc-buildup--${tone}`} title={title}>
      {up ? <ArrowUp strokeWidth={2.5} /> : <ArrowDown strokeWidth={2.5} />}
      <span>{code}</span>
    </span>
  );
}

export const OptionChainTable: React.FC<OptionChainTableProps> = ({
  chainData,
  symbol,
  selectedExpiry,
  isLoading,
  onAddOrToggleLeg,
}) => {
  const [strikeFilter, setStrikeFilter] = useState<StrikeFilter>('15');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColMenu, setShowColMenu] = useState(false);
  const [chartContract, setChartContract] = useState<{
    strike: number;
    type: OptionType;
    ltp: number;
    changePct: number;
  } | null>(null);

  const spot = chainData?.spotPrice || 0;
  const atmStrike = chainData?.atmStrike || 0;
  const maxPain = chainData?.maxPain || 0;

  const rows = useMemo(() => {
    const all = chainData?.contracts || [];
    if (strikeFilter === 'all' || all.length === 0) return all;
    const limit = parseInt(strikeFilter, 10);
    const atmIndex = all.findIndex((c) => c.strike >= atmStrike);
    const idx = atmIndex >= 0 ? atmIndex : Math.floor(all.length / 2);
    const start = Math.max(0, idx - limit);
    const end = Math.min(all.length, idx + limit + 1);
    return all.slice(start, end);
  }, [chainData?.contracts, strikeFilter, atmStrike]);

  const maxOi = useMemo(() => {
    let m = 1;
    rows.forEach((r) => {
      if (r.ce.oi > m) m = r.ce.oi;
      if (r.pe.oi > m) m = r.pe.oi;
    });
    return m;
  }, [rows]);

  const summary = useMemo(() => {
    const all = chainData?.contracts || [];
    let itmCeOi = 0;
    let itmPeOi = 0;
    let otmCeOi = 0;
    let otmPeOi = 0;
    let itmCeVol = 0;
    let itmPeVol = 0;
    let otmCeVol = 0;
    let otmPeVol = 0;
    let atmCeOi = 0;
    let atmPeOi = 0;
    let atmCeVol = 0;
    let atmPeVol = 0;
    let atmCeLtp = 0;
    let atmPeLtp = 0;

    all.forEach((r) => {
      if (r.strike === atmStrike) {
        atmCeOi = r.ce.oi;
        atmPeOi = r.pe.oi;
        atmCeVol = r.ce.volume;
        atmPeVol = r.pe.volume;
        atmCeLtp = r.ce.ltp;
        atmPeLtp = r.pe.ltp;
      } else if (r.strike < atmStrike) {
        itmCeOi += r.ce.oi;
        itmCeVol += r.ce.volume;
        otmPeOi += r.pe.oi;
        otmPeVol += r.pe.volume;
      } else {
        otmCeOi += r.ce.oi;
        otmCeVol += r.ce.volume;
        itmPeOi += r.pe.oi;
        itmPeVol += r.pe.volume;
      }
    });

    return {
      itm: { ceOi: itmCeOi, peOi: itmPeOi, ceVol: itmCeVol, peVol: itmPeVol },
      atm: { ceOi: atmCeOi, peOi: atmPeOi, ceVol: atmCeVol, peVol: atmPeVol, ceLtp: atmCeLtp, peLtp: atmPeLtp },
      otm: { ceOi: otmCeOi, peOi: otmPeOi, ceVol: otmCeVol, peVol: otmPeVol },
      total: {
        ceOi: itmCeOi + atmCeOi + otmCeOi,
        peOi: itmPeOi + atmPeOi + otmPeOi,
        ceVol: itmCeVol + atmCeVol + otmCeVol,
        peVol: itmPeVol + atmPeVol + otmPeVol,
      },
    };
  }, [chainData?.contracts, atmStrike]);

  const toggleCol = useCallback((key: ColumnKey) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const renderSideCells = (row: OptionChainRowDto, side: 'ce' | 'pe', isItm: boolean) => {
    const c = side === 'ce' ? row.ce : row.pe;
    const type: OptionType = side === 'ce' ? 'CE' : 'PE';
    const itmCls = isItm ? (side === 'ce' ? 'oc-itm-ce' : 'oc-itm-pe') : '';
    const chgPct = oiChgPct(c);
    const oiPct = maxOi > 0 ? Math.min(100, Math.round((c.oi / maxOi) * 100)) : 0;
    const priceChg = Number(c.changePct) || 0;

    const cells: React.ReactNode[] = [];

    if (side === 'ce') {
      if (columns.action) {
        cells.push(
          <td key="act" className={`oc-td oc-td-action ${itmCls}`}>
            <div className="oc-action-pair">
              <button
                type="button"
                className="oc-btn-buy"
                title="Buy Call"
                onClick={() =>
                  onAddOrToggleLeg({
                    side: 'BUY',
                    type: 'CE',
                    strike: row.strike,
                    price: c.ltp,
                    iv: c.iv,
                    expiry: selectedExpiry,
                  })
                }
              >
                B
              </button>
              <button
                type="button"
                className="oc-btn-sell"
                title="Sell Call"
                onClick={() =>
                  onAddOrToggleLeg({
                    side: 'SELL',
                    type: 'CE',
                    strike: row.strike,
                    price: c.ltp,
                    iv: c.iv,
                    expiry: selectedExpiry,
                  })
                }
              >
                S
              </button>
            </div>
          </td>,
        );
      }
      if (columns.buildup) {
        cells.push(
          <td key="bu" className={`oc-td oc-td-center ${itmCls}`}>
            <BuildupBadge buildup={c.buildup} />
          </td>,
        );
      }
      if (columns.volume) {
        cells.push(
          <td key="vol" className={`oc-td oc-td-num ${itmCls}`}>
            {formatQty(c.volume)}
          </td>,
        );
      }
      if (columns.oiChg) {
        cells.push(
          <td
            key="oic"
            className={`oc-td oc-td-num ${itmCls} ${
              chgPct == null ? '' : chgPct >= 0 ? 'oc-pos' : 'oc-neg'
            }`}
          >
            {chgPct == null ? '—' : `${chgPct >= 0 ? '+' : ''}${chgPct}%`}
          </td>,
        );
      }
      if (columns.oi) {
        cells.push(
          <td key="oi" className={`oc-td oc-td-oi ${itmCls}`}>
            <div className="oc-oi-cell">
              <span>{formatQty(c.oi)}</span>
              <span className="oc-oi-bar oc-oi-bar--ce" style={{ width: `${oiPct}%` }} />
            </div>
          </td>,
        );
      }
      if (columns.iv) {
        cells.push(
          <td key="iv" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.iv != null ? c.iv.toFixed(1) : '—'}
          </td>,
        );
      }
      if (columns.delta) {
        cells.push(
          <td key="d" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.delta != null ? c.delta.toFixed(2) : '—'}
          </td>,
        );
      }
      if (columns.theta) {
        cells.push(
          <td key="t" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.theta != null ? c.theta.toFixed(2) : '—'}
          </td>,
        );
      }
      if (columns.ltp) {
        cells.push(
          <td key="ltp" className={`oc-td oc-td-ltp oc-td-ltp--ce ${itmCls}`}>
            <button
              type="button"
              className="oc-ltp-btn"
              onClick={() =>
                setChartContract({
                  strike: row.strike,
                  type,
                  ltp: c.ltp,
                  changePct: priceChg,
                })
              }
              title="Open LTP chart"
            >
              <span className="oc-ltp-main">{formatLtp(c.ltp)}</span>
              {c.ltp > 0 && (
                <span className={priceChg >= 0 ? 'oc-pos' : 'oc-neg'}>
                  {priceChg >= 0 ? '+' : ''}
                  {priceChg.toFixed(0)}%
                </span>
              )}
              <LineChart className="oc-ltp-chart-icon" strokeWidth={2} />
            </button>
          </td>,
        );
      }
    } else {
      if (columns.ltp) {
        cells.push(
          <td key="ltp" className={`oc-td oc-td-ltp oc-td-ltp--pe ${itmCls}`}>
            <button
              type="button"
              className="oc-ltp-btn"
              onClick={() =>
                setChartContract({
                  strike: row.strike,
                  type,
                  ltp: c.ltp,
                  changePct: priceChg,
                })
              }
              title="Open LTP chart"
            >
              <LineChart className="oc-ltp-chart-icon" strokeWidth={2} />
              <span className="oc-ltp-main">{formatLtp(c.ltp)}</span>
              {c.ltp > 0 && (
                <span className={priceChg >= 0 ? 'oc-pos' : 'oc-neg'}>
                  {priceChg >= 0 ? '+' : ''}
                  {priceChg.toFixed(0)}%
                </span>
              )}
            </button>
          </td>,
        );
      }
      if (columns.iv) {
        cells.push(
          <td key="iv" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.iv != null ? c.iv.toFixed(1) : '—'}
          </td>,
        );
      }
      if (columns.delta) {
        cells.push(
          <td key="d" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.delta != null ? c.delta.toFixed(2) : '—'}
          </td>,
        );
      }
      if (columns.theta) {
        cells.push(
          <td key="t" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.theta != null ? c.theta.toFixed(2) : '—'}
          </td>,
        );
      }
      if (columns.oi) {
        cells.push(
          <td key="oi" className={`oc-td oc-td-oi ${itmCls}`}>
            <div className="oc-oi-cell">
              <span>{formatQty(c.oi)}</span>
              <span className="oc-oi-bar oc-oi-bar--pe" style={{ width: `${oiPct}%` }} />
            </div>
          </td>,
        );
      }
      if (columns.oiChg) {
        cells.push(
          <td
            key="oic"
            className={`oc-td oc-td-num ${itmCls} ${
              chgPct == null ? '' : chgPct >= 0 ? 'oc-pos' : 'oc-neg'
            }`}
          >
            {chgPct == null ? '—' : `${chgPct >= 0 ? '+' : ''}${chgPct}%`}
          </td>,
        );
      }
      if (columns.volume) {
        cells.push(
          <td key="vol" className={`oc-td oc-td-num ${itmCls}`}>
            {formatQty(c.volume)}
          </td>,
        );
      }
      if (columns.buildup) {
        cells.push(
          <td key="bu" className={`oc-td oc-td-center ${itmCls}`}>
            <BuildupBadge buildup={c.buildup} />
          </td>,
        );
      }
      if (columns.action) {
        cells.push(
          <td key="act" className={`oc-td oc-td-action ${itmCls}`}>
            <div className="oc-action-pair">
              <button
                type="button"
                className="oc-btn-buy"
                title="Buy Put"
                onClick={() =>
                  onAddOrToggleLeg({
                    side: 'BUY',
                    type: 'PE',
                    strike: row.strike,
                    price: c.ltp,
                    iv: c.iv,
                    expiry: selectedExpiry,
                  })
                }
              >
                B
              </button>
              <button
                type="button"
                className="oc-btn-sell"
                title="Sell Put"
                onClick={() =>
                  onAddOrToggleLeg({
                    side: 'SELL',
                    type: 'PE',
                    strike: row.strike,
                    price: c.ltp,
                    iv: c.iv,
                    expiry: selectedExpiry,
                  })
                }
              >
                S
              </button>
            </div>
          </td>,
        );
      }
    }

    return cells;
  };

  const sideHeader = (side: 'ce' | 'pe') => {
    const labels: React.ReactNode[] = [];
    const push = (key: ColumnKey, text: string, align: 'left' | 'right' | 'center' = 'right') => {
      if (!columns[key]) return;
      labels.push(
        <th key={`${side}-${key}`} className={`oc-th oc-th-${align}`}>
          {text}
        </th>,
      );
    };

    if (side === 'ce') {
      push('action', 'Action', 'center');
      push('buildup', 'Buildup', 'center');
      push('volume', 'Volume');
      push('oiChg', 'OI Chg%');
      push('oi', 'OI');
      push('iv', 'IV');
      push('delta', 'Delta');
      push('theta', 'Theta');
      push('ltp', 'LTP');
    } else {
      push('ltp', 'LTP', 'left');
      push('iv', 'IV', 'left');
      push('delta', 'Delta', 'left');
      push('theta', 'Theta', 'left');
      push('oi', 'OI');
      push('oiChg', 'OI Chg%');
      push('volume', 'Volume');
      push('buildup', 'Buildup', 'center');
      push('action', 'Action', 'center');
    }
    return labels;
  };

  const renderSummary = (
    label: string,
    data: { ceOi: number; peOi: number; ceVol: number; peVol: number; ceLtp?: number; peLtp?: number },
  ) => {
    const ceCells: React.ReactNode[] = [];
    const peCells: React.ReactNode[] = [];

    const fillSide = (side: 'ce' | 'pe', bucket: typeof ceCells) => {
      const oi = side === 'ce' ? data.ceOi : data.peOi;
      const vol = side === 'ce' ? data.ceVol : data.peVol;
      const ltp = side === 'ce' ? data.ceLtp : data.peLtp;
      if (side === 'ce' && columns.action) bucket.push(<td key="a" className="oc-td" />);
      if (side === 'ce' && columns.buildup) bucket.push(<td key="b" className="oc-td" />);
      if (side === 'ce' && columns.volume) bucket.push(<td key="v" className="oc-td oc-td-num">{formatQty(vol)}</td>);
      if (side === 'ce' && columns.oiChg) bucket.push(<td key="c" className="oc-td" />);
      if (side === 'ce' && columns.oi) bucket.push(<td key="o" className="oc-td oc-td-num">{formatQty(oi)}</td>);
      if (side === 'ce' && columns.iv) bucket.push(<td key="i" className="oc-td" />);
      if (side === 'ce' && columns.delta) bucket.push(<td key="d" className="oc-td" />);
      if (side === 'ce' && columns.theta) bucket.push(<td key="t" className="oc-td" />);
      if (side === 'ce' && columns.ltp) {
        bucket.push(
          <td key="l" className="oc-td oc-td-num">
            {ltp != null && ltp > 0 ? ltp.toFixed(2) : '—'}
          </td>,
        );
      }

      if (side === 'pe' && columns.ltp) {
        bucket.push(
          <td key="l" className="oc-td oc-td-num">
            {ltp != null && ltp > 0 ? ltp.toFixed(2) : '—'}
          </td>,
        );
      }
      if (side === 'pe' && columns.iv) bucket.push(<td key="i" className="oc-td" />);
      if (side === 'pe' && columns.delta) bucket.push(<td key="d" className="oc-td" />);
      if (side === 'pe' && columns.theta) bucket.push(<td key="t" className="oc-td" />);
      if (side === 'pe' && columns.oi) bucket.push(<td key="o" className="oc-td oc-td-num">{formatQty(oi)}</td>);
      if (side === 'pe' && columns.oiChg) bucket.push(<td key="c" className="oc-td" />);
      if (side === 'pe' && columns.volume) bucket.push(<td key="v" className="oc-td oc-td-num">{formatQty(vol)}</td>);
      if (side === 'pe' && columns.buildup) bucket.push(<td key="b" className="oc-td" />);
      if (side === 'pe' && columns.action) bucket.push(<td key="a" className="oc-td" />);
    };

    fillSide('ce', ceCells);
    fillSide('pe', peCells);

    // Put label in first CE numeric/empty cell area via overlay on strike
    return (
      <tr className="oc-summary-row" key={label}>
        {ceCells}
        <td className="oc-td oc-td-strike oc-summary-strike">{label}</td>
        {peCells}
      </tr>
    );
  };

  return (
    <div className="oc-root">
      <div className="oc-toolbar">
        <div className="oc-filter-group">
          <span className="oc-filter-label">Strikes</span>
          {(['10', '15', '20', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`oc-filter-btn ${strikeFilter === f ? 'active' : ''}`}
              onClick={() => setStrikeFilter(f)}
            >
              {f === 'all' ? 'All' : `±${f}`}
            </button>
          ))}
        </div>

        <div className="oc-toolbar-meta">
          <span>
            Spot <strong>{spot > 0 ? spot.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}</strong>
          </span>
          <span>
            PCR <strong>{chainData?.pcr?.toFixed(2) ?? '—'}</strong>
          </span>
          <span>
            Max Pain <strong>{maxPain > 0 ? maxPain.toLocaleString('en-IN') : '—'}</strong>
          </span>
        </div>

        <div className="oc-col-filter-wrap">
          <button
            type="button"
            className={`oc-filter-btn ${showColMenu ? 'active' : ''}`}
            onClick={() => setShowColMenu((v) => !v)}
          >
            <Columns3 strokeWidth={2} />
            <span>Columns</span>
          </button>
          {showColMenu && (
            <div className="oc-col-menu" role="menu">
              {COLUMN_LABELS.map((c) => (
                <label key={c.key} className="oc-col-item">
                  <input
                    type="checkbox"
                    checked={columns[c.key]}
                    onChange={() => toggleCol(c.key)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="oc-table-wrap">
        <table className="oc-table">
          <thead>
            <tr>
              <th
                className="oc-group-ce"
                colSpan={sideHeader('ce').length || 1}
              >
                CALLS
              </th>
              <th className="oc-group-strike">STRIKE</th>
              <th
                className="oc-group-pe"
                colSpan={sideHeader('pe').length || 1}
              >
                PUTS
              </th>
            </tr>
            <tr>
              {sideHeader('ce')}
              <th className="oc-th oc-th-center oc-th-strike">Strike</th>
              {sideHeader('pe')}
            </tr>
          </thead>
          <tbody>
            {renderSummary('ITM Total', summary.itm)}
            {renderSummary('ATM', summary.atm)}
            {renderSummary('OTM Total', summary.otm)}
            {renderSummary('Total', summary.total)}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={99} className="oc-empty">
                  {isLoading ? (
                    <>
                      <RefreshCw className="oc-spin" />
                      Loading option chain…
                    </>
                  ) : (
                    'No option-chain rows for this expiry. Try another expiry or reconnect the feed.'
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isAtm = row.strike === atmStrike;
                const isMaxPain = row.strike === maxPain;
                const isItmCe = spot > 0 ? row.strike < spot : row.strike < atmStrike;
                const isItmPe = spot > 0 ? row.strike > spot : row.strike > atmStrike;

                return (
                  <tr key={row.strike} className={isAtm ? 'oc-row-atm' : undefined}>
                    {renderSideCells(row, 'ce', isItmCe)}
                    <td className={`oc-td oc-td-strike ${isAtm ? 'oc-atm' : ''}`}>
                      <span className="oc-strike-val">{row.strike}</span>
                      {isAtm && <span className="oc-badge oc-badge-atm">ATM</span>}
                      {isMaxPain && !isAtm && (
                        <span className="oc-badge oc-badge-maxpain">MAX PAIN</span>
                      )}
                      {isMaxPain && isAtm && (
                        <span className="oc-badge oc-badge-maxpain">MAX PAIN</span>
                      )}
                    </td>
                    {renderSideCells(row, 'pe', isItmPe)}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {chartContract && (
        <div className="oc-chart-drawer" role="dialog" aria-label="Option LTP chart">
          <div className="oc-chart-drawer-head">
            <div>
              <h3>
                {symbol} — {selectedExpiry} — {chartContract.strike} {chartContract.type}
              </h3>
              <p>
                LTP <strong>{formatLtp(chartContract.ltp)}</strong>{' '}
                <span className={chartContract.changePct >= 0 ? 'oc-pos' : 'oc-neg'}>
                  {chartContract.changePct >= 0 ? '+' : ''}
                  {chartContract.changePct.toFixed(2)}%
                </span>
              </p>
            </div>
            <button
              type="button"
              className="sm-panel-icon-btn"
              onClick={() => setChartContract(null)}
              aria-label="Close chart"
            >
              <X strokeWidth={2} />
            </button>
          </div>
          <div className="oc-chart-drawer-body">
            <div className="oc-chart-ltp-strip">
              Contract LTP <strong>₹{formatLtp(chartContract.ltp)}</strong>
              <span className="oc-chart-ltp-note">Underlying live chart below · zoom with scroll or buttons</span>
            </div>
            <NiftyCandlestickChart
              symbol={symbol}
              spotPrice={spot}
              spotChange={chainData?.spotChange || 0}
              spotChangePct={chainData?.spotChangePct || 0}
              isActive
            />
          </div>
        </div>
      )}
    </div>
  );
};
