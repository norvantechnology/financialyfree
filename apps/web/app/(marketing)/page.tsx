import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Target,
  ShieldCheck,
  GraduationCap,
  BarChart3,
  ArrowRight,
  BookOpen,
  Landmark,
  LineChart,
} from 'lucide-react';
import { buildPageMetadata } from '../../lib/marketing/seo';
import {
  AMFI_DISCLOSURE,
  HOME_FAQS,
  MF_RISK_DISCLAIMER,
  NOT_ADVICE_DISCLAIMER,
  PLANS,
  SITE,
  VERIFIED_STATS,
} from '../../lib/marketing/site';
import { absoluteUrl } from '../../lib/marketing/blog';
import { JsonLd } from '../../components/marketing/JsonLd';
import { IndicesRibbon } from '../../components/marketing/IndicesRibbon';
import { SipCalculatorPreview } from '../../components/marketing/SipCalculatorPreview';
import { TrackBTabsClient } from '../../components/marketing/TrackBTabsClient';
import {
  AnimatedCounter,
  CtaSection,
  FAQAccordion,
  FeatureCard,
  Reveal,
} from '../../components/marketing/primitives';

export const metadata: Metadata = buildPageMetadata({
  title: 'Goal-Based Mutual Funds & Techno-Funda Research',
  description:
    'AMFI-registered mutual fund distributor (ARN-350272). Plan SIPs for FIRE, education & wealth — plus 20 Techno-Funda research tools. Educational decision-support, not investment advice.',
  path: '/',
});

const TRACK_B_PREVIEWS = [
  {
    id: 'mmi',
    title: 'Market Mood Index',
    body: 'Composite sentiment telemetry for market climate context.',
  },
  {
    id: 'valuation',
    title: 'Valuation Lab',
    body: 'Nine models: DCF, Reverse DCF, Graham, Lynch, DDM, multiples and more.',
  },
  {
    id: 'orders',
    title: 'Order Tracker',
    body: 'SEBI LODR order wins with PDF annexure ₹ Cr extraction.',
  },
  {
    id: 'fno',
    title: 'F&O OI & PCR',
    body: 'Open interest, put-call ratio and max-pain style views.',
  },
];

export default function HomePage() {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'FinancialService'],
    name: SITE.name,
    legalName: SITE.legalEntity,
    url: absoluteUrl('/'),
    email: SITE.supportEmail,
    description: SITE.tagline,
    areaServed: 'IN',
    slogan: SITE.tagline,
    identifier: SITE.amfiArn,
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd data={[orgLd, faqLd]} />

      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-badge">
            <ShieldCheck size={16} aria-hidden />
            AMFI Registered MFD · ARN-350272 · {SITE.legalEntity}
          </div>
          <h1 className="mkt-serif">Invest with purpose. Research with discipline.</h1>
          <p className="mkt-hero-sub">
            Track A: goal-based SIPs, paperless KYC, and BSE StAR MF execution. Track B: 20
            Techno-Funda research desks — valuation, PEAD, order filings, F&O, and more.
            Educational decision-support only — not investment advice.
          </p>
          <div className="mkt-hero-ctas">
            <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary">
              Start Free Goal Planner
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/techno-funda" className="mkt-btn mkt-btn-ghost">
              Explore Research Suite
            </Link>
          </div>
          <IndicesRibbon />
        </div>
      </section>

      <section className="mkt-section mkt-section-alt" aria-labelledby="stats-heading">
        <div className="mkt-container">
          <h2 id="stats-heading" className="visually-hidden">
            Platform capabilities
          </h2>
          <div className="mkt-grid-4">
            {VERIFIED_STATS.map((s) => (
              <Reveal key={s.label}>
                <div className="mkt-stat mkt-card">
                  <div className="num">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="label">{s.label}</div>
                  <div className="detail">{s.detail}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section" aria-labelledby="calc-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Try before you sign up</span>
            <h2 id="calc-heading">Goal SIP calculator</h2>
            <p className="mkt-lead">
              Instant monthly SIP estimate from our audited goal engine. Save scenarios after you
              create a free account.
            </p>
          </Reveal>
          <Reveal>
            <SipCalculatorPreview />
          </Reveal>
        </div>
      </section>

      <section className="mkt-section mkt-section-dark" aria-labelledby="track-a-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker" style={{ color: '#fbbf24' }}>
              Track A · Wealth
            </span>
            <h2 id="track-a-heading">Goal-based investing, end to end</h2>
            <p className="mkt-lead">
              From horizon planning to KYC to exchange-routed SIPs — built for disciplined wealth
              creation.
            </p>
          </Reveal>
          <div className="mkt-grid-2" style={{ marginBottom: 28 }}>
            <FeatureCard
              icon={<Target size={22} />}
              badge="Goals"
              title="Four wealth horizons"
              description="Emergency Fund, Retirement/FIRE, Child Education, and Wealth Creation — inflation-aware SIP maths."
            />
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              badge="KYC"
              title="Paperless onboarding"
              description="Complete KYC digitally, then invest via our AMFI distributor rails."
            />
            <FeatureCard
              icon={<Landmark size={22} />}
              badge="Execution"
              title="BSE StAR MF routing"
              description="Lumpsum and SIP orders with e-NACH / UPI Autopay mandate support."
            />
            <FeatureCard
              icon={<GraduationCap size={22} />}
              badge="Academy"
              title="LMS course library"
              description="Zero-to-Hero curriculum alongside live planning tools."
            />
          </div>
          <Reveal>
            <div className="mkt-flow" aria-label="Track A flow">
              {[
                { t: 'Set a goal', d: 'Pick horizon & target corpus' },
                { t: 'Plan SIP', d: 'Use the shared calc engine' },
                { t: 'Complete KYC', d: 'Paperless verification' },
                { t: 'Execute', d: 'Route via BSE StAR MF' },
              ].map((step, i) => (
                <div key={step.t} className="mkt-flow-step">
                  <div className="n">{i + 1}</div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{step.t}</strong>
                  <span style={{ opacity: 0.75, fontSize: '0.9rem' }}>{step.d}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mkt-section mkt-section-alt" aria-labelledby="track-b-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track B · Research</span>
            <h2 id="track-b-heading">Techno-Funda research suite</h2>
            <p className="mkt-lead">
              Twenty institutional desks for DIY investors who want filings, valuation, and market
              structure in one workspace — not a tip shop.
            </p>
          </Reveal>
          <TrackBTabsClient items={TRACK_B_PREVIEWS} />
          <div style={{ marginTop: 20 }}>
            <Link href="/features" className="mkt-btn mkt-btn-outline-dark">
              See all features
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section" aria-labelledby="how-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">How it works</span>
            <h2 id="how-heading">Four steps to clarity</h2>
          </Reveal>
          <div className="mkt-grid-4">
            {[
              { icon: <Target size={20} />, t: 'Plan', d: 'Model goals with free calculators' },
              { icon: <BookOpen size={20} />, t: 'Learn', d: 'Academy lessons & compliance context' },
              { icon: <BarChart3 size={20} />, t: 'Research', d: 'Unlock Techno-Funda desks' },
              { icon: <LineChart size={20} />, t: 'Invest', d: 'KYC + BSE StAR MF execution' },
            ].map((s) => (
              <Reveal key={s.t}>
                <article className="mkt-card">
                  <div style={{ color: '#0f766e', marginBottom: 10 }}>{s.icon}</div>
                  <h3 className="mkt-serif" style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>
                    {s.t}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--mkt-muted)' }}>{s.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section-alt" aria-labelledby="pricing-preview">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Pricing</span>
            <h2 id="pricing-preview">Plans that match how you invest</h2>
            <p className="mkt-lead">Starter is free. Research and Academy unlock with annual plans.</p>
          </Reveal>
          <div className="mkt-grid-4">
            {PLANS.map((plan) => (
              <Reveal key={plan.id}>
                <article className={`mkt-card mkt-plan ${plan.highlighted ? 'popular' : ''}`}>
                  {plan.highlighted ? <span className="mkt-plan-badge">Popular</span> : null}
                  <h3 className="mkt-serif" style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>
                    {plan.name}
                  </h3>
                  <div className="mkt-price tabular">
                    {plan.priceLabel}
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--mkt-muted)' }}>
                      {' '}
                      {plan.period}
                    </span>
                  </div>
                  <p style={{ color: 'var(--mkt-muted)', fontSize: '0.9rem', flex: 1 }}>{plan.description}</p>
                  <Link
                    href={plan.href}
                    className={`mkt-btn ${plan.highlighted ? 'mkt-btn-primary' : 'mkt-btn-outline-dark'}`}
                    style={{ width: '100%', marginTop: 12 }}
                  >
                    {plan.cta}
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/pricing" className="mkt-btn mkt-btn-outline-dark">
              View full comparison
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section" aria-labelledby="home-faq">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">FAQ</span>
            <h2 id="home-faq">Common questions</h2>
          </Reveal>
          <FAQAccordion items={HOME_FAQS} idPrefix="home-faq" />
          <p style={{ marginTop: 16 }}>
            <Link href="/faq">Browse the full FAQ</Link>
          </p>
        </div>
      </section>

      <CtaSection />

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div
          className="mkt-container"
          style={{ fontSize: '0.85rem', color: 'var(--mkt-muted)', lineHeight: 1.55 }}
        >
          <p style={{ margin: '0 0 8px' }}>{AMFI_DISCLOSURE}</p>
          <p style={{ margin: '0 0 8px' }}>{NOT_ADVICE_DISCLAIMER}</p>
          <p style={{ margin: 0 }}>{MF_RISK_DISCLAIMER}</p>
        </div>
      </section>
    </>
  );
}
