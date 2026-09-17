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
  title: 'Features: All Wealth Planning & Stock Research Tools | GoalCompass',
  description:
    'Explore GoalCompass features: Goal-based SIP planner, paperless e-KYC, BSE StAR MF automation, 9 valuation models (DCF, Graham, PEG), 6 smart stock screeners, and market mood sentiment.',
  path: '/features',
});

const FEATURE_FAQS = [
  {
    question: 'I am a complete beginner. Which track should I start with?',
    answer:
      'Start with Track A! It is 100% free and designed specifically for everyday investors. You simply enter a goal (like Retirement or Child Education), and our system calculates your exact monthly SIP. There is zero finance jargon to learn.',
  },
  {
    question: 'Is Track A really 100% free forever?',
    answer:
      'Yes! Goal planning, SIP calculators, paperless KYC, portfolio dashboard, and mutual fund order execution are completely free. You only pay if you decide to upgrade to Track B for advanced stock valuation models and institutional screeners.',
  },
  {
    question: 'How safe is my money when investing through GoalCompass?',
    answer:
      'Your money never touches GoalCompass bank accounts. All transactions are routed directly to Asset Management Companies (AMCs) through BSE StAR MF, India’s premier exchange infrastructure. Your investments are held securely in your own name.',
  },
  {
    question: 'Can I use GoalCompass if I already have mutual funds on another app?',
    answer:
      'Yes! You can link your existing mutual funds in your GoalCompass dashboard to track your complete net worth, calculate live XIRR, and get rebalancing alerts all in one place.',
  },
  {
    question: 'What is included in the 7-day free trial for Track B?',
    answer:
      'You get unrestricted access to all 20 research tools: the 9-model Valuation Lab, all 6 Smart Screeners (PEAD earnings surprises, Order wins, Breakouts), the live Market Mood Index, and alternative data feeds — no commitments required.',
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
              Every tool you need to build wealth &amp; pick winning stocks
            </h1>
            <p className="fp-hero-subtitle">
              GoalCompass organizes 34 powerful capabilities into two clear paths. Use{' '}
              <strong>Track A</strong> for automated mutual fund wealth planning, or unlock{' '}
              <strong>Track B</strong> for institutional-style stock research. Explore each tool in plain English below.
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
                    <span className="fp-track-label">Track A · 100% Free Forever</span>
                    <h2 className="fp-track-heading">Wealth Planning &amp; Auto-SIPs</h2>
                  </div>
                </div>
                <p className="fp-track-description">
                  Built for everyday investors who want disciplined compounding without stress. Set life goals, calculate inflation-adjusted monthly SIPs, and automate everything.
                </p>
                <div className="fp-track-features-list">
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Goal &amp; FIRE Planner</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> 3-Min Paperless KYC</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> UPI Autopay / e-NACH</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Portfolio Drift Alerts</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> SWP Pension Planner</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Family Wealth Hub</span>
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
                    <span className="fp-track-label">Track B · Research Desk</span>
                    <h2 className="fp-track-heading">Techno-Funda Stock Suite</h2>
                  </div>
                </div>
                <p className="fp-track-description">
                  Built for active equity investors who want raw data, fair-value models, and early institutional signals — instead of risky social media tips.
                </p>
                <div className="fp-track-features-list">
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> 9 Valuation Models (DCF, PEG)</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> 6 Smart Stock Screeners</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Live Market Mood Index</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> F&amp;O Open Interest &amp; PCR</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> Insider Trading Feed</span>
                  <span className="fp-pill-chip"><CheckCircle2 size={13} /> 8-Qtr Ownership Radar</span>
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
                Filter by category, search by keyword, or tap any quick prompt to see exactly what each tool does and how it helps you grow your wealth.
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
                  Stop emotional trading with the Market Mood Index
                </h2>
                <p className="fp-spotlight-desc">
                  Most retail investors buy at the peak when euphoria is highest, and sell at the bottom out of panic. The Market Mood Index turns this human bias on its head.
                </p>
                <div className="fp-mmi-rules">
                  <div className="fp-mmi-rule-card">
                    <span className="fp-mmi-rule-tag" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      Extreme Fear (0–30)
                    </span>
                    <p>Good quality stocks are trading at discount prices. The highest-probability time to accumulate more.</p>
                  </div>
                  <div className="fp-mmi-rule-card">
                    <span className="fp-mmi-rule-tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                      Extreme Greed (70–100)
                    </span>
                    <p>Valuations are stretched and euphoric. A signal to be cautious, review stop-losses, and avoid FOMO buying.</p>
                  </div>
                </div>

                <div className="fp-mmi-signals-grid">
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>FII &amp; DII Institutional Daily Flows</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>India VIX Volatility Index</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>Nifty 50 Advance-Decline Breadth</span>
                  </div>
                  <div className="fp-mmi-signal-item">
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    <span>200-Day Moving Average Breadth</span>
                  </div>
                </div>
              </div>

              <div className="fp-mmi-spotlight-right">
                <div className="fp-gauge-card">
                  <div className="fp-gauge-label">Live Market Sentiment Gauge</div>
                  <div className="fp-gauge-meter">
                    <div className="fp-gauge-arc">
                      <div className="fp-gauge-needle" />
                    </div>
                  </div>
                  <div className="fp-gauge-legend">
                    <span style={{ color: '#ef4444' }}>Fear</span>
                    <span style={{ color: '#f59e0b' }}>Neutral</span>
                    <span style={{ color: '#10b981' }}>Greed</span>
                  </div>
                  <div className="fp-gauge-status">
                    <span className="fp-gauge-score">42</span>
                    <span className="fp-gauge-mood">Neutral Zone</span>
                  </div>
                  <p className="fp-gauge-hint">Market is balanced. Good time for disciplined SIPs.</p>
                  <Link href="/techno-funda" className="mkt-btn mkt-btn-outline-dark" style={{ width: '100%', marginTop: '1rem' }}>
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
                Core &amp; Satellite Investing Made Effortless
              </h2>
              <p className="mkt-lead" style={{ maxWidth: 720, margin: '0 auto 2.5rem auto', textAlign: 'center' }}>
                Top wealth managers recommend dividing your portfolio into a stable core and a high-conviction satellite. GoalCompass lets you run both under one roof.
              </p>
            </div>

            <div className="fp-core-satellite-grid">
              {/* Core Side */}
              <div className="fp-cs-card fp-cs-core">
                <div className="fp-cs-badge">Core Portfolio (70%–80% of Savings)</div>
                <h3 className="mkt-serif fp-cs-title">Track A: Automated Wealth Foundation</h3>
                <p className="fp-cs-desc">
                  Set up automated, diversified equity &amp; debt mutual fund SIPs that compound steadily over 5 to 25 years. You never need to watch daily price tickers.
                </p>
                <ul className="fp-cs-list">
                  <li><CheckCircle2 size={16} /> Retirement, Child College, and Emergency Goals</li>
                  <li><CheckCircle2 size={16} /> Automated monthly UPI Autopay / e-NACH</li>
                  <li><CheckCircle2 size={16} /> Asset allocation drift alerts</li>
                  <li><CheckCircle2 size={16} /> 100% Free with zero management fees</li>
                </ul>
              </div>

              {/* Satellite Side */}
              <div className="fp-cs-card fp-cs-satellite">
                <div className="fp-cs-badge" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                  Satellite Portfolio (20%–30% of Savings)
                </div>
                <h3 className="mkt-serif fp-cs-title">Track B: High-Conviction Stock Research</h3>
                <p className="fp-cs-desc">
                  Pick individual winning companies using our 20 research desks. Evaluate fair value with 9 valuation models, catch breakout volume, and track institutional whale buys.
                </p>
                <ul className="fp-cs-list">
                  <li><CheckCircle2 size={16} /> DCF, Graham, and Peter Lynch fair value calculators</li>
                  <li><CheckCircle2 size={16} /> PEAD earnings beat and corporate contract screeners</li>
                  <li><CheckCircle2 size={16} /> Market Mood Index fear &amp; greed indicators</li>
                  <li><CheckCircle2 size={16} /> Zero social media noise — 100% raw exchange data</li>
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
