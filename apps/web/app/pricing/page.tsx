'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Zap, Award, Shield, ArrowRight, ShieldCheck, X, Sparkles } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';
import { SidebarLayout } from '../../components/sidebar-layout';
import { isAllAccessFreeMode, fetchAppAccessMode } from '../../lib/auth-client';

const FEATURE_MAP: Record<
  string,
  { name: string; description: string; targetPlanIds: string[] }
> = {
  valuation: {
    name: 'Valuation Lab & DCF Screener',
    description: 'Reverse DCF modeling, margin of safety targets, and intrinsic valuation benchmarks.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  mmi: {
    name: 'Market Mood Index',
    description: 'Composite multi-factor sentiment telemetry, FII/DII liquidity flows, and India VIX overlay.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  pead: {
    name: 'PEAD Screener',
    description: 'Post-Earnings Announcement Drift radar tracking high-probability earnings surprises.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  vahan: {
    name: 'Vahan Auto Telemetry',
    description: 'Live vehicle registration analytics for tracking Indian automotive OEM sales trends and market velocity.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  buybacks: {
    name: 'Buybacks & Arbitrage Desk',
    description: 'Live tender-offer monitor, entitlement ratios, and retail arbitrage profit calculators.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  results: {
    name: 'Results Calendar',
    description: 'Earnings release schedule, quarterly alerts, and historical performance tables.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  shareholding: {
    name: 'Shareholding Patterns',
    description: 'Quarterly institutional ownership trends, promoter pledges, and foreign holdings.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
  news: {
    name: 'News Desk',
    description: 'Real-time curated financial press feeds, regulatory filings, and market intelligence.',
    targetPlanIds: ['tools-annual', 'all-access-bundle'],
  },
};

interface PlanViewItem {
  id: string;
  slug: string;
  name: string;
  badge: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isPopular: boolean;
}

const FREE_STARTER_PLAN: PlanViewItem = {
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
};

export default function PricingPage() {
  const { t } = useTranslation();
  const [activeFeatureKey, setActiveFeatureKey] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanViewItem[]>([FREE_STARTER_PLAN]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFreeMode, setIsFreeMode] = useState<boolean>(() => isAllAccessFreeMode());

  useEffect(() => {
    fetchAppAccessMode()
      .then((r) => setIsFreeMode(r.isAllAccessFree))
      .catch(() => {});
    const sync = () => setIsFreeMode(isAllAccessFreeMode());
    window.addEventListener('storage', sync);
    window.addEventListener('ff_auth_state_changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ff_auth_state_changed', sync);
    };
  }, []);

  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/subscriptions/plans`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedPlans: PlanViewItem[] = data.map((item: any) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              badge: item.isPopular
                ? t.common.recommended
                : item.slug === 'diy-masterclass'
                ? 'Lifetime Access'
                : 'Active Traders',
              price: `₹${Number(item.price).toLocaleString('en-IN')}`,
              originalPrice: item.originalPrice
                ? `₹${Number(item.originalPrice).toLocaleString('en-IN')}`
                : undefined,
              period: item.durationMonths
                ? item.durationMonths === 12
                  ? item.isPopular
                    ? 'first year bundle'
                    : '/ year'
                  : `${item.durationMonths} months`
                : 'one-time',
              description: item.description,
              features: item.features || [],
              ctaText: isFreeMode
                ? 'Unlocked Free'
                : item.isPopular
                ? 'Get Complete Access'
                : item.slug === 'diy-masterclass'
                ? 'Enroll Lifetime'
                : 'Subscribe Annual',
              ctaHref: isFreeMode ? '/techno-funda' : `/checkout/${item.slug}`,
              isPopular: Boolean(item.isPopular),
            }));

            mappedPlans.sort((a, b) => {
              const order = ['diy-masterclass', 'all-access-bundle', 'tools-annual'];
              const idxA = order.indexOf(a.slug);
              const idxB = order.indexOf(b.slug);
              return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
            });

            setPlans([FREE_STARTER_PLAN, ...mappedPlans]);
          }
        }
      } catch (err) {
        console.warn('Could not load live plans from API', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, [t.common.recommended, isFreeMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const feat = params.get('feature');
      if (feat) {
        const normalized = feat.replace(/-lab|-screener|-auto|-desk|-patterns/g, '');
        if (FEATURE_MAP[feat]) {
          setActiveFeatureKey(feat);
        } else if (FEATURE_MAP[normalized]) {
          setActiveFeatureKey(normalized);
        }
        setTimeout(() => {
          const el = document.getElementById('highlighted-plan-card') || document.getElementById('pricing-grid');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, []);

  const activeFeature = activeFeatureKey ? FEATURE_MAP[activeFeatureKey] : null;

  return (
    <SidebarLayout activePath="/pricing">
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)', marginTop: 'var(--space-2)' }}>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
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

        {/* Complimentary Access Active Banner */}
        {isFreeMode && (
          <div
            id="free-access-banner"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
              border: '1.5px solid #10B981',
              borderRadius: 'var(--radius-xl)',
              padding: '18px 22px',
              marginBottom: 'var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '18px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#10B981',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Complimentary All-Access Enabled
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  All research desks, screeners, and masterclasses are currently 100% free for all investors.
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  No payment or credit card required. Enjoy complete institutional-grade access across the platform.
                </div>
              </div>
            </div>
            <Link
              href="/techno-funda"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#10B981',
                color: '#06281E',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              Explore Research Desks <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Feature Unlock Callout Banner */}
        {activeFeature && (
          <div
            id="feature-unlock-banner"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
              border: '1.5px solid #F59E0B',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 22px',
              marginBottom: 'var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0,
                }}
              >
                <Zap size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#B45309',
                      background: 'rgba(245, 158, 11, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    PRO FEATURE
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                    {activeFeature.name}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                  {activeFeature.description} Included in <strong>Techno-Funda Tools Annual</strong> and <strong>All-Access Flagship Bundle</strong> highlighted below.
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveFeatureKey(null)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(180, 83, 9, 0.3)',
                color: '#B45309',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '6px 12px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Clear Filter <X size={11} />
              </span>
            </button>
          </div>
        )}

        {/* Pricing Grid */}
        <div
          id="pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--space-6)',
            alignItems: 'stretch',
            marginBottom: 'var(--space-12)',
          }}
        >
          {isLoading ?
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  height: '520px',
                  padding: 'clamp(var(--space-5), 3vw, var(--space-8))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              >
                <div style={{ width: '40%', height: '24px', background: 'var(--bg-surface-elevated, #e2e8f0)', borderRadius: '4px' }} />
                <div style={{ width: '65%', height: '36px', background: 'var(--bg-surface-elevated, #e2e8f0)', borderRadius: '4px' }} />
                <div style={{ width: '100%', height: '60px', background: 'var(--bg-surface-elevated, #e2e8f0)', borderRadius: '4px' }} />
                <div style={{ width: '100%', height: '140px', background: 'var(--bg-surface-elevated, #e2e8f0)', borderRadius: '4px' }} />
                <div style={{ marginTop: 'auto', width: '100%', height: '44px', background: 'var(--bg-surface-elevated, #e2e8f0)', borderRadius: '8px' }} />
              </div>
            ))
          : plans.map((p) => {
            const isFeatureTarget = !!activeFeature && activeFeature.targetPlanIds.includes(p.slug);
            return (
              <div
                key={p.slug}
                id={isFeatureTarget ? 'highlighted-plan-card' : undefined}
                style={{
                  background: 'var(--bg-surface)',
                  border: isFeatureTarget
                    ? '2px solid #F59E0B'
                    : p.isPopular
                    ? '2px solid var(--color-accent)'
                    : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(var(--space-5), 3vw, var(--space-8))',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isFeatureTarget
                    ? '0 0 0 4px rgba(245, 158, 11, 0.16), var(--shadow-md)'
                    : p.isPopular
                    ? 'var(--shadow-md)'
                    : 'var(--shadow-sm)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Feature highlight or popular badge */}
                {isFeatureTarget ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      padding: '4px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                    }}
                  >
                    <ShieldCheck size={12} />
                    Unlocks {activeFeature.name.split('&')[0].trim()}
                  </div>
                ) : p.isPopular ? (
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
                ) : null}

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
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-5)', marginBottom: 'var(--space-6)', flex: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {p.features.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                        <Check size={15} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
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
                  minHeight: '44px',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <span>{p.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
        </div>

        {/* Guarantee Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'var(--space-4)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ padding: '8px' }}>
            <Shield size={20} color="var(--color-accent)" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Bank-Grade Security
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>RBI-compliant 256-bit encrypted checkout</p>
          </div>

          <div style={{ padding: '8px' }}>
            <Zap size={20} color="var(--color-accent)" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Instant Activation
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Immediate access & automated GST invoice</p>
          </div>

          <div style={{ padding: '8px' }}>
            <Award size={20} color="var(--color-accent)" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Certified Curriculum
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Verifiable digital certificate on completion</p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
