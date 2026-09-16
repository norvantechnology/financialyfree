import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import {
  PRICING_FAQS,
  PLANS,
  SITE,
} from '../../../lib/marketing/site';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, FAQAccordion, Reveal } from '../../../components/marketing/primitives';
import { PlanRecommender } from '../../../components/marketing/PlanRecommender';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing — Starter, Tools, DIY Bundle & All-Access',
  description:
    'Compare FinanciallyFree plans: Free Starter, Tools Annual ₹9,999, DIY Wealth Bundle ₹14,999, All-Access Mastermind ₹24,999. AMFI ARN-350272.',
  path: '/pricing',
});

const MATRIX: Array<{ feature: string; starter: string; tools: string; diy: string; all: string }> = [
  { feature: 'Goal SIP calculators', starter: 'Yes', tools: 'Yes', diy: 'Yes', all: 'Yes' },
  { feature: 'Introductory Academy lessons', starter: 'Yes', tools: 'Yes', diy: 'Full library', all: 'Full library' },
  { feature: 'Techno-Funda (20 tools)', starter: 'Overview', tools: 'Full', diy: 'Full', all: 'Full' },
  { feature: 'Valuation Lab (9 models)', starter: '—', tools: 'Yes', diy: 'Yes', all: 'Yes' },
  { feature: 'Paperless KYC + MF execution', starter: 'Yes*', tools: 'Yes*', diy: 'Yes*', all: 'Yes*' },
  { feature: 'Research community / Q&A', starter: '—', tools: '—', diy: '—', all: 'Yes' },
];

export default function PricingPage() {
  const productLd = PLANS.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SITE.name} ${p.name}`,
    description: p.description,
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: p.id === 'starter' ? '0' : p.priceLabel.replace(/[^\d]/g, ''),
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(p.href),
    },
  }));

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: absoluteUrl('/pricing') },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumbLd, ...productLd]} />
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]} />
          <Reveal>
            <span className="mkt-kicker">Pricing</span>
            <h1 className="mkt-serif mkt-page-title">Simple annual plans</h1>
            <p className="mkt-lead">
              Start free. Upgrade when you need the full research suite or Academy library.
            </p>
          </Reveal>

          <div className="mkt-grid-4" style={{ marginBottom: 36 }}>
            {PLANS.map((plan) => (
              <article key={plan.id} className={`mkt-card mkt-plan ${plan.highlighted ? 'popular' : ''}`}>
                {plan.highlighted ? <span className="mkt-plan-badge">Popular</span> : null}
                <h2 className="mkt-serif mkt-card-title">{plan.name}</h2>
                <div className="mkt-price tabular">
                  {plan.priceLabel}
                  <span className="mkt-price-period"> {plan.period}</span>
                </div>
                <p className="mkt-plan-desc">{plan.description}</p>
                <ul className="mkt-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mkt-btn mkt-btn-block ${plan.highlighted ? 'mkt-btn-primary' : 'mkt-btn-outline-dark'}`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>

          <Reveal>
            <h2 className="mkt-serif">Comparison matrix</h2>
            <div className="mkt-matrix">
              <div
                className="mkt-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Plan comparison table"
              >
                <p className="mkt-scroll-hint">Swipe sideways to compare all plans →</p>
                <table className="mkt-table">
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      <th scope="col">Starter</th>
                      <th scope="col">Tools</th>
                      <th scope="col">DIY Bundle</th>
                      <th scope="col">All-Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row">{row.feature}</th>
                        <td>{row.starter}</td>
                        <td>{row.tools}</td>
                        <td>{row.diy}</td>
                        <td>{row.all}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mkt-matrix-stack">
                {(
                  [
                    ['Starter', 'starter'],
                    ['Tools', 'tools'],
                    ['DIY Bundle', 'diy'],
                    ['All-Access', 'all'],
                  ] as const
                ).map(([label, key]) => (
                  <article key={key} className="mkt-card">
                    <h3 className="mkt-serif mkt-card-title">{label}</h3>
                    <dl>
                      {MATRIX.map((row) => (
                        <React.Fragment key={`${key}-${row.feature}`}>
                          <dt>{row.feature}</dt>
                          <dd>{row[key]}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </div>
            <p className="mkt-text-muted" style={{ fontSize: '0.85rem' }}>
              * Mutual fund execution available after KYC under AMFI distributor relationship
              (ARN-{SITE.amfiArn}).
            </p>
          </Reveal>

          <div className="mkt-stack-gap">
            <h2 className="mkt-serif">Which plan fits?</h2>
            <PlanRecommender />
          </div>

          <div className="mkt-stack-gap">
            <h2 className="mkt-serif">Pricing FAQ</h2>
            <p className="mkt-lead" style={{ marginBottom: 16 }}>
              Plan and billing questions. For the full compliance FAQ, see the FAQ page.
            </p>
            <FAQAccordion items={PRICING_FAQS} idPrefix="pricing-faq" />
            <p style={{ marginTop: 16 }}>
              <Link href="/faq" className="mkt-btn mkt-btn-outline-dark">
                Browse the full FAQ
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
