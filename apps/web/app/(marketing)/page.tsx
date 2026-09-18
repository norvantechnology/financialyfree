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
  Star,
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
  title: 'Goal-Based Mutual Funds & Techno-Funda Research',
  description:
    'Plan SIPs for FIRE, education, and wealth creation. 20 Techno-Funda research tools for self-directed investors.',
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

const TRUST_LOGOS = [
  { name: 'BSE StAR MF', abbr: 'BSE' },
  { name: 'NSE', abbr: 'NSE' },
  { name: 'SEBI Compliant', abbr: 'SEBI' },
  { name: 'Aadhaar eKYC', abbr: 'KYC' },
  { name: '256-bit SSL', abbr: 'SSL' },
];

const FEATURES_LIST = [
  { icon: <Target size={18} />, text: 'Goal-based SIP planner' },
  { icon: <ShieldCheck size={18} />, text: 'Paperless digital KYC' },
  { icon: <Landmark size={18} />, text: 'BSE StAR MF execution' },
  { icon: <BarChart3 size={18} />, text: '20 research tools' },
  { icon: <GraduationCap size={18} />, text: 'Investing academy' },
  { icon: <Activity size={18} />, text: 'Live market data' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Target size={28} />,
    title: 'Set your goal',
    desc: 'Pick from Emergency Fund, Retirement/FIRE, Child Education, or Wealth Creation. Enter your target amount and timeline.',
    color: '#f59e0b',
  },
  {
    step: '02',
    icon: <BookOpen size={28} />,
    title: 'Learn & plan',
    desc: 'Use our Academy courses and SIP calculator to understand exactly how much to invest every month to reach your goal.',
    color: '#10b981',
  },
  {
    step: '03',
    icon: <BarChart3 size={28} />,
    title: 'Research smarter',
    desc: 'Explore 20 Techno-Funda tools - valuation models, market sentiment, order flows, F&O data - all in one place.',
    color: '#6366f1',
  },
  {
    step: '04',
    icon: <Landmark size={28} />,
    title: 'Invest with confidence',
    desc: 'Complete paperless KYC and start your SIP. Orders route directly through BSE StAR MF exchange infrastructure.',
    color: '#0f766e',
  },
];

const TESTIMONIALS = [
  {
    name: 'Arjun M.',
    role: 'Software Engineer, Bengaluru',
    text: 'Finally a platform that explains investing simply. The goal planner showed me exactly how much I need to save for my child\'s education. Love the Techno-Funda tools too.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    role: 'Doctor, Mumbai',
    text: 'The FIRE calculator was an eye-opener. I now have a clear monthly SIP target for early retirement. The academy courses helped me understand MFs from scratch.',
    rating: 5,
  },
  {
    name: 'Rahul K.',
    role: 'Business Owner, Delhi',
    text: 'The Valuation Lab with 9 models is incredible for stock research. Using it alongside the goal dashboard gives a complete investing picture.',
    rating: 5,
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
                Goal-based Investing &middot; Techno-Funda Research
              </div>

              <h1 className="mkt-serif hp-h1">
                Invest with{' '}
                <span className="hp-gradient-text">purpose.</span>
                <br />
                Research with{' '}
                <span className="hp-gradient-text">discipline.</span>
              </h1>

              <p className="mkt-hero-sub">
                GoalCompass gives you a <strong>goal-based SIP planner</strong> for wealth,
                FIRE &amp; education - plus <strong>20 institutional research tools</strong> to
                make smarter investment decisions. Free to start.
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
                    <div className="hp-preview-goal-label">FIRE Goal · 2035</div>
                    <div className="hp-preview-goal-value">₹2.4 Cr</div>
                    <div className="hp-preview-progress-bar">
                      <div className="hp-preview-progress-fill" style={{ width: '42%' }} />
                    </div>
                    <div className="hp-preview-goal-meta">₹12,500 / month SIP · 42% funded</div>
                  </div>
                  <div className="hp-preview-stats-row">
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">Market Mood</div>
                      <div className="hp-preview-stat-val" style={{ color: '#10b981' }}>Greed</div>
                    </div>
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">Nifty PE</div>
                      <div className="hp-preview-stat-val">21.4x</div>
                    </div>
                    <div className="hp-preview-stat">
                      <div className="hp-preview-stat-label">Portfolio</div>
                      <div className="hp-preview-stat-val" style={{ color: '#10b981' }}>+14.2%</div>
                    </div>
                  </div>
                  <div className="hp-preview-tools">
                    <div className="hp-preview-tool-label">Research Tools</div>
                    <div className="hp-preview-tool-chips">
                      {['Valuation Lab', 'F&O OI', 'Order Tracker', 'PEAD'].map((t) => (
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
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mkt-lead">
              Built for Indian self-directed investors who want clarity, tools, and execution in one place.
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
                <div className="detail">Techno-Funda suite: MMI, Valuation Lab, F&amp;O, PEAD &amp; more</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><PieChart size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={9} suffix="" />
                </div>
                <div className="label">Valuation Models</div>
                <div className="detail">DCF, Reverse DCF, Graham, Lynch, DDM &amp; more</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><Target size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={4} suffix="" />
                </div>
                <div className="label">Goal Horizons</div>
                <div className="detail">Emergency, Retirement/FIRE, Education, Wealth Creation</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="mkt-stat mkt-card hp-stat-card">
                <div className="hp-stat-icon"><Globe size={24} /></div>
                <div className="num tabular">
                  <AnimatedCounter value={2200} suffix="+" />
                </div>
                <div className="label">Companies Tracked</div>
                <div className="detail">NSE shareholding &amp; equities universe coverage</div>
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
                  Tell GoalCompass your goal. We calculate exactly how much to invest monthly,
                  handle paperless KYC, and execute your SIP directly on exchange. No confusion,
                  no paperwork.
                </p>
                <ul className="hp-check-list">
                  <li><CheckCircle2 size={18} /><span>Set goals: Emergency Fund, FIRE, Education, Wealth</span></li>
                  <li><CheckCircle2 size={18} /><span>Inflation-aware SIP calculations with corpus projections</span></li>
                  <li><CheckCircle2 size={18} /><span>Paperless Aadhaar e-KYC - live in under 3 minutes</span></li>
                  <li><CheckCircle2 size={18} /><span>SIP &amp; lumpsum orders via BSE StAR MF</span></li>
                  <li><CheckCircle2 size={18} /><span>e-NACH / UPI Autopay mandate support</span></li>
                  <li><CheckCircle2 size={18} /><span>Academy courses alongside live tools</span></li>
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
                  title="Four wealth horizons"
                  description="Emergency Fund, Retirement/FIRE, Child Education, and Wealth Creation with inflation-aware SIP math."
                />
                <FeatureCard
                  icon={<ShieldCheck size={22} />}
                  badge="KYC"
                  title="Paperless onboarding"
                  description="Complete KYC digitally via Aadhaar e-KYC &amp; PAN in under 3 minutes. No physical documents."
                />
                <FeatureCard
                  icon={<Landmark size={22} />}
                  badge="Execution"
                  title="Exchange-routed SIPs"
                  description="Lumpsum and SIP orders with e-NACH / UPI Autopay mandate. Funds settle directly with AMC."
                />
                <FeatureCard
                  icon={<GraduationCap size={22} />}
                  badge="Academy"
                  title="Zero-to-Hero courses"
                  description="Structured curriculum from mutual fund basics to advanced strategy, alongside live tools."
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
                <span className="mkt-kicker">Track B · Techno-Funda Research</span>
                <h2 id="track-b-heading" className="mkt-serif">
                  20 institutional tools. One workspace.
                </h2>
                <p className="mkt-lead">
                  Stop juggling 10 different websites. Everything a serious DIY investor needs -
                  valuation models, market sentiment, corporate filings, F&amp;O data, sector analysis -
                  is in one clean dashboard.
                </p>
                <div className="hp-research-grid">
                  {[
                    { icon: <Activity size={16} />, label: 'Market Mood Index', sub: 'Sentiment gauge' },
                    { icon: <LineChart size={16} />, label: 'Valuation Lab', sub: '9 models' },
                    { icon: <Search size={16} />, label: 'PEAD Screener', sub: 'Post-earnings drift' },
                    { icon: <Layers size={16} />, label: 'Order Tracker', sub: 'SEBI filings' },
                    { icon: <BarChart3 size={16} />, label: 'F&O Analytics', sub: 'OI &amp; PCR' },
                    { icon: <TrendingUp size={16} />, label: 'Sector Heatmap', sub: 'Rotation view' },
                    { icon: <Zap size={16} />, label: 'Bulk &amp; Block Deals', sub: 'Institutional flow' },
                    { icon: <PieChart size={16} />, label: 'IPO Tracker', sub: 'GMP &amp; timeline' },
                  ].map((tool) => (
                    <div key={tool.label} className="hp-research-item">
                      <span className="hp-research-icon">{tool.icon}</span>
                      <div>
                        <div className="hp-research-name">{tool.label}</div>
                        <div className="hp-research-sub" dangerouslySetInnerHTML={{ __html: tool.sub }} />
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
                  <div className="hp-step-number" style={{ color: step.color, borderColor: step.color + '30', background: step.color + '10' }}>
                    {step.step}
                  </div>
                  <div className="hp-step-icon" style={{ color: step.color, background: step.color + '15' }}>
                    {step.icon}
                  </div>
                  <h3 className="hp-step-title">{step.title}</h3>
                  <p className="hp-step-desc">{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hp-step-arrow" aria-hidden><ChevronRight size={20} /></div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="mkt-section mkt-section-dark" aria-labelledby="testimonials-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Investor stories</span>
            <h2 id="testimonials-heading" className="mkt-serif">
              What investors are saying
            </h2>
            <p className="mkt-lead">
              Real feedback from Indian investors using GoalCompass to build wealth and research smarter.
            </p>
          </Reveal>
          <div className="mkt-grid-3 hp-testimonials">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.name}>
                <article className="hp-testimonial-card">
                  <div className="hp-testimonial-stars">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <blockquote className="hp-testimonial-text">&ldquo;{t.text}&rdquo;</blockquote>
                  <footer className="hp-testimonial-author">
                    <div className="hp-testimonial-avatar">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="hp-testimonial-name">{t.name}</div>
                      <div className="hp-testimonial-role">{t.role}</div>
                    </div>
                  </footer>
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
