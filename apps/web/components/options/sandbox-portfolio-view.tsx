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
    <div className="space-y-6 animate-fadeIn">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Total Capital</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ₹{totalCapital.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Virtual Base</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Available Margin</span>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">
            ₹{availableMargin.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Free to deploy</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Deployed Margin</span>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            ₹{deployedMargin.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Margin blocked</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Unrealized P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Open positions</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Realized P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Closed trades</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Net Total P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Cumulative ROI</span>
        </div>
      </div>

      {/* Positions Table Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Open Sandbox Positions ({positions.length})</h3>
              <p className="text-xs text-neutral-400">
                Fills executed at real live NSE tick prices without order routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPortfolio}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {positions.length > 0 && (
              <button
                onClick={squareOffAll}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Square Off All
              </button>
            )}

            <button
              onClick={resetPortfolio}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
            >
              Reset Capital
            </button>
          </div>
        </div>

        {positions.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-neutral-800/80">
            <table className="w-full text-xs text-left text-neutral-300 font-mono">
              <thead className="text-[11px] uppercase bg-neutral-950/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-2.5">Instrument</th>
                  <th className="px-3 py-2.5">Side</th>
                  <th className="px-3 py-2.5 text-right">Quantity</th>
                  <th className="px-3 py-2.5 text-right">Entry Price</th>
                  <th className="px-3 py-2.5 text-right">Live CMP</th>
                  <th className="px-4 py-2.5 text-right">Unrealized P&L</th>
                  <th className="px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">
                          {pos.symbol} {pos.strike ? `₹${pos.strike} ${pos.optionType}` : 'FUT'}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-sans">
                          Expiry: {pos.expiry} | Lot Size: {pos.lotSize}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-white">
                        {pos.quantity * pos.lotSize} ({pos.quantity} Lots)
                      </td>
                      <td className="px-3 py-3 text-right text-neutral-300 font-bold">
                        ₹{Number(pos.entryPrice).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right text-sky-300 font-bold">
                        ₹{Number(pos.currentPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sm">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}₹{Number(pos.unrealizedPnl).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => squareOffPosition(pos.id)}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 transition-colors"
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
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800/80 text-neutral-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">No Open Paper Positions</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Select contracts in the Option Chain (+B / +S) or build a strategy in the Strategy Builder and click "Paper Trade in Sandbox" to simulate execution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
