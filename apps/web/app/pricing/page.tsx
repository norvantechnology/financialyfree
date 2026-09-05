'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Award, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

export default function PricingPage() {
  const { t } = useTranslation();

  const plans = [
    {
      id: 'plan_starter',
      slug: 'free-starter',
      name: 'Free Goal Planner',
      badge: 'Free Forever',
      price: '₹0',
      period: '',
      description: 'Calculate your retirement, child education, or emergency fund goals with our AMFI-compliant goal engine.',
      features: [
        'Multi-Goal SIP & Horizon Calculators',
        'Inflation-Adjusted Target Projections',
        'Asset Allocation & Glide Path Visualizer',
        'Market Mood Index Overview',
        'Free Introductory Lessons',
      ],
      ctaText: 'Start Planning Free',
      ctaHref: '/dashboard/goals',
      isPopular: false,
    },
    {
      id: 'diy-masterclass',
      slug: 'diy-masterclass',
      name: 'DIY Masterclass',
      badge: 'Lifetime Access',
      price: '₹14,999',
      originalPrice: '₹24,999',
      period: 'one-time',
      description: 'Comprehensive Techno-Funda investing framework for independent investors seeking alpha.',
      features: [
        'Complete Techno-Funda Video Course',
        'High-Conviction Stock Checklist',
        'Chapter Quizzes & Graded Assignments',
        'Verified Course Completion Certificate',
        'Lifetime Investor Community & Q&A',
      ],
      ctaText: 'Enroll Lifetime',
      ctaHref: '/checkout/diy-masterclass',
      isPopular: false,
    },
    {
      id: 'all-access-bundle',
      slug: 'all-access-bundle',
      name: 'All-Access Flagship Bundle',
      badge: t.common.recommended,
      price: '₹24,999',
      originalPrice: '₹44,999',
      period: 'first year bundle',
      description: 'Our complete investor ecosystem: Lifetime Course + 1 Year Institutional Tools + 1 Year Live Webinars.',
      features: [
        'Everything in DIY Masterclass (Lifetime)',
        'Valuation Lab + DCF Arbitrage Tools (1 Year)',
        'Master Tracker + PEAD Results Screener (1 Year)',
        'Buyback & Demerger Arbitrage Desk (1 Year)',
        '52 Weekly Live Interactive Webinar Sessions (1 Year)',
        'Full Video Replay Vault with Notes',
        'Priority WhatsApp & Mentorship Channel',
      ],
      ctaText: 'Get Complete Access',
      ctaHref: '/checkout/all-access-bundle',
      isPopular: true,
    },
    {
      id: 'tools-webinars-annual',
      slug: 'tools-webinars-annual',
      name: 'Tools + Webinars Annual',
      badge: 'Active Traders',
      price: '₹9,999',
      originalPrice: '₹15,999',
      period: '/ year',
      description: 'Keep your market edge sharp with proprietary indicators, weekly market reviews, and live Q&A.',
      features: [
        'Valuation Lab & DCF Screener Access',
        'Master Tracker + PEAD Post-Earnings Signals',
        'Buyback Research & Results Calendar',
        '52 Weekly Live Interactive Webinars',
        'Webinar Archive & Recording Replays',
      ],
      ctaText: 'Subscribe Annual',
      ctaHref: '/checkout/tools-webinars-annual',
      isPopular: false,
    },
  ];

  return (
    <SidebarLayout activePath="/pricing">
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Commercial Entitlement Tiering"
          sourceNotes="Official fee schedule for educational curricula and research tools. Zero commissions on direct goal planning."
        />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)', marginTop: 'var(--space-2)' }}>
          <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} />
            <span>TRANSPARENT INSTITUTIONAL PRICING</span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginTop: '4px',
              marginBottom: 'var(--space-3)',
            }}
          >
            {t.pricing.title}
          </h1>
          <p
            style={{
              fontSize: 'clamp(var(--text-base), 2vw, var(--text-lg))',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Pricing Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
            alignItems: 'stretch',
            marginBottom: 'var(--space-12)',
          }}
        >
          {plans.map((p) => (
            <div
              key={p.slug}
              style={{
                background: 'var(--bg-surface)',
                border: p.isPopular ? '2px solid var(--color-accent)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: 'clamp(var(--space-5), 3vw, var(--space-8))',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: p.isPopular ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              }}
            >
              {p.isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-accent)',
                    color: '#FFFFFF',
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.badge}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h3 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.name}
                  </h3>
                  {!p.isPopular && (
                    <span className="badge-muted">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', minHeight: '44px', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
                  {p.description}
                </p>

                {/* Price Display */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      className="font-serif"
                      style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)' }}
                    >
                      {p.price}
                    </span>
                    {p.originalPrice && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                        {p.originalPrice}
                      </span>
                    )}
                    {p.period && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{p.period}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {p.price === '₹0' ? 'No payment details required' : t.common.gstExcluded}
                  </div>
                </div>

                {/* Features List */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)', marginBottom: 'var(--space-8)', flex: 1 }}>
                  <div className="category-tag" style={{ marginBottom: 'var(--space-3)' }}>
                    WHAT&apos;S INCLUDED:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {p.features.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-sm)' }}>
                        <Check size={16} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={p.ctaHref}
                className={p.isPopular ? 'btn btn-primary' : 'btn btn-outline'}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <span>{p.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Trust & Guarantee Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ padding: 'var(--space-2)' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-3)',
              }}
            >
              <Shield size={20} color="var(--color-accent)" />
            </div>
            <h4 className="font-serif" style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              AMFI Partner Code
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>ARN-350272 / FutureZenith Insights LLP</p>
          </div>

          <div style={{ padding: 'var(--space-2)' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-3)',
              }}
            >
              <Zap size={20} color="#D97706" />
            </div>
            <h4 className="font-serif" style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Instant Activation
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>Immediate course unlock & automated tax receipt</p>
          </div>

          <div style={{ padding: 'var(--space-2)' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-3)',
              }}
            >
              <Award size={20} color="#059669" />
            </div>
            <h4 className="font-serif" style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Certified Curriculum
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>Verifiable digital certificate upon module completion</p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
