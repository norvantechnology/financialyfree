'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowRight, Sparkles, Check, LogIn } from 'lucide-react';

export interface TechnoFundaPaywallLockProps {
  activeTab: string;
  tabTitle: string;
  isLoggedIn: boolean;
  userEmail?: string;
  userName?: string;
  children?: React.ReactNode;
}

const TAB_DESCRIPTIONS: Record<string, { summary: string; bullets: string[] }> = {
  mmi: {
    summary: 'Composite multi-factor market sentiment telemetry tracking fear, greed, FII/DII liquidity, and India VIX regimes.',
    bullets: [
      'Multi-factor sentiment score (0-100) updated during market hours',
      'FII vs DII net institutional liquidity overlay',
      'Volatility regime warnings & momentum divergence indicators',
    ],
  },
  'master-tracker': {
    summary: 'Institutional tracking desk for high-conviction compounders, quarterly guidance vs actuals, and key management catalysts.',
    bullets: [
      'Multi-year sales & PAT compounding rates with PEG benchmarks',
      'Consensus quarterly growth milestones & guidance delivery',
      'Real-time technical RSI, 200-DMA, and momentum status signals',
    ],
  },
  pead: {
    summary: 'Post-Earnings Announcement Drift radar tracking high-probability quarterly earnings surprises across Indian equities.',
    bullets: [
      'Automated detection of PAT beats >15% above consensus estimates',
      '2-day to 20-day institutional price drift trajectory tracking',
      'Volume breakout validation & earnings quality scoring',
    ],
  },
  orders: {
    summary: 'Live BSE & NSE corporate contract disclosures, mega-order wins, and capital expenditure inflows.',
    bullets: [
      'Real-time contract awards classified as % of annual company revenue',
      'Order book to trailing revenue ratio benchmarking',
      'Sector-wide order momentum across Defence, Railways, EPC, & Infra',
    ],
  },
  valuation: {
    summary: 'Fair value estimates and margin of safety targets across 9 proprietary institutional valuation models.',
    bullets: [
      '2-Stage Discounted Cash Flow (DCF) with dynamic WACC calculator',
      'Reverse DCF extracting market-implied growth expectations',
      'Graham Number, Peter Lynch Fair Value, and Historical Multiples',
    ],
  },
  results: {
    summary: 'Institutional earnings release calendar, quarterly board meeting agendas, and historical scorecard performance.',
    bullets: [
      'Real-time tracking of upcoming board meetings & financial declarations',
      'Reported vs expected quarterly revenue & EBITDA margins',
      'Instant access to audited PDF investor disclosures',
    ],
  },
  news: {
    summary: 'Curated financial intelligence desk streaming BSE/NSE corporate announcements and regulatory filings.',
    bullets: [
      'Categorized filings: Orders, Fundraising, Board, & Corporate Actions',
      'Zero-noise high-impact announcements with verified exchange links',
      'Sentiment analysis and keyword extraction on regulatory filings',
    ],
  },
  shareholding: {
    summary: 'Quarterly institutional ownership trends, promoter pledging changes, and FII/DII accumulation shifts.',
    bullets: [
      'Promoter holding delta and pledged shares surveillance',
      'FII and Domestic Mutual Fund institutional accumulation radar',
      'Public vs smart money float distribution analytics',
    ],
  },
  vahan: {
    summary: 'MoRTH Vahan vehicle registration analytics tracking automotive sector OEM sales velocity and nationwide retail trends.',
    bullets: [
      'Monthly retail registration volumes by OEM (Maruti, Tata, M&M, etc.)',
      'EV adoption ratios across 2-wheelers, 3-wheelers, & commercial segments',
      'Leading indicator for quarterly automotive earnings performance',
    ],
  },
  'bank-nbfc': {
    summary: 'Historical Cost of Funds heatmaps, NIM spreads, ROA benchmarking, and liability profiles across Indian banks and NBFCs.',
    bullets: [
      'Multi-year Cost of Borrowing vs Cost of Deposits matrix',
      'CASA ratio trends and asset-liability maturity profiling',
      'Credit growth vs deposit growth divergence benchmarks',
    ],
  },
  buybacks: {
    summary: 'Live corporate tender-offer monitor, entitlement ratio models, and retail arbitrage profit calculators.',
    bullets: [
      'Tender-offer price vs CMP spread and record date calendars',
      'Retail quota reservation (15%) entitlement ratio estimations',
      'Historical acceptance ratio analytics & net arbitrage yield models',
    ],
  },
  '52w-screener': {
    summary: 'Real-time 52-Week High breakout and 52-Week Low breakdown radar across Indian equities.',
    bullets: [
      'Fresh all-time high breakouts and multi-month breakdown alerts',
      'Proximity distance filters: within 2% or 5% of 52-Week High/Low',
      'Volume surge validation across Nifty 50, Midcap, and Smallcap stocks',
    ],
  },
  deals: {
    summary: 'Institutional and marquee investor Bulk and Block deal transaction surveillance from NSE and BSE.',
    bullets: [
      'Real-time transaction feed tracking smart money stake acquisitions',
      'Marquee investor flags: Ashish Kacholia, Mukul Agrawal, GQG Partners, Vanguard',
      'Buy vs Sell institutional volume distribution in ₹ Crores',
    ],
  },
  fno: {
    summary: 'Derivative market sentiment telemetry, Put-Call Ratio (PCR), Max Pain strikes, and Open Interest heatmaps.',
    bullets: [
      'Nifty & Bank Nifty Put-Call Ratio (PCR) with automated sentiment verdict',
      'Max Pain strike calculation showing option writer liquidity anchors',
      'Open Interest buildup classification: Long Buildup vs Short Buildup',
    ],
  },
  insider: {
    summary: 'SEBI Prohibition of Insider Trading (PIT) and SAST promoter/insider transactions radar.',
    bullets: [
      'Promoter and Director open market share purchases and disposals',
      'Promoter pledge creation and revocation tracking',
      'Post-transaction shareholding percentage delta calculations',
    ],
  },
  ipo: {
    summary: 'Mainboard and SME IPO intelligence calendar with live subscription bidding multiples and GMP estimates.',
    bullets: [
      'Live bidding multiples updated across QIB, HNI, Retail, and Total',
      'Price band, lot size, issue size, and key listing date calendars',
      'Grey Market Premium (GMP) estimates and listing day gain tracking',
    ],
  },
  dividends: {
    summary: 'Dedicated upcoming ex-dividend calendar, dividend yield screeners, bonus issues, and stock splits.',
    bullets: [
      'Chronological upcoming ex-dividend and record date calendar',
      'High dividend yield filter (≥2.5% annualized yield)',
      'Bonus issue ratios (1:1) and stock split restructuring tracking',
    ],
  },
  'sector-heatmap': {
    summary: '11 NSE Sectoral indices performance heatmap, sector rotation telemetry, and market breadth distribution.',
    bullets: [
      'Interactive color-scaled heatmap across 1D, 1W, 1M, and YTD timeframes',
      'Sector rotation states: Leading, Improving, Weakening, or Lagging',
      'Advances vs Declines count and top gainer/loser stock in each sector',
    ],
  },
  'delivery-momentum': {
    summary: 'High-conviction buying signal filtering stocks near 52-Week High with delivery volume exceeding 50-70%.',
    bullets: [
      'Separates genuine institutional accumulation from speculative day trading',
      'Delivery percentage threshold filters: ≥50%, ≥60%, ≥65%, ≥70%',
      '30-day volume surge multipliers and momentum continuation verdicts',
    ],
  },
  circuits: {
    summary: 'Stocks locked in Upper Circuit and Lower Circuit with pending order book depth and consecutive day streaks.',
    bullets: [
      'Upper circuit (100% buyers) and Lower circuit (100% sellers) radar',
      'Circuit band limits (5%, 10%, 20%) and turnover volume in ₹ Cr',
      'Consecutive circuit streak counter flagging extreme momentum or risk',
    ],
  },
};

export function TechnoFundaPaywallLock({
  activeTab,
  tabTitle,
  isLoggedIn,
  userEmail,
  userName,
  children,
}: TechnoFundaPaywallLockProps) {
  const tabInfo = TAB_DESCRIPTIONS[activeTab] || {
    summary: 'Institutional-grade equity research and financial modeling tools.',
    bullets: [
      'Proprietary valuation models & multi-year historical benchmarks',
      'Real-time corporate filings & exchange disclosures',
      'Priority institutional screener & research community access',
    ],
  };

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 0, marginTop: '8px' }}>
      {/* ── Elevated Institutional Lock Card ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: 'clamp(24px, 4vw, 36px)',
          boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)',
          maxWidth: '680px',
          margin: '0 auto 24px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Lock Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(217, 119, 6, 0.1)',
            border: '1.5px solid rgba(217, 119, 6, 0.3)',
            color: '#D97706',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
          }}
        >
          <Lock size={24} />
        </div>

        {/* Pro Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#D97706',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            Techno-Funda Pro Suite
          </span>
        </div>

        {/* Title & Headline */}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(20px, 3.5vw, 26px)',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Unlock {tabTitle}
        </h2>

        {/* Summary Description */}
        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.55,
            maxWidth: '520px',
            margin: '0 auto 20px',
          }}
        >
          {tabInfo.summary}
        </p>

        {/* Value Proposition Bullets */}
        <div
          style={{
            textAlign: 'left',
            background: '#F8FAFC',
            border: '1px solid #F1F5F9',
            borderRadius: '12px',
            padding: '14px 18px',
            margin: '0 auto 24px',
            maxWidth: '540px',
          }}
        >
          <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: '10px' }}>
            What you get with Pro Access:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tabInfo.bullets.map((bullet, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <Check size={15} color="#0F766E" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conditional CTAs based on whether user is Guest or Free User */}
        {!isLoggedIn ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
              <Link
                href={`/auth/login?redirect=/techno-funda?tab=${activeTab}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogIn size={15} />
                <span>Sign In to Access</span>
              </Link>

              <Link
                href={`/pricing?feature=${activeTab}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#0F766E',
                  border: '1.5px solid #0F766E',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={15} />
                <span>View Plans & Pricing</span>
              </Link>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Don't have an account yet?{' '}
              <Link
                href="/auth/register"
                style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}
              >
                Create free account
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: '12.5px',
                color: '#64748B',
                marginBottom: '16px',
                padding: '6px 12px',
                background: '#F1F5F9',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              Signed in as <strong>{userName || userEmail || 'Free Member'}</strong> • Free Plan Active
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
              <Link
                href="/checkout/tools-annual"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                }}
              >
                <span>Upgrade to Tools Annual (₹9,999/yr)</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href={`/pricing?feature=${activeTab}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#334155',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>Compare All Plans</span>
              </Link>
            </div>
          </div>
        )}

        {/* Security & Regulatory reassurance */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <ShieldCheck size={13} color="#0F766E" />
          <span>100% Verified Exchange Disclosures • Institutional-Grade Data</span>
        </div>
      </div>

      {/* ── Realistic Blurred Teaser Snapshot Preview ── */}
      {children && (
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            filter: 'blur(5.5px)',
            opacity: 0.22,
            pointerEvents: 'none',
            userSelect: 'none',
            maxHeight: '260px',
            overflow: 'hidden',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            background: '#FFFFFF',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
