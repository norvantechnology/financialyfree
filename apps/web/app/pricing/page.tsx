'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Award, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';

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
      description: 'Calculate your retirement, child education, or dream home goals with our AMFI-compliant goal engine.',
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
        'Market Mood Index Pro & Reversal Alerts (1 Year)',
        'Master Tracker + PEAD Results Screener (1 Year)',
        'Vahan Vehicle Registration Real-Time Ingestion (1 Year)',
        '52 Weekly Live Interactive Webinar Sessions (1 Year)',
        'Full Video Replay Vault with Timestamps & Notes',
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
        'Market Mood Index Pro & Technical Overlays',
        'Master Tracker + PEAD Post-Earnings Signals',
        'Vahan Auto Ingestion & Sector Trends',
        '52 Weekly Live Interactive Webinars',
        'Webinar Archive & Recording Replays',
      ],
      ctaText: 'Subscribe Annual',
      ctaHref: '/checkout/tools-webinars-annual',
      isPopular: false,
    },
  ];

  return (
    <div style={{ padding: 'var(--space-12) var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 16px',
            color: 'var(--color-primary-400)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
          }}
        >
          <Sparkles size={14} />
          <span>Invest With Confidence</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-4)',
          }}
        >
          {t.pricing.title}
        </h1>
        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto',
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
        }}
      >
        {plans.map((p) => {
          return (
            <div
              key={p.slug}
              style={{
                background: p.isPopular ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(255, 255, 255, 0.02)',
                border: p.isPopular ? '2px solid var(--color-primary-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-8)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: p.isPopular ? '0 12px 36px rgba(14, 165, 233, 0.2)' : 'none',
              }}
            >
              {p.isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {p.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{p.name}</h3>
                  {!p.isPopular && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', minHeight: '44px', marginBottom: 'var(--space-6)' }}>
                  {p.description}
                </p>

                {/* Price Display */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>{p.price}</span>
                    {p.originalPrice && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {p.originalPrice}
                      </span>
                    )}
                    {p.period && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{p.period}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {p.price === '₹0' ? 'No credit card required' : t.common.gstExcluded}
                  </div>
                </div>

                {/* Features List */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                    What's included:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {p.features.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-sm)' }}>
                        <Check size={16} color="var(--color-primary-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={p.ctaHref}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: p.isPopular
                    ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{p.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div
        style={{
          marginTop: 'var(--space-16)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        <div>
          <Shield size={28} color="var(--color-primary-400)" style={{ margin: '0 auto var(--space-3)' }} />
          <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>AMFI Partner Code</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>ARN-350272 / FutureZenith Insights LLP</p>
        </div>
        <div>
          <Zap size={28} color="var(--color-warning-400)" style={{ margin: '0 auto var(--space-3)' }} />
          <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Instant Activation</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Immediate course unlock & automated Razorpay receipt</p>
        </div>
        <div>
          <Award size={28} color="var(--color-success-400)" style={{ margin: '0 auto var(--space-3)' }} />
          <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Certified Curriculum</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Verifiable digital certificate upon module completion</p>
        </div>
      </div>
    </div>
  );
}
