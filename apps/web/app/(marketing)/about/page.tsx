import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import {
  AMFI_DISCLOSURE,
  NOT_ADVICE_DISCLAIMER,
  SITE,
} from '../../../lib/marketing/site';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, CtaSection, Reveal } from '../../../components/marketing/primitives';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us: AMFI Distributor & Research Platform',
  description:
    'FutureZenith Insights LLP (ARN-350272) builds FinanciallyFree: goal-based mutual fund distribution and Techno-Funda educational research tools.',
  path: '/about',
});

export default function AboutPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'About', item: absoluteUrl('/about') },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
          <Reveal>
            <span className="mkt-kicker">About</span>
            <h1 className="mkt-serif mkt-page-title">
              Built for purposeful wealth and honest research
            </h1>
            <p className="mkt-lead">
              FinanciallyFree is a product of <strong>{SITE.legalEntity}</strong>, an AMFI-registered
              Mutual Fund Distributor ({SITE.amfiArn}). We combine goal-based investing with a
              Techno-Funda research suite designed for DIY investors.
            </p>
          </Reveal>

          <div className="mkt-grid-2" style={{ marginTop: 28 }}>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Our mission
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                Help Indian investors plan clear goals, learn with discipline, and access
                institutional-style market context, without pretending we are a SEBI research
                analyst or investment adviser.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Compliance posture
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                {AMFI_DISCLOSURE} {NOT_ADVICE_DISCLAIMER} Academy and Techno-Funda content are
                educational / decision-support only.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Track A: Wealth Planning
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                Goal planners, paperless KYC, Academy courses, and BSE StAR MF order routing under
                our distributor relationship.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Track B: Market Research
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                Twenty Techno-Funda desks for valuation models, corporate filings, screeners, and market
                structure tools for self-directed study.
              </p>
            </article>
          </div>

          <article className="mkt-card" style={{ marginTop: 20 }}>
            <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
              Instructors &amp; product team
            </h2>
            <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6, marginBottom: 0 }}>
              Curriculum and research tooling are produced by the FinanciallyFree product team at{' '}
              {SITE.legalEntity}. We do not publish celebrity endorsements or unverifiable
              performance claims. For partnership or media queries, visit{' '}
              <Link href="/contact">Contact</Link>.
            </p>
          </article>
        </div>
      </section>
      <CtaSection title="Meet the platform in practice" />
    </>
  );
}
