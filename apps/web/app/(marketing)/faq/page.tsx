import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { HOME_FAQS, MF_RISK_DISCLAIMER, NOT_ADVICE_DISCLAIMER } from '../../../lib/marketing/site';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, FAQAccordion, Reveal } from '../../../components/marketing/primitives';

export const metadata: Metadata = buildPageMetadata({
  title: 'FAQ: Goals, Research, Pricing & Compliance',
  description:
    'Frequently asked questions about FinanciallyFree plans, Techno-Funda research, AMFI distribution, and compliance.',
  path: '/faq',
});

const EXTRA = [
  {
    question: 'Do you guarantee investment returns?',
    answer:
      'No. We never guarantee returns. Mutual fund investments are subject to market risks. Research tools are educational decision-support only.',
  },
  {
    question: 'Where can I read legal policies?',
    answer:
      'See Privacy Policy, Terms of Use, Refund Policy, and Disclaimer under Legal in the site footer.',
  },
];

const ALL = [...HOME_FAQS, ...EXTRA];

export default function FaqPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: absoluteUrl('/faq') },
    ],
  };

  return (
    <>
      <JsonLd data={[faqLd, breadcrumbLd]} />
      <section className="mkt-section">
        <div className="mkt-container" style={{ maxWidth: 800 }}>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
          <Reveal>
            <span className="mkt-kicker">FAQ</span>
            <h1 className="mkt-serif mkt-page-title">
              Frequently asked questions
            </h1>
            <p className="mkt-lead">{NOT_ADVICE_DISCLAIMER}</p>
          </Reveal>
          <FAQAccordion items={ALL} idPrefix="faq-page" />
          <p style={{ marginTop: 20 }}>
            Still stuck? <Link href="/contact">Contact support</Link>.
          </p>
          <p className="mkt-text-muted" style={{ fontSize: '0.85rem' }}>{MF_RISK_DISCLAIMER}</p>
        </div>
      </section>
    </>
  );
}
