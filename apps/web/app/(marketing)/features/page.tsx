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
} from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'Features: Wealth Track & Techno-Funda Research',
  description:
    'Explore Track A goal investing, KYC, BSE StAR MF execution, and Academy, alongside Track B with 20 research tools including Valuation Lab, Order Tracker, PEAD, and F&O.',
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
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Features' }]} />
          <Reveal>
            <span className="mkt-kicker">Features</span>
            <h1 className="mkt-serif mkt-page-title">
              Two tracks. One disciplined platform.
            </h1>
            <p className="mkt-lead">
              Track A covers goal planning through mutual fund execution. Track B is the Techno-Funda
              research suite for DIY investors.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mkt-section mkt-section-alt" id="track-a" aria-labelledby="fa">
        <div className="mkt-container">
          <h2 id="fa" className="mkt-serif">
            Track A: Wealth Planning
          </h2>
          <p className="mkt-lead">Goal planning, learning, KYC, and mutual fund execution.</p>
          <div className="mkt-grid-2">
            <FeatureCard icon={<Target size={22} />} title="Goal-based SIP engine" description="Emergency, FIRE/Retirement, Child Education, and Wealth Creation with inflation-aware monthly SIP calculations." />
            <FeatureCard icon={<ShieldCheck size={22} />} title="Paperless KYC" description="Digital onboarding before exchange-routed investments." />
            <FeatureCard icon={<Landmark size={22} />} title="BSE StAR MF execution" description="Lumpsum and SIP with e-NACH / UPI Autopay under our AMFI ARN." />
            <FeatureCard icon={<GraduationCap size={22} />} title="Academy LMS" description="Zero-to-Hero curriculum with lesson progress and quizzes." />
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/dashboard/goals" className="mkt-btn mkt-btn-primary">
              Open Goal Planner
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section" id="track-b" aria-labelledby="fb">
        <div className="mkt-container">
          <h2 id="fb" className="mkt-serif">
            Track B: Techno-Funda Research
          </h2>
          <p className="mkt-lead">Twenty institutional desks. Educational decision-support only.</p>
          <div className="mkt-grid-3">
            <FeatureCard icon={<Activity size={20} />} title="Market Mood Index" description="Composite sentiment telemetry." />
            <FeatureCard icon={<PieChart size={20} />} title="Valuation Lab (9 models)" description="DCF, Reverse DCF, Graham, Lynch, DDM, multiples & more." />
            <FeatureCard icon={<BarChart3 size={20} />} title="PEAD Screener" description="Post-earnings announcement drift radar." />
            <FeatureCard icon={<Newspaper size={20} />} title="Order Tracker" description="LODR order wins with PDF annexure values." />
            <FeatureCard icon={<LineChart size={20} />} title="Sector Heatmap & F&O" description="Rotation context, OI, PCR views." />
            <FeatureCard icon={<Rocket size={20} />} title="IPO, Insider, 52W & Deals" description="Primary markets, PIT disclosures, breakouts, bulk/block." />
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/techno-funda" className="mkt-btn mkt-btn-outline-dark">
              Launch Research Suite
            </Link>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
