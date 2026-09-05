'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Sliders,
  Activity,
  Target,
  ChevronRight,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Briefcase,
  GraduationCap,
  Video,
  ShieldCheck,
  CreditCard,
  Settings,
  Lock,
  Sparkles,
  Bell,
  Menu,
  X,
  Gauge,
  BarChart3,
  Truck,
  LogOut,
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export function SidebarLayout({ children, activePath }: SidebarLayoutProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; first_name?: string; last_name?: string; role?: string } | null>(null);
  const [askAureusOpen, setAskAureusOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
    window.location.href = '/';
  };

  const workspaceNav = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Goals & FIRE', href: '/dashboard/goals', icon: Target },
    { label: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
    { label: 'Invest (BSE StAR)', href: '/dashboard/invest', icon: Sliders },
    { label: 'Learn / LMS', href: '/courses', icon: GraduationCap },
    { label: 'Techno-Funda Tools', href: '/techno-funda', icon: Activity },
    { label: 'Webinars', href: '/webinars', icon: Video },
  ];

  const researchNav = [
    { label: 'Valuation lab', href: '/techno-funda?tab=valuation', icon: Activity },
    { label: 'Stock universe', href: '/dashboard/invest', icon: Search },
    { label: 'Market Mood', href: '/techno-funda?tab=mmi', icon: Gauge },
    { label: 'PEAD Screener', href: '/techno-funda?tab=pead', icon: BarChart3 },
    { label: 'Vahan Auto', href: '/techno-funda?tab=vahan', icon: Truck },
    { label: 'Buybacks & Arbitrage', href: '/techno-funda?tab=buybacks', icon: RefreshCw },
    { label: 'Results calendar', href: '/techno-funda?tab=results', icon: Calendar },
    { label: 'Shareholding', href: '/techno-funda?tab=shareholding', icon: Shield },
    { label: 'News & filings', href: '/techno-funda?tab=news', icon: FileText },
  ];

  const yourRoomNav = [
    { label: 'KYC Verification', href: '/kyc', icon: ShieldCheck },
    { label: 'Billing & Invoices', href: '/dashboard/billing', icon: CreditCard },
    { label: 'DPDP Preferences', href: '/dashboard/settings/notifications', icon: Settings },
    { label: 'Admin Console', href: '/admin', icon: Lock },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-base, #F8F6F1)' }}>
      {/* ── Mobile Overlay ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 400,
          }}
        />
      )}

      {/* ── Persistent Dark Navy Left Sidebar ─────────────────────────── */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-sidebar, #0D1522)',
          color: 'var(--color-sidebar-text, #94A3B8)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100dvh',
          zIndex: 450,
          transition: 'transform 0.25s ease',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        className={`sidebar-nav-container ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '22px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid #D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '18px',
                background: 'rgba(217, 119, 6, 0.12)',
              }}
            >
              A
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                }}
              >
                AUREUS
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#94A3B8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginTop: '2px',
                }}
              >
                RESEARCH ROOM
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'none',
            }}
            className="sidebar-close-mobile"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {/* Section 1: WORKSPACE */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-sidebar-header, #64748B)',
                padding: '0 12px 8px',
              }}
            >
              WORKSPACE
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section 2: RESEARCH */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-sidebar-header, #64748B)',
                padding: '0 12px 8px',
              }}
            >
              RESEARCH
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {researchNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || (currentPath.startsWith('/techno-funda') && item.href.includes(currentPath));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section 3: YOUR ROOM */}
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-sidebar-header, #64748B)',
                padding: '0 12px 8px',
              }}
            >
              YOUR ROOM
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {yourRoomNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile Card at Bottom */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: user ? '#D97706' : '#475569',
              color: user ? '#0F172A' : '#F1F5F9',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {user
              ? (user.first_name ? user.first_name[0] : (user.email ? user.email[0] : 'U')).toUpperCase()
              : 'GI'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user
                ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email?.split('@')[0])
                : 'Guest Investor'}
            </div>
            <div
              style={{
                color: user?.role === 'admin' ? '#34D399' : user ? '#F59E0B' : '#94A3B8',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {user?.role === 'admin' ? 'ADMINISTRATOR' : user ? 'VERIFIED INVESTOR' : 'GUEST ACCESS'}
            </div>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Canvas Area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Status Bar */}
        <header
          style={{
            height: '56px',
            padding: '0 28px',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--border-color, #E8E4DC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Left: Mobile hamburger & Static Market Snapshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{
                background: 'none',
                border: 'none',
                color: '#111827',
                cursor: 'pointer',
                display: 'none',
                padding: '4px',
              }}
              className="sidebar-hamburger-mobile"
            >
              <Menu size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ fontWeight: 500 }}>Static market snapshot</span>
              <span style={{ color: '#D1D5DB' }}>/</span>
              <span>02 Sep 2026 09:42 IST</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <button
              onClick={() => setAskAureusOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: '1px solid #E5E7EB',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4B5563',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '6px',
              }}
            >
              <Sparkles size={14} color="#D97706" />
              <span>Ask Aureus</span>
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
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Bell size={18} />
              </button>
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                }}
              />

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '36px',
                    width: '320px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '14px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>System Alerts</span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#4B5563' }}>
                    <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>DPDP Consent Preferences Active</div>
                      <div>Transactional SIP reminder channels enabled. Marketing opt-out respected.</div>
                    </div>
                    <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>AMFI NAV Snapshot Synced</div>
                      <div>Latest scheme NAV values updated for goal allocation engine.</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <Link
                      href="/dashboard/settings/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Manage DPDP Settings →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn btn-outline"
                  style={{
                    minHeight: '28px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  padding: '6px 14px',
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(2px)',
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '520px',
                width: '100%',
                border: '1px solid #E5E7EB',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#D97706" />
                  <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Ask Aureus Intelligence
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
                Aureus is your institutional research co-pilot. Quickly jump to key financial tools or inspect stock metrics:
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
                  <span>📊 Run DCF Valuation Lab on Listed Equities</span>
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
                  <span>📈 Inspect PEAD Earnings Momentum Signals</span>
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
                  <span>🎯 Optimize Goal-Linked Mutual Fund SIPs</span>
                  <ChevronRight size={16} color="#64748B" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content Canvas */}
        <main style={{ flex: 1, padding: 'clamp(20px, 3vw, 36px)' }}>
          {children}
        </main>

        {/* Statutory Regulatory Disclosures */}
        <footer
          style={{
            padding: '20px clamp(20px, 3vw, 36px)',
            borderTop: '1px solid var(--border-color, #E8E4DC)',
            background: 'var(--bg-base, #F8F6F1)',
            fontSize: '11px',
            color: 'var(--text-muted, #6B7280)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <strong>FinanciallyFree / Aureus Research Room</strong> • AMFI Registered Mutual Fund Distributor ARN-350272
            <br />
            <span>Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Educational & research terminal.</span>
          </div>
          <div>
            <span>© 2026 FutureZenith Insights LLP • All rights reserved</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sidebar-nav-container {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
          }
          .sidebar-mobile-open {
            transform: translateX(0) !important;
          }
          .sidebar-hamburger-mobile {
            display: flex !important;
          }
          .sidebar-close-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
