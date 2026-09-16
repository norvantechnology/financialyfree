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
  HOME_FAQS,
  PLANS,
  PLATFORM_STEPS,
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
    'AMFI-registered mutual fund distributor (ARN-350272). Plan SIPs for FIRE, education, and wealth, plus 20 Techno-Funda research tools. Educational decision-support, not investment advice.',
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
            AMFI Registered MFD · ARN-{SITE.amfiArn} · {SITE.legalEntity}
          </div>
          <h1 className="mkt-serif">Invest with purpose. Research with discipline.</h1>
          <p className="mkt-hero-sub">
            Track A offers goal-based SIPs, paperless KYC, and BSE StAR MF execution. Track B provides 20
            Techno-Funda research desks for valuation, PEAD, order filings, F&O analytics, and market sentiment.
            Educational decision-support only (not investment advice).
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
          <div className="mkt-hero-direct-links">
            <span>Direct access:</span>
            <Link href="/dashboard" className="mkt-hero-direct-link">
              Go to Dashboard →
            </Link>
            <span className="mkt-hero-link-sep">·</span>
            <Link href="/auth/login" className="mkt-hero-direct-link">
              Log In
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
            <span className="mkt-kicker">Track A · Wealth</span>
            <h2 id="track-a-heading">Goal-based investing, end to end</h2>
            <p className="mkt-lead">
              From horizon planning to KYC to exchange-routed SIPs, built for disciplined wealth
              creation.
            </p>
          </Reveal>
          <div className="mkt-grid-2" style={{ marginBottom: 28 }}>
            <FeatureCard
              icon={<Target size={22} />}
              badge="Goals"
              title="Four wealth horizons"
              description="Emergency Fund, Retirement/FIRE, Child Education, and Wealth Creation with inflation-aware SIP calculations."
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
            <div className="mkt-flow" aria-label="How FinanciallyFree works">
              {PLATFORM_STEPS.map((step, i) => (
                <div key={step.title} className="mkt-flow-step">
                  <div className="n">{i + 1}</div>
                  <strong>{step.title}</strong>
                  <span className="detail">{step.detail}</span>
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
              structure in one workspace (not a tip shop).
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
            <p className="mkt-lead">
              A structured roadmap across Track A wealth tools and Track B research: plan, learn,
              research, then invest.
            </p>
          </Reveal>
          <div className="mkt-grid-4">
            {PLATFORM_STEPS.map((s, i) => {
              const icons = [
                <Target key="t" size={20} />,
                <BookOpen key="b" size={20} />,
                <BarChart3 key="c" size={20} />,
                <LineChart key="l" size={20} />,
              ];
              return (
                <Reveal key={s.title}>
                  <article className="mkt-card">
                    <div className="mkt-card-icon">{icons[i]}</div>
                    <h3 className="mkt-serif mkt-card-title">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="mkt-text-muted" style={{ margin: 0 }}>
                      {s.detail}
                    </p>
                  </article>
                </Reveal>
              );
            })}
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
                  <h3 className="mkt-serif mkt-card-title">{plan.name}</h3>
                  <div className="mkt-price tabular">
                    {plan.priceLabel}
                    <span className="mkt-price-period"> {plan.period}</span>
                  </div>
                  <p className="mkt-plan-desc">{plan.description}</p>
                  <Link
                    href={plan.href}
                    className={`mkt-btn mkt-btn-block ${plan.highlighted ? 'mkt-btn-primary' : 'mkt-btn-outline-dark'}`}
                    style={{ marginTop: 12 }}
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
            <Link href="/faq" className="mkt-btn mkt-btn-outline-dark">
              Browse the full FAQ
            </Link>
          </p>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
