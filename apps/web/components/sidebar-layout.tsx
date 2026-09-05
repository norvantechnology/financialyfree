'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Sliders,
  Activity,
  Target,
  Layers,
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
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export function SidebarLayout({ children, activePath }: SidebarLayoutProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { label: 'Valuation lab', href: '/techno-funda', icon: Activity },
    { label: 'Stock universe', href: '/dashboard/invest', icon: Search },
    { label: 'Big orders', href: '/techno-funda', icon: Layers },
    { label: 'Demergers', href: '/techno-funda', icon: ChevronRight },
    { label: 'Buybacks', href: '/techno-funda', icon: RefreshCw },
    { label: 'Results calendar', href: '/techno-funda', icon: Calendar },
    { label: 'Shareholding', href: '/techno-funda', icon: Shield },
    { label: 'News & filings', href: '/techno-funda', icon: FileText },
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
                const isActive = currentPath === item.href && item.label === 'Valuation lab';
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
              background: '#D97706',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            AS
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
              Arjun Shah
            </div>
            <div
              style={{
                color: '#F59E0B',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              PRIVATE ACCESS
            </div>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4B5563',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '6px',
              }}
            >
              <Sparkles size={14} color="#D97706" />
              <span>Ask Aureus</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button
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
            </div>

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
          </div>
        </header>

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
