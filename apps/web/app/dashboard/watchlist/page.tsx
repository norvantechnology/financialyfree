'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Bell,
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { getStoredAccessToken, getApiBaseUrl } from '../../../lib/auth-client';

interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  alertPriceAbove: number | null;
  alertPriceBelow: number | null;
  addedAt: string;
  lastTriggeredAt: string | null;
  notes: string | null;
  currentPrice: number | null;
  change: number | null;
  changePct: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  alertAboveTriggered: boolean;
  alertBelowTriggered: boolean;
  distanceToAlertAbovePct: number | null;
  distanceToAlertBelowPct: number | null;
  lastPriceUpdated: string;
}

/** Empty until an API-driven suggestions endpoint is wired — never hardcode popular tickers. */
const POPULAR_SUGGESTIONS: Array<{ symbol: string; name: string }> = [];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Add stock state
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [newAlertAbove, setNewAlertAbove] = useState<string>('');
  const [newAlertBelow, setNewAlertBelow] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Editing alert modal/inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editAbove, setEditAbove] = useState<string>('');
  const [editBelow, setEditBelow] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Alert check test state
  const [alertTestMsg, setAlertTestMsg] = useState<string | null>(null);
  const [isTestingAlerts, setIsTestingAlerts] = useState<boolean>(false);

  const fetchWatchlist = useCallback(async (isRefresh = false) => {
    const token = getStoredAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err: any) {
      console.error('Watchlist fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Handle Add Item
  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddError(null);

    const clean = newSymbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
    if (!clean) {
      setAddError('Please enter a valid stock symbol (e.g. TATAMOTORS, RELIANCE)');
      return;
    }

    const token = getStoredAccessToken();
    if (!token) return;

    setIsAdding(true);
    const baseUrl = getApiBaseUrl();

    try {
      const payload: any = { symbol: clean };
      if (newAlertAbove) payload.alertPriceAbove = parseFloat(newAlertAbove);
      if (newAlertBelow) payload.alertPriceBelow = parseFloat(newAlertBelow);

      const res = await fetch(`${baseUrl}/api/v1/watchlist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to add symbol to watchlist');
      }

      setNewSymbol('');
      setNewAlertAbove('');
      setNewAlertBelow('');
      await fetchWatchlist(true);
      window.dispatchEvent(
        new CustomEvent('ff_watchlist_changed', {
          detail: { symbol: clean, isWatchlisted: true },
        }),
      );
    } catch (err: any) {
      setAddError(err.message || 'Error adding symbol');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (id: string, symbol: string) => {
    const token = getStoredAccessToken();
    if (!token) return;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        window.dispatchEvent(
          new CustomEvent('ff_watchlist_changed', {
            detail: { symbol, isWatchlisted: false },
          }),
        );
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Handle Edit Alert Save
  const handleSaveAlerts = async (id: string) => {
    const token = getStoredAccessToken();
    if (!token) return;

    setIsSavingEdit(true);
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/api/v1/watchlist/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertPriceAbove: editAbove ? parseFloat(editAbove) : null,
          alertPriceBelow: editBelow ? parseFloat(editBelow) : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setEditingItemId(null);
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Test Check Alerts
  const handleTestAlerts = async () => {
    const token = getStoredAccessToken();
    if (!token) return;

    setIsTestingAlerts(true);
    setAlertTestMsg(null);
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/api/v1/watchlist/check-alerts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.triggeredCount > 0) {
          const detail = data.triggeredAlerts
            .map((a: any) => `${a.symbol} (${a.condition})`)
            .join(', ');
          setAlertTestMsg(`⚡ ${data.triggeredCount} Alert(s) Triggered & Dispatched: ${detail}`);
        } else {
          setAlertTestMsg(`Checked ${data.checkedCount} stock alerts. All prices currently within configured thresholds.`);
        }
        await fetchWatchlist(true);
      }
    } catch (err: any) {
      setAlertTestMsg(`Alert check failed: ${err.message}`);
    } finally {
      setIsTestingAlerts(false);
    }
  };

  const configuredAlertsCount = items.filter(
    (i) => i.alertPriceAbove !== null || i.alertPriceBelow !== null,
  ).length;
  const triggeredAlertsCount = items.filter(
    (i) => i.alertAboveTriggered || i.alertBelowTriggered,
  ).length;

  return (
    <SidebarLayout activePath="/dashboard/watchlist">
      <div className="wl-container">
        {/* Header */}
        <div className="wl-header">
          <div className="wl-title-area">
            <div className="wl-title-row">
              <div className="wl-title-icon">
                <Bookmark size={20} strokeWidth={2.5} />
              </div>
              <h1 className="wl-title">
                Personal Watchlist & Price Alerts
              </h1>
              <span className="wl-badge-delayed">
                Live 15-min Delayed
              </span>
            </div>
            <p className="wl-subtitle">
              Save high-conviction compounders from research tabs, track live quotes, and receive automated WhatsApp & email price crossing alerts.
            </p>
          </div>

          <div className="wl-header-actions">
            <button
              type="button"
              onClick={() => fetchWatchlist(true)}
              disabled={refreshing}
              className="wl-btn-secondary"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Quotes'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestAlerts}
              disabled={isTestingAlerts || configuredAlertsCount === 0}
              className="wl-btn-primary"
              style={{
                opacity: configuredAlertsCount === 0 ? 0.6 : 1,
                cursor: isTestingAlerts || configuredAlertsCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Bell size={14} />
              <span>{isTestingAlerts ? 'Evaluating...' : 'Check Alerts Now'}</span>
            </button>
          </div>
        </div>

        {/* Test Alert Banner Feedback */}
        {alertTestMsg && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: alertTestMsg.includes('⚡') ? '#ECFDF5' : '#EFF6FF',
              border: alertTestMsg.includes('⚡') ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
              color: alertTestMsg.includes('⚡') ? '#065F46' : '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} />
              <span>{alertTestMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertTestMsg(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {!isAuthenticated && !loading ? (
          /* Unauthenticated Guest State */
          <div
            className="wl-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '40px auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Bookmark size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
              Sign In to Build Your Personal Watchlist
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              Create custom price-crossing alert triggers and sync saved tickers across all Techno-Funda research tabs.
            </p>
            <Link
              href="/auth/login?redirect=/dashboard/watchlist"
              className="wl-btn-primary"
              style={{
                display: 'inline-flex',
                padding: '10px 24px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <span>Sign In to Continue</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Metric Overview Cards */}
            <div className="wl-kpi-grid">
              <div className="wl-kpi-card">
                <div className="wl-kpi-header">
                  <span className="wl-kpi-title">Saved Stocks</span>
                  <Bookmark size={16} color="#64748B" />
                </div>
                <div className="wl-kpi-val">{items.length}</div>
                <div className="wl-kpi-sub">
                  Active tickers tracked in your portfolio
                </div>
              </div>

              <div className="wl-kpi-card">
                <div className="wl-kpi-header">
                  <span className="wl-kpi-title">Configured Price Alerts</span>
                  <Bell size={16} color="#D97706" />
                </div>
                <div className="wl-kpi-val" style={{ color: '#D97706' }}>
                  {configuredAlertsCount}
                </div>
                <div className="wl-kpi-sub">
                  Automated crossing thresholds active
                </div>
              </div>

              <div className="wl-kpi-card">
                <div className="wl-kpi-header">
                  <span className="wl-kpi-title">Triggered Today</span>
                  <TrendingUp size={16} color={triggeredAlertsCount > 0 ? '#059669' : '#64748B'} />
                </div>
                <div
                  className="wl-kpi-val"
                  style={{ color: triggeredAlertsCount > 0 ? '#059669' : '#0F172A' }}
                >
                  {triggeredAlertsCount}
                </div>
                <div className="wl-kpi-sub">
                  Stocks currently meeting alert targets
                </div>
              </div>
            </div>

            {/* Add Symbol Bar */}
            <div className="wl-card">
              <div className="wl-card-title">
                <Plus size={18} color="#0F766E" strokeWidth={2.5} />
                <span>Add Stock to Watchlist</span>
              </div>

              <form onSubmit={handleAddItem} className="wl-form-grid">
                <div className="wl-form-group">
                  <label className="wl-form-label">
                    NSE/BSE SYMBOL *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TATAMOTORS, INFY"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="wl-form-input"
                    style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  />
                </div>

                <div className="wl-form-group">
                  <label className="wl-form-label">
                    ALERT ABOVE (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Target above (₹)"
                    value={newAlertAbove}
                    onChange={(e) => setNewAlertAbove(e.target.value)}
                    className="wl-form-input"
                  />
                </div>

                <div className="wl-form-group">
                  <label className="wl-form-label">
                    ALERT BELOW (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Target below (₹)"
                    value={newAlertBelow}
                    onChange={(e) => setNewAlertBelow(e.target.value)}
                    className="wl-form-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="wl-form-submit-btn"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>{isAdding ? 'Adding...' : 'Add to Watchlist'}</span>
                </button>
              </form>

              {addError && (
                <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{addError}</span>
                </div>
              )}

              {POPULAR_SUGGESTIONS.length > 0 && (
                <div className="wl-quick-chips-row">
                  <span className="wl-quick-chip-label">Quick Add:</span>
                  {POPULAR_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.symbol}
                      type="button"
                      onClick={() => {
                        setNewSymbol(sug.symbol);
                      }}
                      className="wl-quick-chip"
                    >
                      +{sug.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Watchlist Table & Mobile Cards */}
            <div className="wl-table-card">
              <div className="wl-table-header-bar">
                <div className="wl-table-title">
                  Monitored Holdings ({items.length})
                </div>
                <div className="wl-table-subtitle">
                  Yahoo Finance Delayed Quote Feed (15-min)
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0F766E' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Loading real-time prices...</p>
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                  <Bookmark size={36} style={{ color: '#CBD5E1', margin: '0 auto 12px auto' }} />
                  <h3 style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                    Your Watchlist is Empty
                  </h3>
                  <p style={{ fontSize: '13px', maxWidth: '450px', margin: '0 auto 16px auto', color: '#64748B' }}>
                    Add your preferred stocks above or click the <strong style={{ color: '#0F766E' }}>+ Watchlist</strong> button on Master Tracker or Valuation Lab.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="wl-desktop-table-wrap">
                    <table className="wl-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>STOCK / COMPANY</th>
                          <th style={{ textAlign: 'right' }}>CMP (₹)</th>
                          <th style={{ textAlign: 'right' }}>DAY CHANGE</th>
                          <th style={{ textAlign: 'center' }}>PRICE ALERTS</th>
                          <th style={{ textAlign: 'center' }}>STATUS</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const isGain = (item.change || 0) >= 0;
                          const isEditing = editingItemId === item.id;

                          return (
                            <tr
                              key={item.id}
                              style={{
                                background: item.alertAboveTriggered || item.alertBelowTriggered ? '#FFFBEB' : 'transparent',
                              }}
                            >
                              {/* Stock / Company */}
                              <td>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                                  {item.symbol}
                                </div>
                                <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
                                  {item.companyName}
                                </div>
                              </td>

                              {/* CMP */}
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A', fontSize: '14.5px', fontFamily: 'var(--font-serif)' }}>
                                {item.currentPrice !== null ? `₹${item.currentPrice.toLocaleString('en-IN')}` : '—'}
                              </td>

                              {/* Day Change */}
                              <td style={{ textAlign: 'right' }}>
                                {item.change !== null && item.changePct !== null ? (
                                  <span className={isGain ? 'wl-price-gain' : 'wl-price-loss'}>
                                    {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    <span>
                                      {isGain ? '+' : ''}
                                      {item.change.toFixed(2)} ({isGain ? '+' : ''}
                                      {item.changePct.toFixed(2)}%)
                                    </span>
                                  </span>
                                ) : (
                                  <span style={{ color: '#94A3B8' }}>—</span>
                                )}
                              </td>

                              {/* Price Alerts Configuration */}
                              <td style={{ textAlign: 'center' }}>
                                {isEditing ? (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748B' }}>Above:</span>
                                      <input
                                        type="number"
                                        placeholder="Above ₹"
                                        value={editAbove}
                                        onChange={(e) => setEditAbove(e.target.value)}
                                        className="wl-inline-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748B' }}>Below:</span>
                                      <input
                                        type="number"
                                        placeholder="Below ₹"
                                        value={editBelow}
                                        onChange={(e) => setEditBelow(e.target.value)}
                                        className="wl-inline-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveAlerts(item.id)}
                                        disabled={isSavingEdit}
                                        className="wl-btn-save-sm"
                                        style={{ flex: 1 }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        className="wl-btn-cancel-sm"
                                        style={{ flex: 1 }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                                    {item.alertPriceAbove ? (
                                      <span style={{ fontSize: '11.5px', color: item.alertAboveTriggered ? '#166534' : '#334155', fontWeight: 600 }}>
                                        ▲ &gt; ₹{item.alertPriceAbove}
                                      </span>
                                    ) : null}
                                    {item.alertPriceBelow ? (
                                      <span style={{ fontSize: '11.5px', color: item.alertBelowTriggered ? '#991B1B' : '#334155', fontWeight: 600 }}>
                                        ▼ &lt; ₹{item.alertPriceBelow}
                                      </span>
                                    ) : null}
                                    {!item.alertPriceAbove && !item.alertPriceBelow ? (
                                      <span className="wl-status-none">None set</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditAbove(item.alertPriceAbove ? String(item.alertPriceAbove) : '');
                                        setEditBelow(item.alertPriceBelow ? String(item.alertPriceBelow) : '');
                                      }}
                                      className="wl-edit-target-link"
                                    >
                                      Edit Target
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Alert Status */}
                              <td style={{ textAlign: 'center' }}>
                                {item.alertAboveTriggered ? (
                                  <span className="wl-status-badge wl-status-met-above">
                                    <Bell size={11} />
                                    Target Met (Above)
                                  </span>
                                ) : item.alertBelowTriggered ? (
                                  <span className="wl-status-badge wl-status-met-below">
                                    <Bell size={11} />
                                    Target Met (Below)
                                  </span>
                                ) : item.alertPriceAbove || item.alertPriceBelow ? (
                                  <span className="wl-status-badge wl-status-active">
                                    Active (Monitoring)
                                  </span>
                                ) : (
                                  <span className="wl-status-none">No trigger</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <Link
                                    href={`/techno-funda?tab=valuation&symbol=${encodeURIComponent(item.symbol)}`}
                                    title="Open in Valuation Lab"
                                    className="wl-btn-action-valuation"
                                  >
                                    <Calculator size={12} />
                                    <span>Valuation</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id, item.symbol)}
                                    title="Remove from Watchlist"
                                    className="wl-btn-action-delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="wl-mobile-cards-wrap">
                    {items.map((item) => {
                      const isGain = (item.change || 0) >= 0;
                      const isEditing = editingItemId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="wl-mobile-stock-card"
                          style={{
                            background: item.alertAboveTriggered || item.alertBelowTriggered ? '#FFFBEB' : '#FFFFFF',
                            borderColor: item.alertAboveTriggered || item.alertBelowTriggered ? '#FDE68A' : '#E2E8F0',
                          }}
                        >
                          {/* Top Row: Symbol + Name & Status */}
                          <div className="wl-m-top-row">
                            <div>
                              <div className="wl-m-symbol">{item.symbol}</div>
                              <div className="wl-m-name">{item.companyName}</div>
                            </div>
                            <div>
                              {item.alertAboveTriggered ? (
                                <span className="wl-status-badge wl-status-met-above">
                                  <Bell size={10} />
                                  Target Met (Above)
                                </span>
                              ) : item.alertBelowTriggered ? (
                                <span className="wl-status-badge wl-status-met-below">
                                  <Bell size={10} />
                                  Target Met (Below)
                                </span>
                              ) : item.alertPriceAbove || item.alertPriceBelow ? (
                                <span className="wl-status-badge wl-status-active">
                                  Active
                                </span>
                              ) : (
                                <span className="wl-status-none">No trigger</span>
                              )}
                            </div>
                          </div>

                          {/* Price Row: CMP & Day Change */}
                          <div className="wl-m-price-row">
                            <div>
                              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Current Price</div>
                              <div className="wl-m-cmp">
                                {item.currentPrice !== null ? `₹${item.currentPrice.toLocaleString('en-IN')}` : '—'}
                              </div>
                            </div>
                            <div>
                              {item.change !== null && item.changePct !== null ? (
                                <span className={isGain ? 'wl-price-gain' : 'wl-price-loss'}>
                                  {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  <span>
                                    {isGain ? '+' : ''}
                                    {item.change.toFixed(2)} ({isGain ? '+' : ''}
                                    {item.changePct.toFixed(2)}%)
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>—</span>
                              )}
                            </div>
                          </div>

                          {/* Alerts Row */}
                          <div className="wl-m-alerts-row">
                            {isEditing ? (
                              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Above ₹</label>
                                    <input
                                      type="number"
                                      placeholder="Target above"
                                      value={editAbove}
                                      onChange={(e) => setEditAbove(e.target.value)}
                                      className="wl-inline-input"
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Below ₹</label>
                                    <input
                                      type="number"
                                      placeholder="Target below"
                                      value={editBelow}
                                      onChange={(e) => setEditBelow(e.target.value)}
                                      className="wl-inline-input"
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAlerts(item.id)}
                                    disabled={isSavingEdit}
                                    className="wl-btn-save-sm"
                                    style={{ flex: 1, padding: '7px 0', fontSize: '12px' }}
                                  >
                                    Save Alert Targets
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    className="wl-btn-cancel-sm"
                                    style={{ flex: 1, padding: '7px 0', fontSize: '12px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Alerts:</span>
                                  {item.alertPriceAbove ? (
                                    <span style={{ fontSize: '11.5px', color: item.alertAboveTriggered ? '#166534' : '#334155', fontWeight: 600 }}>
                                      ▲ &gt; ₹{item.alertPriceAbove}
                                    </span>
                                  ) : null}
                                  {item.alertPriceBelow ? (
                                    <span style={{ fontSize: '11.5px', color: item.alertBelowTriggered ? '#991B1B' : '#334155', fontWeight: 600 }}>
                                      ▼ &lt; ₹{item.alertPriceBelow}
                                    </span>
                                  ) : null}
                                  {!item.alertPriceAbove && !item.alertPriceBelow ? (
                                    <span className="wl-status-none">None configured</span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditAbove(item.alertPriceAbove ? String(item.alertPriceAbove) : '');
                                    setEditBelow(item.alertPriceBelow ? String(item.alertPriceBelow) : '');
                                  }}
                                  className="wl-edit-target-link"
                                >
                                  Edit Target
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Actions Row */}
                          <div className="wl-m-actions-row">
                            <Link
                              href={`/techno-funda?tab=valuation&symbol=${encodeURIComponent(item.symbol)}`}
                              className="wl-btn-action-valuation"
                              style={{ flex: 1, justifyContent: 'center' }}
                            >
                              <Calculator size={13} />
                              <span>Valuation Lab</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, item.symbol)}
                              className="wl-btn-action-delete"
                              title="Remove from Watchlist"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

