import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, BookOpen, BarChart3, Radio, ArrowRight, Shield, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FinanciallyFree — Invest with Purpose, Learn to Grow',
  description:
    'Goal-based mutual fund investing, Zero to Hero investing course, and Techno-Funda research tools. AMFI-registered distributor ARN-350272.',
};

const GOAL_TILES = [
  {
    id: 'emergency_fund',
    emoji: '🛡️',
    title: 'Emergency Fund',
    titleHi: 'इमरजेंसी फंड',
    desc: '3–6 months of expenses, safe and liquid',
    color: 'var(--color-warning)',
    href: '/goals/new?type=emergency_fund',
  },
  {
    id: 'retirement',
    emoji: '🏡',
    title: 'Retirement',
    titleHi: 'रिटायरमेंट',
    desc: 'Retire at your number, on your timeline',
    color: 'var(--color-accent)',
    href: '/goals/new?type=retirement',
  },
  {
    id: 'child_education',
    emoji: '🎓',
    title: "Child's Education",
    titleHi: 'बच्चे की पढ़ाई',
    desc: 'Fund the best education without stress',
    color: 'var(--color-primary)',
    href: '/goals/new?type=child_education',
  },
  {
    id: 'wealth_creation',
    emoji: '📈',
    title: 'Wealth Creation',
    titleHi: 'वेल्थ क्रिएशन',
    desc: 'Grow your money beyond inflation',
    color: 'hsl(266, 70%, 60%)',
    href: '/goals/new?type=wealth_creation',
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Done With You',
    subtitle: 'Goal-Based SIP Investing',
    desc: 'Tell us your goal — retirement, education, emergency fund — and get a personalised SIP recommendation with full formula transparency. We are AMFI-registered distributor ARN-350272.',
    badge: 'Free',
    badgeColor: 'badge-accent',
  },
  {
    icon: BookOpen,
    title: 'Do It Yourself',
    subtitle: 'Zero to Hero Course',
    desc: '24+ hours of Techno-Funda investing content in Hinglish. Taught by Shubham Sethi. Learn fundamental + technical analysis, pick winning companies, and manage your own portfolio.',
    badge: '₹14,999',
    badgeColor: 'badge-primary',
  },
  {
    icon: BarChart3,
    title: 'Techno-Funda Tools',
    subtitle: 'Market Mood · Master Tracker · PEAD · Vahan',
    desc: 'Premium analytics tools: Bull/Bear market sentiment gauge, curated quality watchlist, post-earnings drift screen, and VAHAN vehicle-registration alternative data.',
    badge: '1-Year Access',
    badgeColor: 'badge-editorial',
  },
  {
    icon: Radio,
    title: 'Live Case Studies',
    subtitle: 'Weekly Zoom Sessions',
    desc: 'Join live weekly Zoom sessions where real companies and quarterly results are analysed together. Access recording replays anytime.',
    badge: 'Included',
    badgeColor: 'badge-accent',
  },
];

const STATS = [
  { value: '₹14,999', label: 'Course Price (₹75K listed)' },
  { value: '24+', label: 'Hours of Course Content' },
  { value: '1 Year', label: 'Tools & Webinar Access' },
  { value: 'ARN-350272', label: 'AMFI Registered Distributor' },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: '100dvh', overflowX: 'hidden' }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: 'hsl(222, 47%, 7%, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--bg-border)',
        padding: 'var(--space-4) 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white',
            }}>FF</div>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              FinanciallyFree
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-20) 0 var(--space-16)',
        background: `
          radial-gradient(ellipse 80% 60% at 50% -20%, hsl(221, 83%, 53%, 0.2), transparent),
          radial-gradient(ellipse 50% 40% at 80% 80%, hsl(158, 64%, 42%, 0.1), transparent)
        `,
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="badge badge-accent animate-fade-in" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
              <Shield size={12} />
              AMFI-Registered Distributor · ARN-350272
            </div>

            <h1 className="animate-slide-up" style={{ marginBottom: 'var(--space-5)', animationDelay: '0.1s' }}>
              Har Rupaye Ko{' '}
              <span className="gradient-text">Ek Maqsad Do</span>
            </h1>

            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto var(--space-8)',
              lineHeight: 1.7,
              animationDelay: '0.2s',
            }} className="animate-fade-in">
              Goal-based SIP investing for real people — Emergency Fund, Retirement, Child Education,
              Wealth Creation. Plus a Techno-Funda course and premium market tools.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register" className="btn btn-primary btn-lg animate-fade-in">
                Start Your First Goal
                <ArrowRight size={18} />
              </Link>
              <Link href="/auth/login" className="btn btn-outline btn-lg animate-fade-in" style={{ animationDelay: '0.15s' }}>
                Explore the Course
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-8) 0', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
            {STATS.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-light)' }}>{stat.value}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Goal Tiles ───────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2>Pick Your <span className="gradient-text">Goal</span></h2>
            <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)' }}>
              Answer 3 quick questions. Get your monthly SIP in under 2 minutes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            {GOAL_TILES.map((tile, i) => (
              <Link
                key={tile.id}
                href={tile.href}
                className="glass-card"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                  textDecoration: 'none', cursor: 'pointer',
                  animationDelay: `${i * 0.08}s`,
                  borderLeft: `3px solid ${tile.color}`,
                }}
              >
                <span style={{ fontSize: 32 }}>{tile.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tile.title}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{tile.titleHi}</div>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>{tile.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: tile.color, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  Calculate SIP <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-16) 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2>Everything You Need to <span className="gradient-text">Grow</span></h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card" style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  background: 'var(--color-primary-muted)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={22} color="var(--color-primary-light)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{f.title}</h3>
                    <span className={`badge ${f.badgeColor}`}>{f.badge}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{f.subtitle}</div>
                  <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust & Compliance ────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-12) 0', borderTop: '1px solid var(--bg-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center', textAlign: 'center' }}>
            <Award size={24} color="var(--text-muted)" />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', maxWidth: 640, lineHeight: 1.7 }}>
              Operated by <strong style={{ color: 'var(--text-secondary)' }}>FutureZenith Insights LLP</strong> · AMFI-registered Mutual Fund Distributor · ARN-350272 ·
              Mutual Fund investments are subject to market risk. Read all scheme-related documents carefully before investing.
              This platform provides education and goal-based distribution services; it does not provide personalised buy/sell recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-16) 0',
        background: `linear-gradient(135deg, hsl(221, 83%, 53%, 0.1), hsl(158, 64%, 42%, 0.08))`,
        textAlign: 'center',
      }}>
        <div className="container">
          <Users size={40} color="var(--color-primary-light)" style={{ margin: '0 auto var(--space-4)' }} />
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Ready to Start?</h2>
          <p style={{ marginBottom: 'var(--space-8)' }}>
            Create your free account. Pick a goal. Get your SIP in 2 minutes.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg animate-pulse-glow">
            Create Free Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
