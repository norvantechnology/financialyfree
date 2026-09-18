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
  TrendingUp,
  Zap,
  CheckCircle2,
  Globe,
  ChevronRight,
  PieChart,
  Activity,
  Layers,
  Search,
} from 'lucide-react';
import { buildPageMetadata } from '../../lib/marketing/seo';
import {
  HOME_FAQS,
  PLANS,
  SITE,
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
  title: 'Goal-Based SIPs & Stock Research for Indian Investors',
  description:
    'Plan monthly SIPs for retirement, education, and wealth. Research Nifty stocks with clear tools - valuation, market mood, and more. Free to start.',
  path: '/',
});

const TRACK_B_PREVIEWS = [
  {
    id: 'mmi',
    title: 'Market Mood Index',
    body: 'A simple fear-to-greed score so you know when markets feel hot or cold.',
  },
  {
    id: 'valuation',
    title: 'Valuation Lab',
    body: 'Check if a stock looks cheap or expensive with clear fair-value models.',
  },
  {
    id: 'orders',
    title: 'Order Tracker',
    body: 'See big company contract wins pulled from official exchange filings.',
  },
  {
    id: 'fno',
    title: 'F&O OI & PCR',
    body: 'Track Nifty options activity - open interest and put-call ratio - live.',
  },
];

const TRUST_LOGOS = [
  { name: 'BSE StAR MF', abbr: 'BSE' },
  { name: 'NSE', abbr: 'NSE' },
  { name: 'SEBI Compliant', abbr: 'SEBI' },
  { name: 'Aadhaar eKYC', abbr: 'KYC' },
  { name: '256-bit SSL', abbr: 'SSL' },
];

const FEATURES_LIST = [
  { icon: <Target size={18} />, text: 'Monthly SIP planner' },
  { icon: <ShieldCheck size={18} />, text: 'Paperless KYC' },
  { icon: <Landmark size={18} />, text: 'Exchange-routed SIPs' },
  { icon: <BarChart3 size={18} />, text: 'Stock research tools' },
  { icon: <GraduationCap size={18} />, text: 'Beginner academy' },
  { icon: <Activity size={18} />, text: 'Live market data' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Target size={20} />,
    title: 'Set your goal',
    desc: 'Choose what you are saving for - emergency fund, retirement, child education, or long-term wealth - and set a target amount and year.',
    color: '#f59e0b',
  },
  {
    step: '02',
    icon: <BookOpen size={20} />,
    title: 'See your monthly SIP',
    desc: 'We show exactly how much to invest each month, based on your timeline and expected returns. No spreadsheet needed.',
    color: '#10b981',
  },
  {
    step: '03',
    icon: <BarChart3 size={20} />,
    title: 'Research stocks clearly',
    desc: 'Use simple tools to check if a stock looks fairly priced, how the market mood feels, and what big investors are doing.',
    color: '#6366f1',
  },
  {
    step: '04',
    icon: <Landmark size={20} />,
    title: 'Start investing',
    desc: 'Complete quick digital KYC and start your SIP. Orders go through exchange infrastructure - not a random tip group.',
    color: '#0f766e',
  },
];

const WHO_ITS_FOR = [
  {
    icon: <Target size={22} />,
    title: 'First-time SIP investors',
    text: 'Know exactly how much to invest each month for retirement, education, or an emergency fund - without a spreadsheet.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'DIY stock pickers',
    text: 'Check if a Nifty stock looks expensive, see market mood, and track big deals - before you buy on a tip.',
  },
  {
    icon: <GraduationCap size={22} />,
    title: 'Busy professionals',
    text: 'Paperless KYC, exchange-routed SIPs, and beginner courses so you can invest with a plan - not guesswork.',
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

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="mkt-hero hp-hero">
        <div className="mkt-container">
          {/* Floating orbs - pure CSS, no JS */}
          <div className="hp-orb hp-orb-1" aria-hidden />
          <div className="hp-orb hp-orb-2" aria-hidden />
          <div className="hp-orb hp-orb-3" aria-hidden />

          <div className="hp-hero-inner">
            <div className="hp-hero-text">
              <div className="mkt-badge hp-badge-animate">
                <ShieldCheck size={15} aria-hidden />
                Mutual fund SIPs &amp; Nifty stock research
              </div>

              <h1 className="hp-h1">
                Invest with{' '}
                <span className="hp-gradient-text">purpose.</span>
                <br />
                Research with{' '}
                <span className="hp-gradient-text">clarity.</span>
              </h1>

              <p className="mkt-hero-sub">
                GoalCompass helps everyday Indian investors plan <strong>monthly SIPs</strong> for
                retirement, education, and wealth - and research Nifty stocks with tools you can
                actually understand. Free to start. No credit card.
              </p>

              {/* Feature pills */}
              <div className="hp-feature-pills">
                {FEATURES_LIST.map((f) => (
                  <span key={f.text} className="hp-pill">
                    {f.icon}
                    {f.text}
                  </span>
                ))}
              </div>

              <div className="mkt-hero-ctas hp-ctas">
                <Link href="/auth/register" className="mkt-btn mkt-btn-primary hp-cta-main">
                  Start Free - No Credit Card
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/techno-funda" className="mkt-btn mkt-btn-ghost">
                  Explore Research Tools
                </Link>
              </div>

              <div className="hp-social-proof">
                <div className="hp-avatars" aria-hidden>
                  {['A', 'R', 'P', 'S', 'M'].map((l, i) => (
                    <div key={i} className="hp-avatar" style={{ background: ['#10b981', '#6366f1', '#f59e0b', '#0f766e', '#ef4444'][i] }}>
                      {l}
                    </div>
                  ))}
                </div>
                <span className="hp-social-text">
                  <strong>2,200+</strong> companies tracked &middot; Used by DIY investors across India
                </span>
              </div>
            </div>

            {/* Hero Dashboard Preview Card */}
            <div className="hp-dashboard-preview" aria-hidden>
              <div className="hp-preview-card">
                <div className="hp-preview-header">
                  <span className="hp-preview-dot" style={{ background: '#ef4444' }} />
                  <span className="hp-preview-dot" style={{ background: '#f59e0b' }} />
                  <span className="hp-preview-dot" style={{ background: '#10b981' }} />
                  <span className="hp-preview-title">GoalCompass Dashboard</span>
                </div>
                <div className="hp-preview-body">
                  <div className="hp-preview-goal">
                    <div className="hp-preview-goal-label">Sample goal · Retirement</div>
                    <div className="hp-preview-goal-value">Your target</div>
                    <div className="hp-preview-progress-bar">
                      <div className="hp-preview-progress-fill" style={{ width: '42%' }} />
                    </div>
                    <div className="hp-preview-goal-meta">Monthly SIP plan · track progress over time</div>
                  </div>
                  <div className="hp-preview-stats-row">
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">Market Mood</div>
                      <div className="hp-preview-stat-val" style={{ color: '#10b981' }}>Live</div>
                    </div>
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">Nifty tools</div>
                      <div className="hp-preview-stat-val">Ready</div>
                    </div>
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">SIP plan</div>
                      <div className="hp-preview-stat-val" style={{ color: '#10b981' }}>On track</div>
                    </div>
                  </div>
                  <div className="hp-preview-tools">
                    <div className="hp-preview-tool-label">Research Tools</div>
                    <div className="hp-preview-tool-chips">
                      {['Fair value check', 'Nifty options', 'Big orders', 'Market mood'].map((t) => (
                        <span key={t} className="hp-preview-chip">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <IndicesRibbon />
        </div>
      </section>

      {/* ─── TRUST STRIP ───────────────────────────────────────── */}
      <section className="hp-trust-strip mkt-section-alt">
        <div className="mkt-container">
          <p className="hp-trust-label">Integrated with &amp; compliant to</p>
          <div className="hp-trust-logos">
            {TRUST_LOGOS.map((t) => (
              <div key={t.name} className="hp-trust-logo" title={t.name}>
                <span className="hp-trust-abbr">{t.abbr}</span>
                <span className="hp-trust-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────── */}
      <section className="mkt-section" aria-labelledby="stats-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Platform at a glance</span>
            <h2 id="stats-heading" className="mkt-serif" style={{ marginBottom: '0.5rem' }}>
              Everything you need to invest with confidence
            </h2>
            <p className="mkt-lead">
              Built for Indian investors who want a clear SIP plan and honest stock research - without
              tip groups or jargon walls.
            </p>
          </Reveal>
          <div className="mkt-grid-4 hp-stats-grid">
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><BarChart3 size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={20} suffix="" />
                </div>
                <div className="label">Research Tools</div>
                <div className="detail">Market mood, fair-value checks, Nifty options, screeners &amp; more</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><PieChart size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={9} suffix="" />
                </div>
                <div className="label">Valuation Models</div>
                <div className="detail">Simple fair-value views so you can ask: is this stock expensive?</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><Target size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={4} suffix="" />
                </div>
                <div className="label">Goal Types</div>
                <div className="detail">Emergency fund, retirement, education, and long-term wealth</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><Globe size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={2200} suffix="+" />
                </div>
                <div className="label">Companies Tracked</div>
                <div className="detail">Live NSE-linked coverage for Indian listed companies</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TRACK A - WEALTH PLANNING ─────────────────────────── */}
      <section className="mkt-section mkt-section-dark" aria-labelledby="track-a-heading">
        <div className="mkt-container">
          <div className="hp-two-col">
            <div className="hp-two-col-text">
              <Reveal>
                <span className="mkt-kicker">Track A · Wealth Planning</span>
                <h2 id="track-a-heading" className="mkt-serif">
                  From dream to SIP in minutes - not months
                </h2>
                <p className="mkt-lead">
                  Tell us what you are saving for. We show your monthly SIP amount, help you finish
                  digital KYC, and start your SIP through exchange infrastructure. Clear steps - no
                  paperwork pile.
                </p>
                <ul className="hp-check-list">
                  <li><CheckCircle2 size={18} /><span>Goals: emergency fund, retirement, education, wealth</span></li>
                  <li><CheckCircle2 size={18} /><span>Monthly SIP amount that factors in inflation</span></li>
                  <li><CheckCircle2 size={18} /><span>Paperless Aadhaar KYC - usually under 3 minutes</span></li>
                  <li><CheckCircle2 size={18} /><span>SIP and one-time orders via BSE StAR MF</span></li>
                  <li><CheckCircle2 size={18} /><span>UPI Autopay or e-NACH for monthly investing</span></li>
                  <li><CheckCircle2 size={18} /><span>Beginner courses next to the live tools</span></li>
                </ul>
                <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary" style={{ marginTop: '1rem' }}>
                  Start Your Goal Plan
                  <ArrowRight size={16} />
                </Link>
              </Reveal>
            </div>
            <div className="hp-two-col-cards">
              <div className="mkt-grid-2" style={{ gap: '1rem' }}>
                <FeatureCard
                  icon={<Target size={22} />}
                  badge="Goals"
                  title="Four clear goals"
                  description="Emergency fund, retirement, child education, and long-term wealth - with a monthly SIP for each."
                />
                <FeatureCard
                  icon={<ShieldCheck size={22} />}
                  badge="KYC"
                  title="Paperless onboarding"
                  description="Finish KYC with Aadhaar and PAN on your phone. No branch visit, no paper forms."
                />
                <FeatureCard
                  icon={<Landmark size={22} />}
                  badge="Execution"
                  title="Exchange-routed SIPs"
                  description="Start SIPs or one-time investments. Orders go through BSE StAR MF to the fund house."
                />
                <FeatureCard
                  icon={<GraduationCap size={22} />}
                  badge="Academy"
                  title="Learn as you invest"
                  description="Short courses from mutual fund basics to stock research - right beside the tools."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SIP CALCULATOR ────────────────────────────────────── */}
      <section className="mkt-section mkt-section-alt" aria-labelledby="calc-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Try it free - no sign-up needed</span>
            <h2 id="calc-heading" className="mkt-serif">
              How much should you invest monthly?
            </h2>
            <p className="mkt-lead">
              Enter your goal, timeline, and expected return. The calculator shows your exact
              monthly SIP and the final corpus - instantly. Save your plan after signing up free.
            </p>
          </Reveal>
          <Reveal>
            <SipCalculatorPreview />
          </Reveal>
        </div>
      </section>

      {/* ─── TRACK B - RESEARCH ────────────────────────────────── */}
      <section className="mkt-section mkt-section-alt" aria-labelledby="track-b-heading">
        <div className="mkt-container">
          <div className="hp-two-col hp-two-col-reverse">
            <div className="hp-two-col-text">
              <Reveal>
                <span className="mkt-kicker">Track B · Stock Research</span>
                <h2 id="track-b-heading" className="mkt-serif">
                  One workspace for serious stock research
                </h2>
                <p className="mkt-lead">
                  Stop jumping between 10 websites. Check fair value, market mood, big deals, and
                  Nifty options data in one clean dashboard - built for DIY investors, not tip sellers.
                </p>
                <div className="hp-research-grid">
                  {[
                    { icon: <Activity size={16} />, label: 'Market Mood', sub: 'Fear vs greed' },
                    { icon: <LineChart size={16} />, label: 'Valuation Lab', sub: 'Is it cheap?' },
                    { icon: <Search size={16} />, label: 'Earnings Screener', sub: 'After results' },
                    { icon: <Layers size={16} />, label: 'Order Tracker', sub: 'Big contracts' },
                    { icon: <BarChart3 size={16} />, label: 'Nifty Options', sub: 'OI & PCR' },
                    { icon: <TrendingUp size={16} />, label: 'Sector Heatmap', sub: 'Where money flows' },
                    { icon: <Zap size={16} />, label: 'Bulk & Block Deals', sub: 'Institutional flow' },
                    { icon: <PieChart size={16} />, label: 'IPO Tracker', sub: 'Upcoming listings' },
                  ].map((tool) => (
                    <div key={tool.label} className="hp-research-item">
                      <span className="hp-research-icon">{tool.icon}</span>
                      <div>
                        <div className="hp-research-name">{tool.label}</div>
                        <div className="hp-research-sub">{tool.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/techno-funda" className="mkt-btn mkt-btn-outline-dark" style={{ marginTop: '1.25rem' }}>
                  Explore All 20 Tools
                  <ArrowRight size={16} />
                </Link>
              </Reveal>
            </div>
            <div className="hp-two-col-tabs">
              <TrackBTabsClient items={TRACK_B_PREVIEWS} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="mkt-section" aria-labelledby="how-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">How it works</span>
            <h2 id="how-heading" className="mkt-serif">
              From zero to investing - in 4 simple steps
            </h2>
            <p className="mkt-lead">
              No jargon. No overwhelming choices. A clear path from setting your goal to your first
              SIP investment.
            </p>
          </Reveal>
          <div className="hp-steps">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.step}>
                <div className="hp-step">
                  <div className="hp-step-visual">
                    <div className="hp-step-number" style={{ color: step.color, background: step.color + '18' }}>
                      {step.step}
                    </div>
                    <div className="hp-step-icon" style={{ color: step.color, background: step.color + '18' }}>
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="hp-step-title">{step.title}</h3>
                  <p className="hp-step-desc">{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hp-step-arrow" aria-hidden><ChevronRight size={18} /></div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ──────────────────────────────────────── */}
      <section className="mkt-section mkt-section-dark" aria-labelledby="audience-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Built for you</span>
            <h2 id="audience-heading" className="mkt-serif">
              Who GoalCompass is for
            </h2>
            <p className="mkt-lead">
              Whether you are starting your first SIP or researching Nifty stocks yourself - clear
              tools, not tip groups.
            </p>
          </Reveal>
          <div className="mkt-grid-3 hp-testimonials">
            {WHO_ITS_FOR.map((item) => (
              <Reveal key={item.title}>
                <article className="hp-testimonial-card">
                  <div className="hp-audience-icon" aria-hidden>
                    {item.icon}
                  </div>
                  <h3 className="hp-testimonial-name" style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
                  <p className="hp-testimonial-text" style={{ fontStyle: 'normal' }}>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────── */}
      <section className="mkt-section mkt-section-alt" aria-labelledby="pricing-preview">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Simple pricing</span>
            <h2 id="pricing-preview" className="mkt-serif">
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p className="mkt-lead">
              The Starter plan is free forever. Unlock the full research suite and Academy with annual plans.
              No hidden charges, no surprises.
            </p>
          </Reveal>
          <div className="mkt-grid-4 hp-plans">
            {PLANS.map((plan) => (
              <Reveal key={plan.id}>
                <article className={`mkt-card mkt-plan hp-plan-card ${plan.highlighted ? 'popular' : ''}`}>
                  {plan.highlighted ? <span className="mkt-plan-badge">Most Popular</span> : null}
                  <h3 className="mkt-serif mkt-card-title">{plan.name}</h3>
                  <div className="mkt-price tabular">
                    {plan.priceLabel}
                    <span className="mkt-price-period"> {plan.period}</span>
                  </div>
                  <p className="mkt-plan-desc">{plan.description}</p>
                  <ul className="hp-plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <CheckCircle2 size={14} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mkt-btn mkt-btn-block ${plan.highlighted ? 'mkt-btn-primary' : 'mkt-btn-outline-dark'}`}
                    style={{ marginTop: 'auto' }}
                  >
                    {plan.cta}
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/pricing" className="mkt-btn mkt-btn-outline-dark">
              View full feature comparison
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────── */}
      <section className="mkt-section" aria-labelledby="home-faq">
        <div className="mkt-container" style={{ maxWidth: '820px' }}>
          <Reveal>
            <span className="mkt-kicker">FAQ</span>
            <h2 id="home-faq" className="mkt-serif">Questions we get asked a lot</h2>
            <p className="mkt-lead">
              No jargon. Straight answers about how GoalCompass works, what&apos;s free, and how your
              money is handled.
            </p>
          </Reveal>
          <FAQAccordion items={HOME_FAQS} idPrefix="home-faq" />
          <p style={{ marginTop: '1.25rem' }}>
            <Link href="/faq" className="mkt-btn mkt-btn-outline-dark">
              Browse all frequently asked questions
              <ArrowRight size={16} />
            </Link>
          </p>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
