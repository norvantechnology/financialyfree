'use client';

import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/options-lab.css';
import { Clock, RefreshCw, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { SandboxPortfolioDto } from '@ff/types';

export const SandboxPortfolioView: React.FC = () => {
  const [portfolio, setPortfolio] = useState<SandboxPortfolioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/options/sandbox/portfolio');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPortfolio(json.data);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 3000); // 3s auto-refresh
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const squareOffPosition = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/options/sandbox/square-off/${id}`, { method: 'POST' });
      if (res.ok) {
        setActionMessage('Position squared off at live market price.');
        setTimeout(() => setActionMessage(null), 3000);
        fetchPortfolio();
      }
    } catch {
      setActionMessage('Error squaring off position.');
    }
  };

  const squareOffAll = async () => {
    if (!confirm('Are you sure you want to square off ALL open positions at live market prices?')) return;
    try {
      const res = await fetch('/api/v1/options/sandbox/square-off-all', { method: 'POST' });
      if (res.ok) {
        setActionMessage('All positions successfully squared off.');
        setTimeout(() => setActionMessage(null), 3000);
        fetchPortfolio();
      }
    } catch {
      setActionMessage('Error squaring off all positions.');
    }
  };

  const resetPortfolio = async () => {
    if (!confirm('Reset entire sandbox portfolio? This will clear all positions and restore ₹10,00,000 capital.')) return;
    try {
      const res = await fetch('/api/v1/options/sandbox/reset', { method: 'POST' });
      if (res.ok) {
        setActionMessage('Sandbox portfolio reset to ₹10,00,000.');
        setTimeout(() => setActionMessage(null), 3000);
        fetchPortfolio();
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

      {/* ── KPI Cards Grid (6 Columns) ── */}
      <div className="opt-kpi-grid cols-6">
        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Total Capital</span>
          <div className="opt-kpi-value">₹{totalCapital.toLocaleString('en-IN')}</div>
          <span className="opt-kpi-sub">Virtual Sandbox Base</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Available Margin</span>
          <div className="opt-kpi-value" style={{ color: '#0284C7' }}>
            ₹{availableMargin.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Free to deploy</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Deployed Margin</span>
          <div className="opt-kpi-value" style={{ color: '#D97706' }}>
            ₹{deployedMargin.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Margin blocked</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Unrealized P&L</span>
          <div
            className="opt-kpi-value"
            style={{ color: unrealizedPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Open live positions</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Realized P&L</span>
          <div
            className="opt-kpi-value"
            style={{ color: realizedPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Closed book trades</span>
        </div>

        <div className="opt-kpi-card">
          <span className="opt-kpi-label">Net Total P&L</span>
          <div
            className="opt-kpi-value"
            style={{ color: totalPnl >= 0 ? '#059669' : '#E11D48' }}
          >
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN')}
          </div>
          <span className="opt-kpi-sub">Cumulative sandbox ROI</span>
        </div>
      </div>

      {/* ── Positions Table Container Card ── */}
      <div className="opt-chart-card">
        <div className="opt-chart-header">
          <div className="opt-chart-title-wrap">
            <div className="opt-chart-icon" style={{ color: '#0F766E' }}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="opt-chart-title">Open Sandbox Positions ({positions.length})</h3>
              <p className="opt-chart-subtitle">
                Fills executed at real live NSE tick prices without order routing
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchPortfolio}
              className="opt-filter-btn"
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {positions.length > 0 && (
              <button
                onClick={squareOffAll}
                className="opt-filter-btn"
                style={{ background: '#FFF1F2', color: '#E11D48', borderColor: '#FECDD3' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Square Off All</span>
              </button>
            )}

            <button
              onClick={resetPortfolio}
              className="opt-filter-btn"
              style={{ background: '#F8FAFC', color: '#334155' }}
            >
              Reset Capital
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
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <Clock className="w-6 h-6 text-slate-500" />
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
              No Open Paper Positions
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              Select contracts in the Option Chain (+B / +S) or build a strategy in the Strategy Builder and click "Paper Trade in Sandbox" to simulate execution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
