'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/options-lab.css';
import { Clock, RefreshCw, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { SandboxPortfolioDto } from '@ff/types';

export const SandboxPortfolioView: React.FC = () => {
  const [portfolio, setPortfolio] = useState<SandboxPortfolioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasPortfolioRef = useRef(false);

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { getStoredAccessToken } = await import('../../lib/auth-client');
    const token = getStoredAccessToken();
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }, []);

  const fetchPortfolio = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent) && hasPortfolioRef.current;
    try {
      if (!silent) setIsLoading(true);
      const headers = await authHeaders();
      if (!(headers as Record<string, string>).Authorization) {
        setAuthError('Sign in to view and manage paper positions.');
        setPortfolio(null);
        return;
      }
      const res = await fetch('/api/v1/options/sandbox/portfolio', { headers, cache: 'no-store' });
      if (res.status === 401) {
        setAuthError('Session expired — sign in again.');
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPortfolio(json.data);
          hasPortfolioRef.current = true;
          setAuthError(null);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void fetchPortfolio({ silent: false });
    const interval = setInterval(() => {
      void fetchPortfolio({ silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const squareOffPosition = async (id: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/v1/options/sandbox/square-off/${id}`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setActionMessage('Position squared off at live market price.');
        setTimeout(() => setActionMessage(null), 3000);
        void fetchPortfolio({ silent: true });
      }
    } catch {
      setActionMessage('Error squaring off position.');
    }
  };

  const squareOffAll = async () => {
    if (!confirm('Are you sure you want to square off ALL open positions at live market prices?')) return;
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/v1/options/sandbox/square-off-all', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setActionMessage('All positions successfully squared off.');
        setTimeout(() => setActionMessage(null), 3000);
        void fetchPortfolio({ silent: true });
      }
    } catch {
      setActionMessage('Error squaring off all positions.');
    }
  };

  const resetPortfolio = async () => {
    if (!confirm('Reset entire sandbox portfolio? This will clear all positions and restore ₹10,00,000 capital.')) return;
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/v1/options/sandbox/reset', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setActionMessage('Sandbox portfolio reset to ₹10,00,000.');
        setTimeout(() => setActionMessage(null), 3000);
        void fetchPortfolio({ silent: true });
      }
    } catch {
      setActionMessage('Error resetting portfolio.');
    }
  };

  const totalCapital = portfolio?.totalCapital || 1000000;
  const availableMargin = portfolio?.availableMargin ?? 1000000;
  const deployedMargin = portfolio?.deployedMargin ?? 0;
  const unrealizedPnl = portfolio?.unrealizedPnl ?? 0;
  const realizedPnl = portfolio?.realizedPnl ?? 0;
  const totalPnl = portfolio?.totalPnl ?? 0;
  const positions = portfolio?.positions || [];

  return (
    <div className="opt-view-stack">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#92400E',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B45309' }}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── KPI strip (capital + P&L) ── */}
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

      {/* ── Positions Table Container Card ── */}
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
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {positions.length > 0 && (
              <button
                type="button"
                onClick={squareOffAll}
                className="opt-filter-btn opt-filter-btn-danger"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Square Off</span>
              </button>
            )}

            <button
              type="button"
              onClick={resetPortfolio}
              className="opt-filter-btn"
            >
              Reset
            </button>
          </div>
        </div>

        {positions.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Instrument</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Side</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Entry Price</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Live CMP</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unrealized P&L</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : 'FUT'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.125rem' }}>
                          Expiry: {pos.expiry} | Lot Size: {pos.lotSize}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <span
                          className={`opt-badge-pill ${pos.side === 'BUY' ? 'green' : 'rose'}`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                        {pos.quantity * pos.lotSize} ({pos.quantity} Lots)
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>
                        ₹{Number(pos.entryPrice).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0284C7' }}>
                        ₹{Number(pos.currentPrice).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.875rem' }}>
                        <span style={{ color: isProfit ? '#059669' : '#E11D48' }}>
                          {isProfit ? '+' : ''}₹{Number(pos.unrealizedPnl).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => squareOffPosition(pos.id)}
                          style={{
                            padding: '0.3rem 0.625rem',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                        >
                          Square Off
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="opt-sandbox-empty" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                background: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
              }}
            >
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
              {authError ? 'Paper portfolio unavailable' : 'No Open Paper Positions'}
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '420px', margin: '0 auto', lineHeight: 1.45 }}>
              {authError ||
                'Build a strategy in Strategy Builder, then tap Paper Trade to simulate fills with live market prices.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
