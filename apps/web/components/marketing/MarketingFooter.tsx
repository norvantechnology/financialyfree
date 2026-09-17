import React from 'react';
import Link from 'next/link';
import {
  NAV_LINKS,
  SITE,
} from '../../lib/marketing/site';

const LEGAL = [
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Use' },
  { href: '/legal/refund-policy', label: 'Refund Policy' },
  { href: '/legal/disclaimer', label: 'Disclaimer' },
  { href: '/faq', label: 'FAQ' },
];

/** Product-feature links only: site pages stay under Explore (no Pricing/Academy dupes). */
const PRODUCT_LINKS = [
  { href: '/dashboard/goals', label: 'Goal Planner' },
  { href: '/techno-funda', label: 'Research Suite' },
  { href: '/kyc', label: 'Paperless KYC' },
  { href: '/dashboard/invest', label: 'Invest / SIP' },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div>
            <Link href="/" className="mkt-brand" style={{ marginBottom: 14 }}>
              <span className="mkt-brand-mark" aria-hidden>
                GC
              </span>
              <span className="mkt-brand-name">{SITE.name}</span>
            </Link>
            <p className="mkt-footer-brand-desc">
              Goal-based mutual fund investing (Track A) and Techno-Funda research tools (Track B),
              built by {SITE.legalEntity}.
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
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
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
          <p style={{ margin: 0 }}>
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
