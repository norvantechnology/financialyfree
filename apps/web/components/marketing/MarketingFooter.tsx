import React from 'react';
import Link from 'next/link';
import {
  AMFI_DISCLOSURE,
  MF_RISK_DISCLAIMER,
  NAV_LINKS,
  NOT_ADVICE_DISCLAIMER,
  SITE,
} from '../../lib/marketing/site';

const LEGAL = [
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Use' },
  { href: '/legal/refund-policy', label: 'Refund Policy' },
  { href: '/legal/disclaimer', label: 'Disclaimer' },
  { href: '/faq', label: 'FAQ' },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div>
            <Link href="/" className="mkt-brand" style={{ marginBottom: 14 }}>
              <span className="mkt-brand-mark" aria-hidden>
                FF
              </span>
              <span className="mkt-brand-name">{SITE.name}</span>
            </Link>
            <p style={{ margin: '0 0 12px', lineHeight: 1.55, maxWidth: '36ch' }}>
              Goal-based mutual fund investing (Track A) and Techno-Funda research (Track B) —
              built by {SITE.legalEntity}.
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#fde68a', fontWeight: 650 }}>
              {AMFI_DISCLOSURE}
            </p>
          </div>

          <div>
            <h3>Explore</h3>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <Link href="/dashboard/goals">Goal Planner</Link>
              </li>
              <li>
                <Link href="/techno-funda">Research Suite</Link>
              </li>
              <li>
                <Link href="/courses">Academy</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/kyc">Paperless KYC</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>Legal &amp; Contact</h3>
            <ul>
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mkt-legal-strip">
          <p style={{ margin: 0 }}>{MF_RISK_DISCLAIMER}</p>
          <p style={{ margin: 0 }}>{NOT_ADVICE_DISCLAIMER}</p>
          <p style={{ margin: 0 }}>
            © {year} {SITE.legalEntity}. All rights reserved. {SITE.name} is a product of{' '}
            {SITE.legalEntity}.
          </p>
        </div>
      </div>
    </footer>
  );
}
