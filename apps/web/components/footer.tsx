'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, BookOpen, Target } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/dashboard/goals') {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* Col 1: Brand & AMFI Creds */}
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, var(--color-primary-500, #0ea5e9), var(--color-secondary-500, #38bdf8))',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#ffffff',
                fontSize: 16,
              }}
            >
              GC
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              GoalCompass
            </span>
          </Link>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
            India&apos;s goal-first mutual fund execution engine & institutional-grade Techno-Funda research platform. Built for compounding wealth with purpose.
          </p>
        </div>

        {/* Col 2: Solutions */}
        <div>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Platform Solutions
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link href="/dashboard/goals" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} color="var(--color-accent-light)" />
                <span>Goal SIP Engine</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/invest" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="var(--color-accent-light)" />
                <span>Curated Mutual Funds</span>
              </Link>
            </li>
            <li>
              <Link href="/techno-funda" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={14} color="var(--color-accent-light)" />
                <span>Techno-Funda Research</span>
              </Link>
            </li>
            <li>
              <Link href="/courses" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="var(--color-accent-light)" />
                <span>DIY Masterclass (LMS)</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Resources & Pricing */}
        <div>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Plans & Access
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link href="/pricing" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Pricing & All-Access Pass
              </Link>
            </li>
            <li>
              <Link href="/kyc" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                KRA KYC Verification
              </Link>
            </li>
            <li>
              <Link href="/dashboard/portfolio" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Portfolio & Transactions
              </Link>
            </li>
            <li>
              <Link href="/dashboard/settings/notifications" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                DPDP Notification Preferences
              </Link>
            </li>
            <li>
              <Link href="/admin" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Admin Operations Console
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1280px',
          margin: 'var(--space-6) auto 0',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span>© {new Date().getFullYear()} GoalCompass. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Link href="/legal/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          <Link href="/legal/privacy-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/legal/refund-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Refund Policy</Link>
          <Link href="/auth/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
        </div>
      </div>
    </footer>
  );
}
