import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import {
  AMFI_DISCLOSURE,
  HOME_FAQS,
  MF_RISK_DISCLAIMER,
  NOT_ADVICE_DISCLAIMER,
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
            <h1 className="mkt-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: 0 }}>
              Simple annual plans
            </h1>
            <p className="mkt-lead">
              Start free. Upgrade when you need the full research suite or Academy library.{' '}
              {NOT_ADVICE_DISCLAIMER}
            </p>
          </Reveal>

          <div className="mkt-grid-4" style={{ marginBottom: 36 }}>
            {PLANS.map((plan) => (
              <article key={plan.id} className={`mkt-card mkt-plan ${plan.highlighted ? 'popular' : ''}`}>
                {plan.highlighted ? <span className="mkt-plan-badge">Popular</span> : null}
                <h2 className="mkt-serif" style={{ fontSize: '1.2rem', margin: '0 0 4px' }}>
                  {plan.name}
                </h2>
                <div className="mkt-price tabular">
                  {plan.priceLabel}
                  <span style={{ fontSize: '0.85rem', color: 'var(--mkt-muted)', fontWeight: 600 }}>
                    {' '}
                    {plan.period}
                  </span>
                </div>
                <p style={{ color: 'var(--mkt-muted)', fontSize: '0.9rem' }}>{plan.description}</p>
                <ul style={{ paddingLeft: 18, margin: '0 0 16px', color: 'var(--mkt-muted)', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 6 }}>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mkt-btn ${plan.highlighted ? 'mkt-btn-primary' : 'mkt-btn-outline-dark'}`}
                  style={{ width: '100%' }}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>

          <Reveal>
            <h2 className="mkt-serif">Comparison matrix</h2>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.92rem',
                  minWidth: 640,
                }}
              >
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                    <th scope="col" style={{ padding: '12px 8px' }}>
                      Feature
                    </th>
                    <th scope="col" style={{ padding: '12px 8px' }}>
                      Starter
                    </th>
                    <th scope="col" style={{ padding: '12px 8px' }}>
                      Tools
                    </th>
                    <th scope="col" style={{ padding: '12px 8px' }}>
                      DIY Bundle
                    </th>
                    <th scope="col" style={{ padding: '12px 8px' }}>
                      All-Access
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((row) => (
                    <tr key={row.feature} style={{ borderBottom: '1px solid #e8e4dc' }}>
                      <th scope="row" style={{ padding: '12px 8px', fontWeight: 650, textAlign: 'left' }}>
                        {row.feature}
                      </th>
                      <td style={{ padding: '12px 8px' }}>{row.starter}</td>
                      <td style={{ padding: '12px 8px' }}>{row.tools}</td>
                      <td style={{ padding: '12px 8px' }}>{row.diy}</td>
                      <td style={{ padding: '12px 8px' }}>{row.all}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--mkt-muted)' }}>
              * Mutual fund execution available after KYC under AMFI distributor relationship ({SITE.amfiArn}).
            </p>
          </Reveal>

          <div style={{ marginTop: 36 }}>
            <h2 className="mkt-serif">Which plan fits?</h2>
            <PlanRecommender />
          </div>

          <div style={{ marginTop: 36 }}>
            <h2 className="mkt-serif">Pricing FAQ</h2>
            <FAQAccordion items={HOME_FAQS.slice(0, 4)} idPrefix="pricing-faq" />
          </div>

          <p style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--mkt-muted)' }}>
            {AMFI_DISCLOSURE} {MF_RISK_DISCLAIMER}
          </p>
        </div>
      </section>
    </>
  );
}
