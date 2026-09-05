'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n/language-context';
import {
  Globe,
  TrendingUp,
  Menu,
  X,
  Target,
  BookOpen,
  BarChart3,
  Video,
  Sparkles,
  ShieldCheck,
  Layers,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { NotificationBell } from './notification-bell';

export function Navbar() {
  const { language, setLanguage, t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const navLinks = [
    { href: '/dashboard/goals', label: t.nav.goals, icon: Target },
    { href: '/courses', label: t.nav.courses, icon: BookOpen },
    { href: '/techno-funda', label: t.nav.tools, icon: BarChart3 },
    { href: '/webinars', label: t.nav.webinars, icon: Video },
    { href: '/pricing', label: t.nav.pricing, icon: Sparkles },
    { href: '/admin', label: 'Admin', icon: ShieldCheck },
  ];

  if (pathname === '/dashboard/goals') {
    return null;
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'rgba(10, 15, 29, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 var(--space-4)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '66px',
          }}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2 }}>
                Financially<span style={{ color: 'var(--color-primary-light)' }}>Free</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>
                ARN-350272
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <nav
            className="hide-on-mobile"
            style={{
              alignItems: 'center',
              gap: 'var(--space-5)',
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: isActive ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'color var(--transition-fast)',
                    padding: '6px 4px',
                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: Desktop */}
          <div
            className="hide-on-mobile"
            style={{
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <NotificationBell />

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Globe size={13} color="var(--color-primary-light)" />
              <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* Login / Dashboard */}
            <Link
              href="/auth/login"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                padding: '8px 12px',
              }}
            >
              {t.nav.login}
            </Link>

            <Link
              href="/pricing"
              className="btn btn-primary btn-sm"
              style={{ minHeight: '36px' }}
            >
              {t.nav.register}
            </Link>
          </div>

          {/* Right Action Controls: Mobile Hamburger + Quick Controls */}
          <div
            className="show-on-mobile"
            style={{
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <NotificationBell />

            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
              aria-label="Toggle language"
            >
              <Globe size={12} color="var(--color-primary-light)" />
              <span>{language === 'en' ? 'EN' : 'हिं'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: '42px',
                height: '42px',
                background: mobileMenuOpen ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${mobileMenuOpen ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mobileMenuOpen ? 'var(--color-danger)' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 85,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Drawer Body */}
          <div
            style={{
              position: 'relative',
              top: '66px',
              width: '100%',
              maxHeight: 'calc(100dvh - 66px)',
              overflowY: 'auto',
              background: 'hsl(222, 40%, 10%)',
              borderBottom: '1px solid var(--bg-border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              padding: 'var(--space-6) var(--space-4) var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            {/* Quick Links Section */}
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Navigation Menu
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-2)' }}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      background: isActive ? 'var(--color-primary-muted)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: isActive ? 'var(--color-primary-light)' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? 'var(--color-primary-light)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Portfolio & Privacy Links */}
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: 'var(--space-2)' }}>
              Investor Services
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <Link
                href="/dashboard/portfolio"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                <Layers size={14} color="var(--color-accent-light)" />
                <span>My Portfolio</span>
              </Link>

              <Link
                href="/kyc"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} color="var(--color-primary-light)" />
                <span>KYC Setup</span>
              </Link>
            </div>

            {/* Account CTA Buttons */}
            <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogIn size={16} />
                <span>{t.nav.login}</span>
              </Link>

              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <UserPlus size={16} />
                <span>{t.nav.register}</span>
              </Link>
            </div>

            {/* Compliance Note */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              AMFI Registered Distributor ARN-350272 · Mutual fund investments are subject to market risks.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
