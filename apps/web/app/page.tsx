'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  ArrowRight,
  Shield,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  FolderPlus,
  Coins,
  Compass,
  Target,
} from 'lucide-react';
import { SidebarLayout } from '../components/sidebar-layout';
import { getStoredAccessToken, getStoredUser, getApiBaseUrl } from '../lib/auth-client';

import { LucideIcon } from 'lucide-react';
import { GOAL_CATEGORIES } from '../lib/goal-categories';

const GOAL_ICONS: Record<string, LucideIcon> = {
  emergency_fund: ShieldCheck,
  retirement: Briefcase,
  child_education: GraduationCap,
  wealth_creation: Layers,
};

// ── 4 Quick-Goal Tiles derived from Canonical Shared GOAL_CATEGORIES ────────
const GOAL_TILES = GOAL_CATEGORIES.map((cat) => ({
  ...cat,
  title: cat.label,
  icon: GOAL_ICONS[cat.id] || Target,
}));

// ── Audited Real Platform Stats for Guests ──────────────────────────────────
// Every number corresponds to an actual, computed feature of the application
const AUDITED_GUEST_STATS = [
  {
    value: '4',
    label: 'Core Wealth Horizons',
    subtext: 'Free Goal Calculators (FIRE, Education, Emergency, Wealth)',
  },
  {
    value: '11',
    label: 'Research Desks',
    subtext: 'Valuation Lab, Order Wins, PEAD, MMI, Vahan, Buybacks, Banks & more',
  },
  {
    value: '9',
    label: 'Valuation Models',
    subtext: 'DCF, Reverse DCF, Graham, Peter Lynch, DDM, Multiples & more',
  },
  {
    value: '100%',
    label: 'Direct AMC Routing',
    subtext: 'Direct Mutual Fund Investing with Secure Exchange Clearing',
  },
];

// ── Real Platform Pillars (Product-focused: Wealth Architecture + Research) ──
const PLATFORM_PILLARS = [
  {
    icon: TrendingUp,
    title: 'Goal-Based Wealth Planning',
    subtitle: 'Smart SIP & Horizon Guidance',
    desc: 'Accurate SIP calculations for early retirement, child education, and emergency savings with automated asset allocation as your goal nears.',
    badge: 'Free & Open',
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Stock Research',
    subtitle: '11 Professional Market Desks',
    desc: 'Intrinsic valuation models, earnings surprise screeners, auto registration trends, and corporate announcement tracking in one clean workspace.',
    badge: 'Pro Intelligence',
  },
  {
    icon: ShieldCheck,
    title: 'Direct Mutual Fund Investing',
    subtitle: 'Zero Commission Scheme Routing',
    desc: 'Invest in lumpsum or automated SIPs directly with top AMCs through secure exchange clearing, with zero hidden distributor commissions.',
    badge: 'ARN-350272',
  },
  {
    icon: Compass,
    title: 'Disciplined Investing Framework',
    subtitle: 'Rules-Based Wealth Building',
    desc: 'Structured stage analysis and prudent risk management strategies designed to build wealth steadily across market cycles.',
    badge: 'Continuous',
  },
];

function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);

  // Live Personal Dashboard Data
  const [goals, setGoals] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<{
    holdings: any[];
    totalInvested: number;
    totalCurrentValue: number;
    totalGain: number;
    overallReturnPct: number;
  } | null>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Check Login & Entitlement State Synchronously
  useEffect(() => {
    const syncPageAuth = () => {
      let authUser: any = null;
      let entitled = false;

      try {
        const storedUser = getStoredUser();
        const activeSub = localStorage.getItem('ff_active_sub');

        if (storedUser) {
          authUser = storedUser;
          setUser(authUser);

          if (activeSub) {
            try {
              const sub = JSON.parse(activeSub);
              if (sub.active) entitled = true;
            } catch {}
          }

          if (
            entitled ||
            authUser.role === 'admin' ||
            authUser.role === 'investor' ||
            (Array.isArray(authUser.entitlements) &&
              authUser.entitlements.some((s: string) =>
                ['course_lifetime', 'tools_1yr', 'bundle_all', 'bundle_diy'].includes(s)
              ))
          ) {
            entitled = true;
          }
        } else {
          try {
            localStorage.removeItem('ff_active_sub');
          } catch {}
          setUser(null);
        }
      } catch {
        setUser(null);
      }

      const loggedIn = !!authUser;
      setIsLoggedIn(loggedIn);
      setIsPro(loggedIn && entitled);

      if (loggedIn) {
        loadPersonalDashboardData();
      }
    };

    syncPageAuth();

    window.addEventListener('storage', syncPageAuth);
    window.addEventListener('ff_auth_state_changed', syncPageAuth);
    window.addEventListener('focus', syncPageAuth);

    return () => {
      window.removeEventListener('storage', syncPageAuth);
      window.removeEventListener('ff_auth_state_changed', syncPageAuth);
      window.removeEventListener('focus', syncPageAuth);
    };
  }, []);

  // 2. Fetch Real Backend Data using existing endpoints
  const loadPersonalDashboardData = async () => {
    setIsSyncing(true);
    const apiUrl = getApiBaseUrl();
    const token = getStoredAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // Endpoint 1: Actual active goals from database
      const goalsPromise = fetch(`${apiUrl}/api/v1/goals`, { headers })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      // Endpoint 2: Real mutual fund portfolio from AMFI feed
      const portfolioPromise = fetch(`${apiUrl}/api/v1/mutual-funds/portfolio`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // Endpoint 3: Real KYC status
      const kycPromise = fetch(`${apiUrl}/api/v1/kyc/status`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [goalsData, portfolioData, kycData] = await Promise.all([
        goalsPromise,
        portfolioPromise,
        kycPromise,
      ]);

      if (Array.isArray(goalsData)) {
        setGoals(goalsData);
      } else {
        setGoals([]);
      }

      if (portfolioData && Array.isArray(portfolioData.holdings)) {
        setPortfolio(portfolioData);
      } else {
        setPortfolio({
          holdings: [],
          totalInvested: 0,
          totalCurrentValue: 0,
          totalGain: 0,
          overallReturnPct: 0,
        });
      }

      if (kycData) {
        setKycStatus(kycData);
      } else {
        // Check local storage fallback
        try {
          const storedKyc = localStorage.getItem('ff_kyc_status');
          if (storedKyc) setKycStatus(JSON.parse(storedKyc));
        } catch {}
      }
    } catch (err) {
      console.warn('Dashboard data fetch error', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics Calculations for Logged-In User
  const totalTargetCorpus = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
  const totalCurrentSavings = goals.reduce((sum, g) => sum + Number(g.currentSavings || 0), 0);
  const overallGoalProgressPct =
    totalTargetCorpus > 0 ? Math.min(100, Math.round((totalCurrentSavings / totalTargetCorpus) * 100)) : 0;

  const displayName =
    user?.firstName || user?.first_name || (user?.email ? user.email.split('@')[0] : 'Investor');

  return (
    <SidebarLayout activePath="/">
      <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LOGGED-IN VIEW: Real Personal Wealth Dashboard                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isLoggedIn ? (
          <div>
            {/* 1. Personal Header & Account Telemetry Strip */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: 'clamp(14px, 3vw, 24px) clamp(14px, 3.5vw, 28px)',
                marginBottom: 'clamp(16px, 3vw, 24px)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h1
                    className="font-serif"
                    style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Welcome back, {displayName}
                  </h1>
                  {isPro && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#D97706',
                        border: '1px solid rgba(245, 158, 11, 0.28)',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      <ShieldCheck size={12} />
                      PRO INVESTOR
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Financial Independence Command Center
                  </span>
                  <span style={{ color: 'var(--border-color)' }}>•</span>
                  {kycStatus?.status === 'verified' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0F766E', fontWeight: 600 }}>
                      <CheckCircle2 size={13} />
                      KYC Verified ({kycStatus.kraProvider ? kycStatus.kraProvider.toUpperCase() : 'CVL'} KRA)
                    </span>
                  ) : (
                    <Link
                      href="/kyc"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#D97706',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <AlertCircle size={13} />
                      KYC Pending • Complete Verification
                    </Link>
                  )}
                  <span style={{ color: 'var(--border-color)' }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                    AMFI Verified NAV
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={loadPersonalDashboardData}
                  disabled={isSyncing}
                  className="btn btn-outline"
                  style={{ padding: '8px 14px', fontSize: '12px', gap: '6px' }}
                  title="Refresh live portfolio and goal states"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
                </button>
                <Link
                  href="/dashboard/goals"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', gap: '6px', textDecoration: 'none' }}
                >
                  <Plus size={14} />
                  <span>New Goal</span>
                </Link>
                <Link
                  href="/dashboard/invest"
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13px', gap: '6px', textDecoration: 'none' }}
                >
                  <TrendingUp size={14} />
                  <span>Invest</span>
                </Link>
              </div>
            </div>

            {/* 2. Top Metric Cards  Real Computed Figures */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                gap: 'clamp(10px, 2.5vw, 14px)',
                marginBottom: 'clamp(16px, 3vw, 32px)',
              }}
            >
              {/* Metric 1: Portfolio Current Value */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(14px, 3vw, 20px)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                  Portfolio Net Worth
                </div>
                <div className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {portfolio ? formatINR(portfolio.totalCurrentValue) : '₹0'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {portfolio && portfolio.totalInvested > 0
                    ? `Invested: ${formatINR(portfolio.totalInvested)}`
                    : 'Zero capital deployed yet'}
                </div>
              </div>

              {/* Metric 2: Net Unrealized Gain */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(14px, 3vw, 20px)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                  Total Gain / Return
                </div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: portfolio && portfolio.totalGain >= 0 ? '#0F766E' : '#B91C1C',
                    marginBottom: '4px',
                  }}
                >
                  {portfolio
                    ? `${portfolio.totalGain >= 0 ? '+' : ''}${formatINR(portfolio.totalGain)}`
                    : '₹0'}
                </div>
                <div style={{ fontSize: '11px', color: portfolio && portfolio.overallReturnPct >= 0 ? '#0F766E' : '#B91C1C', fontWeight: 600 }}>
                  {portfolio && portfolio.totalInvested > 0
                    ? `${portfolio.overallReturnPct >= 0 ? '+' : ''}${portfolio.overallReturnPct.toFixed(2)}% Overall Return`
                    : 'No active holdings'}
                </div>
              </div>

              {/* Metric 3: Active Goals Count */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(14px, 3vw, 20px)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                  Active Goals
                </div>
                <div className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {totalTargetCorpus > 0 ? `Target Corpus: ${formatINR(totalTargetCorpus)}` : 'Create your first goal target'}
                </div>
              </div>

              {/* Metric 4: Goal Funded Percentage */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(14px, 3vw, 20px)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                  Goal Corpus Funded
                </div>
                <div className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {overallGoalProgressPct}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {totalTargetCorpus > 0
                    ? `${formatINR(totalCurrentSavings)} of ${formatINR(totalTargetCorpus)}`
                    : 'Define a horizon to track'}
                </div>
              </div>
            </div>

            {/* 3. Active Goals Section */}
            <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Active Financial Goals
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Real milestones tracked against inflation and glide-path asset allocations.
                  </p>
                </div>
                <Link
                  href="/dashboard/goals"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>Manage All Goals</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {goals.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                    gap: '14px',
                  }}
                >
                  {goals.map((g) => {
                    const target = Number(g.targetAmount || 0);
                    const current = Number(g.currentSavings || 0);
                    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                    return (
                      <div
                        key={g.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xl)',
                          padding: '18px 20px',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                              {g.name}
                            </h3>
                            <span
                              style={{
                                fontSize: '10.5px',
                                textTransform: 'capitalize',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'var(--bg-surface-raised)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {g.riskBand || 'balanced'} risk
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                            Target: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(target)}</strong> · Horizon:{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>{g.horizonYears} yrs</strong>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Saved: {formatINR(current)}</span>
                              <span style={{ fontWeight: 600, color: '#0F766E' }}>{pct}% Funded</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)',
                                  borderRadius: '9999px',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Expected: {g.expectedReturnPct || 12}% p.a.
                          </span>
                          <Link
                            href="/dashboard/goals"
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--color-accent)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Open Glide Path</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Honest Empty State for Goals */
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '36px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(15, 118, 110, 0.08)',
                      color: '#0F766E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <FolderPlus size={22} />
                  </div>
                  <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Active Goals Yet
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                    Define your emergency reserve, retirement target (FIRE), or higher education milestone to get your mathematically verified SIP.
                  </p>
                  <Link href="/dashboard/goals" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px', textDecoration: 'none' }}>
                    <span>+ Set Up Your First Goal</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Portfolio Snapshot Section */}
            <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Direct Mutual Fund Holdings
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Direct plans with AMFI NAV valuation and zero distributor commission.
                  </p>
                </div>
                <Link
                  href="/dashboard/portfolio"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>View Full Portfolio</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {portfolio && portfolio.holdings && portfolio.holdings.length > 0 ? (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    overflowX: 'auto',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-raised)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '12px 18px' }}>Scheme Name</th>
                        <th style={{ padding: '12px 14px' }}>Invested</th>
                        <th style={{ padding: '12px 14px' }}>Current Value</th>
                        <th style={{ padding: '12px 14px' }}>Unrealized Gain</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.holdings.map((h, i) => (
                        <tr
                          key={h.id || h.schemeCode || i}
                          style={{
                            borderBottom: i < portfolio.holdings.length - 1 ? '1px solid var(--border-color)' : 'none',
                          }}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.schemeName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {h.amcName} · Folio: {h.folioNumber}
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                            {formatINR(Number(h.investedAmount || 0))}
                          </td>
                          <td style={{ padding: '14px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatINR(Number(h.currentValue || 0))}
                          </td>
                          <td style={{ padding: '14px 14px', color: Number(h.gain || 0) >= 0 ? '#0F766E' : '#B91C1C', fontWeight: 600 }}>
                            {Number(h.gain || 0) >= 0 ? '+' : ''}{formatINR(Number(h.gain || 0))} ({Number(h.gainPct || 0).toFixed(2)}%)
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <Link
                              href="/dashboard/portfolio"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '12px',
                                color: 'var(--color-accent)',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              <span>Details</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Honest Empty State for Portfolio */
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '36px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.06)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <Coins size={22} />
                  </div>
                  <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Holdings Found
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                    Your direct mutual fund folios will display here once initiated. Zero distributor commission.
                  </p>
                  <Link href="/dashboard/invest" className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '13px', textDecoration: 'none' }}>
                    <span>Browse Direct Mutual Funds</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 5. Institutional Research Quick-Desks */}
            <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Institutional Research Desks
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Direct access to equity intelligence, DCF modeling, and corporate actions.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  {
                    title: 'Valuation Lab',
                    desc: 'Discounted Cash Flow, relative multiples, and margin of safety models.',
                    href: '/techno-funda?tab=valuation',
                    tag: 'DCF Intrinsic',
                  },
                  {
                    title: 'Market Mood Index',
                    desc: 'Real-time market sentiment thermometer with FII/DII liquidity overlay.',
                    href: '/techno-funda?tab=mmi',
                    tag: 'Sentiment',
                  },
                  {
                    title: 'PEAD Screener',
                    desc: 'Post-Earnings Announcement Drift tracking institutional surprises.',
                    href: '/techno-funda?tab=pead',
                    tag: 'Earnings Drift',
                  },
                  {
                    title: 'Buybacks & Arbitrage',
                    desc: 'Tender offer monitor with retail entitlement and arbitrage yields.',
                    href: '/techno-funda?tab=buybacks',
                    tag: 'Corporate Actions',
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '16px 18px',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.tag}
                        </span>
                        <ArrowUpRight size={14} color="var(--color-accent)" />
                      </div>
                      <h3 className="font-serif" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* GUEST VIEW: Clean Marketing & Wealth Architecture Overview         */
          /* ═══════════════════════════════════════════════════════════════════ */
          <div>
            {/* Modern Fintech Hero Section */}
            <div className="hero-ai-card" style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(15, 118, 110, 0.08)',
                  color: '#0F766E',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                }}
              >
                <Shield size={13} />
                <span>GOAL-BASED INVESTING & MARKET RESEARCH</span>
              </div>

              <h1
                className="font-serif"
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.15,
                  maxWidth: '800px',
                  margin: '0 auto var(--space-3)',
                }}
              >
                Har Rupaye Ko Ek Maqsad Do
              </h1>

              <p
                style={{
                  fontSize: 'clamp(var(--text-sm), 2vw, var(--text-base))',
                  color: 'var(--text-secondary)',
                  maxWidth: '620px',
                  margin: '0 auto var(--space-6)',
                  lineHeight: 1.6,
                }}
              >
                Plan your family&apos;s financial future with clear goals and smart asset allocation, backed by real-time market data and trusted research tools.
              </p>

              <div className="btn-group-responsive" style={{ justifyContent: 'center' }}>
                <Link
                  href="/dashboard/goals"
                  className="btn btn-primary btn-mobile-full"
                  style={{ textDecoration: 'none', padding: '12px 28px', gap: '8px' }}
                >
                  <span>Launch Free Goal Planner</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/techno-funda"
                  className="btn btn-outline btn-mobile-full"
                  style={{ textDecoration: 'none', padding: '12px 28px' }}
                >
                  <span>Explore Research Desks</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="btn btn-outline btn-mobile-full"
                  style={{ textDecoration: 'none', padding: '12px 28px' }}
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>

            {/* Audited Platform Stats  100% Real Computed Figures */}
            <div className="kpi-grid-mobile-2col" style={{ marginBottom: 'var(--space-8)' }}>
              {AUDITED_GUEST_STATS.map((stat) => (
                <div key={stat.label} className="kpi-card-compact" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <div
                    className="font-serif"
                    style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {stat.subtext}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 4 QUICK-GOAL TILES: Emergency, FIRE, Education, Wealth Compounding  */}
        {/* Available to BOTH Guest & Logged-In Users                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 'clamp(20px, 4vw, 40px)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 4px',
              }}
            >
              {isLoggedIn ? 'Plan Another Financial Goal' : 'Choose Your Goal & Calculate Your Horizon'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Set your target amount and timeline. See the exact monthly SIP needed to reach your goal on time.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '12px',
            }}
          >
            {GOAL_TILES.map((tile) => (
              <Link
                key={tile.id}
                href={tile.href}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderTop: `4px solid ${tile.color}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px 18px',
                  boxShadow: 'var(--shadow-sm)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface-raised, #F4F1EA)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tile.color,
                      marginBottom: '12px',
                    }}
                  >
                    <tile.icon size={18} />
                  </div>
                  <h3
                    className="font-serif"
                    style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}
                  >
                    {tile.title}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {tile.subtitle}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px' }}>
                    {tile.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: tile.color,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span>Calculate SIP</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM PILLARS (For Guests)                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!isLoggedIn && (
          <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h2
                className="font-serif"
                style={{
                  fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px',
                }}
              >
                Everything You Need to Compound Wealth
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                From pure-math goal calculators to institutional equity valuation tools.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
              {PLATFORM_PILLARS.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '18px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-raised)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-accent)',
                        }}
                      >
                        <f.icon size={18} />
                      </div>
                      <span className="badge-muted" style={{ fontWeight: 600, fontSize: '11px' }}>
                        {f.badge}
                      </span>
                    </div>

                    <h3
                      className="font-serif"
                      style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}
                    >
                      {f.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '8px' }}>
                      {f.subtitle}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
