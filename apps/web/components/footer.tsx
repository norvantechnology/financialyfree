'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Sparkles, TrendingUp, BookOpen, Video, Target } from 'lucide-react';

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
              FF
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              FinanciallyFree
            </span>
          </Link>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
            India&apos;s goal-first mutual fund execution engine & institutional-grade Techno-Funda research platform. Built for compounding wealth with purpose.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              color: 'var(--color-primary-400)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            <Shield size={14} />
            <span>AMFI Registered MFD: ARN-350272</span>
          </div>
        </div>

        {/* Col 2: Solutions */}
        <div>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Platform Solutions
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link href="/dashboard/goals" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} color="var(--color-primary-400)" />
                <span>Goal SIP Engine</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/invest" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="var(--color-success-400)" />
                <span>Curated Mutual Funds</span>
              </Link>
            </li>
            <li>
              <Link href="/techno-funda" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--color-accent-light)" />
                <span>Techno-Funda Research</span>
              </Link>
            </li>
            <li>
              <Link href="/courses" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="var(--color-warning-400)" />
                <span>DIY Masterclass (LMS)</span>
              </Link>
            </li>
            <li>
              <Link href="/webinars" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Video size={14} color="var(--color-editorial)" />
                <span>Weekly Live Webinars</span>
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

        {/* Col 4: Trust & Compliance */}
        <div>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Compliance & Legal
          </h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
            FutureZenith Insights LLP<br />
            AMFI ARN-350272 | EUIN: E538291<br />
            Valid Till: 2028-11-20
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>BSE StAR MF Member ID: 52910</span>
            <span style={{ color: 'var(--text-secondary)' }}>Razorpay Trusted Business Verified</span>
          </div>
        </div>
      </div>

      {/* Regulatory Disclaimers Bottom Bar */}
      <div
        style={{
          maxWidth: '1280px',
          margin: 'var(--space-8) auto 0',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        <p>
          <strong>Statutory Disclosure:</strong> Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance is not indicative of future returns. FinanciallyFree (FutureZenith Insights LLP) is an AMFI-registered Mutual Fund Distributor (ARN-350272) and acts as an order routing intermediary. We do not offer discretionary portfolio management services or guaranteed return schemes.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span>© {new Date().getFullYear()} FinanciallyFree. All rights reserved. Made with ❤️ for Indian investors.</span>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link href="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
            <Link href="/dashboard/settings/notifications" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/auth/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Investor Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
