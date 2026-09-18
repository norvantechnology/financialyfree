import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, CtaSection, Reveal, FAQAccordion } from '../../../components/marketing/primitives';
import { FeaturesExplorer } from '../../../components/marketing/FeaturesExplorer';
import {
  Target,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Activity,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'Features: SIP Planning & Stock Research Tools | GoalCompass',
  description:
    'Explore GoalCompass: monthly SIP planner, paperless KYC, mutual fund investing, fair-value stock tools, screeners, and market mood - explained in plain English.',
  path: '/features',
});

const FEATURE_FAQS = [
  {
    question: 'I am a complete beginner. Which track should I start with?',
    answer:
      'Start with Track A. It is free and built for everyday investors. Enter a goal (retirement, education, emergency fund), see your monthly SIP, and invest without learning market jargon first.',
  },
  {
    question: 'Is Track A really free forever?',
    answer:
      'Yes. Goal planning, SIP calculators, paperless KYC, portfolio dashboard, and mutual fund order routing are free. You only pay if you upgrade to Track B for the full stock research suite.',
  },
  {
    question: 'How safe is my money when investing through GoalCompass?',
    answer:
      'Your money does not sit in a GoalCompass bank account. Mutual fund orders are routed to fund houses through BSE StAR MF exchange infrastructure, and investments are held in your name.',
  },
  {
    question: 'Can I use GoalCompass if I already have mutual funds on another app?',
    answer:
      'Yes. You can track existing funds in your GoalCompass dashboard to see your overall picture, returns, and rebalancing needs in one place.',
  },
  {
    question: 'What is included in the Track B trial?',
    answer:
      'You get access to the research tools: fair-value models, stock screeners, Market Mood Index, and related market data feeds - so you can try them before you pay.',
  },
];

export default function FeaturesPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Features', item: absoluteUrl('/features') },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FEATURE_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumbLd, faqLd]} />

      {/* ─── PAGE HERO ──────────────────────────────────────── */}
      <section className="mkt-section fp-hero-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Features' }]} />
          <Reveal>
            <div className="fp-hero-badge">
              <Sparkles size={15} style={{ color: 'var(--mkt-gold)' }} />
              <span>Complete Feature Overview</span>
            </div>
            <h1 className="mkt-serif fp-hero-title">
              Every tool you need to build wealth and research stocks
            </h1>
            <p className="fp-hero-subtitle">
              GoalCompass has two clear paths. <strong>Track A</strong> helps you plan monthly SIPs
              and invest in mutual funds. <strong>Track B</strong> helps you research Nifty stocks
              with tools explained in plain English.
            </p>

            {/* ─── TWO TRACKS HIGH-LEVEL SELECTOR ─── */}
            <div className="fp-tracks-overview">
              {/* Track A Card */}
              <div className="fp-track-summary-card fp-track-a-highlight">
                <div className="fp-track-card-header">
                  <div className="fp-track-card-icon fp-icon-green">
                    <Target size={24} />
                  </div>
                  <div>
                    <span className="fp-track-label">Track A · Free to start</span>
                    <h2 className="fp-track-heading">Wealth Planning &amp; Auto-SIPs</h2>
                  </div>
                </div>
                <p className="fp-track-description">
                  For everyday investors who want a clear monthly plan. Set a goal, see how much to
                  invest, finish KYC, and start your SIP - without stress.
                </p>
                <div className="fp-track-features-list">
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Goal &amp; SIP planner</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> 3-min paperless KYC</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> UPI Autopay / e-NACH</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Portfolio alerts</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Withdrawal planner</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Family goals</span>
                </div>
                <div className="fp-track-action-row">
                  <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary">
                    Start Planning Free
                    <ArrowRight size={15} />
                  </Link>
                  <a href="#feature-explorer" className="fp-jump-link">
                    Explore Track A Tools ↓
                  </a>
                </div>
              </div>

              {/* Track B Card */}
              <div className="fp-track-summary-card fp-track-b-highlight">
                <div className="fp-track-card-header">
                  <div className="fp-track-card-icon fp-icon-indigo">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span className="fp-track-label">Track B · Stock research</span>
                    <h2 className="fp-track-heading">Nifty Stock Research Suite</h2>
                  </div>
                </div>
                <p className="fp-track-description">
                  For DIY equity investors who want fair-value checks, market mood, and early
                  signals - not social media tips.
                </p>
                <div className="fp-track-features-list">
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Fair-value models</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Smart stock screeners</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Market Mood Index</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Nifty options (OI &amp; PCR)</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Insider &amp; promoter alerts</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Ownership trends</span>
                </div>
                <div className="fp-track-action-row">
                  <Link href="/pricing" className="mkt-btn mkt-btn-outline-dark">
                    Explore Research Plans
                    <ArrowRight size={15} />
                  </Link>
                  <a href="#feature-explorer" className="fp-jump-link">
                    Explore Track B Tools ↓
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── INTERACTIVE FEATURES EXPLORER ──────────────────── */}
      <section className="mkt-section mkt-section-alt" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="mkt-container">
          <Reveal>
            <div className="fp-section-title-wrap">
              <span className="mkt-kicker">Interactive Catalog</span>
              <h2 className="mkt-serif fp-section-title">
                Search and explore all 34 capabilities
              </h2>
              <p className="mkt-lead" style={{ maxWidth: 700, margin: '0 auto 1.5rem auto', textAlign: 'center' }}>
                Filter by category, search by keyword, or tap a quick prompt to see what each tool does
                in plain English.
              </p>
            </div>
          </Reveal>

          <FeaturesExplorer />
        </div>
      </section>

      {/* ─── SPOTLIGHT 1: MARKET MOOD INDEX (MMI) ───────────── */}
      <section className="mkt-section fp-spotlight-section">
        <div className="mkt-container">
          <Reveal>
            <div className="fp-mmi-spotlight-box">
              <div className="fp-mmi-spotlight-left">
                <div className="fp-hero-badge" style={{ marginBottom: '1rem', width: 'fit-content' }}>
                  <Activity size={14} style={{ color: 'var(--mkt-gold)' }} />
                  <span>Flagship Sentiment Tool</span>
                </div>
                <h2 className="mkt-serif fp-spotlight-title">
                  Check market mood before you buy or sell
                </h2>
                <p className="fp-spotlight-desc">
                  Many investors buy when everyone is excited and sell when everyone is scared. The
                  Market Mood Index turns that into a simple 0-100 score so you can stay disciplined.
                </p>
                <div className="fp-mmi-rules">
                  <div className="fp-mmi-rule-card">
                    <span className="fp-mmi-rule-tag" style={{ background: 'rgba(239,68,68,0.15)', color: '#b91c1c' }}>
                      Extreme Fear (0-30)
                    </span>
                    <p>Markets feel gloomy. Often a better time to keep SIPs going or buy carefully - not panic-sell.</p>
                  </div>
                  <div className="fp-mmi-rule-card">
                    <span className="fp-mmi-rule-tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#047857' }}>
                      Extreme Greed (70-100)
                    </span>
                    <p>Markets feel euphoric. A reminder to slow down, avoid FOMO tips, and stick to your plan.</p>
                  </div>
                </div>

                <div className="fp-mmi-signals-grid">
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Foreign &amp; domestic fund flows</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>India VIX (market fear gauge)</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>How many Nifty stocks are rising vs falling</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Long-term trend breadth</span>
                  </div>
                </div>
              </div>

              <div className="fp-mmi-spotlight-right">
                <div className="fp-gauge-card">
                  <div className="fp-gauge-label">Sample mood gauge</div>
                  <div className="fp-gauge-meter">
                    <div className="fp-gauge-arc">
                      <div className="fp-gauge-needle" />
                    </div>
                  </div>
                  <div className="fp-gauge-legend">
                    <span style={{ color: '#f87171' }}>Fear</span>
                    <span style={{ color: '#fbbf24' }}>Neutral</span>
                    <span style={{ color: '#34d399' }}>Greed</span>
                  </div>
                  <div className="fp-gauge-status">
                    <span className="fp-gauge-score">42</span>
                    <span className="fp-gauge-mood">Neutral Zone</span>
                  </div>
                  <p className="fp-gauge-hint">Illustrative only. Open the live tool for today&apos;s reading.</p>
                  <Link href="/techno-funda" className="mkt-btn mkt-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    Open Live MMI Tool →
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW TRACK A & B WORK TOGETHER ──────────────────── */}
      <section className="mkt-section mkt-section-alt">
        <div className="mkt-container">
          <Reveal>
            <div className="fp-section-title-wrap">
              <span className="mkt-kicker">The Complete Strategy</span>
              <h2 className="mkt-serif fp-section-title">
                Core &amp; satellite investing, made simple
              </h2>
              <p className="mkt-lead" style={{ maxWidth: 720, margin: '0 auto 2.5rem auto', textAlign: 'center' }}>
                Many advisors suggest a steady core portfolio plus a smaller high-conviction satellite.
                GoalCompass lets you run both in one place.
              </p>
            </div>

            <div className="fp-core-satellite-grid">
              {/* Core Side */}
              <div className="fp-cs-card fp-cs-core">
                <div className="fp-cs-badge">Core Portfolio (70%-80% of Savings)</div>
                <h3 className="mkt-serif fp-cs-title">Track A: Steady wealth foundation</h3>
                <p className="fp-cs-desc">
                  Automate diversified mutual fund SIPs that compound over years. You do not need to
                  watch daily price ticks.
                </p>
                <ul className="fp-cs-list">
                  <li><CheckCircle2 size={16} /> Retirement, education, and emergency goals</li>
                  <li><CheckCircle2 size={16} /> Monthly UPI Autopay / e-NACH</li>
                  <li><CheckCircle2 size={16} /> Alerts if your mix drifts too far</li>
                  <li><CheckCircle2 size={16} /> Free to start - no management fee from us</li>
                </ul>
              </div>

              {/* Satellite Side */}
              <div className="fp-cs-card fp-cs-satellite">
                <div className="fp-cs-badge">
                  Satellite Portfolio (20%-30% of Savings)
                </div>
                <h3 className="mkt-serif fp-cs-title">Track B: High-conviction stock research</h3>
                <p className="fp-cs-desc">
                  Research individual companies with clear fair-value tools, earnings and order
                  screeners, and market mood - built for DIY investors.
                </p>
                <ul className="fp-cs-list">
                  <li><CheckCircle2 size={16} /> Fair-value calculators you can understand</li>
                  <li><CheckCircle2 size={16} /> Earnings beat and big-order screeners</li>
                  <li><CheckCircle2 size={16} /> Market Mood Index (fear &amp; greed)</li>
                  <li><CheckCircle2 size={16} /> Exchange data first - not tip-group noise</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── BEGINNER FAQ SECTION ───────────────────────────── */}
      <section className="mkt-section">
        <div className="mkt-container" style={{ maxWidth: 840 }}>
          <Reveal>
            <div className="fp-section-title-wrap">
              <span className="mkt-kicker">Got Questions?</span>
              <h2 className="mkt-serif fp-section-title">
                Common questions from new visitors
              </h2>
              <p className="mkt-lead" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Everything you need to know before getting started.
              </p>
            </div>

            <FAQAccordion items={FEATURE_FAQS} idPrefix="features-faq" />
          </Reveal>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────── */}
      <CtaSection
        title="Ready to build your financial plan?"
        subtitle="Track A is 100% free forever. Start in under 2 minutes with no credit card required."
        primaryHref="/auth/register"
        primaryLabel="Get Started Free"
        secondaryHref="/pricing"
        secondaryLabel="View Research Plans"
      />
    </>
  );
}
