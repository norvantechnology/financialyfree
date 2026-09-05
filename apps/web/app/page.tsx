'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BookOpen,
  BarChart3,
  Radio,
  ArrowRight,
  Shield,
  Award,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { SidebarLayout } from '../components/sidebar-layout';
import { StaticSnapshotBanner } from '../components/static-snapshot-banner';

const GOAL_TILES = [
  {
    id: 'emergency_fund',
    icon: ShieldCheck,
    title: 'Emergency Fund',
    titleHi: 'इमरजेंसी फंड',
    desc: '3–6 months of living expenses, fully safe and liquid.',
    color: '#0F766E',
    href: '/dashboard/goals?type=emergency_fund',
  },
  {
    id: 'retirement',
    icon: Briefcase,
    title: 'Retirement (FIRE)',
    titleHi: 'रिटायरमेंट',
    desc: 'Retire at your financial independence number on your timeline.',
    color: '#0F172A',
    href: '/dashboard/goals?type=retirement',
  },
  {
    id: 'child_education',
    icon: GraduationCap,
    title: "Child's Higher Education",
    titleHi: 'बच्चे की पढ़ाई',
    desc: 'Fund premier higher education without taking on crippling debt.',
    color: '#0F766E',
    href: '/dashboard/goals?type=child_education',
  },
  {
    id: 'wealth_creation',
    icon: Layers,
    title: 'Long-Term Wealth Creation',
    titleHi: 'वेल्थ क्रिएशन',
    desc: 'Compound capital above inflation across diversified equity indices.',
    color: '#0F172A',
    href: '/dashboard/goals?type=wealth_creation',
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Done With You',
    subtitle: 'Goal-Based SIP Investing',
    desc: 'Personalized SIP recommendations with complete mathematical formula transparency, glide paths, and BSE StAR MF automated execution.',
    badge: 'Free',
  },
  {
    icon: BookOpen,
    title: 'Do It Yourself',
    subtitle: 'Zero to Hero Masterclass',
    desc: '24+ hours of structured Techno-Funda investing modules. Screening moats, stage analysis, and institutional post-earnings drift (PEAD).',
    badge: '₹14,999',
  },
  {
    icon: BarChart3,
    title: 'Techno-Funda Research Room',
    subtitle: 'Valuation Lab · Buybacks · Results · Shareholding',
    desc: 'Institutional analytics suite: DCF Valuation Lab, tender offer buyback arbitrage, quarterly earnings surprises, and bulk delivery trackers.',
    badge: '1-Year Access',
  },
  {
    icon: Radio,
    title: 'Live Case Studies',
    subtitle: 'Weekly Zoom Workshops',
    desc: 'Live masterclasses breaking down real-time market setups with CMT & CFA charterholders. Includes full video replays and slide decks.',
    badge: 'Included',
  },
];

const STATS = [
  { value: '₹14,999', label: 'Course Price (₹75K listed)' },
  { value: '24+', label: 'Hours of Curriculum Video' },
  { value: '1 Year', label: 'Research Room Access' },
  { value: 'ARN-350272', label: 'AMFI Registered Distributor' },
];

export default function HomePage() {
  return (
    <SidebarLayout activePath="/">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Research & Wealth Platform"
          sourceNotes="Market intelligence, goal planning algorithms, and LMS educational content operated under AMFI ARN-350272."
        />

        {/* Hero Section */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-8), 5vw, var(--space-12))',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div
            className="category-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Shield size={14} />
            <span>AMFI-REGISTERED DISTRIBUTOR · ARN-350272</span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              maxWidth: '800px',
              margin: '0 auto var(--space-4)',
            }}
          >
            Har Rupaye Ko Ek Maqsad Do
          </h1>

          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              maxWidth: '620px',
              margin: '0 auto var(--space-8)',
              lineHeight: 1.6,
            }}
          >
            Goal-based mutual fund investing engineered for disciplined wealth accumulation — Emergency Fund, Retirement, Child Education, and Wealth Creation. Combined with institutional Techno-Funda research tools.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/goals"
              className="btn btn-primary"
              style={{ textDecoration: 'none', padding: '12px 24px' }}
            >
              <span>Launch Goal Planner</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/techno-funda"
              className="btn btn-outline"
              style={{ textDecoration: 'none', padding: '12px 24px' }}
            >
              <span>Explore Research Room</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="font-serif"
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Goal Tiles Grid */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="category-tag">SYSTEMATIC CAPITAL ALLOCATION</div>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '4px 0',
              }}
            >
              Pick Your Goal & Simulate Your Horizon
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Answer 3 quick financial parameters. Calculate required monthly SIP in under 2 minutes.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {GOAL_TILES.map((tile) => (
              <Link
                key={tile.id}
                href={tile.href}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderTop: `4px solid ${tile.color}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-sm)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface-raised, #F4F1EA)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tile.color,
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <tile.icon size={20} />
                  </div>
                  <h3
                    className="font-serif"
                    style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}
                  >
                    {tile.title}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {tile.titleHi}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-4)' }}>
                    {tile.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: tile.color,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                  }}
                >
                  <span>Calculate SIP</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Pillars */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="category-tag">ECOSYSTEM ARCHITECTURE</div>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '4px 0',
              }}
            >
              Everything You Need to Compound Capital
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface-raised)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <f.icon size={20} />
                    </div>
                    <span className="badge-muted" style={{ fontWeight: 600 }}>
                      {f.badge}
                    </span>
                  </div>

                  <h3
                    className="font-serif"
                    style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}
                  >
                    {f.title}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                    {f.subtitle}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Statutory Compliance */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Award size={28} color="#D97706" style={{ margin: '0 auto var(--space-3)' }} />
          <div className="category-tag">STATUTORY REGULATORY DISCLOSURE</div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: 'var(--space-2) auto 0',
              lineHeight: 1.7,
            }}
          >
            Operated by <strong style={{ color: 'var(--text-primary)' }}>FutureZenith Insights LLP</strong> · AMFI-registered Mutual Fund Distributor · ARN-350272. Mutual Fund investments are subject to market risks, read all scheme-related documents carefully.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
