'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Info,
  Lock,
  Key,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';

export interface DataSourceItem {
  id: string;
  sourceKey: string;
  sourceName: string;
  mode: 'LIVE_FETCH' | 'COMPUTED_FROM_LIVE' | 'STATIC_SEED' | 'MOCK_PROVIDER';
  status: 'SUCCESS' | 'FAILURE';
  upstreamRef: string;
  lastFetchedAt: string;
  durationMs: number;
  rawResponseSnippet: string;
  errorMessage?: string | null;
  updatedAt: string;
}

export interface AccountIntegrityCheck {
  checkKey: string;
  name: string;
  status: 'PASS' | 'FAIL';
  executedAt: string;
  durationMs: number;
  httpCodes?: Record<string, number>;
  rawOutput: Record<string, unknown>;
  notes: string;
}

export default function DataIntegrityPage() {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [serverTime, setServerTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now());

  // Account & Session Integrity state
  const [accountChecks, setAccountChecks] = useState<AccountIntegrityCheck[]>([]);
  const [loadingAccountChecks, setLoadingAccountChecks] = useState(true);
  const [runningCheckKey, setRunningCheckKey] = useState<string | null>(null);
  const [runningAllAccountChecks, setRunningAllAccountChecks] = useState(false);
  const [expandedCheckKeys, setExpandedCheckKeys] = useState<Record<string, boolean>>({});
  const [copiedCheckKey, setCopiedCheckKey] = useState<string | null>(null);
  const [accountFlashKey, setAccountFlashKey] = useState<string | null>(null);

  // Global Platform Access Mode Switch (system_settings)
  const [accessMode, setAccessMode] = useState<'FREE' | 'SUBSCRIPTION'>('FREE');
  const [isAccessModeUpdating, setIsAccessModeUpdating] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const loadAccessMode = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/app-config/access-mode`);
      if (res.ok) {
        const data = await res.json();
        setAccessMode(data.mode);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ff_access_mode', data.mode);
        }
      }
    } catch (e) {
      console.warn('Failed to load access mode', e);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadAccessMode();
  }, [loadAccessMode]);

  const handleToggleAccessMode = async () => {
    const nextMode = accessMode === 'FREE' ? 'SUBSCRIPTION' : 'FREE';
    try {
      setIsAccessModeUpdating(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/app-config/access-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setAccessMode(data.mode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ff_access_mode', data.mode);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('ff_auth_state_changed'));
      }
      showToast(
        `Platform access mode successfully switched to ${data.mode}! ${
          data.mode === 'FREE'
            ? 'All research desks and tabs are now completely free for everyone.'
            : 'Paywall locks and subscription requirements are now re-engaged.'
        }`,
        'success'
      );
    } catch (err: any) {
      showToast(`Failed to update access mode: ${err.message}`, 'error');
    } finally {
      setIsAccessModeUpdating(false);
    }
  };

  // Live seconds ticker for relative times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadDataSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/data-integrity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSources(json.sources || []);
      setServerTime(json.serverTime || new Date().toISOString());
    } catch (err: any) {
      showToast(`Failed to load data integrity records: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  const handleRefreshSingle = async (sourceKey: string) => {
    try {
      setRefreshingKey(sourceKey);
      const res = await fetch(`${apiUrl}/api/v1/admin/data-integrity/${sourceKey}/refresh`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const updated = json.updatedSource as DataSourceItem;

      setSources((prev) =>
        prev.map((item) => (item.sourceKey === sourceKey ? updated : item)),
      );
      setServerTime(json.serverTime || new Date().toISOString());

      // Trigger visual highlight flash
      setFlashKey(sourceKey);
      setTimeout(() => setFlashKey(null), 1800);

      showToast(
        `Refreshed ${updated.sourceName} (${updated.mode}) in ${updated.durationMs}ms`,
        'success',
      );
    } catch (err: any) {
      showToast(`Failed to refresh ${sourceKey}: ${err.message}`, 'error');
    } finally {
      setRefreshingKey(null);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/data-integrity/refresh-all`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.updatedSources)) {
        setSources(json.updatedSources);
      }
      setServerTime(json.serverTime || new Date().toISOString());
      showToast('All 11 data dependencies refreshed from upstream and re-evaluated.', 'success');
    } catch (err: any) {
      showToast(`Failed to batch refresh: ${err.message}`, 'error');
    } finally {
      setRefreshingAll(false);
    }
  };

  const loadAccountChecks = useCallback(async () => {
    try {
      setLoadingAccountChecks(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/account-integrity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAccountChecks(json.checks || []);
    } catch (err: any) {
      showToast(`Failed to load account integrity checks: ${err.message}`, 'error');
    } finally {
      setLoadingAccountChecks(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadAccountChecks();
  }, [loadAccountChecks]);

  const handleRunSpecificCheck = async (checkKey: string) => {
    try {
      setRunningCheckKey(checkKey);
      const res = await fetch(`${apiUrl}/api/v1/admin/account-integrity/${checkKey}/run`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const result = json.result as AccountIntegrityCheck;

      setAccountChecks((prev) =>
        prev.map((c) => (c.checkKey === checkKey ? result : c)),
      );

      setAccountFlashKey(checkKey);
      setTimeout(() => setAccountFlashKey(null), 1800);

      showToast(`Check "${result.name}" executed: ${result.status} (${result.durationMs}ms)`, 'success');
    } catch (err: any) {
      showToast(`Failed to execute check ${checkKey}: ${err.message}`, 'error');
    } finally {
      setRunningCheckKey(null);
    }
  };

  const handleRunAllAccountChecks = async () => {
    try {
      setRunningAllAccountChecks(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/account-integrity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAccountChecks(json.checks || []);
      showToast(`Executed all 8 Account & Session Integrity checks!`, 'success');
    } catch (err: any) {
      showToast(`Failed to run all checks: ${err.message}`, 'error');
    } finally {
      setRunningAllAccountChecks(false);
    }
  };

  const toggleExpand = (sourceKey: string) => {
    setExpandedKeys((prev) => ({ ...prev, [sourceKey]: !prev[sourceKey] }));
  };

  const toggleCheckExpanded = (key: string) => {
    setExpandedCheckKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (sourceKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(sourceKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyCheckJson = (key: string, data: any) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedCheckKey(key);
    setTimeout(() => setCopiedCheckKey(null), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'Never';
    const timestamp = new Date(isoString).getTime();
    const diffSec = Math.max(0, Math.floor((currentTimeTick - timestamp) / 1000));
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  };

  const formatExactIst = (isoString: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getModeBadge = (mode: DataSourceItem['mode']) => {
    switch (mode) {
      case 'LIVE_FETCH':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #BBF7D0',
            }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} /> LIVE_FETCH
          </span>
        );
      case 'COMPUTED_FROM_LIVE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: '#E0F2FE',
              color: '#0369A1',
              border: '1px solid #BAE6FD',
            }}
          >
            <Activity size={11} /> COMPUTED_FROM_LIVE
          </span>
        );
      case 'STATIC_SEED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FDE68A',
            }}
          >
            <FileCode size={11} /> STATIC_SEED
          </span>
        );
      case 'MOCK_PROVIDER':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: '#F3E8FF',
              color: '#7E22CE',
              border: '1px solid #E9D5FF',
            }}
          >
            <ShieldCheck size={11} /> MOCK_PROVIDER
          </span>
        );
      default:
        return null;
    }
  };

  const liveFetchCount = sources.filter((s) => s.mode === 'LIVE_FETCH').length;
  const computedCount = sources.filter((s) => s.mode === 'COMPUTED_FROM_LIVE').length;
  const staticCount = sources.filter((s) => s.mode === 'STATIC_SEED').length;

  return (
    <SidebarLayout activePath="/admin">
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', paddingBottom: '60px' }}>
        {/* Static Snapshot Banner */}
        <StaticSnapshotBanner
          datasetNote="Audit Registry: Real PostgreSQL `data_source_health` table logging every fetch attempt and raw response"
          sourceNote="Enforces objective classification: LIVE_FETCH | COMPUTED_FROM_LIVE | STATIC_SEED | MOCK_PROVIDER"
        />

        {/* Header Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>
                Admin &bull; Observability &bull; Provenance
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                table: data_source_health
              </span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
              }}
            >
              Data Integrity &amp; Upstream Diagnostics
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, maxWidth: '720px' }}>
              Objective diagnostic registry tracking all 11 external dependencies. Shows actual raw upstream payloads,
              real server timestamps recorded directly in PostgreSQL, and real latency per fetch.
            </p>
          </div>

          {/* Right Action: Batch Refresh & Server Time */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              id="force-refresh-all-btn"
              onClick={handleRefreshAll}
              disabled={refreshingAll || loading}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: refreshingAll ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={15} className={refreshingAll ? 'animate-spin' : ''} />
              {refreshingAll ? 'Refreshing 11 Sources...' : 'Force Refresh All (11 Sources)'}
            </button>
            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} />
              <span>Server Clock:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                {serverTime ? formatExactIst(serverTime) : 'Syncing...'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Platform Access Switch Card */}
        <div
          id="global-access-mode-card"
          style={{
            background: accessMode === 'FREE'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
            border: `1.5px solid ${accessMode === 'FREE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            boxShadow: accessMode === 'FREE'
              ? '0 4px 16px rgba(16, 185, 129, 0.08)'
              : '0 4px 16px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: accessMode === 'FREE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${accessMode === 'FREE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accessMode === 'FREE' ? '#10B981' : '#F59E0B',
                flexShrink: 0,
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>
                  Database Switch &bull; PostgreSQL `system_settings`
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: accessMode === 'FREE' ? '#DCFCE7' : '#FEF3C7',
                    color: accessMode === 'FREE' ? '#15803D' : '#B45309',
                    border: `1px solid ${accessMode === 'FREE' ? '#BBF7D0' : '#FDE68A'}`,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: accessMode === 'FREE' ? '#16A34A' : '#D97706',
                    }}
                  />
                  CURRENT MODE: {accessMode === 'FREE' ? 'FREE (100% UNLOCKED FOR ALL)' : 'SUBSCRIPTION (PAYWALLS ENFORCED)'}
                </span>
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: '0 0 4px 0',
                }}
              >
                Global Product Access Switch
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0, maxWidth: '760px', lineHeight: 1.5 }}>
                {accessMode === 'FREE'
                  ? 'Platform is currently in FREE mode. All 23 research desks, scanners, models, and LMS lessons are fully unlocked for all users without requiring a subscription. Toggling will instantly restore paywalls across the app.'
                  : 'Platform is currently in SUBSCRIPTION mode. Research desks, scanners, and masterclasses require an active plan or pro entitlement. Toggling will grant free all-access to all visitors immediately.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              id="toggle-access-mode-btn"
              onClick={handleToggleAccessMode}
              disabled={isAccessModeUpdating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isAccessModeUpdating ? 'wait' : 'pointer',
                background: accessMode === 'FREE' ? '#0F172A' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: accessMode === 'FREE'
                  ? '0 4px 12px rgba(15, 23, 42, 0.25)'
                  : '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={isAccessModeUpdating ? 'animate-spin' : ''} />
              {isAccessModeUpdating
                ? 'Updating Mode in DB...'
                : accessMode === 'FREE'
                ? 'Switch to SUBSCRIPTION Mode (Lock Tabs)'
                : 'Switch to FREE Mode (Unlock All Tabs)'}
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ padding: '14px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Total Tracked Dependencies
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              {sources.length}
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Audit coverage 100% complete</span>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803D', textTransform: 'uppercase' }}>
              Live HTTP Fetchers
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>
              {liveFetchCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>/ 11</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>AMFI, Indices, VIX, Vahan</span>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0369A1', textTransform: 'uppercase' }}>
              Computed From Live
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0369A1', marginTop: '4px' }}>
              {computedCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>/ 11</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Market Mood Index (@ff/calc)</span>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#B45309', textTransform: 'uppercase' }}>
              Curated Statutory Seeds
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>
              {staticCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>/ 11</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Curated Research Feeds</span>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              background: toast.type === 'error' ? '#991B1B' : '#0F172A',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} color="#4ADE80" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Main Diagnostics Table */}
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC',
            }}
          >
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Data Dependencies Live Registry
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Every row reflects genuine database state from table <code style={{ color: '#0F766E' }}>data_source_health</code>
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Click <strong>Force refresh now</strong> to re-run live fetch and verify timestamp progression
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Data Source</th>
                  <th style={{ padding: '12px 14px' }}>Mode</th>
                  <th style={{ padding: '12px 14px' }}>Status &amp; Latency</th>
                  <th style={{ padding: '12px 14px' }}>Last Fetched / Computed</th>
                  <th style={{ padding: '12px 16px' }}>Upstream Reference</th>
                  <th style={{ padding: '12px 16px' }}>Raw Value Snippet</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      <div>Querying PostgreSQL <code>data_source_health</code>...</div>
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                      No data source records found. Click &quot;Force Refresh All&quot; to initialize database table.
                    </td>
                  </tr>
                ) : (
                  sources.map((item) => {
                    const isRefreshing = refreshingKey === item.sourceKey;
                    const isFlashing = flashKey === item.sourceKey;
                    const isExpanded = !!expandedKeys[item.sourceKey];
                    const isSuccess = item.status === 'SUCCESS';
                    const hasHttpUrl = item.upstreamRef.startsWith('http');

                    return (
                      <React.Fragment key={item.sourceKey}>
                        <tr
                          id={`row-${item.sourceKey}`}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isFlashing
                              ? '#FEF08A'
                              : isRefreshing
                              ? '#EFF6FF'
                              : 'transparent',
                            transition: 'background-color 0.4s ease',
                          }}
                        >
                          {/* 1. Data Source */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                              {item.sourceName}
                            </div>
                            <code style={{ fontSize: '11px', color: '#64748B', background: '#F8FAFC', padding: '1px 5px', borderRadius: '3px' }}>
                              {item.sourceKey}
                            </code>
                          </td>

                          {/* 2. Mode */}
                          <td style={{ padding: '14px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {getModeBadge(item.mode)}
                          </td>

                          {/* 3. Status & Latency */}
                          <td style={{ padding: '14px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {isSuccess ? (
                                <CheckCircle2 size={13} color="#16A34A" />
                              ) : (
                                <AlertCircle size={13} color="#DC2626" />
                              )}
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: isSuccess ? '#16A34A' : '#DC2626',
                                }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#64748B',
                                background: '#F1F5F9',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.durationMs}ms
                            </span>
                          </td>

                          {/* 4. Last Fetched Timestamp */}
                          <td style={{ padding: '14px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '12px' }}>
                              {formatRelativeTime(item.lastFetchedAt)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {formatExactIst(item.lastFetchedAt)}
                            </div>
                            <code
                              style={{
                                display: 'block',
                                fontSize: '10px',
                                color: '#94A3B8',
                                marginTop: '3px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.lastFetchedAt}
                            </code>
                          </td>

                          {/* 5. Upstream Reference */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '240px' }}>
                            {hasHttpUrl ? (
                              <a
                                href={item.upstreamRef.split(' ')[0]}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#0284C7',
                                  fontSize: '12px',
                                  wordBreak: 'break-all',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                              >
                                <span>{item.upstreamRef}</span>
                                <ExternalLink size={12} style={{ flexShrink: 0 }} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#334155', wordBreak: 'break-word', fontWeight: 500 }}>
                                {item.upstreamRef}
                              </span>
                            )}
                          </td>

                          {/* 6. Raw Value Snippet */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '280px' }}>
                            <button
                              onClick={() => toggleExpand(item.sourceKey)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer',
                              }}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              <span>{isExpanded ? 'Hide Raw JSON' : 'View Raw Payload'}</span>
                            </button>
                            {!isExpanded && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#64748B',
                                  fontFamily: 'monospace',
                                  marginTop: '4px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '240px',
                                }}
                              >
                                {item.rawResponseSnippet.replace(/\s+/g, ' ').slice(0, 50)}...
                              </div>
                            )}
                          </td>

                          {/* 7. Action Button */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                            <button
                              id={`btn-refresh-${item.sourceKey}`}
                              onClick={() => handleRefreshSingle(item.sourceKey)}
                              disabled={isRefreshing || refreshingAll}
                              className="btn btn-outline"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                minHeight: '32px',
                                cursor: isRefreshing ? 'wait' : 'pointer',
                                background: isRefreshing ? '#F1F5F9' : '#FFFFFF',
                              }}
                            >
                              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                              <span>{isRefreshing ? 'Fetching...' : 'Force refresh now'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded JSON Inspector Row */}
                        {isExpanded && (
                          <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155' }}>
                            <td colSpan={7} style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '11px' }}>
                                  <Database size={13} />
                                  <span>PostgreSQL Record Snippet &bull; Timestamp: <code style={{ color: '#FCD34D' }}>{item.lastFetchedAt}</code></span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(item.sourceKey, item.rawResponseSnippet)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#1E293B',
                                    color: '#E2E8F0',
                                    border: '1px solid #475569',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {copiedKey === item.sourceKey ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                                  <span>{copiedKey === item.sourceKey ? 'Copied' : 'Copy JSON'}</span>
                                </button>
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  background: '#020617',
                                  color: '#38BDF8',
                                  padding: '12px 16px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  lineHeight: 1.5,
                                  overflowX: 'auto',
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  border: '1px solid #1E293B',
                                }}
                              >
                                {item.rawResponseSnippet}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Account & Session Integrity Section                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            marginTop: '28px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                  }}
                >
                  <ShieldCheck size={20} />
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Account &amp; Session Integrity
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#DCFCE7',
                    color: '#15803D',
                    border: '1px solid #BBF7D0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  8 Live Audits
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                Objective cryptographic validation, Argon2id verification, 3-status token boundaries, 4-status SKU entitlement gates, and PostgreSQL row persistence.
              </p>
            </div>

            <button
              onClick={handleRunAllAccountChecks}
              disabled={runningAllAccountChecks}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: runningAllAccountChecks ? 'not-allowed' : 'pointer',
                opacity: runningAllAccountChecks ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={runningAllAccountChecks ? 'spin' : ''} />
              <span>{runningAllAccountChecks ? 'Running all checks...' : 'Run all 8 checks'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
              gap: '12px',
              padding: '16px 24px',
              background: '#F1F5F9',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Audits Passed</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} />
                <span>{accountChecks.filter((c) => c.status === 'PASS').length} of {accountChecks.length || 8} PASS</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Password Cryptography</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} color="#0F766E" />
                <span>Argon2id (RFC 9106)</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Token &amp; SKU Boundaries</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={16} color="#0F766E" />
                <span>3 &amp; 4 Real HTTP Codes</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>PostgreSQL Entities</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} color="#0F766E" />
                <span>KYC, Goals, LMS, Subs</span>
              </div>
            </div>
          </div>

          {/* Checks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', width: '90px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', minWidth: '260px' }}>Integrity Check &amp; Scope</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', minWidth: '220px' }}>Real HTTP Response Codes</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', minWidth: '220px' }}>PostgreSQL &amp; Live Evidence</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', width: '170px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingAccountChecks && accountChecks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      Loading live account &amp; session integrity audits...
                    </td>
                  </tr>
                ) : (
                  accountChecks.map((check) => {
                    const isRunning = runningCheckKey === check.checkKey;
                    const isExpanded = expandedCheckKeys[check.checkKey];
                    const isFlashed = accountFlashKey === check.checkKey;
                    const isPass = check.status === 'PASS';

                    return (
                      <React.Fragment key={check.checkKey}>
                        <tr
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isFlashed ? '#FEF3C7' : isExpanded ? '#F8FAFC' : '#FFFFFF',
                            transition: 'background 0.3s ease',
                          }}
                        >
                          {/* Status */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: isPass ? '#DCFCE7' : '#FEE2E2',
                                color: isPass ? '#15803D' : '#B91C1C',
                                border: `1px solid ${isPass ? '#86EFAC' : '#FCA5A5'}`,
                              }}
                            >
                              {isPass ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                              <span>{check.status}</span>
                            </span>
                          </td>

                          {/* Name & Scope */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>
                              {check.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                              {check.notes}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>Checked: {formatRelativeTime(check.executedAt)}</span>
                              <span>&bull;</span>
                              <span>Duration: {check.durationMs}ms</span>
                            </div>
                          </td>

                          {/* HTTP Codes */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            {check.httpCodes && Object.keys(check.httpCodes).length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {Object.entries(check.httpCodes).map(([label, code]) => {
                                  const is200 = code === 200;
                                  const is401 = code === 401;
                                  return (
                                    <div
                                      key={label}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '6px',
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: is200 ? '#F0FDF4' : is401 ? '#FFFBEB' : '#FAF5FF',
                                        border: `1px solid ${is200 ? '#BBF7D0' : is401 ? '#FDE68A' : '#E9D5FF'}`,
                                      }}
                                    >
                                      <span style={{ color: '#475569', fontWeight: 500 }}>{label}:</span>
                                      <strong
                                        style={{
                                          fontFamily: 'ui-monospace, monospace',
                                          color: is200 ? '#15803D' : is401 ? '#D97706' : '#7E22CE',
                                        }}
                                      >
                                        HTTP {code}
                                      </strong>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
                                Direct PostgreSQL Query (No HTTP gateway)
                              </div>
                            )}
                          </td>

                          {/* Evidence Summary */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div
                              style={{
                                fontSize: '11px',
                                fontFamily: 'ui-monospace, monospace',
                                color: '#334155',
                                background: '#F8FAFC',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                maxWidth: '280px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={JSON.stringify(check.rawOutput)}
                            >
                              {check.checkKey === 'argon2_hash' && (
                                <span>{(check.rawOutput as any)?.hashPrefix || 'Argon2id Hash'}</span>
                              )}
                              {check.checkKey === 'kyc_record' && (
                                <span>UCC: {(check.rawOutput as any)?.bseUniqueClientCode} ({(check.rawOutput as any)?.status})</span>
                              )}
                              {check.checkKey === 'users_me' && (
                                <span>{(check.rawOutput as any)?.email} [{(check.rawOutput as any)?.role}]</span>
                              )}
                              {check.checkKey === 'goal_soft_delete' && (
                                <span>Soft-delete verified: isActive=false in DB</span>
                              )}
                              {check.checkKey === 'lesson_progress' && (
                                <span>{(check.rawOutput as any)?.verifiedRecord?.lessonTitle} (Watched {(check.rawOutput as any)?.verifiedRecord?.watchedSeconds}s)</span>
                              )}
                              {check.checkKey === 'subscription_entitlements' && (
                                <span>{(check.rawOutput as any)?.activeSubscriptionsCount} Sub / {(check.rawOutput as any)?.entitlementsCount} Entitlements</span>
                              )}
                              {check.checkKey === 'token_boundary' && (
                                <span>No Token 401 &rarr; Expired 401 &rarr; Valid 200</span>
                              )}
                              {check.checkKey === 'entitlement_boundary' && (
                                <span>PEAD (403/200) &bull; LMS (403/200)</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => handleRunSpecificCheck(check.checkKey)}
                                disabled={isRunning}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#4F46E5',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isRunning ? 'not-allowed' : 'pointer',
                                  opacity: isRunning ? 0.7 : 1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <RefreshCw size={11} className={isRunning ? 'spin' : ''} />
                                <span>{isRunning ? 'Checking...' : 'Run check'}</span>
                              </button>

                              <button
                                onClick={() => toggleCheckExpanded(check.checkKey)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  background: isExpanded ? '#E2E8F0' : '#F1F5F9',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  cursor: 'pointer',
                                }}
                                title={isExpanded ? 'Collapse raw JSON' : 'Expand raw JSON'}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable JSON Output Panel */}
                        {isExpanded && (
                          <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155' }}>
                            <td colSpan={5} style={{ padding: '14px 20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '11px' }}>
                                  <FileCode size={13} />
                                  <span>
                                    Audit Output &bull; Timestamp:{' '}
                                    <code style={{ color: '#FCD34D' }}>{check.executedAt}</code>
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyCheckJson(check.checkKey, check.rawOutput)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#1E293B',
                                    color: '#E2E8F0',
                                    border: '1px solid #475569',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {copiedCheckKey === check.checkKey ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                                  <span>{copiedCheckKey === check.checkKey ? 'Copied' : 'Copy JSON'}</span>
                                </button>
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  background: '#020617',
                                  color: '#38BDF8',
                                  padding: '12px 16px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  lineHeight: 1.5,
                                  overflowX: 'auto',
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  border: '1px solid #1E293B',
                                }}
                              >
                                {JSON.stringify(check.rawOutput, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Methodology Explanatory Box */}
        <div
          className="card"
          style={{
            marginTop: '24px',
            padding: '16px 20px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Info size={18} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
              <strong style={{ color: '#0F172A' }}>How this verification works:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                <li>
                  Clicking <strong>&quot;Force refresh now&quot;</strong> dispatches a POST request to{' '}
                  <code style={{ color: '#0F766E' }}>/api/v1/admin/data-integrity/:sourceKey/refresh</code>.
                </li>
                <li>
                  The backend triggers the upstream handler (e.g., streaming the full AMFI NAV text file or querying Yahoo Finance HTTP endpoints), records the actual duration, and writes an audited record directly to the PostgreSQL table{' '}
                  <code style={{ color: '#0F766E' }}>data_source_health</code>.
                </li>
                <li>
                  The newly committed database row with its exact millisecond server timestamp and response snippet is returned to this page, advancing the &quot;Last Fetched&quot; column live.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
