import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, CtaSection, FeatureCard, Reveal } from '../../../components/marketing/primitives';
import {
  Target,
  ShieldCheck,
  Landmark,
  GraduationCap,
  BarChart3,
  LineChart,
  Newspaper,
  PieChart,
  Activity,
  Rocket,
  Search,
  Briefcase,
  Calculator,
  TrendingUp,
  Layers,
  Scale,
  FileText,
  Flame,
  Zap,
  Users,
  RefreshCw,
  ArrowRight,
  Coins,
  Building2,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'Features: Wealth Planning Engine & 20 Techno-Funda Desks',
  description:
    'Explore Track A goal-based mutual fund investing with paperless KYC and BSE StAR execution, alongside Track B featuring 20 institutional Techno-Funda research desks.',
  path: '/features',
});

export default function FeaturesPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Features', item: absoluteUrl('/features') },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />

      {/* Hero Section */}
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Features' }]} />
          <Reveal>
            <span className="mkt-kicker">Platform Architecture</span>
            <h1 className="mkt-serif mkt-page-title">
              Two Disciplined Tracks. Twenty-Five Integrated Tools.
            </h1>
            <p className="mkt-lead">
              FinanciallyFree bridges long-term mutual fund wealth creation with quantitative equity research.
              Track A powers disciplined goal investing with BSE StAR exchange execution, while Track B provides
              20 institutional-grade research desks for self-directed market intelligence.
            </p>

            {/* Quick Filter Navigation Pills */}
            <div className="mkt-feature-nav" aria-label="Feature categories">
              <a href="#track-a" className="mkt-feature-pill">
                <Target size={14} aria-hidden /> Track A: Wealth &amp; SIP
              </a>
              <a href="#valuation-desks" className="mkt-feature-pill">
                <PieChart size={14} aria-hidden /> Valuation Lab (9 Models)
              </a>
              <a href="#alpha-screeners" className="mkt-feature-pill">
                <Zap size={14} aria-hidden /> Screeners &amp; Order Tracker
              </a>
              <a href="#market-telemetry" className="mkt-feature-pill">
                <Activity size={14} aria-hidden /> Market Mood &amp; F&amp;O
              </a>
              <a href="#macro-primary" className="mkt-feature-pill">
                <Building2 size={14} aria-hidden /> Primary Markets &amp; Macro
              </a>
              <a href="#academy" className="mkt-feature-pill">
                <GraduationCap size={14} aria-hidden /> Investing Academy
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Track A: Wealth Planning & Mutual Fund Engine */}
      <section className="mkt-section mkt-section-alt" id="track-a" aria-labelledby="track-a-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track A · Wealth Management</span>
            <h2 id="track-a-heading" className="mkt-serif">
              Goal-Based Mutual Fund Engine with Exchange Routing
            </h2>
            <p className="mkt-lead">
              Designed for long-term compounders targeting financial independence, retirement, higher education,
              and generational wealth creation.
            </p>
          </Reveal>

          <div className="mkt-grid-3">
            <FeatureCard
              icon={<Target size={22} />}
              badge="Core Engine"
              title="Multi-Goal SIP Planner"
              description="Model four distinct life horizons: Emergency Cushion (6 to 12 months), Retirement / FIRE, Child Higher Education, and Long-Term Wealth. Computes inflation-adjusted monthly SIP requirements and annual step-up paths."
              tags={['Inflation-Aware', 'Step-Up SIP', 'FIRE Countdown', 'Shortfall Alerts']}
            />
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              badge="100% Digital"
              title="Paperless Digital KYC"
              description="Complete online onboarding via Aadhaar e-KYC and PAN verification compliant with SEBI and AMFI guidelines. Get investment-ready in under 3 minutes without physical documents or courier visits."
              tags={['SEBI Compliant', 'AMFI ARN-350272', 'Aadhaar e-KYC', 'Instant Verification']}
            />
            <FeatureCard
              icon={<Landmark size={22} />}
              badge="Exchange Execution"
              title="BSE StAR MF Order Routing"
              description="Lumpsum purchases and automated monthly SIP mandates routed directly through BSE StAR MF exchange infrastructure. Funds settle straight between your bank account and AMC custodian accounts."
              tags={['BSE StAR Architecture', 'e-NACH Mandates', 'UPI Autopay', 'Direct AMC Settlement']}
            />
            <FeatureCard
              icon={<RefreshCw size={22} />}
              badge="Risk Control"
              title="Portfolio Telemetry &amp; Rebalancing"
              description="Consolidated portfolio view across equity, debt, hybrid, and index funds. Live asset allocation drift alerts signal when equity market rallies tilt your risk exposure beyond your target threshold."
              tags={['Asset Allocation', 'Drift Monitoring', 'Rebalance Signals', 'Tax Context']}
            />
            <FeatureCard
              icon={<Users size={22} />}
              badge="Family Office"
              title="Household &amp; Family Goal Buckets"
              description="Group family goals under a unified household dashboard while preserving individual investor records and PAN-segregated tax tracking."
              tags={['Household Grouping', 'Goal Segregation', 'Multi-Horizon View']}
            />
            <FeatureCard
              icon={<Coins size={22} />}
              badge="Cashflow Design"
              title="Systematic STP &amp; SWP Execution"
              description="Automate Systematic Transfer Plans (STP) for phased equity allocation and Systematic Withdrawal Plans (SWP) for predictable monthly retirement cashflow streams."
              tags={['SWP Retirement Paycheck', 'STP Phased Staging', 'Capital Preservation']}
            />
          </div>

          <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary">
              Open Goal Planner
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/kyc" className="mkt-btn mkt-btn-outline-dark">
              Start Paperless KYC
            </Link>
          </div>
        </div>
      </section>

      {/* Track B: Valuation Lab & Quantitative Desks */}
      <section className="mkt-section" id="valuation-desks" aria-labelledby="valuation-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track B · Fundamental Analysis</span>
            <h2 id="valuation-heading" className="mkt-serif">
              Valuation Lab: Nine Quantitative Models
            </h2>
            <p className="mkt-lead">
              Avoid narrative hype and social media tips. Value companies quantitatively using audited historical
              financials, cash flow normalization, and peer benchmarking.
            </p>
          </Reveal>

          <div className="mkt-grid-3">
            <FeatureCard
              icon={<Calculator size={22} />}
              badge="Cash Flow Model"
              title="Discounted Cash Flow (DCF)"
              description="Two-stage and three-stage Free Cash Flow to Firm (FCFF) modeling. Dynamic WACC calculator, terminal growth bounds, and a multi-dimensional sensitivity matrix across discount rates."
              tags={['FCFF / FCFE', 'Sensitivity Matrix', 'Dynamic WACC', 'Terminal Multiples']}
            />
            <FeatureCard
              icon={<Scale size={22} />}
              badge="Expectations Investing"
              title="Reverse DCF Lab"
              description="Reverse-engineers the cash flow growth rate implied by the current market price. Identify whether the market is pricing in realistic earnings growth or unattainable expectations."
              tags={['Implied Growth CAGR', 'Expectations Pricing', 'Margin of Safety']}
            />
            <FeatureCard
              icon={<Briefcase size={22} />}
              badge="Value Investing"
              title="Benjamin Graham Formula"
              description="The classic intrinsic value formula adjusted for prevailing AAA corporate bond yields, past 3-year normalized earnings, and long-term expected GDP growth."
              tags={['Deep Value', 'Bond Yield Adjustment', 'Normalized EPS', 'Graham Number']}
            />
            <FeatureCard
              icon={<TrendingUp size={22} />}
              badge="GARP Framework"
              title="Peter Lynch Fair Value"
              description="Growth-At-A-Reasonable-Price (GARP) valuation. Plots historical PEG ratios, median historical P/E lines, and earnings growth trajectories across market cycles."
              tags={['GARP Analysis', 'PEG Ratio', 'Historical P/E Bands', 'Earnings Line']}
            />
            <FeatureCard
              icon={<Coins size={22} />}
              badge="Income Assets"
              title="Dividend Discount Model (DDM)"
              description="Gordon Growth Model tailored for mature companies, utilities, and high-dividend yield stocks. Models terminal dividend yields and payout stability."
              tags={['Gordon Growth', 'Payout Sustainability', 'High Yield Valuation']}
            />
            <FeatureCard
              icon={<Layers size={22} />}
              badge="Peer Multiples"
              title="EV/EBITDA &amp; Relative Valuation"
              description="Enterprise value multiples, Price-to-Book (P/B), and Price-to-Sales (P/S) compared against sector peers, 5-year historical medians, and return on capital (ROCE/ROE)."
              tags={['EV/EBITDA', 'Sector Medians', 'ROCE / ROE Context', 'Peer Quartiles']}
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <Link href="/techno-funda" className="mkt-btn mkt-btn-outline-dark">
              Launch Valuation Lab
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Track B: Alpha Screeners & Corporate Disclosures */}
      <section className="mkt-section mkt-section-alt" id="alpha-screeners" aria-labelledby="screeners-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track B · Automated Signals</span>
            <h2 id="screeners-heading" className="mkt-serif">
              Automated Screeners &amp; Filing Detectors
            </h2>
            <p className="mkt-lead">
              Stay ahead of market shifts. Our institutional screeners parse quarterly earnings beats, contract wins,
              and volume surges in real time.
            </p>
          </Reveal>

          <div className="mkt-grid-3">
            <FeatureCard
              icon={<BarChart3 size={22} />}
              badge="Earnings Momentum"
              title="PEAD Screener"
              description="Post-Earnings Announcement Drift radar. Identifies companies delivering quarterly revenue and EBITDA beats that trigger persistent institutional price drift over subsequent weeks."
              tags={['Quarterly Surprise', 'EBITDA Beats', 'Price Reaction', 'Drift Tracking']}
            />
            <FeatureCard
              icon={<Newspaper size={22} />}
              badge="SEBI Filings"
              title="LODR Order Tracker"
              description="Captures material contract wins, corporate orders, and government tenders filed under SEBI LODR regulations. Automatically extracts order values in ₹ Crore directly from exchange PDFs."
              tags={['Order Wins', '₹ Crore Extraction', 'LODR Disclosures', 'Market Cap Ratio']}
            />
            <FeatureCard
              icon={<Zap size={22} />}
              badge="Price Momentum"
              title="52-Week Breakout Radar"
              description="Real-time scanner filtering stocks breaking out to fresh 52-week highs or breaking multi-month bases with 2x to 5x average volume expansion."
              tags={['Fresh 52W Highs', 'Volume Multiplier', 'Base Breakouts', 'All-Time Highs']}
            />
            <FeatureCard
              icon={<Flame size={22} />}
              badge="Smart Money"
              title="Delivery Momentum Screener"
              description="Filters for stocks experiencing sustained delivery percentage surges above 60% alongside expanding traded value, signalling institutional accumulation rather than speculative intraday churn."
              tags={['Delivery % Surge', 'Institutional Accumulation', 'Cash Turnover']}
            />
            <FeatureCard
              icon={<Activity size={22} />}
              badge="Liquidity Watch"
              title="Circuit &amp; Freeze Scanner"
              description="Monitors stocks locked in upper and lower price bands, order book depth imbalances, pending buyer queues, and volatility cooling periods."
              tags={['Upper Circuit Alerts', 'Buy Queue Spreads', 'Freeze Bands']}
            />
            <FeatureCard
              icon={<Sparkles size={22} />}
              badge="Special Situations"
              title="Buybacks &amp; Arbitrage Radar"
              description="Tracks tender-offer buybacks, retail category entitlement ratios, record dates, and potential arbitrage spreads across corporate actions."
              tags={['Tender Buybacks', 'Acceptance Ratios', 'Arbitrage Spreads', 'Record Dates']}
            />
          </div>
        </div>
      </section>

      {/* Track B: Market Telemetry & Derivatives Intelligence */}
      <section className="mkt-section mkt-section-dark" id="market-telemetry" aria-labelledby="telemetry-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track B · Quantitative Telemetry</span>
            <h2 id="telemetry-heading" className="mkt-serif">
              Market Mood, Sector Rotation &amp; F&amp;O Analytics
            </h2>
            <p className="mkt-lead">
              Track institutional money flow, derivative positioning, and sector leadership across the Indian market.
            </p>
          </Reveal>

          <div className="mkt-grid-3">
            <FeatureCard
              icon={<Activity size={22} />}
              badge="Macro Sentiment"
              title="Market Mood Index (MMI)"
              description="A six-factor composite sentiment barometer tracking FII/DII net flows, market advance-decline breadth, India VIX volatility, 52-week price strength, and 200-day moving average positioning."
              tags={['Extreme Fear / Greed', 'FII / DII Flow', 'India VIX', 'Market Breadth']}
            />
            <FeatureCard
              icon={<LineChart size={22} />}
              badge="Sector Strength"
              title="Sector Rotation Heatmap"
              description="Relative strength comparison of all 14 NSE sectoral indices against the benchmark Nifty 50. Identifies early capital rotation into emerging sectors before broad index rallies."
              tags={['14 NSE Sectors', 'Relative Strength', 'Leading vs Lagging', 'Rotation Waves']}
            />
            <FeatureCard
              icon={<FileText size={22} />}
              badge="Derivatives"
              title="F&amp;O Open Interest &amp; PCR"
              description="Detailed derivatives telemetry: strikes with open interest buildups, Put-Call Ratio (PCR) changes, max pain calculation, and monthly expiry roll-over percentages."
              tags={['Open Interest (OI)', 'Put-Call Ratio (PCR)', 'Max Pain Strike', 'Roll-Over %']}
            />
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              badge="Regulatory Filings"
              title="Insider Trading &amp; PIT Tracker"
              description="SEBI Prohibition of Insider Trading (PIT) disclosures: promoter open market purchases, executive share sales, and promoter pledge creation or revocation alerts."
              tags={['Promoter Purchases', 'Pledge Revocations', 'SEBI PIT Filings', 'ESOP Activity']}
            />
            <FeatureCard
              icon={<Rocket size={22} />}
              badge="Institutional Prints"
              title="Bulk &amp; Block Deals Radar"
              description="Large-value transaction alerts on NSE and BSE. Identifies institutional crosses, foreign institutional participation, and domestic mutual fund allocations above 0.5% equity."
              tags={['Institutional Crosses', 'Block Window Prints', 'HNI Allocations']}
            />
            <FeatureCard
              icon={<Coins size={22} />}
              badge="Calendar"
              title="Corporate Actions &amp; Dividends"
              description="Centralized calendar tracking upcoming dividend ex-dates, bonus share distributions, stock splits, rights issues, and board meeting agendas."
              tags={['Ex-Dividend Dates', 'Bonus / Splits', 'Board Meetings', 'AGM Agendas']}
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <Link href="/techno-funda" className="mkt-btn mkt-btn-primary">
              Explore Research Suite
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Track B: Primary Markets & Macro Signals */}
      <section className="mkt-section" id="macro-primary" aria-labelledby="macro-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Track B · Alternative Data &amp; Macro</span>
            <h2 id="macro-heading" className="mkt-serif">
              Primary Markets, Shareholding &amp; Macro Signals
            </h2>
            <p className="mkt-lead">
              Gain an analytical edge with non-traditional datasets including vehicle registrations, banking credit,
              and ownership shifts across 2,200+ listed equities.
            </p>
          </Reveal>

          <div className="mkt-grid-4">
            <FeatureCard
              icon={<Users size={20} />}
              badge="Ownership"
              title="Shareholding Pattern Radar"
              description="Eight quarters of historical ownership shifts across Foreign Institutional Investors (FIIs), Domestic Mutual Funds, and Promoters across 2,200+ NSE companies."
              tags={['FII Accumulation', 'MF Holding Changes', 'Promoter Stakes']}
            />
            <FeatureCard
              icon={<Rocket size={20} />}
              badge="Primary Market"
              title="IPO Radar &amp; GMP Tracker"
              description="Mainboard and SME IPO telemetry: real-time subscription multiples across QIB, NII, and Retail buckets, Grey Market Premium context, and anchor investor books."
              tags={['Subscription Multiples', 'Anchor Book List', 'Grey Market Context']}
            />
            <FeatureCard
              icon={<TrendingUp size={20} />}
              badge="Ground Reality"
              title="Vahan Auto Registrations"
              description="Monthly vehicle registration numbers directly from the Ministry of Road Transport. Monitor real-world 2W, passenger car, and commercial vehicle deliveries before quarterly sales results."
              tags={['MoRTH Vahan Data', 'OEM Volume Trends', 'Leading Auto Indicator']}
            />
            <FeatureCard
              icon={<Building2 size={20} />}
              badge="Credit Pulse"
              title="Bank &amp; NBFC Credit Growth"
              description="Fortnightly systemic banking credit and deposit growth data from RBI. Monitor credit-to-deposit ratios, net interest margin trends, and banking sector liquidity."
              tags={['RBI Credit Growth', 'Deposit Ratios', 'Systemic Liquidity']}
            />
          </div>
        </div>
      </section>

      {/* Academy & Education LMS */}
      <section className="mkt-section mkt-section-alt" id="academy" aria-labelledby="academy-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Education · Investor Literacy</span>
            <h2 id="academy-heading" className="mkt-serif">
              Investing Academy: Zero-to-Hero Curriculum
            </h2>
            <p className="mkt-lead">
              Structured, no-jargon courses designed to transform beginners into confident, self-directed investors.
            </p>
          </Reveal>

          <div className="mkt-grid-3">
            <FeatureCard
              icon={<GraduationCap size={22} />}
              badge="Beginner Level"
              title="Foundations of Disciplined Wealth"
              description="Master inflation mathematics, risk vs return tradeoffs, asset allocation frameworks, and the exponential power of uninterrupted compounding over 10 to 25 year horizons."
              tags={['Compounding Math', 'Asset Allocation', 'Inflation Realities']}
            />
            <FeatureCard
              icon={<Search size={22} />}
              badge="Intermediate Level"
              title="Mutual Fund Selection Framework"
              description="Learn how to evaluate rolling return consistency, downside standard deviation, Sharpe ratios, fund manager track records, and total expense ratio impacts."
              tags={['Rolling Returns', 'Sharpe & Sortino', 'Portfolio Turnover', 'Direct vs Regular']}
            />
            <FeatureCard
              icon={<BarChart3 size={22} />}
              badge="Advanced Level"
              title="Techno-Funda Practical Application"
              description="Step-by-step case studies on reading annual reports, understanding cash flow statements, running DCF models, and interpreting earnings announcement drift."
              tags={['Annual Reports', 'Cash Flow Quality', 'DCF Case Studies', 'PEAD Execution']}
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <Link href="/courses" className="mkt-btn mkt-btn-outline-dark">
              Browse Academy Courses
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Synergy: How Track A & Track B Work Together */}
      <section className="mkt-section" aria-labelledby="synergy-heading">
        <div className="mkt-container">
          <Reveal>
            <span className="mkt-kicker">Portfolio Strategy</span>
            <h2 id="synergy-heading" className="mkt-serif">
              How Track A and Track B Work Together
            </h2>
            <p className="mkt-lead">
              The core-and-satellite methodology: compound long-term wealth reliably while reserving satellite capital for
              disciplined research ideas.
            </p>
          </Reveal>

          <div className="mkt-grid-2">
            <article className="mkt-card" style={{ borderLeft: '4px solid var(--mkt-gold)' }}>
              <div className="mkt-card-badge">Track A · Core Compounder (70% - 80%)</div>
              <h3 className="mkt-serif mkt-card-title">Disciplined Mutual Fund SIPs</h3>
              <p className="mkt-text-muted" style={{ lineHeight: 1.6 }}>
                Allocate the core of your monthly surplus to diversified, inflation-protected mutual funds.
                Automatic UPI Autopay and e-NACH mandates ensure you never miss market compounding, while goal
                countdown timers keep you aligned with retirement and education targets.
              </p>
              <div className="mkt-feature-tags">
                <span className="mkt-feature-tag">BSE StAR MF</span>
                <span className="mkt-feature-tag">Automatic Rebalancing</span>
                <span className="mkt-feature-tag">Zero Emotion</span>
              </div>
            </article>

            <article className="mkt-card" style={{ borderLeft: '4px solid var(--mkt-teal)' }}>
              <div className="mkt-card-badge">Track B · Satellite Alpha (20% - 30%)</div>
              <h3 className="mkt-serif mkt-card-title">Techno-Funda Quantitative Research</h3>
              <p className="mkt-text-muted" style={{ lineHeight: 1.6 }}>
                For experienced investors seeking individual stock ideas, use our 20 quantitative research desks to
                filter earnings momentum (PEAD), track institutional orders (LODR), and calculate intrinsic value ranges
                before deploying satellite capital.
              </p>
              <div className="mkt-feature-tags">
                <span className="mkt-feature-tag">Valuation Lab</span>
                <span className="mkt-feature-tag">PEAD Screener</span>
                <span className="mkt-feature-tag">Decision Support</span>
              </div>
            </article>
          </div>

          <div style={{ marginTop: 20 }}>
            <p className="mkt-text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
              * Important Disclosure: AMFI-registered mutual fund distributor (ARN-350272). Track B research tools provide
              quantitative data and educational decision-support only. FinanciallyFree does not provide stock recommendations,
              portfolio management services, or guaranteed returns.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <CtaSection
        title="Experience disciplined investing in action"
        subtitle="Start with a free goal plan on Track A, then explore our 20 Techno-Funda research desks on Track B."
        primaryHref="/dashboard/goals"
        primaryLabel="Start Free Goal Plan"
        secondaryHref="/techno-funda"
        secondaryLabel="Explore Research Suite"
      />
    </>
  );
}
