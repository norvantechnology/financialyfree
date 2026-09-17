import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, CtaSection, Reveal } from '../../../components/marketing/primitives';

export const metadata: Metadata = buildPageMetadata({
  title: 'About GoalCompass: Goal-based Investing & Research Platform',
  description:
    'GoalCompass provides goal-based mutual fund investing and Techno-Funda educational research tools.',
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
              GoalCompass helps Indian investors plan clear financial goals, build wealth with discipline,
              and access institutional-style market research — all in one platform.
            </p>
          </Reveal>

          <div className="mkt-grid-2" style={{ marginTop: 28 }}>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Our mission
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                Empower Indian investors to set clear financial goals, invest with long-term discipline,
                and access institutional-grade market data and valuation tools with complete clarity.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Our Approach
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                We build transparent tools that help you understand your investments — not tell you what to buy.
                All research tools are designed for self-directed learning and exploration.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Track A: Wealth Planning
              </h2>
              <p style={{ color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
                Goal planners, paperless KYC, Academy courses, and seamless mutual fund execution —
                everything you need to invest with a clear plan.
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
              Curriculum and research tooling are produced by the GoalCompass product team.
              We do not publish celebrity endorsements or unverifiable
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
