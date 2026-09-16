import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { AMFI_DISCLOSURE, MF_RISK_DISCLAIMER, NOT_ADVICE_DISCLAIMER, SITE } from '../../../lib/marketing/site';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, Reveal } from '../../../components/marketing/primitives';
import { ContactForm } from '../../../components/marketing/ContactForm';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact — Support & Partnerships',
  description: `Contact FinanciallyFree / ${SITE.legalEntity}. Support email ${SITE.supportEmail}. AMFI ARN-350272.`,
  path: '/contact',
});

export default function ContactPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: absoluteUrl('/contact') },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
          <Reveal>
            <span className="mkt-kicker">Contact</span>
            <h1 className="mkt-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: 0 }}>
              We are here to help
            </h1>
            <p className="mkt-lead">
              Product questions, billing, or partnerships. Messages route through our existing
              notifications email provider (mock SES/SendGrid in non-prod).
            </p>
          </Reveal>

          <div className="mkt-grid-2">
            <ContactForm />
            <aside className="mkt-card">
              <h2 className="mkt-serif" style={{ fontSize: '1.2rem', marginTop: 0 }}>
                Direct channels
              </h2>
              <p style={{ marginBottom: 8 }}>
                <strong>Support:</strong>{' '}
                <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Business:</strong>{' '}
                <a href={`mailto:${SITE.businessEmail}`}>{SITE.businessEmail}</a>
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Entity:</strong> {SITE.legalEntity}
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Registered posture:</strong> {AMFI_DISCLOSURE}
              </p>
              <p style={{ marginTop: 16, fontSize: '0.88rem', color: 'var(--mkt-muted)' }}>
                {SITE.addressLines.join(', ')}
              </p>
              <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--mkt-muted)' }}>
                {NOT_ADVICE_DISCLAIMER} {MF_RISK_DISCLAIMER}
              </p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
