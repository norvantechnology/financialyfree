'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/options-lab.css';
import { Clock, RefreshCw, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { SandboxPortfolioDto } from '@ff/types';

type ActionKind = 'refresh' | 'square-one' | 'square-all' | 'reset' | null;

export const SandboxPortfolioView: React.FC<{ isActive?: boolean }> = ({ isActive = true }) => {
  const [portfolio, setPortfolio] = useState<SandboxPortfolioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKind>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const hasPortfolioRef = useRef(false);

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
    const { getStoredAccessToken } = await import('../../lib/auth-client');
    const token = getStoredAccessToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  const fetchPortfolio = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent) && hasPortfolioRef.current;
      try {
        if (!silent) setIsLoading(true);
        const headers = await authHeaders();
        if (!headers) {
          setAuthError('Sign in to view and manage paper positions.');
          setPortfolio(null);
          hasPortfolioRef.current = false;
          return;
        }
        const res = await fetch('/api/v1/options/sandbox/portfolio', {
          headers,
          cache: 'no-store',
        });
        if (res.status === 401) {
          setAuthError('Session expired — sign in again.');
          setPortfolio(null);
          return;
        }
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          setPortfolio(json.data);
          hasPortfolioRef.current = true;
          setAuthError(null);
        } else if (!silent) {
          setAuthError(json?.message || 'Could not load paper portfolio.');
        }
      } catch {
        if (!silent) setAuthError('Network error loading portfolio.');
      } finally {
        setIsLoading(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    void fetchPortfolio({ silent: false });
    const interval = setInterval(() => {
      if (isActive) void fetchPortfolio({ silent: true });
    }, 5000);
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

  const totalCapital = portfolio?.totalCapital || 1000000;
  const availableMargin = portfolio?.availableMargin ?? 1000000;
  const deployedMargin = portfolio?.deployedMargin ?? 0;
  const unrealizedPnl = portfolio?.unrealizedPnl ?? 0;
  const realizedPnl = portfolio?.realizedPnl ?? 0;
  const totalPnl = portfolio?.totalPnl ?? 0;
  const positions = portfolio?.positions || [];
  const isBusy = busy != null;

  return (
    <div className="opt-view-stack">
      {(actionMessage || actionError) && (
        <div
          className={`opt-sandbox-toast ${actionError ? 'is-error' : 'is-ok'}`}
          role="status"
        >
          <div className="opt-sandbox-toast-body">
            <ShieldCheck className="w-4 h-4" />
            <span>{actionError || actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActionMessage(null);
              setActionError(null);
            }}
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="opt-kpi-grid cols-6">
        <div className="opt-kpi-card" title="Virtual sandbox base capital">
          <span className="opt-kpi-label">Capital</span>
          <div className="opt-kpi-value">₹{totalCapital.toLocaleString('en-IN')}</div>
        </div>

        <div className="opt-kpi-card" title="Free margin available to deploy">
          <span className="opt-kpi-label">Available</span>
          <div className="opt-kpi-value" style={{ color: '#0284C7' }}>
            ₹{availableMargin.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="opt-kpi-card" title="Margin blocked by open positions">
          <span className="opt-kpi-label">Deployed</span>
          <div className="opt-kpi-value" style={{ color: '#D97706' }}>
            ₹{deployedMargin.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="opt-kpi-card" title="Unrealized P&L on open positions">
          <span className="opt-kpi-label">Unrealized</span>
          <div
            className="opt-kpi-value"
            style={{ color: unrealizedPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="opt-kpi-card" title="Realized P&L from closed trades">
          <span className="opt-kpi-label">Realized</span>
          <div
            className="opt-kpi-value"
            style={{ color: realizedPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="opt-kpi-card" title="Net total sandbox P&L">
          <span className="opt-kpi-label">Net P&L</span>
          <div
            className="opt-kpi-value"
            style={{ color: totalPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="opt-chart-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div className="opt-chart-icon" style={{ color: '#0F766E' }}>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="opt-chart-title">Open Positions ({positions.length})</h3>
              <p className="opt-chart-subtitle">Paper fills at live NSE prices</p>
            </div>
          </div>

          <div className="opt-sandbox-actions">
            <button
              type="button"
              onClick={() => void fetchPortfolio({ silent: true })}
              className="opt-filter-btn"
              title="Refresh quotes"
              disabled={isBusy}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || busy === 'refresh' ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {positions.length > 0 && (
              <button
                type="button"
                onClick={() => void squareOffAll()}
                className="opt-filter-btn opt-filter-btn-danger"
                disabled={isBusy}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{busy === 'square-all' ? 'Squaring…' : 'Square Off'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void resetPortfolio()}
              className="opt-filter-btn"
              disabled={isBusy}
            >
              {busy === 'reset' ? 'Resetting…' : 'Reset'}
            </button>
          </div>
        </div>

        {positions.length > 0 ? (
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
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  const liveCmp =
                    Number(pos.currentPrice) > 0
                      ? Number(pos.currentPrice)
                      : Number(pos.entryPrice) > 0
                        ? Number(pos.entryPrice)
                        : 0;
                  const rowBusy = busy === 'square-one' && busyId === pos.id;
                  return (
                    <tr key={pos.id}>
                      <td>
                        <div className="opt-sandbox-instr">
                          {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : 'FUT'}
                        </div>
                        <div className="opt-sandbox-instr-meta">
                          Expiry: {pos.expiry} · Lot {pos.lotSize}
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
                          {rowBusy ? '…' : 'Square Off'}
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
            <div className="opt-sandbox-empty-icon">
              <Clock className="w-5 h-5" />
            </div>
            <h4>{authError ? 'Paper portfolio unavailable' : 'No Open Paper Positions'}</h4>
            <p>
              {authError ||
                'Build a strategy in Strategy Builder, then tap Paper Trade to simulate fills with live market prices.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
