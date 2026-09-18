'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Sliders,
  Target,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  Settings,
  Lock,
  Database,
  Bell,
  Menu,
  X,
  Gauge,
  BarChart3,
  LogOut,
  Calculator,
  Command,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  Landmark,
  ClipboardList,
  Car,
  PieChart,
  Zap,
  Percent,
  Users,
  Layers,
  UserCheck,
  Rocket,
  Coins,
  AlertTriangle,
  Bookmark,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { useBodyScrollLock } from '../lib/use-body-scroll-lock';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  clearAuthStorage,
  getApiBaseUrl,
  isTokenExpired,
  isAllAccessFreeMode,
  fetchAppAccessMode,
  persistAuthTokens,
} from '../lib/auth-client';

export type AccessTier = 'guest' | 'authenticated' | 'entitled' | 'admin';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  brandBadge?: string;
  askButtonText?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tabKey?: string;
  isPro?: boolean;
}

// 1. Guest Workspace Nav: Full platform overview
const guestWorkspaceNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/goals', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
  { label: 'Watchlist', href: '/dashboard/watchlist', icon: Bookmark },
  { label: 'Invest', href: '/dashboard/invest', icon: Sliders },
  { label: 'Academy', href: '/courses', icon: GraduationCap },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Home Page', href: '/', icon: Home },
];

// 2. Authenticated Investor Workspace Nav: Adds Portfolio and Invest
const authenticatedWorkspaceNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/goals', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
  { label: 'Watchlist', href: '/dashboard/watchlist', icon: Bookmark },
  { label: 'Invest', href: '/dashboard/invest', icon: Sliders },
  { label: 'Academy', href: '/courses', icon: GraduationCap },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Home Page', href: '/', icon: Home },
];

// 3. Techno-Funda Research: Logical, workflow-based research arrangement
const researchNav: NavItem[] = [
  { label: 'Options Lab', href: '/options-lab', icon: Activity, isPro: true },
  { label: 'Market Mood', href: '/techno-funda?tab=mmi', tabKey: 'mmi', icon: Gauge, isPro: true },
  { label: 'Sector Heatmap', href: '/techno-funda?tab=sector-heatmap', tabKey: 'sector-heatmap', icon: PieChart, isPro: true },
  { label: '52W High / Low', href: '/techno-funda?tab=52w-screener', tabKey: '52w-screener', icon: Zap, isPro: true },
  { label: 'Delivery Momentum', href: '/techno-funda?tab=delivery-momentum', tabKey: 'delivery-momentum', icon: Percent, isPro: true },
  { label: 'Bulk & Block Deals', href: '/techno-funda?tab=deals', tabKey: 'deals', icon: Users, isPro: true },
  { label: 'F&O Analytics', href: '/techno-funda?tab=fno', tabKey: 'fno', icon: Layers, isPro: true },
  { label: 'Insider Trading', href: '/techno-funda?tab=insider', tabKey: 'insider', icon: UserCheck, isPro: true },
  { label: 'Circuit Watch', href: '/techno-funda?tab=circuits', tabKey: 'circuits', icon: AlertTriangle, isPro: true },
  { label: 'IPO Tracker', href: '/techno-funda?tab=ipo', tabKey: 'ipo', icon: Rocket, isPro: true },
  { label: 'Dividend Calendar', href: '/techno-funda?tab=dividends', tabKey: 'dividends', icon: Coins, isPro: true },
  { label: 'Master Tracker', href: '/techno-funda?tab=master-tracker', tabKey: 'master-tracker', icon: TrendingUp, isPro: true },
  { label: 'PEAD Screener', href: '/techno-funda?tab=pead', tabKey: 'pead', icon: BarChart3, isPro: true },
  { label: 'Order Tracker', href: '/techno-funda?tab=orders', tabKey: 'orders', icon: ClipboardList, isPro: true },
  { label: 'Valuation Lab', href: '/techno-funda?tab=valuation', tabKey: 'valuation', icon: Calculator, isPro: true },
  { label: 'Results Calendar', href: '/techno-funda?tab=results', tabKey: 'results', icon: Calendar, isPro: true },
  { label: 'News Desk', href: '/techno-funda?tab=news', tabKey: 'news', icon: FileText, isPro: true },
  { label: 'Shareholding', href: '/techno-funda?tab=shareholding', tabKey: 'shareholding', icon: Shield, isPro: true },
  { label: 'Vahan Auto', href: '/techno-funda?tab=vahan', tabKey: 'vahan', icon: Car, isPro: true },
  { label: 'Bank / NBFC', href: '/techno-funda?tab=bank-nbfc', tabKey: 'bank-nbfc', icon: Landmark, isPro: true },
  { label: 'Buybacks & Arbitrage', href: '/techno-funda?tab=buybacks', tabKey: 'buybacks', icon: RefreshCw, isPro: true },
];

// 4. Investor Account Nav: KYC, Billing, DPDP (Admin & Data Integrity strictly excluded)
const investorAccountNav: NavItem[] = [
  { label: 'KYC Verification', href: '/kyc', icon: ShieldCheck },
  { label: 'Billing & Invoices', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Privacy & Notifications', href: '/dashboard/settings/notifications', icon: Settings },
];

// 5. Admin Account Nav: Includes Data Integrity & Admin Console
const adminAccountNav: NavItem[] = [
  { label: 'KYC Verification', href: '/kyc', icon: ShieldCheck },
  { label: 'Billing & Invoices', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Privacy & Notifications', href: '/dashboard/settings/notifications', icon: Settings },
  { label: 'Data Integrity', href: '/admin/data-integrity', icon: Database },
  { label: 'Admin Console', href: '/admin', icon: Lock },
];

function SidebarNavLinks({
  currentPath,
  onNavigate,
  isCollapsed = false,
  accessTier = 'guest',
  isFreeMode = false,
}: {
  currentPath: string;
  onNavigate: () => void;
  isCollapsed?: boolean;
  accessTier: AccessTier;
  isFreeMode?: boolean;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'mmi';

  const isTechnoFunda = currentPath === '/techno-funda' || currentPath.startsWith('/techno-funda');

  const isItemActive = (item: NavItem): boolean => {
    if (item.tabKey) {
      return isTechnoFunda && currentTab === item.tabKey;
    }
    if (isTechnoFunda) {
      return false;
    }
    if (item.href === '/dashboard/goals' || item.href === '/dashboard' || item.href === '/dashboard/overview') {
      return (
        currentPath === '/dashboard' ||
        currentPath === '/dashboard/goals' ||
        currentPath === '/dashboard/overview'
      );
    }
    return currentPath === item.href;
  };

  const isUnsubscribed = (accessTier === 'guest' || accessTier === 'authenticated') && !isFreeMode;

  const renderNavSection = (title: string, items: NavItem[], isProGroup = false) => (
    <div style={{ marginBottom: isCollapsed ? '6px' : '14px' }}>
      {!isCollapsed ? (
        <div className="sb-section-label">
          <span>{title}</span>
          {isProGroup && isUnsubscribed && (
            <span className="sb-pro-badge">PRO</span>
          )}
        </div>
      ) : (
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '6px 8px 8px' }} />
      )}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          const destinationHref = item.href;
          const isItemLocked = item.isPro && isUnsubscribed;
          const tooltip = isItemLocked ? `${item.label} (Pro Subscription)` : item.label;

          return (
            <Link
              key={item.label}
              href={destinationHref}
              onClick={onNavigate}
              title={isCollapsed ? undefined : tooltip}
              className={`sidebar-nav-link ${active ? 'sidebar-nav-link-active' : ''}`}
              style={{
                justifyContent: isCollapsed ? 'center' : 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.75}
                  style={{
                    flexShrink: 0,
                    color: active ? 'var(--sb-accent-emerald, #10B981)' : 'inherit',
                    transition: 'color 0.14s ease',
                  }}
                />
                {!isCollapsed && (
                  <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '14px',
                    fontWeight: active ? 650 : 500,
                    flex: 1,
                    letterSpacing: '-0.01em',
                  }}>
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && isItemLocked && (
                <Lock
                  size={12}
                  style={{
                    flexShrink: 0,
                    color: '#D97706',
                    opacity: 0.85,
                    marginLeft: '6px',
                  }}
                  aria-label="Pro Feature Locked"
                />
              )}

              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="sb-tooltip">
                  {tooltip}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  if (accessTier === 'guest') {
    return (
      <>
        {renderNavSection('PUBLIC WORKSPACE', guestWorkspaceNav)}
        {renderNavSection('TECHNO-FUNDA RESEARCH', researchNav, true)}
      </>
    );
  }

  if (accessTier === 'authenticated') {
    return (
      <>
        {renderNavSection('WORKSPACE', authenticatedWorkspaceNav)}
        {renderNavSection('TECHNO-FUNDA RESEARCH', researchNav, true)}
        {renderNavSection('ACCOUNT & SETTINGS', investorAccountNav)}
      </>
    );
  }

  if (accessTier === 'entitled') {
    return (
      <>
        {renderNavSection('WORKSPACE', authenticatedWorkspaceNav)}
        {renderNavSection('TECHNO-FUNDA RESEARCH', researchNav, false)}
        {renderNavSection('ACCOUNT & SETTINGS', investorAccountNav)}
      </>
    );
  }

  return (
    <>
      {renderNavSection('WORKSPACE', authenticatedWorkspaceNav)}
      {renderNavSection('TECHNO-FUNDA RESEARCH', researchNav, false)}
      {renderNavSection('ACCOUNT & SETTINGS', adminAccountNav)}
    </>
  );
}

function SidebarNavSkeleton({ isCollapsed = false }: { isCollapsed?: boolean }) {
  if (isCollapsed) {
    return (
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ height: '9px', width: '60px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '4px 0 6px' }} />
      <div style={{ height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
      <div style={{ height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
      <div style={{ height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
      <div style={{ height: '9px', width: '90px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '14px 0 6px' }} />
      <div style={{ height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
      <div style={{ height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
    </div>
  );
}

export function SidebarLayout({
  children,
  activePath,
  brandTitle,
  brandSubtitle,
  brandBadge,
  askButtonText,
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;

  const resolvedBrandTitle = brandTitle || 'GOALCOMPASS';
  const resolvedBrandSubtitle = brandSubtitle || 'WEALTH & RESEARCH';
  const resolvedBrandBadge = brandBadge || 'GC';
  const resolvedAskButtonText = askButtonText || 'Ask GoalCompass';
  const resolvedModalTitle = 'GoalCompass Intelligence';
  const resolvedModalDesc =
    'GoalCompass is your wealth architecture & institutional research co-pilot. Quickly jump to key financial tools or inspect stock metrics:';
  const resolvedFooterText = 'GoalCompass';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessTier, setAccessTier] = useState<AccessTier>('guest');
  const [isFreeMode, setIsFreeMode] = useState<boolean>(() => isAllAccessFreeMode());
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    entitlements?: string[];
  } | null>(null);
  const [askAureusOpen, setAskAureusOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  // --- Client-side auth guard (defense-in-depth alongside Edge Middleware) ---
  // After layout initializes, redirect guests away from protected routes.
  const PROTECTED_PREFIXES = ['/dashboard', '/techno-funda', '/options-lab', '/kyc', '/courses', '/checkout', '/admin'];
  useEffect(() => {
    if (!isInitialized) return;
    const isProtected = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (isProtected && accessTier === 'guest') {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, accessTier, pathname, router]);

  useEffect(() => {
    // 1. Synchronous auth and entitlement state evaluator
    const syncAuthState = () => {
      try {
        setIsFreeMode(isAllAccessFreeMode());
        const token = getStoredAccessToken();
        const refreshToken = getStoredRefreshToken();
        const storedUser = getStoredUser();

        // If no token and no user, user is unauthenticated
        if (!token && !refreshToken && !storedUser) {
          setUser(null);
          setAccessTier('guest');
          try {
            localStorage.removeItem('ff_active_sub');
          } catch {}
          return;
        }

        if (storedUser) {
          setUser(storedUser);

          let isEntitledSub = false;
          try {
            const activeSub = localStorage.getItem('ff_active_sub');
            if (activeSub) {
              const sub = JSON.parse(activeSub);
              if (sub.active) isEntitledSub = true;
            }
          } catch {}

          if (storedUser.role === 'admin') {
            setAccessTier('admin');
          } else if (
            isEntitledSub ||
            (Array.isArray(storedUser.entitlements) &&
              storedUser.entitlements.some((s: string) =>
                ['course_lifetime', 'tools_1yr', 'bundle_all', 'bundle_diy'].includes(s)
              ))
          ) {
            setAccessTier('entitled');
          } else {
            setAccessTier('authenticated');
          }
        }
      } catch {
        // preserve existing user state on transient error
      } finally {
        setIsInitialized(true);
      }
    };

    syncAuthState();
    fetchAppAccessMode()
      .then((res) => {
        setIsFreeMode(res.isAllAccessFree);
      })
      .catch(() => {});

    // 2. Load sidebar collapsed state
    try {
      const storedCollapsed = localStorage.getItem('ff_sidebar_collapsed');
      if (storedCollapsed !== null) {
        setIsCollapsed(storedCollapsed === 'true');
      } else if (typeof window !== 'undefined' && window.innerWidth <= 1200 && window.innerWidth > 1024) {
        setIsCollapsed(true);
      }
    } catch {}

    // 3. Validate session with backend GET /api/v1/users/me & silent refresh if expired
    const validateSession = async () => {
      const token = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!token && !refreshToken) {
        setUser(null);
        setAccessTier('guest');
        return;
      }

      const apiBase = getApiBaseUrl();

      try {
        let currentToken = token;
        let res: Response | null = null;

        // If access token is available and not expired, attempt /api/v1/users/me
        if (currentToken && !isTokenExpired(currentToken)) {
          try {
            res = await fetch(`${apiBase}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${currentToken}` },
              cache: 'no-store',
            });
          } catch (fetchErr) {
            console.warn('Session verification network error', fetchErr);
          }
        }

        // If access token expired, missing, or returned 401, attempt silent refresh
        if ((!res || res.status === 401) && refreshToken) {
          try {
            const refreshRes = await fetch(`${apiBase}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
              cache: 'no-store',
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccess = refreshData.tokens?.accessToken || refreshData.accessToken;
              const newRefresh = refreshData.tokens?.refreshToken || refreshData.refreshToken;
              const expiresIn = refreshData.tokens?.expiresIn || refreshData.expiresIn || 900;

              if (newAccess) {
                currentToken = newAccess;
                persistAuthTokens({
                  accessToken: newAccess,
                  refreshToken: newRefresh,
                  expiresIn,
                });

                res = await fetch(`${apiBase}/api/v1/users/me`, {
                  headers: { Authorization: `Bearer ${currentToken}` },
                  cache: 'no-store',
                });
              }
            } else if (refreshRes.status === 401) {
              // Refresh token genuinely rejected / revoked
              clearAuthStorage();
              setUser(null);
              setAccessTier('guest');
              if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
                router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
              }
              return;
            }
          } catch (refreshErr) {
            console.warn('Silent refresh network error', refreshErr);
          }
        }

        if (res && res.ok) {
          const freshUser = await res.json();
          setUser(freshUser);
          try {
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch {}

          let hasActiveSub = false;
          try {
            const activeSub = localStorage.getItem('ff_active_sub');
            if (activeSub) {
              const sub = JSON.parse(activeSub);
              if (sub.active) hasActiveSub = true;
            }
          } catch {}

          if (freshUser.role === 'admin') {
            setAccessTier('admin');
          } else if (
            hasActiveSub ||
            (Array.isArray(freshUser.entitlements) &&
              freshUser.entitlements.some((s: string) =>
                ['course_lifetime', 'tools_1yr', 'bundle_all', 'bundle_diy'].includes(s)
              ))
          ) {
            setAccessTier('entitled');
          } else {
            setAccessTier('authenticated');
          }
        } else if (res && res.status === 401 && !refreshToken) {
          // Access token expired and no refresh token exists
          clearAuthStorage();
          setUser(null);
          setAccessTier('guest');
          if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
            router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        }
      } catch (err) {
        console.warn('Session check network error', err);
      }
    };

    validateSession();

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('ff_auth_state_changed', syncAuthState);
    window.addEventListener('focus', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('ff_auth_state_changed', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
    };
  }, []);

  // Re-sync user immediately on client route transitions to prevent stale header cache
  useEffect(() => {
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    try {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch {}
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ff_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      toggleCollapse();
    }
  };

  // Lock body scroll when mobile navigation drawer or Ask Aureus modal is open
  useBodyScrollLock(mobileMenuOpen || askAureusOpen);

  const handleSignOut = async () => {
    const token = getStoredAccessToken();
    const apiBase = getApiBaseUrl();
    if (token) {
      try {
        await fetch(`${apiBase}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.warn('Backend logout invalidation call error:', err);
      }
    }
    clearAuthStorage();
    setUser(null);
    setAccessTier('guest');
    window.location.href = '/';
  };

  // --- Pre-render auth guard ---
  // While auth state hasn't been determined yet, show a neutral loading screen
  // on protected routes to prevent any flash of dashboard content.
  const PROTECTED_PREFIXES_CHECK = ['/dashboard', '/techno-funda', '/options-lab', '/kyc', '/courses', '/checkout', '/admin'];
  const isOnProtectedRoute = PROTECTED_PREFIXES_CHECK.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (!isInitialized && isOnProtectedRoute) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          background: 'var(--bg-base, #0A0F1D)',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(14,165,233,0.2)',
            borderTopColor: '#0ea5e9',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 500 }}>
          Loading GoalCompass...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-base, #F8F6F1)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Mobile Overlay ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="sidebar-backdrop-overlay"
          aria-label="Close navigation overlay"
        />
      )}

      {/* ── Persistent Dark Navy Left Sidebar (Fixed & Collapsible) ────── */}
      {/* ── Persistent Institutional Left Sidebar (Fixed & Collapsible) ────── */}
      <aside
        className={`sidebar-nav-container ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}
      >
        {/* ── Brand Header ─────────────────────────────────────── */}
        {!isCollapsed ? (
          <div
            style={{
              padding: '14px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--sb-border)',
              height: '60px',
              boxSizing: 'border-box',
              background: 'rgba(15, 23, 42, 0.4)',
            }}
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              title="GoalCompass Home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              <div className="sb-brand-avatar">
                {resolvedBrandBadge}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '15px',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resolvedBrandTitle}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--sb-text-muted, #64748B)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 650,
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>{resolvedBrandSubtitle}</span>
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Desktop collapse toggle */}
              <button
                onClick={toggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="sidebar-collapse-desktop-btn"
              >
                <PanelLeftClose size={14} />
              </button>

              {/* Close button on mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="sidebar-close-mobile"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid var(--sb-border)',
              height: '60px',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={toggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="sb-brand-avatar"
              style={{ cursor: 'pointer' }}
            >
              {resolvedBrandBadge}
            </button>
          </div>
        )}

        {/* Scrollable Nav Links with Custom Sleek Scrollbar */}
        <div className="sidebar-scroll-area">
          {!isInitialized ? (
            <SidebarNavSkeleton isCollapsed={isCollapsed} />
          ) : (
            <Suspense fallback={<SidebarNavSkeleton isCollapsed={isCollapsed} />}>
              <SidebarNavLinks
                currentPath={currentPath}
                onNavigate={() => setMobileMenuOpen(false)}
                isCollapsed={isCollapsed}
                accessTier={accessTier}
                isFreeMode={isFreeMode}
              />
            </Suspense>
          )}
        </div>

        {/* ── User Profile Card at Bottom ─────────────────────── */}
        {!isCollapsed ? (
          !isInitialized ? (
            <div className="sb-user-card">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '11px', width: '65%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }} />
                <div style={{ height: '8px', width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }} />
              </div>
            </div>
          ) : (
            <div className="sb-user-card">
              <div
                className="sb-user-avatar"
                style={{
                  background: user
                    ? accessTier === 'admin'
                      ? '#059669'
                      : accessTier === 'entitled'
                      ? '#0F766E'
                      : isFreeMode
                      ? '#059669'
                      : '#0284C7'
                    : isFreeMode
                    ? '#059669'
                    : '#1E293B',
                }}
              >
                {user
                  ? (user.firstName ? user.firstName[0] : (user.first_name ? user.first_name[0] : (user.email ? user.email[0] : 'U'))).toUpperCase()
                  : 'G'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sb-user-name">
                  {user
                    ? (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email?.split('@')[0]))
                    : 'Guest'}
                </div>
                <div
                  className="sb-user-tier"
                  style={{
                    color:
                      !user ? (isFreeMode ? '#34D399' : 'var(--sb-text-muted)')
                      : accessTier === 'admin' ? '#34D399'
                      : accessTier === 'entitled' ? '#10B981'
                      : isFreeMode ? '#34D399'
                      : '#38BDF8',
                  }}
                >
                  {!user ? (isFreeMode ? 'FREE PASS' : 'GUEST')
                   : accessTier === 'admin' ? 'ADMIN'
                   : accessTier === 'entitled' ? 'PRO'
                   : isFreeMode ? 'ALL ACCESS'
                   : 'MEMBER'}
                </div>
              </div>
              {user ? (
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="sb-user-action-btn"
                >
                  <LogOut size={15} />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  title="Sign In"
                  aria-label="Sign In"
                  className="sb-sign-in-btn"
                >
                  <LogIn size={12} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          )
        ) : (
          <div
            style={{
              padding: '12px 0',
              borderTop: '1px solid var(--sb-border)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              marginTop: 'auto',
            }}
          >
            {!isInitialized ? (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            ) : user ? (
              <>
                <div
                  title={`${user.firstName || user.first_name || user.email} (${accessTier})`}
                  className="sb-user-avatar"
                  style={{
                    background:
                      accessTier === 'admin'
                        ? '#059669'
                        : accessTier === 'entitled'
                        ? '#D97706'
                        : '#0284C7',
                  }}
                >
                  {(user.firstName ? user.firstName[0] : (user.first_name ? user.first_name[0] : (user.email ? user.email[0] : 'U'))).toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="sb-user-action-btn"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                title="Sign In"
                aria-label="Sign In"
                className="sb-user-action-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <LogIn size={14} />
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* ── Main Canvas Area (Offset from fixed sidebar) ─────────────── */}
      <div className={`sidebar-main-canvas ${isCollapsed ? 'canvas-collapsed' : ''}`}>
        {/* Top Status Bar */}
        <header
          className="sidebar-topbar"
          style={{
            height: '56px',
            padding: '0 clamp(10px, 2vw, 24px)',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--border-color, #E8E4DC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            gap: '6px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Sidebar toggle button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={handleToggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Toggle navigation menu'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="sidebar-toggle-btn"
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setAskAureusOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Command size={14} color="#6B7280" />
              <span className="topbar-ask-text">{resolvedAskButtonText}</span>
              <kbd className="hide-on-mobile" style={{ fontSize: '11px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '3px', padding: '1.5px 6px', color: '#6B7280', fontWeight: 650 }}>⌘K</kbd>
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="View system notifications"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Bell size={18} />
              </button>
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                }}
              />

              {/* Notifications Popover with Mobile Backdrop */}
              {notificationsOpen && (
                <>
                  <div
                    className="notifications-backdrop"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div
                    className="notifications-popover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 750, color: '#111827' }}>System Alerts</span>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
                        aria-label="Close alerts"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', color: '#4B5563' }}>
                      <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 650, color: '#0F172A', marginBottom: '2px' }}>DPDP Consent Preferences Active</div>
                        <div>Transactional SIP reminder channels enabled. Marketing opt-out respected.</div>
                      </div>
                      <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 650, color: '#0F172A', marginBottom: '2px' }}>AMFI NAV Snapshot Synced</div>
                        <div>Latest scheme NAV values updated for goal allocation engine.</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                      <Link
                        href="/dashboard/settings/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        style={{ fontSize: '11.5px', color: '#0F766E', fontWeight: 650, textDecoration: 'none' }}
                      >
                        Manage DPDP Settings →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isInitialized ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '30px',
                }}
              >
                {/* Subtle neutral placeholder during initial mount to prevent flashing 'Sign In' to authenticated users */}
                <div
                  style={{
                    width: '74px',
                    height: '30px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(0,0,0,0.05)',
                  }}
                />
              </div>
            ) : user ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  id="topbar-user-profile-trigger"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="topbar-user-trigger-btn"
                  title={user.email || 'User Profile'}
                  aria-label="User Profile Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div
                    className="topbar-user-avatar"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#0F766E',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 750,
                      flexShrink: 0,
                    }}
                  >
                    {(user.firstName?.[0] || user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="topbar-user-email hide-on-mobile" style={{ fontSize: '13px', color: '#334155', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                  {accessTier === 'admin' && (
                    <span
                      className="hide-on-mobile"
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 750,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#065F46',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      Admin
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    className="hide-on-mobile"
                    style={{
                      color: '#64748B',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>

                {/* User Profile Popover Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="notifications-backdrop"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="user-profile-popover"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {/* User Info Header */}
                      <div className="user-popover-header">
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#0F766E',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {(user.firstName?.[0] || user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(user.firstName || user.first_name) ? `${user.firstName || user.first_name} ${user.lastName || user.last_name || ''}`.trim() : user.email?.split('@')[0]}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </div>
                        </div>
                        {accessTier === 'admin' && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              background: '#DCFCE7',
                              color: '#166534',
                              border: '1px solid #86EFAC',
                              flexShrink: 0,
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="user-popover-divider" />

                      {/* Quick Navigation Links */}
                      <div className="user-popover-links">
                        <Link
                          href="/dashboard/goals"
                          onClick={() => setUserMenuOpen(false)}
                          className="user-popover-link-item"
                        >
                          <Target size={15} style={{ color: '#0F766E' }} />
                          <span>Goals & Wealth</span>
                        </Link>
                        <Link
                          href="/techno-funda"
                          onClick={() => setUserMenuOpen(false)}
                          className="user-popover-link-item"
                        >
                          <BarChart3 size={15} style={{ color: '#0F766E' }} />
                          <span>Techno-Funda Research</span>
                        </Link>
                        <Link
                          href="/dashboard/settings/notifications"
                          onClick={() => setUserMenuOpen(false)}
                          className="user-popover-link-item"
                        >
                          <Settings size={15} style={{ color: '#0F766E' }} />
                          <span>Account & Privacy</span>
                        </Link>
                        <Link
                          href="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="user-popover-link-item"
                        >
                          <Home size={15} style={{ color: '#0F766E' }} />
                          <span>Website Homepage</span>
                        </Link>
                        {accessTier === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="user-popover-link-item"
                          >
                            <ShieldCheck size={15} style={{ color: '#059669' }} />
                            <span>Admin Console</span>
                          </Link>
                        )}
                      </div>

                      <div className="user-popover-divider" />

                      {/* Sign Out Button in Popover */}
                      <div style={{ padding: '2px' }}>
                        <button
                          type="button"
                          id="popover-signout-btn"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleSignOut();
                          }}
                          className="user-popover-signout-btn"
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  fontSize: '13.5px',
                  fontWeight: 650,
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Ask Aureus Intelligence Modal */}
        {askAureusOpen && (
          <div
            className="modal-backdrop-fixed"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
            onClick={() => setAskAureusOpen(false)}
          >
            <div
              className="modal-dialog-contained card"
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '520px',
                width: '100%',
                maxHeight: 'calc(100dvh - 32px)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                border: '1px solid #E5E7EB',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Command size={18} color="#0D1522" />
                  <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {resolvedModalTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setAskAureusOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginBottom: '16px' }}>
                {resolvedModalDesc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  href="/techno-funda?tab=valuation"
                  onClick={() => setAskAureusOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    textDecoration: 'none',
                    color: '#0F172A',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calculator size={15} color="#0F766E" />
                    <span>Run DCF Valuation Lab on Listed Equities</span>
                  </span>
                  <ChevronRight size={16} color="#64748B" />
                </Link>
                <Link
                  href="/techno-funda?tab=pead"
                  onClick={() => setAskAureusOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    textDecoration: 'none',
                    color: '#0F172A',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={15} color="#0F766E" />
                    <span>Inspect PEAD Earnings Momentum Signals</span>
                  </span>
                  <ChevronRight size={16} color="#64748B" />
                </Link>
                <Link
                  href="/dashboard/goals"
                  onClick={() => setAskAureusOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    textDecoration: 'none',
                    color: '#0F172A',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={15} color="#0F766E" />
                    <span>Optimize Goal-Linked Mutual Fund SIPs</span>
                  </span>
                  <ChevronRight size={16} color="#64748B" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content Canvas */}
        <main className="sidebar-main-content">
          {children}
        </main>

        {/* Footer */}
        <footer className="sidebar-footer">
          <div className="sidebar-footer-text">
            <span className="sidebar-footer-brand">{resolvedFooterText}</span>
          </div>
          <div className="sidebar-footer-copy">
            <span>© {new Date().getFullYear()} GoalCompass</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
