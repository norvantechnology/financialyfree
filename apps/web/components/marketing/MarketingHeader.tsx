'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS, SITE } from '../../lib/marketing/site';
import { useScrolled } from '../../lib/marketing/hooks';
import { useBodyScrollLock } from '../../lib/use-body-scroll-lock';
import {
  getStoredAccessToken,
  getStoredUser,
  isTokenExpired,
} from '../../lib/auth-client';

function readLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const token = getStoredAccessToken();
  const user = getStoredUser();
  if (!token || !user) return false;
  if (isTokenExpired(token)) return false;
  return true;
}

export function MarketingHeader({ forceSolid = false }: { forceSolid?: boolean }) {
  const pathname = usePathname();
  const scrolled = useScrolled(20);
  const onHome = pathname === '/';
  const solid = forceSolid || scrolled || !onHome;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const sync = () => setLoggedIn(readLoggedIn());
    sync();
    window.addEventListener('ff_auth_state_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ff_auth_state_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useBodyScrollLock(drawerOpen);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className={`mkt-header ${solid ? 'is-scrolled' : 'is-top'}`}>
        <div className="mkt-header-inner">
          <Link href="/" className="mkt-brand" aria-label={`${SITE.name} home`}>
            <Image
              src="/og-default.svg"
              alt={`${SITE.name} logo`}
              width={36}
              height={36}
              priority
              style={{ borderRadius: 10 }}
            />
            <span className="mkt-brand-name">{SITE.name}</span>
          </Link>

          <nav className="mkt-nav-desktop" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mkt-nav-link"
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mkt-header-actions">
            {loggedIn ? (
              <Link href="/dashboard" className="mkt-btn mkt-btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="mkt-btn mkt-btn-ghost">
                  Log In
                </Link>
                <Link href="/auth/register" className="mkt-btn mkt-btn-primary">
                  Get Started Free
                </Link>
              </>
            )}
            <button
              type="button"
              className="mkt-menu-btn"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mkt-drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        hidden={!drawerOpen}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span className="mkt-brand-name" style={{ color: '#fff' }}>
            Menu
          </span>
          <button
            type="button"
            className="mkt-menu-btn"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <nav aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mkt-drawer-link"
              onClick={() => setDrawerOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 24 }}>
          {loggedIn ? (
            <Link href="/dashboard" className="mkt-btn mkt-btn-primary" onClick={() => setDrawerOpen(false)}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="mkt-btn mkt-btn-ghost" onClick={() => setDrawerOpen(false)}>
                Log In
              </Link>
              <Link href="/auth/register" className="mkt-btn mkt-btn-primary" onClick={() => setDrawerOpen(false)}>
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
