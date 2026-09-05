'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n/language-context';
import { Globe, TrendingUp } from 'lucide-react';

export function Navbar() {
  const { language, setLanguage, t } = useTranslation();
  const pathname = usePathname();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const navLinks = [
    { href: '/dashboard/goals', label: t.nav.goals },
    { href: '/courses', label: t.nav.courses },
    { href: '/techno-funda', label: t.nav.tools },
    { href: '/webinars', label: t.nav.webinars },
    { href: '/pricing', label: t.nav.pricing },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 var(--space-6)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            }}
          >
            <TrendingUp size={20} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 60%, var(--color-primary-400))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FinanciallyFree
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? 'var(--color-primary-400)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  transition: 'color var(--transition-fast)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Language Toggle & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Globe size={14} color="var(--color-primary-400)" />
            <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Login / Dashboard CTA */}
          <Link
            href="/auth/login"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: '8px 14px',
            }}
          >
            {t.nav.login}
          </Link>

          <Link
            href="/pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              color: '#ffffff',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
            }}
          >
            {t.nav.register}
          </Link>
        </div>
      </div>
    </header>
  );
}
