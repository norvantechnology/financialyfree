'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Maximize2,
  Minimize2,
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

/** Compact StockMojo-style sparkline affordance next to LTP */
function LtpChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 7.5 3.2 5.2 5.1 6.4 7.8 2.8 11 5.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.6 2.6h1.5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type StrikeFilter = '10' | '15' | '20' | 'all';

type ColumnKey =
  | 'buildup'
  | 'volume'
  | 'oiChgPct'
  | 'oiChgAbs'
  | 'oi'
  | 'ltp'
  | 'iv'
  | 'delta'
  | 'theta'
  | 'action';

/** StockMojo-style defaults - Volume + OI Chg% on; abs OI Chg optional */
const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  buildup: true,
  volume: true,
  oiChgPct: true,
  oiChgAbs: false,
  oi: true,
  ltp: true,
  iv: true,
  delta: false,
  theta: false,
  action: false,
};

const COLUMN_LABELS: { key: ColumnKey; label: string }[] = [
  { key: 'buildup', label: 'Buildup' },
  { key: 'volume', label: 'Volume' },
  { key: 'oiChgPct', label: 'OI Chg%' },
  { key: 'oi', label: 'OI' },
  { key: 'oiChgAbs', label: 'OI Chg' },
  { key: 'ltp', label: 'LTP' },
  { key: 'iv', label: 'IV (center)' },
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

/** Format qty in underlying units (contracts × lot) - StockMojo Cr/L style */
function formatUnits(contracts: number, lotSize: number): string {
  const n = (Number(contracts) || 0) * Math.max(1, lotSize || 1);
  if (n <= 0) return '-';
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`;
  return n.toLocaleString('en-IN');
}

function formatLtp(n: number): string {
  if (!n || n <= 0) return '-';
  return n.toFixed(2);
}

/** Prefer last trade; fall back to bid/ask mid so illiquid rows still show a quote */
function effectiveLtp(contract: OptionContractDto): number {
  const ltp = Number(contract.ltp) || 0;
  if (ltp > 0) return ltp;
  const bid = Number(contract.bidPrice) || 0;
  const ask = Number(contract.askPrice) || 0;
  if (bid > 0 && ask > 0) return Math.round(((bid + ask) / 2) * 100) / 100;
  if (bid > 0) return bid;
  if (ask > 0) return ask;
  return 0;
}

/** StockMojo-style smile IV: OTM put below spot, OTM call above spot */
function smileIv(row: OptionChainRowDto, spot: number): number | null {
  const ce = row.ce?.iv != null && Number.isFinite(row.ce.iv) ? Number(row.ce.iv) : null;
  const pe = row.pe?.iv != null && Number.isFinite(row.pe.iv) ? Number(row.pe.iv) : null;
  if (spot > 0 && Number(row.strike) < spot) return pe ?? ce;
  if (spot > 0 && Number(row.strike) > spot) return ce ?? pe;
  if (ce != null && pe != null) return Math.round(((ce + pe) / 2) * 10) / 10;
  return ce ?? pe;
}

function formatOiChgPct(contract: OptionContractDto): {
  text: string;
  pct: number | null;
  tone: 'pos' | 'neg' | 'flat';
} {
  // Prefer exchange-provided OI change % when present
  const exch = Number(contract.oiChangePct);
  if (Number.isFinite(exch) && exch !== 0) {
    const pct = Math.round(exch);
    return {
      text: `${pct >= 0 ? '+' : ''}${pct}%`,
      pct: exch,
      tone: exch >= 0 ? 'pos' : 'neg',
    };
  }
  const oi = Number(contract.oi) || 0;
  const chg = Number(contract.oiChange) || 0;
  if (chg === 0) return { text: '-', pct: null, tone: 'flat' };
  const prev = oi - chg;
  if (prev <= 0 || Math.abs(prev) < 1) {
    return {
      text: chg > 0 ? '+New' : '-',
      pct: chg > 0 ? 100 : null,
      tone: chg > 0 ? 'pos' : 'neg',
    };
  }
  const raw = (chg / prev) * 100;
  if (!Number.isFinite(raw)) return { text: '-', pct: null, tone: 'flat' };
  const pct = Math.round(raw);
  return {
    text: `${pct >= 0 ? '+' : ''}${pct}%`,
    pct: raw,
    tone: raw >= 0 ? 'pos' : 'neg',
  };
}

/** Heat intensity 0-4 from relative magnitude (live NSE values only). */
function heatLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!max || value <= 0) return 0;
  const r = value / max;
  if (r >= 0.85) return 4;
  if (r >= 0.6) return 3;
  if (r >= 0.35) return 2;
  if (r >= 0.15) return 1;
  return 0;
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
      return { code: '-', tone: 'flat', title: 'Neutral' };
  }
}

function BuildupBadge({ buildup }: { buildup: OiBuildupType | string | undefined }) {
  const { code, tone, title } = buildupCode(buildup);
  if (tone === 'flat') {
    return <span className="oc-buildup oc-buildup--flat" title={title}>-</span>;
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
  const [chartFullscreen, setChartFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContract) {
      setChartFullscreen(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (chartFullscreen) setChartFullscreen(false);
        else setChartContract(null);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [chartContract, chartFullscreen]);

  const chartHeight = useMemo(() => {
    if (typeof window === 'undefined') return 520;
    if (chartFullscreen) return Math.max(560, window.innerHeight - 88);
    return Math.max(480, Math.min(640, window.innerHeight - 160));
  }, [chartFullscreen]);

  const spot = Number(chainData?.spotPrice) || 0;
  const atmStrike =
    Number(chainData?.atmStrike) ||
    (spot > 0 ? Math.round(spot / 50) * 50 : 0);
  const maxPain = Number(chainData?.maxPain) || 0;
  const lotSize = Math.max(1, Number(chainData?.lotSize) || 1);
  const atmRowRef = useRef<HTMLTableRowElement | null>(null);

  // Keep popup LTP in sync with live chain row (same strike + side)
  useEffect(() => {
    if (!chartContract || !chainData?.contracts?.length) return;
    const row = chainData.contracts.find(
      (c) => Math.abs(Number(c.strike) - chartContract.strike) < 0.51,
    );
    if (!row) return;
    const side = chartContract.type === 'CE' ? row.ce : row.pe;
    const ltp = effectiveLtp(side);
    const changePct = Number(side?.changePct) || 0;
    if (ltp <= 0) return;
    if (
      Math.abs(ltp - chartContract.ltp) < 0.005 &&
      Math.abs(changePct - chartContract.changePct) < 0.005
    ) {
      return;
    }
    setChartContract((prev) =>
      prev ? { ...prev, ltp, changePct } : prev,
    );
  }, [chainData, chartContract]);

  const liveSpotLabel =
    spot > 0
      ? `Spot ₹${spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      : null;

  const rows = useMemo(() => {
    const all = chainData?.contracts || [];
    if (strikeFilter === 'all' || all.length === 0) return all;
    const limit = parseInt(strikeFilter, 10);
    const atmIndex = all.findIndex((c) => Number(c.strike) >= atmStrike);
    const idx = atmIndex >= 0 ? atmIndex : Math.floor(all.length / 2);
    const start = Math.max(0, idx - limit);
    const end = Math.min(all.length, idx + limit + 1);
    return all.slice(start, end);
  }, [chainData?.contracts, strikeFilter, atmStrike]);

  // Scroll ATM into view whenever the chain / filter changes
  useEffect(() => {
    if (!atmStrike || rows.length === 0) return;
    const t = window.setTimeout(() => {
      atmRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [atmStrike, strikeFilter, chainData?.selectedExpiry, rows.length]);

  const maxOi = useMemo(() => {
    let m = 1;
    rows.forEach((r) => {
      const ce = (Number(r.ce.oi) || 0) * lotSize;
      const pe = (Number(r.pe.oi) || 0) * lotSize;
      if (ce > m) m = ce;
      if (pe > m) m = pe;
    });
    return m;
  }, [rows, lotSize]);

  const maxVol = useMemo(() => {
    let m = 1;
    rows.forEach((r) => {
      const ce = (Number(r.ce.volume) || 0) * lotSize;
      const pe = (Number(r.pe.volume) || 0) * lotSize;
      if (ce > m) m = ce;
      if (pe > m) m = pe;
    });
    return m;
  }, [rows, lotSize]);

  const maxOiChgAbs = useMemo(() => {
    let m = 1;
    rows.forEach((r) => {
      m = Math.max(
        m,
        Math.abs(Number(r.ce.oiChange) || 0) * lotSize,
        Math.abs(Number(r.pe.oiChange) || 0) * lotSize,
      );
    });
    return m;
  }, [rows, lotSize]);

  const maxOiChgPct = useMemo(() => {
    let m = 1;
    rows.forEach((r) => {
      const ce = formatOiChgPct(r.ce).pct;
      const pe = formatOiChgPct(r.pe).pct;
      if (ce != null) m = Math.max(m, Math.abs(ce));
      if (pe != null) m = Math.max(m, Math.abs(pe));
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
      if (Number(r.strike) === atmStrike) {
        atmCeOi = r.ce.oi;
        atmPeOi = r.pe.oi;
        atmCeVol = r.ce.volume;
        atmPeVol = r.pe.volume;
        atmCeLtp = effectiveLtp(r.ce);
        atmPeLtp = effectiveLtp(r.pe);
      } else if (Number(r.strike) < atmStrike) {
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
    const heat = side === 'ce' ? 'ce' : 'pe';
    const itmCls = isItm ? (side === 'ce' ? 'oc-itm-ce' : 'oc-itm-pe') : '';
    const pctInfo = formatOiChgPct(c);
    const oiAbs = Number(c.oiChange) || 0;
    const oiUnits = (Number(c.oi) || 0) * lotSize;
    const volUnits = (Number(c.volume) || 0) * lotSize;
    const oiChgUnits = Math.abs(oiAbs) * lotSize;
    const quote = effectiveLtp(c);
    const oiHeat = heatLevel(oiUnits, maxOi);
    const volHeat = heatLevel(volUnits, maxVol);
    const pctHeat = pctInfo.pct != null ? heatLevel(Math.abs(pctInfo.pct), maxOiChgPct) : 0;
    const chgBar = maxOiChgAbs > 0 ? Math.min(100, Math.round((oiChgUnits / maxOiChgAbs) * 100)) : 0;
    const priceChg = Number(c.changePct) || 0;

    const pushBuildup = (cells: React.ReactNode[]) => {
      if (!columns.buildup) return;
      cells.push(
        <td key="bu" className={`oc-td oc-td-center ${itmCls}`}>
          <button
            type="button"
            className="oc-buildup-hit"
            title={`${buildupCode(c.buildup).title} - click to trade`}
            onClick={() =>
              onAddOrToggleLeg({
                side: buildupCode(c.buildup).tone === 'short' || buildupCode(c.buildup).tone === 'unwind' ? 'SELL' : 'BUY',
                type,
                strike: row.strike,
                price: quote,
                iv: c.iv,
                expiry: selectedExpiry,
              })
            }
          >
            <BuildupBadge buildup={c.buildup} />
          </button>
        </td>,
      );
    };

    const pushOi = (cells: React.ReactNode[]) => {
      if (!columns.oi) return;
      cells.push(
        <td
          key="oi"
          className={`oc-td oc-td-num oc-heat oc-heat-${heat}-${oiHeat} ${itmCls}`}
          title={`OI ${formatUnits(c.oi, lotSize)} (${Number(c.oi).toLocaleString('en-IN')} lots × ${lotSize})`}
        >
          {formatUnits(c.oi, lotSize)}
        </td>,
      );
    };

    const pushOiChgPct = (cells: React.ReactNode[]) => {
      if (!columns.oiChgPct) return;
      cells.push(
        <td
          key="oicp"
          className={`oc-td oc-td-num oc-heat oc-heat-${heat}-${pctHeat} ${itmCls} ${
            pctInfo.tone === 'flat' ? '' : pctInfo.tone === 'pos' ? 'oc-pos' : 'oc-neg'
          }`}
          title="OI change % vs previous day (NSE)"
        >
          {pctInfo.text}
        </td>,
      );
    };

    const pushOiChgAbs = (cells: React.ReactNode[]) => {
      if (!columns.oiChgAbs) return;
      cells.push(
        <td
          key="oica"
          className={`oc-td oc-td-oi-chg ${itmCls} ${oiAbs > 0 ? 'oc-pos' : oiAbs < 0 ? 'oc-neg' : ''}`}
          title={`OI change ${formatUnits(Math.abs(oiAbs), lotSize)}`}
        >
          <div className="oc-oi-chg-cell">
            <span>
              {oiAbs === 0
                ? '-'
                : `${oiAbs > 0 ? '' : '-'}${formatUnits(Math.abs(oiAbs), lotSize)}`}
            </span>
            <span
              className={`oc-oi-chg-bar oc-oi-chg-bar--${heat}`}
              style={{ width: `${chgBar}%` }}
            />
          </div>
        </td>,
      );
    };

    const pushLtp = (cells: React.ReactNode[]) => {
      if (!columns.ltp) return;
      cells.push(
        <td key="ltp" className={`oc-td oc-td-ltp oc-td-ltp--${heat} ${itmCls}`}>
          <button
            type="button"
            className="oc-ltp-btn"
            onClick={() =>
              setChartContract({
                strike: row.strike,
                type,
                ltp: quote,
                changePct: priceChg,
              })
            }
            title="Open live LTP chart (TradingView NSE)"
          >
            {side === 'pe' ? <LtpChartIcon className="oc-ltp-chart-icon" /> : null}
            <span className="oc-ltp-main">{formatLtp(quote)}</span>
            {quote > 0 ? (
              <span className={priceChg >= 0 ? 'oc-pos' : 'oc-neg'}>
                {priceChg >= 0 ? '+' : ''}
                {priceChg.toFixed(0)}%
              </span>
            ) : null}
            {side === 'ce' ? <LtpChartIcon className="oc-ltp-chart-icon" /> : null}
          </button>
        </td>,
      );
    };

    const pushVolume = (cells: React.ReactNode[]) => {
      if (!columns.volume) return;
      cells.push(
        <td
          key="vol"
          className={`oc-td oc-td-num oc-heat oc-heat-${heat}-${volHeat} ${itmCls}`}
          title={`Volume ${formatUnits(c.volume, lotSize)}`}
        >
          {formatUnits(c.volume, lotSize)}
        </td>,
      );
    };

    const pushGreeks = (cells: React.ReactNode[]) => {
      if (columns.delta) {
        cells.push(
          <td key="d" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.delta != null ? c.delta.toFixed(2) : '-'}
          </td>,
        );
      }
      if (columns.theta) {
        cells.push(
          <td key="t" className={`oc-td oc-td-num oc-muted ${itmCls}`}>
            {c.theta != null ? c.theta.toFixed(2) : '-'}
          </td>,
        );
      }
    };

    const pushAction = (cells: React.ReactNode[]) => {
      if (!columns.action) return;
      cells.push(
        <td key="act" className={`oc-td oc-td-action ${itmCls}`}>
          <div className="oc-action-pair">
            <button
              type="button"
              className="oc-btn-buy"
              title={`Buy ${type}`}
              onClick={() =>
                onAddOrToggleLeg({
                  side: 'BUY',
                  type,
                  strike: row.strike,
                  price: quote,
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
              title={`Sell ${type}`}
              onClick={() =>
                onAddOrToggleLeg({
                  side: 'SELL',
                  type,
                  strike: row.strike,
                  price: quote,
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
    };

    const cells: React.ReactNode[] = [];
    // StockMojo: CE Buildup→Volume→OI%→OI→LTP | Strike·IV | PE LTP→OI→OI%→Volume→Buildup
    if (side === 'ce') {
      pushAction(cells);
      pushBuildup(cells);
      pushVolume(cells);
      pushOiChgPct(cells);
      pushOi(cells);
      pushOiChgAbs(cells);
      pushLtp(cells);
      pushGreeks(cells);
    } else {
      pushLtp(cells);
      pushGreeks(cells);
      pushOi(cells);
      pushOiChgPct(cells);
      pushOiChgAbs(cells);
      pushVolume(cells);
      pushBuildup(cells);
      pushAction(cells);
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
      push('oiChgPct', 'OI Chg%');
      push('oi', 'OI');
      push('oiChgAbs', 'OI Chg');
      push('ltp', 'LTP');
      push('delta', 'Delta');
      push('theta', 'Theta');
    } else {
      push('ltp', 'LTP', 'left');
      push('delta', 'Delta', 'left');
      push('theta', 'Theta', 'left');
      push('oi', 'OI');
      push('oiChgPct', 'OI Chg%');
      push('oiChgAbs', 'OI Chg');
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
      if (side === 'ce' && columns.volume) {
        bucket.push(
          <td key="v" className="oc-td oc-td-num">
            {formatUnits(vol, lotSize)}
          </td>,
        );
      }
      if (side === 'ce' && columns.oiChgPct) bucket.push(<td key="cp" className="oc-td" />);
      if (side === 'ce' && columns.oi) {
        bucket.push(
          <td key="o" className="oc-td oc-td-num">
            {formatUnits(oi, lotSize)}
          </td>,
        );
      }
      if (side === 'ce' && columns.oiChgAbs) bucket.push(<td key="ca" className="oc-td" />);
      if (side === 'ce' && columns.ltp) {
        bucket.push(
          <td key="l" className="oc-td oc-td-num">
            {ltp != null && ltp > 0 ? ltp.toFixed(2) : '-'}
          </td>,
        );
      }
      if (side === 'ce' && columns.delta) bucket.push(<td key="d" className="oc-td" />);
      if (side === 'ce' && columns.theta) bucket.push(<td key="t" className="oc-td" />);

      if (side === 'pe' && columns.ltp) {
        bucket.push(
          <td key="l" className="oc-td oc-td-num">
            {ltp != null && ltp > 0 ? ltp.toFixed(2) : '-'}
          </td>,
        );
      }
      if (side === 'pe' && columns.delta) bucket.push(<td key="d" className="oc-td" />);
      if (side === 'pe' && columns.theta) bucket.push(<td key="t" className="oc-td" />);
      if (side === 'pe' && columns.oi) {
        bucket.push(
          <td key="o" className="oc-td oc-td-num">
            {formatUnits(oi, lotSize)}
          </td>,
        );
      }
      if (side === 'pe' && columns.oiChgPct) bucket.push(<td key="cp" className="oc-td" />);
      if (side === 'pe' && columns.oiChgAbs) bucket.push(<td key="ca" className="oc-td" />);
      if (side === 'pe' && columns.volume) {
        bucket.push(
          <td key="v" className="oc-td oc-td-num">
            {formatUnits(vol, lotSize)}
          </td>,
        );
      }
      if (side === 'pe' && columns.buildup) bucket.push(<td key="b" className="oc-td" />);
      if (side === 'pe' && columns.action) bucket.push(<td key="a" className="oc-td" />);
    };

    fillSide('ce', ceCells);
    fillSide('pe', peCells);

    return (
      <tr className="oc-summary-row" key={label}>
        {ceCells}
        <td className="oc-td oc-td-strike oc-summary-strike" colSpan={columns.iv ? 2 : 1}>
          {label}
        </td>
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
          <span className={`oc-feed-pill ${(chainData?.source || '').includes('LIVE') ? 'live' : 'cached'}`}>
            {chainData?.source || '-'}
          </span>
          <span>
            Spot <strong>{spot > 0 ? spot.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</strong>
          </span>
          <span title="OI & Volume shown as contracts × lot size (StockMojo units)">
            Lot <strong>{lotSize}</strong>
          </span>
          <span>
            PCR <strong>{chainData?.pcr?.toFixed(2) ?? '-'}</strong>
          </span>
          <span>
            Max Pain <strong>{maxPain > 0 ? maxPain.toLocaleString('en-IN') : '-'}</strong>
          </span>
          {chainData?.timestamp ? (
            <span className="oc-asof" title="NSE / feed as-of (IST)">
              {new Date(chainData.timestamp).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
          ) : null}
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
              <th className="oc-group-strike" colSpan={columns.iv ? 2 : 1}>
                STRIKE
              </th>
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
              {columns.iv ? <th className="oc-th oc-th-center oc-th-iv">IV</th> : null}
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
                      Loading option chain...
                    </>
                  ) : (
                    'No option-chain rows for this expiry. Try another expiry or reconnect the feed.'
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isAtm = Number(row.strike) === atmStrike;
                const isMaxPain = Number(row.strike) === maxPain;
                const isItmCe = spot > 0 ? Number(row.strike) < spot : Number(row.strike) < atmStrike;
                const isItmPe = spot > 0 ? Number(row.strike) > spot : Number(row.strike) > atmStrike;
                const ivSmile = smileIv(row, spot);

                return (
                  <tr
                    key={row.strike}
                    ref={isAtm ? atmRowRef : undefined}
                    className={isAtm ? 'oc-row-atm' : undefined}
                  >
                    {renderSideCells(row, 'ce', isItmCe)}
                    <td className={`oc-td oc-td-strike ${isAtm ? 'oc-atm' : ''} ${isMaxPain ? 'oc-maxpain-cell' : ''}`}>
                      <span className="oc-strike-val">{row.strike}</span>
                      {isAtm && <span className="oc-badge oc-badge-atm">ATM</span>}
                      {isMaxPain && <span className="oc-badge oc-badge-maxpain">Max Pain</span>}
                    </td>
                    {columns.iv ? (
                      <td className="oc-td oc-td-num oc-td-iv-center" title="OTM smile IV (Put below spot, Call above)">
                        {ivSmile != null ? ivSmile.toFixed(1) : '-'}
                      </td>
                    ) : null}
                    {renderSideCells(row, 'pe', isItmPe)}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {chartContract && (
        <div
          className={`oc-chart-overlay ${chartFullscreen ? 'is-fullscreen' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Live option chart"
        >
          <button
            type="button"
            className="oc-chart-overlay-backdrop"
            aria-label="Close chart"
            onClick={() => setChartContract(null)}
          />
          <div className="oc-chart-drawer oc-chart-drawer--live">
            <div className="oc-chart-drawer-head">
              <div className="oc-chart-drawer-head-main">
                <div className="oc-chart-live-pill" title="Live NSE feed">
                  LIVE
                </div>
                <div className="oc-chart-drawer-titles">
                  <h3>
                    {symbol} {chartContract.strike} {chartContract.type}
                    <span className="oc-chart-drawer-exp">{selectedExpiry}</span>
                  </h3>
                  <div className="oc-chart-drawer-stats">
                    <span>
                      LTP{' '}
                      <strong>₹{formatLtp(chartContract.ltp)}</strong>
                    </span>
                    <span className={chartContract.changePct >= 0 ? 'oc-pos' : 'oc-neg'}>
                      {chartContract.changePct >= 0 ? '+' : ''}
                      {chartContract.changePct.toFixed(2)}%
                    </span>
                    {liveSpotLabel ? (
                      <span className="oc-chart-drawer-spot">{liveSpotLabel}</span>
                    ) : null}
                    <span className="oc-chart-drawer-note">
                      Chart: {symbol} underlying (NSE)
                    </span>
                  </div>
                </div>
              </div>
              <div className="oc-chart-drawer-actions">
                <button
                  type="button"
                  className="oc-chart-tool-btn"
                  title={chartFullscreen ? 'Exit fullscreen' : 'Fullscreen chart'}
                  onClick={() => setChartFullscreen((v) => !v)}
                >
                  {chartFullscreen ? <Minimize2 strokeWidth={2} /> : <Maximize2 strokeWidth={2} />}
                  <span>{chartFullscreen ? 'Exit' : 'Full'}</span>
                </button>
                <button
                  type="button"
                  className="oc-chart-tool-btn oc-chart-tool-btn--close"
                  onClick={() => setChartContract(null)}
                  aria-label="Close chart"
                >
                  <X strokeWidth={2} />
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div className="oc-chart-drawer-body">
              <NiftyCandlestickChart
                key={`oc-chart-${symbol}`}
                symbol={symbol}
                spotPrice={spot}
                spotChange={chainData?.spotChange || 0}
                spotChangePct={chainData?.spotChangePct || 0}
                immersive
                fullTools
                height={chartHeight}
                isActive
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
