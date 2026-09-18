'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import '../../styles/options-lab.css';
import { RefreshCw } from 'lucide-react';
import { OptionChainDto, SandboxPortfolioDto, SandboxPositionDto } from '@ff/types';

type ActionKind = 'refresh' | 'square-one' | 'square-all' | 'reset' | null;

function calcUnrealized(
  side: string,
  entry: number,
  cmp: number,
  quantity: number,
  lotSize: number,
): number {
  const totalQty = quantity * lotSize;
  const raw = side === 'BUY' ? (cmp - entry) * totalQty : (entry - cmp) * totalQty;
  return Math.round(raw * 100) / 100;
}

function toExpiryIso(a?: string | null): string {
  if (!a) return '';
  const s = String(a).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s.slice(0, 10);
}

function sameExpiry(a?: string | null, b?: string | null): boolean {
  const x = toExpiryIso(a);
  const y = toExpiryIso(b);
  return Boolean(x && y && x === y);
}

function ltpFromChain(
  chain: OptionChainDto | null | undefined,
  pos: Pick<SandboxPositionDto, 'symbol' | 'strike' | 'optionType' | 'expiry'>,
): number | null {
  if (!chain?.contracts?.length) return null;
  if (chain.underlying && pos.symbol && chain.underlying.toUpperCase() !== pos.symbol.toUpperCase()) {
    return null;
  }
  // Critical: never overlay LTP from a different expiry (e.g. weekly vs monthly)
  if (!sameExpiry(pos.expiry, chain.selectedExpiry)) {
    return null;
  }
  if (pos.strike == null || pos.optionType === 'FUT') {
    return chain.spotPrice > 0 ? chain.spotPrice : null;
  }
  const row = chain.contracts.find((c) => Math.abs(Number(c.strike) - Number(pos.strike)) < 0.51);
  if (!row) return null;
  const side = pos.optionType === 'CE' ? row.ce : row.pe;
  const ltp = Number(side?.ltp) || 0;
  if (ltp > 0) return ltp;
  const bid = Number(side?.bidPrice) || 0;
  const ask = Number(side?.askPrice) || 0;
  if (bid > 0 && ask > 0) return Math.round(((bid + ask) / 2) * 100) / 100;
  if (bid > 0) return bid;
  if (ask > 0) return ask;
  return null;
}

function chainKey(symbol: string, expiry: string): string {
  return `${symbol.toUpperCase()}|${toExpiryIso(expiry)}`;
}

export const SandboxPortfolioView: React.FC<{
  isActive?: boolean;
  /** Live option chain from Strategy Builder / WS - overlays CMP instantly */
  liveChain?: OptionChainDto | null;
}> = ({ isActive = true, liveChain = null }) => {
  const [portfolio, setPortfolio] = useState<SandboxPortfolioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKind>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastMarkAt, setLastMarkAt] = useState<number | null>(null);
  /** Per symbol|expiry chains so multi-expiry books mark correctly */
  const [markChains, setMarkChains] = useState<Record<string, OptionChainDto>>({});
  const hasPortfolioRef = useRef(false);
  const inFlightRef = useRef(false);
  const marksInFlightRef = useRef(false);

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setActionMessage(null);
    } else {
      setActionMessage(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionMessage(null);
      setActionError(null);
    }, 4000);
  };

  const authHeaders = useCallback(async (): Promise<HeadersInit | null> => {
    const { ensureFreshAccessToken, redirectToLogin } = await import('../../lib/auth-client');
    const token = await ensureFreshAccessToken();
    if (!token) {
      redirectToLogin('/options-lab');
      return null;
    }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  const fetchPortfolio = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (inFlightRef.current) return;
      const silent = Boolean(opts?.silent) && hasPortfolioRef.current;
      try {
        inFlightRef.current = true;
        if (!silent) setIsLoading(true);
        const headers = await authHeaders();
        if (!headers) {
          setAuthError('Session expired - redirecting to sign in...');
          setPortfolio(null);
          hasPortfolioRef.current = false;
          return;
        }
        const res = await fetch('/api/v1/options/sandbox/portfolio', {
          headers,
          cache: 'no-store',
        });
        if (res.status === 401) {
          const { ensureFreshAccessToken, redirectToLogin } = await import('../../lib/auth-client');
          const retryToken = await ensureFreshAccessToken();
          if (!retryToken) {
            setAuthError('Session expired - redirecting to sign in...');
            setPortfolio(null);
            redirectToLogin('/options-lab');
            return;
          }
          const retry = await fetch('/api/v1/options/sandbox/portfolio', {
            headers: {
              Authorization: `Bearer ${retryToken}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });
          if (retry.status === 401) {
            setAuthError('Session expired - redirecting to sign in...');
            setPortfolio(null);
            redirectToLogin('/options-lab');
            return;
          }
          const retryJson = await retry.json().catch(() => null);
          if (retry.ok && retryJson?.data) {
            setPortfolio(retryJson.data);
            hasPortfolioRef.current = true;
            setAuthError(null);
            setLastMarkAt(Date.now());
          }
          return;
        }
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          setPortfolio(json.data);
          hasPortfolioRef.current = true;
          setAuthError(null);
          setLastMarkAt(Date.now());
        } else if (!silent) {
          setAuthError(json?.message || 'Could not load paper portfolio.');
        }
      } catch {
        if (!silent) setAuthError('Network error loading portfolio.');
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    },
    [authHeaders],
  );

  // Fast poll while Simulator tab is active (3s - marks use shared hot cache)
  useEffect(() => {
    void fetchPortfolio({ silent: false });
    const interval = setInterval(() => {
      if (isActive) void fetchPortfolio({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, isActive]);

  useEffect(() => {
    if (isActive) void fetchPortfolio({ silent: true });
  }, [isActive, fetchPortfolio]);

  useEffect(() => {
    const onRefresh = () => void fetchPortfolio({ silent: false });
    window.addEventListener('sandbox:refresh', onRefresh);
    return () => window.removeEventListener('sandbox:refresh', onRefresh);
  }, [fetchPortfolio]);

  // Fetch a live chain for every open position expiry (Strategy Builder only has one)
  const openExpiryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const pos of portfolio?.positions || []) {
      if (!pos.symbol || !pos.expiry) continue;
      keys.add(chainKey(pos.symbol, pos.expiry));
    }
    return Array.from(keys).sort();
  }, [portfolio?.positions]);

  const fetchMarkChains = useCallback(async () => {
    if (!isActive || openExpiryKeys.length === 0 || marksInFlightRef.current) return;
    marksInFlightRef.current = true;
    try {
      const next: Record<string, OptionChainDto> = {};
      await Promise.all(
        openExpiryKeys.map(async (key) => {
          const [sym, exp] = key.split('|');
          if (!sym || !exp) return;
          try {
            const qs = new URLSearchParams({ expiry: exp, fresh: '1' });
            const res = await fetch(`/api/v1/options/chain/${sym}?${qs.toString()}`, {
              cache: 'no-store',
            });
            if (!res.ok) return;
            const json = await res.json().catch(() => null);
            const chain = json?.data as OptionChainDto | undefined;
            if (chain?.contracts?.length && sameExpiry(chain.selectedExpiry, exp)) {
              next[key] = chain;
            }
          } catch {
            /* keep previous mark chain */
          }
        }),
      );
      if (Object.keys(next).length > 0) {
        setMarkChains((prev) => ({ ...prev, ...next }));
        setLastMarkAt(Date.now());
      }
    } finally {
      marksInFlightRef.current = false;
    }
  }, [isActive, openExpiryKeys]);

  useEffect(() => {
    void fetchMarkChains();
    const interval = setInterval(() => {
      if (isActive) void fetchMarkChains();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMarkChains, isActive]);

  /** Merge API portfolio with live LTPs from every matching expiry chain */
  const markedPositions = useMemo(() => {
    const positions = portfolio?.positions || [];
    return positions.map((pos) => {
      const key = chainKey(pos.symbol, pos.expiry);
      const expiryChain = markChains[key] || null;
      const chainLtp =
        ltpFromChain(expiryChain, pos) ?? ltpFromChain(liveChain, pos);
      const apiCmp =
        Number(pos.currentPrice) > 0
          ? Number(pos.currentPrice)
          : Number(pos.entryPrice) > 0
            ? Number(pos.entryPrice)
            : 0;
      const cmp = chainLtp != null && chainLtp > 0 ? chainLtp : apiCmp;
      const entry = Number(pos.entryPrice);
      const unrealized = calcUnrealized(pos.side, entry, cmp, pos.quantity, pos.lotSize);
      const fromMatchingChain = chainLtp != null && chainLtp > 0;
      const quoteLive = Boolean(fromMatchingChain || pos.quoteLive === true);
      return { ...pos, currentPrice: cmp, unrealizedPnl: unrealized, quoteLive };
    });
  }, [portfolio, liveChain, markChains]);

  const liveUnrealized = useMemo(
    () => Math.round(markedPositions.reduce((a, p) => a + p.unrealizedPnl, 0) * 100) / 100,
    [markedPositions],
  );
  const realizedPnl = portfolio?.realizedPnl ?? 0;
  const liveTotalPnl = Math.round((liveUnrealized + realizedPnl) * 100) / 100;
  const totalCapital = portfolio?.totalCapital || 1000000;
  const availableMargin = portfolio?.availableMargin ?? 1000000;
  const deployedMargin = portfolio?.deployedMargin ?? 0;
  const isBusy = busy != null;
  const anyLiveQuote = markedPositions.some((p) => p.quoteLive);
  const marksLabel =
    (anyLiveQuote
      ? markChains[openExpiryKeys[0]]?.source ||
        portfolio?.marksSource ||
        liveChain?.source
      : portfolio?.marksSource) ||
    (liveChain?.source ? String(liveChain.source) : null);
  const showInitialLoad = isLoading && !portfolio && !authError;
  const markExpiryLabel =
    openExpiryKeys.length > 1
      ? `${openExpiryKeys.length} expiries`
      : openExpiryKeys[0]?.split('|')[1] || liveChain?.selectedExpiry || null;

  const squareOffPosition = async (id: string) => {
    if (busy) return;
    setBusy('square-one');
    setBusyId(id);
    try {
      const headers = await authHeaders();
      if (!headers) {
        showMsg('Sign in required to square off.', true);
        return;
      }
      const res = await fetch(`/api/v1/options/sandbox/square-off/${id}`, {
        method: 'POST',
        headers,
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success !== false) {
        showMsg(json?.message || 'Position squared off at live market price.');
        await fetchPortfolio({ silent: true });
        void fetchMarkChains();
      } else {
        showMsg(json?.message || 'Could not square off position.', true);
      }
    } catch {
      showMsg('Error squaring off position.', true);
    } finally {
      setBusy(null);
      setBusyId(null);
    }
  };

  const squareOffAll = async () => {
    if (busy) return;
    if (!confirm('Square off ALL open positions at live market prices?')) return;
    setBusy('square-all');
    try {
      const headers = await authHeaders();
      if (!headers) {
        showMsg('Sign in required to square off.', true);
        return;
      }
      const res = await fetch('/api/v1/options/sandbox/square-off-all', {
        method: 'POST',
        headers,
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success !== false) {
        const count = typeof json?.count === 'number' ? json.count : null;
        showMsg(
          count != null
            ? `Squared off ${count} position${count === 1 ? '' : 's'}.`
            : 'All positions successfully squared off.',
        );
        await fetchPortfolio({ silent: true });
        void fetchMarkChains();
      } else {
        showMsg(json?.message || 'Could not square off all positions.', true);
      }
    } catch {
      showMsg('Error squaring off all positions.', true);
    } finally {
      setBusy(null);
    }
  };

  const resetPortfolio = async () => {
    if (busy) return;
    if (
      !confirm(
        'Reset entire sandbox portfolio? This clears all positions and restores ₹10,00,000 capital.',
      )
    ) {
      return;
    }
    setBusy('reset');
    try {
      const headers = await authHeaders();
      if (!headers) {
        showMsg('Sign in required to reset.', true);
        return;
      }
      const res = await fetch('/api/v1/options/sandbox/reset', {
        method: 'POST',
        headers,
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success !== false) {
        showMsg(json?.message || 'Sandbox portfolio reset to ₹10,00,000.');
        setMarkChains({});
        await fetchPortfolio({ silent: false });
      } else {
        showMsg(json?.message || 'Could not reset portfolio.', true);
      }
    } catch {
      showMsg('Error resetting portfolio.', true);
    } finally {
      setBusy(null);
    }
  };

  const history = portfolio?.history || [];
  const asOfLabel = portfolio?.asOf
    ? new Date(portfolio.asOf).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : lastMarkAt
      ? new Date(lastMarkAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : null;

  if (showInitialLoad) {
    return (
      <div className="opt-view-stack" aria-busy="true" aria-live="polite">
        <div className="opt-sandbox-boot">
          <div className="opt-sandbox-boot-spinner" aria-hidden />
          <h3 className="opt-sandbox-boot-title">Loading paper portfolio</h3>
          <p className="opt-sandbox-boot-msg">
            Fetching open positions and marking them to live market prices. This usually takes a moment.
          </p>
          <div className="opt-sandbox-boot-skel" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="opt-sandbox-boot-skel-card">
                <span className="opt-sandbox-boot-skel-line short" />
                <span className="opt-sandbox-boot-skel-line" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="opt-view-stack">
      {(actionMessage || actionError) && (
        <div
          className={`opt-sandbox-toast ${actionError ? 'is-error' : 'is-ok'}`}
          role="status"
        >
          <div className="opt-sandbox-toast-body">
            <span>{actionError || actionMessage}</span>
          </div>
          <button
            type="button"
            className="opt-sandbox-toast-dismiss"
            onClick={() => {
              setActionMessage(null);
              setActionError(null);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="opt-sandbox-banner">
        <div className="opt-sandbox-banner-meta">
          <span className={`opt-sandbox-banner-source ${marksLabel?.includes('LIVE') ? 'is-live' : ''}`}>
            {marksLabel || 'PAPER'}
          </span>
          {asOfLabel ? <span className="opt-sandbox-banner-time">{asOfLabel}</span> : null}
        </div>
        <div className="opt-sandbox-banner-kpis" role="group" aria-label="Paper portfolio summary">
          <div className="opt-sandbox-kpi" title="Virtual sandbox base capital">
            <span className="opt-sandbox-kpi-label">Capital</span>
            <span className="opt-sandbox-kpi-value">₹{totalCapital.toLocaleString('en-IN')}</span>
          </div>
          <div className="opt-sandbox-kpi" title="Free margin available to deploy">
            <span className="opt-sandbox-kpi-label">Available</span>
            <span className="opt-sandbox-kpi-value is-avail">₹{availableMargin.toLocaleString('en-IN')}</span>
          </div>
          <div className="opt-sandbox-kpi" title="Margin blocked by open positions">
            <span className="opt-sandbox-kpi-label">Deployed</span>
            <span className="opt-sandbox-kpi-value is-deployed">₹{deployedMargin.toLocaleString('en-IN')}</span>
          </div>
          <div className="opt-sandbox-kpi" title="Unrealized P&L on open positions">
            <span className="opt-sandbox-kpi-label">Unrealized</span>
            <span className={`opt-sandbox-kpi-value ${liveUnrealized >= 0 ? 'is-pos' : 'is-neg'}`}>
              {liveUnrealized >= 0 ? '+' : ''}₹{liveUnrealized.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="opt-sandbox-kpi" title="Realized P&L from squared-off trades">
            <span className="opt-sandbox-kpi-label">Realized</span>
            <span className={`opt-sandbox-kpi-value ${realizedPnl >= 0 ? 'is-pos' : 'is-neg'}`}>
              {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="opt-sandbox-kpi opt-sandbox-kpi--net" title="Net total sandbox P&L">
            <span className="opt-sandbox-kpi-label">Net P&L</span>
            <span className={`opt-sandbox-kpi-value ${liveTotalPnl >= 0 ? 'is-pos' : 'is-neg'}`}>
              {liveTotalPnl >= 0 ? '+' : ''}₹{liveTotalPnl.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div className="opt-chart-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div>
              <h3 className="opt-chart-title">Open Positions ({markedPositions.length})</h3>
              <p className="opt-chart-subtitle">
                Marked to live market prices for each position expiry
                {markExpiryLabel ? ` · ${markExpiryLabel}` : ''}
              </p>
            </div>
          </div>

          <div className="opt-sandbox-actions">
            <button
              type="button"
              onClick={() => {
                void fetchPortfolio({ silent: true });
                void fetchMarkChains();
              }}
              className="opt-sandbox-btn"
              title="Refresh live quotes"
              disabled={isBusy}
            >
              <RefreshCw className={`opt-sandbox-btn-ico ${isLoading ? 'is-spin' : ''}`} aria-hidden />
              Refresh
            </button>

            {markedPositions.length > 0 && (
              <button
                type="button"
                onClick={() => void squareOffAll()}
                className="opt-sandbox-btn opt-sandbox-btn--danger"
                disabled={isBusy}
              >
                {busy === 'square-all' ? 'Squaring...' : 'Square Off'}
              </button>
            )}

            <button
              type="button"
              onClick={() => void resetPortfolio()}
              className="opt-sandbox-btn"
              disabled={isBusy}
            >
              {busy === 'reset' ? 'Resetting...' : 'Reset'}
            </button>
          </div>
        </div>

        {markedPositions.length > 0 ? (
          <div className="opt-sandbox-table-wrap">
            <table className="opt-sandbox-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th className="num">Quantity</th>
                  <th className="num">Entry</th>
                  <th className="num">Live CMP</th>
                  <th className="num">Unrealized P&L</th>
                  <th className="center">Action</th>
                </tr>
              </thead>
              <tbody>
                {markedPositions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  const liveCmp = Number(pos.currentPrice);
                  const rowBusy = busy === 'square-one' && busyId === pos.id;
                  return (
                    <tr key={pos.id}>
                      <td>
                        <div className="opt-sandbox-instr">
                          {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : 'FUT'}
                        </div>
                        <div className="opt-sandbox-instr-meta">
                          Expiry: {toExpiryIso(pos.expiry) || pos.expiry} · Lot {pos.lotSize}
                          {pos.quoteLive ? ' · live' : ' · awaiting quote'}
                        </div>
                      </td>
                      <td>
                        <span className={`opt-badge-pill ${pos.side === 'BUY' ? 'green' : 'rose'}`}>
                          {pos.side}
                        </span>
                      </td>
                      <td className="num">
                        {pos.quantity * pos.lotSize} ({pos.quantity} Lots)
                      </td>
                      <td className="num mono">₹{Number(pos.entryPrice).toFixed(2)}</td>
                      <td className="num mono cmp">₹{liveCmp.toFixed(2)}</td>
                      <td className="num mono">
                        <span style={{ color: isProfit ? '#059669' : '#E11D48', fontWeight: 800 }}>
                          {isProfit ? '+' : ''}₹{Number(pos.unrealizedPnl).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="center">
                        <button
                          type="button"
                          className="opt-sandbox-sqoff"
                          disabled={isBusy}
                          onClick={() => void squareOffPosition(pos.id)}
                        >
                          {rowBusy ? '...' : 'Square Off'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="opt-sandbox-empty">
            <h4>{authError ? 'Paper portfolio unavailable' : 'No open paper positions'}</h4>
            <p>
              {authError ||
                'Build a strategy in Strategy Builder, then use Paper Trade to fill positions at live market prices. Squared-off trades appear in Trade History below.'}
            </p>
          </div>
        )}
      </div>

      <div className="opt-chart-card opt-sandbox-history-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div>
              <h3 className="opt-chart-title">Trade History ({history.length})</h3>
              <p className="opt-chart-subtitle">
                Squared-off paper trades · realized P&L booked at exit
              </p>
            </div>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="opt-sandbox-table-wrap opt-sandbox-history-wrap">
            <table className="opt-sandbox-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th className="num">Qty</th>
                  <th className="num">Entry</th>
                  <th className="num">Exit</th>
                  <th className="num">Realized P&L</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {history.map((pos) => {
                  const pnl = Number(pos.realizedPnl) || 0;
                  const isProfit = pnl >= 0;
                  return (
                    <tr key={pos.id}>
                      <td>
                        <div className="opt-sandbox-instr">
                          {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : 'FUT'}
                        </div>
                        <div className="opt-sandbox-instr-meta">
                          Expiry: {toExpiryIso(pos.expiry) || pos.expiry}
                        </div>
                      </td>
                      <td>
                        <span className={`opt-badge-pill ${pos.side === 'BUY' ? 'green' : 'rose'}`}>
                          {pos.side}
                        </span>
                      </td>
                      <td className="num">
                        {pos.quantity * pos.lotSize}
                      </td>
                      <td className="num mono">₹{Number(pos.entryPrice).toFixed(2)}</td>
                      <td className="num mono cmp">₹{Number(pos.currentPrice).toFixed(2)}</td>
                      <td className="num mono">
                        <span style={{ color: isProfit ? '#059669' : '#E11D48', fontWeight: 800 }}>
                          {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="opt-sandbox-closed-at">
                        {pos.closedAt
                          ? new Date(pos.closedAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="opt-sandbox-empty opt-sandbox-empty--compact">
            <h4>No squared-off trades yet</h4>
            <p>When you square off a position, it moves here with booked realized P&L.</p>
          </div>
        )}
      </div>
    </div>
  );
};
