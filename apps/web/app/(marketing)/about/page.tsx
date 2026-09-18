import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, CtaSection, Reveal } from '../../../components/marketing/primitives';

export const metadata: Metadata = buildPageMetadata({
  title: 'About GoalCompass: SIPs & Stock Research for Indian Investors',
  description:
    'GoalCompass helps Indian investors plan monthly SIPs and research Nifty stocks with clear, honest tools - built by FutureZenith Insights LLP.',
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
              GoalCompass helps everyday Indian investors plan clear goals, invest with monthly SIPs,
              and research Nifty stocks with tools you can understand - all in one place.
            </p>
          </Reveal>

          <div className="mkt-grid-2" style={{ marginTop: 28 }}>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Our mission
              </h2>
              <p style={{ color: 'var(--mkt-text-muted)', lineHeight: 1.6 }}>
                Help Indian investors set clear financial goals, invest with long-term discipline,
                and access clear market data and valuation tools - without tip-group noise.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Our approach
              </h2>
              <p style={{ color: 'var(--mkt-text-muted)', lineHeight: 1.6 }}>
                We build transparent tools that help you understand investments - not tell you what
                to buy. Research features are for self-directed learning and exploration.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Track A: Wealth planning
              </h2>
              <p style={{ color: 'var(--mkt-text-muted)', lineHeight: 1.6 }}>
                Goal planners, paperless KYC, beginner courses, and mutual fund SIPs routed through
                exchange infrastructure - so you invest with a plan.
              </p>
            </article>
            <article className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
                Track B: Stock research
              </h2>
              <p style={{ color: 'var(--mkt-text-muted)', lineHeight: 1.6 }}>
                Fair-value models, screeners, filings, and market mood tools for DIY investors who
                want to research Nifty stocks themselves.
              </p>
            </article>
          </div>

          <article className="mkt-card" style={{ marginTop: 20 }}>
            <h2 className="mkt-serif" style={{ fontSize: '1.3rem', marginTop: 0 }}>
              Instructors &amp; product team
            </h2>
            <p style={{ color: 'var(--mkt-text-muted)', lineHeight: 1.6, marginBottom: 0 }}>
              Curriculum and research tooling are built by the GoalCompass product team at
              FutureZenith Insights LLP. We do not publish celebrity endorsements or unverifiable
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
