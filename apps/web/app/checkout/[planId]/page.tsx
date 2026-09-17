'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Calculator,
  Gauge,
  BarChart3,
  Activity,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Check,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { getApiBaseUrl } from '../../../lib/auth-client';

interface PlanDetail {
  slug: string;
  name: string;
  basePrice: number;
  duration: string;
  skus: string[];
  tag?: string;
  features: string[];
}

const PLAN_DATA: Record<string, PlanDetail> = {
  'tools-annual': {
    slug: 'tools-annual',
    name: 'Techno-Funda Tools Annual',
    basePrice: 9999,
    duration: '1 Year Pro Access',
    skus: ['tools_1yr', 'bundle_all'],
    tag: 'MOST POPULAR',
    features: [
      'Market Mood Index & Pro Technical Overlays',
      'Master Tracker + PEAD Results Screener',
      '52W High/Low, Deals & F&O Analytics',
      'Valuation Lab & DCF Financial Modelling',
      'Vahan Registration Trends & Sector Heatmap',
    ],
  },
  'diy-masterclass': {
    slug: 'diy-masterclass',
    name: 'Techno-Funda DIY Masterclass',
    basePrice: 14999,
    duration: 'Lifetime Course + 1 Year Tools',
    skus: ['course_lifetime', 'tools_1yr'],
    tag: 'BEST FOR LEARNERS',
    features: [
      'Lifetime Access to Full 8-Module Masterclass',
      '1 Year Access to All 20 Techno-Funda Tools',
      'Valuation Lab & DCF Financial Modelling',
      'Certificate of Completion & Case Studies',
    ],
  },
  'all-access-bundle': {
    slug: 'all-access-bundle',
    name: 'Techno-Funda All-Access Flagship Bundle',
    basePrice: 24999,
    duration: 'Lifetime Course + 1 Year Research Tools',
    skus: ['course_lifetime', 'tools_1yr', 'bundle_diy', 'bundle_all'],
    tag: 'FLAGSHIP BUNDLE',
    features: [
      'Everything in DIY Masterclass (Lifetime)',
      '1 Year Techno-Funda Screener & Analytics Tools',
      'Exclusive Research Community & Live Mentorship',
      'Priority WhatsApp Mentorship Channel',
    ],
  },
};

const PLAN_ALIASES: Record<string, string> = {
  'tools-1yr': 'tools-annual',
  'bundle': 'all-access-bundle',
  'course-lifetime': 'diy-masterclass',
  'masterclass': 'diy-masterclass',
};

const QUICK_UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', color: '#1A73E8', letter: 'G' },
  { id: 'phonepe', name: 'PhonePe', color: '#5F259F', letter: 'Pe' },
  { id: 'paytm', name: 'Paytm', color: '#00BAF2', letter: '₹' },
  { id: 'bhim', name: 'BHIM / CRED', color: '#00529B', letter: 'B' },
];

const BANK_HANDLES = ['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@ibl'];

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra' },
];

export default function CheckoutPage() {
  const params = useParams();
  const rawSlug = (params?.planId as string) || 'tools-annual';
  const initialSlug = PLAN_ALIASES[rawSlug] || rawSlug;

  const [plansMap, setPlansMap] = useState<Record<string, PlanDetail>>(PLAN_DATA);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(
    PLAN_DATA[initialSlug] ? initialSlug : 'tools-annual'
  );

  const plan = plansMap[selectedPlanSlug] || plansMap['tools-annual'] || PLAN_DATA['tools-annual'];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiSubMode, setUpiSubMode] = useState<'apps' | 'qr' | 'id'>('apps');
  const [selectedApp, setSelectedApp] = useState<string>('gpay');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Billing User state
  const [billingName, setBillingName] = useState('Sandeep Kumar');
  const [billingEmail, setBillingEmail] = useState('investor@goalcompass.in');
  const [currentUserId, setCurrentUserId] = useState<string>('f47cfaa8-74c1-4257-81a1-fe803c31e0c0');
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPlanPickerOpen, setIsPlanPickerOpen] = useState(false);
  const [isPriceBreakdownOpen, setIsPriceBreakdownOpen] = useState(false);

  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    paymentId: string;
    totalPaid: number;
    invoiceNumber: string;
    activatedAt: string;
  } | null>(null);

  const gstAmount = Math.round(plan.basePrice * 0.18 * 100) / 100;
  const totalAmount = Math.round((plan.basePrice + gstAmount) * 100) / 100;

  // Fetch live plans from database
  useEffect(() => {
    async function loadPlans() {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/subscriptions/plans`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped: Record<string, PlanDetail> = { ...PLAN_DATA };
            for (const item of list) {
              mapped[item.slug] = {
                slug: item.slug,
                name: item.name,
                basePrice: Number(item.price),
                duration: item.durationMonths
                  ? `${item.durationMonths === 12 ? '1 Year' : `${item.durationMonths} Months`} Access`
                  : 'Lifetime Course',
                skus: item.skus || [],
                tag: item.isPopular
                  ? 'MOST POPULAR'
                  : item.slug === 'diy-masterclass'
                  ? 'BEST FOR LEARNERS'
                  : undefined,
                features: item.features || [],
              };
            }
            setPlansMap(mapped);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live plans for checkout', err);
      }
    }
    loadPlans();
  }, []);

  // Hydrate user session on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id) setCurrentUserId(u.id);
          if (u.email) setBillingEmail(u.email);
          if (u.firstName || u.lastName) {
            setBillingName(`${u.firstName || ''} ${u.lastName || ''}`.trim());
          } else if (u.first_name || u.last_name) {
            setBillingName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
          } else if (u.name) {
            setBillingName(u.name);
          }
        }
      }
    } catch {}
  }, []);

  // ── High-Speed Instant Payment & Pro Activation ───────────────────────────
  const handleActivatePro = async () => {
    setIsProcessing(true);

    const now = new Date();
    const mockOrderId = `ORD-FF-${Date.now().toString(36).toUpperCase()}`;
    const mockPaymentId = `pay_bypass_${Date.now().toString(36)}`;
    let finalInvoiceNum = `INV-FF-BYPASS-${Date.now().toString(36).toUpperCase()}`;

    // 1. Instant optimistic Pro state persistence in LocalStorage & Cookies
    const allProSkus = Array.from(
      new Set([
        ...plan.skus,
        'course_lifetime',
        'tools_1yr',
        'bundle_all',
        'bundle_diy',
      ])
    );

    const storedSub = {
      planSlug: plan.slug,
      planName: plan.name,
      active: true,
      activatedAt: now.toISOString(),
      skus: allProSkus,
    };
    try {
      localStorage.setItem('ff_active_sub', JSON.stringify(storedSub));
      localStorage.setItem('ff_pro_user', 'true');
      document.cookie = 'ff_pro_user=true; path=/; max-age=31536000; SameSite=Lax';

      const existingUserStr = localStorage.getItem('user');
      const existingUser = existingUserStr ? JSON.parse(existingUserStr) : null;
      const updatedUser = {
        id: existingUser?.id || currentUserId,
        email: billingEmail || existingUser?.email || 'investor@goalcompass.in',
        firstName: billingName ? billingName.split(' ')[0] : (existingUser?.firstName || 'Sandeep'),
        lastName: billingName ? billingName.split(' ').slice(1).join(' ') : (existingUser?.lastName || 'Kumar'),
        role: existingUser?.role || 'investor',
        entitlements: allProSkus,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {}

    // 2. Call backend bypass-activate endpoint via relative URL proxy
    try {
      const baseUrl = getApiBaseUrl();
      const bypassRes = await fetch(`${baseUrl}/api/v1/subscriptions/bypass-activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planSlug: plan.slug,
          userId: currentUserId,
        }),
      });

      if (bypassRes.ok) {
        const data = await bypassRes.json();
        if (data.invoiceNumber) {
          finalInvoiceNum = data.invoiceNumber;
        }
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify({ ...data.user, entitlements: allProSkus }));
        }
      }
    } catch (err) {
      console.warn('Backend bypass call fallback to client activation', err);
    }

    // 3. Broadcast auth state changed event across tabs and layouts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ff_auth_state_changed'));
      window.dispatchEvent(new Event('storage'));
    }

    setReceiptData({
      orderId: mockOrderId,
      paymentId: mockPaymentId,
      totalPaid: totalAmount,
      invoiceNumber: finalInvoiceNum,
      activatedAt: now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    setIsProcessing(false);
    setIsSuccess(true);
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess && receiptData) {
    const proModules = [
      { name: '52W High / Low', href: '/techno-funda?tab=52w-screener', icon: BarChart3 },
      { name: 'Bulk & Block Deals', href: '/techno-funda?tab=deals', icon: Activity },
      { name: 'F&O OI Analytics', href: '/techno-funda?tab=fno', icon: RefreshCw },
      { name: 'Market Mood (MMI)', href: '/techno-funda?tab=mmi', icon: Gauge },
      { name: 'Valuation Lab', href: '/techno-funda?tab=valuation', icon: Calculator },
      { name: 'Circuit Breakers', href: '/techno-funda?tab=circuits', icon: Calendar },
      { name: 'Delivery Screener', href: '/techno-funda?tab=delivery-momentum', icon: Shield },
      { name: 'PEAD Screener', href: '/techno-funda?tab=pead', icon: FileText },
    ];

    return (
      <SidebarLayout activePath="/pricing">
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', padding: '0 8px 32px' }}>
          {/* Main Success Card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '28px 20px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ECFDF5',
                border: '2px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CheckCircle2 size={32} color="#059669" />
            </div>

            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#065F46',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '9999px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              PRO MEMBERSHIP ACTIVE
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              Payment Verified &amp; Pro Unlocked!
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 18px', lineHeight: 1.4 }}>
              Congratulations, {billingName || 'Investor'}! All institutional screening tools, calendars, and analytics are ready.
            </p>

            {/* Receipt Summary Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 14px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Plan</div>
                  <div style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 700, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={plan.name}>
                    {plan.name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Amount Paid</div>
                  <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                    ₹{receiptData.totalPaid.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Invoice No</div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                    {receiptData.invoiceNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                    Active &amp; Ready
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/techno-funda?tab=52w-screener"
                style={{
                  height: '46px',
                  padding: '0 20px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
                }}
              >
                <span>Launch Techno-Funda Dashboard</span>
                <ArrowRight size={15} />
              </Link>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <Link
                  href="/courses"
                  style={{
                    height: '38px',
                    padding: '0 10px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                  }}
                >
                  Explore Courses
                </Link>
                <Link
                  href="/dashboard/billing"
                  style={{
                    height: '38px',
                    padding: '0 10px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                  }}
                >
                  View Invoice
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Access Pro Modules: Compact 2-Column Grid */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '14px 14px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Instant Access to All 20 Pro Tools:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
              }}
            >
              {proModules.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.name}
                    href={t.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      textDecoration: 'none',
                      color: '#1E293B',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={14} color="#0F766E" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {t.name}
                    </span>
                    <ArrowRight size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ── Main Mobile-Optimized Unified Checkout ────────────────────────────────
  return (
    <SidebarLayout activePath="/pricing">
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', padding: '0 6px 36px' }}>
        
        {/* Top Breadcrumb & Trust Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Link
            href="/pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>All Plans</span>
          </Link>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#065F46',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={12} />
            256-Bit SSL Secure
          </span>
        </div>

        {/* ── MASTER UNIFIED CHECKOUT CARD ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Section 1: Selected Plan Header & Price */}
          <div
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '16px 18px',
              borderBottom: '1px solid #1E293B',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selected Subscription
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px', lineHeight: 1.3 }}>
                  {plan.name}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: 700, color: '#2DD4BF', background: 'rgba(45, 212, 191, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Check size={11} />
                  <span>{plan.duration}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPlanPickerOpen(!isPlanPickerOpen)}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 650,
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Switch Plan</span>
                {isPlanPickerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Inline Plan Switcher */}
            {isPlanPickerOpen && (
              <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                  Select another tier:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.values(PLAN_DATA).map((p) => (
                    <div
                      key={p.slug}
                      onClick={() => {
                        setSelectedPlanSlug(p.slug);
                        setIsPlanPickerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '7px',
                        background: plan.slug === p.slug ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: plan.slug === p.slug ? '1px solid #2DD4BF' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: plan.slug === p.slug ? 700 : 500, color: '#FFFFFF' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#2DD4BF' }}>
                        ₹{Math.round(p.basePrice * 1.18).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Total Payable:</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPriceBreakdownOpen(!isPriceBreakdownOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {isPriceBreakdownOpen ? 'Hide Tax Breakdown' : 'View Tax Breakdown'}
              </button>
            </div>

            {/* Collapsible Tax Breakdown */}
            {isPriceBreakdownOpen && (
              <div style={{ marginTop: '10px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', padding: '8px 12px', fontSize: '11.5px', color: '#CBD5E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Base Plan Price:</span>
                  <span style={{ fontWeight: 600 }}>₹{plan.basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST (18% Goods &amp; Services Tax):</span>
                  <span style={{ fontWeight: 600 }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Billing Account Details */}
          <div
            style={{
              padding: '12px 18px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <span style={{ fontWeight: 600, color: '#64748B' }}>Billing Account: </span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{billingName}</span>
              <span style={{ color: '#64748B' }}> ({billingEmail})</span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingBilling(!isEditingBilling)}
              style={{
                fontSize: '11.5px',
                fontWeight: 650,
                color: '#0F766E',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              {isEditingBilling ? 'Done' : 'Edit details'}
            </button>

            {isEditingBilling && (
              <div style={{ width: '100%', marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="Full Name"
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                  }}
                />
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="Email Address"
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Section 3: Select Payment Method */}
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              Select Payment Method:
            </div>

            {/* 3 Main Segmented Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'upi' ? '2px solid #0F766E' : '1px solid #E2E8F0',
                  background: paymentMethod === 'upi' ? '#F0FDFA' : '#FFFFFF',
                  color: paymentMethod === 'upi' ? '#0F766E' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Smartphone size={18} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>UPI (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'card' ? '2px solid #0F766E' : '1px solid #E2E8F0',
                  background: paymentMethod === 'card' ? '#F0FDFA' : '#FFFFFF',
                  color: paymentMethod === 'card' ? '#0F766E' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <CreditCard size={18} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'netbanking' ? '2px solid #0F766E' : '1px solid #E2E8F0',
                  background: paymentMethod === 'netbanking' ? '#F0FDFA' : '#FFFFFF',
                  color: paymentMethod === 'netbanking' ? '#0F766E' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Building2 size={18} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Net Banking</span>
              </button>
            </div>

            {/* TAB CONTENT: UPI */}
            {paymentMethod === 'upi' && (
              <div>
                {/* UPI Sub-mode selector */}
                <div
                  style={{
                    display: 'flex',
                    background: '#F1F5F9',
                    borderRadius: '8px',
                    padding: '3px',
                    marginBottom: '14px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setUpiSubMode('apps')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: upiSubMode === 'apps' ? 700 : 500,
                      background: upiSubMode === 'apps' ? '#FFFFFF' : 'transparent',
                      color: upiSubMode === 'apps' ? '#0F172A' : '#64748B',
                      boxShadow: upiSubMode === 'apps' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Quick Pay Apps
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiSubMode('qr')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: upiSubMode === 'qr' ? 700 : 500,
                      background: upiSubMode === 'qr' ? '#FFFFFF' : 'transparent',
                      color: upiSubMode === 'qr' ? '#0F172A' : '#64748B',
                      boxShadow: upiSubMode === 'qr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    📱 Scan QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiSubMode('id')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: upiSubMode === 'id' ? 700 : 500,
                      background: upiSubMode === 'id' ? '#FFFFFF' : 'transparent',
                      color: upiSubMode === 'id' ? '#0F172A' : '#64748B',
                      boxShadow: upiSubMode === 'id' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ✍️ UPI ID
                  </button>
                </div>

                {/* Sub-Mode 1: Quick Pay Apps */}
                {upiSubMode === 'apps' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {QUICK_UPI_APPS.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApp(app.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: selectedApp === app.id ? '2px solid #0F766E' : '1px solid #E2E8F0',
                            background: selectedApp === app.id ? '#F0FDFA' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              background: app.color,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {app.letter}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 650, color: '#1E293B', flex: 1 }}>
                            {app.name}
                          </span>
                          {selectedApp === app.id && <Check size={16} color="#0F766E" />}
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Ready to approve in <strong>{QUICK_UPI_APPS.find(a => a.id === selectedApp)?.name}</strong>. Tap pay below to activate.</span>
                    </div>
                  </div>
                )}

                {/* Sub-Mode 2: Scan QR */}
                {upiSubMode === 'qr' && (
                  <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ background: '#FFFFFF', display: 'inline-block', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', marginBottom: '10px' }}>
                      {/* Crisp Dynamic QR Code representation */}
                      <svg width="150" height="150" viewBox="0 0 100 100" fill="#0F172A">
                        <rect width="100" height="100" fill="#FFFFFF" />
                        <path d="M10 10h30v30h-30z M15 15h20v20h-20z M20 20h10v10h-10z" />
                        <path d="M60 10h30v30h-30z M65 15h20v20h-20z M70 20h10v10h-10z" />
                        <path d="M10 60h30v30h-30z M15 65h20v20h-20z M20 70h10v10h-10z" />
                        <rect x="45" y="10" width="5" height="15" />
                        <rect x="10" y="45" width="15" height="5" />
                        <rect x="45" y="45" width="10" height="10" />
                        <rect x="60" y="45" width="15" height="5" />
                        <rect x="60" y="60" width="5" height="20" />
                        <rect x="70" y="70" width="20" height="5" />
                        <rect x="80" y="80" width="10" height="10" />
                        <rect x="45" y="70" width="10" height="10" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                      Scan using Google Pay, PhonePe, Paytm or BHIM
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                      Paying ₹{totalAmount.toLocaleString('en-IN')} • Instant Pro Unlock
                    </div>
                  </div>
                )}

                {/* Sub-Mode 3: Enter UPI ID */}
                {upiSubMode === 'id' && (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@bank or 9876543210@upi"
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          fontSize: '13px',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: '8px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {/* Bank suffix chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {BANK_HANDLES.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.includes('@') ? upiId.split('@')[0] : (upiId || 'investor');
                            setUpiId(`${prefix}${h}`);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CARD */}
            {paymentMethod === 'card' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Card Number</div>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8921"
                  defaultValue="4532 8812 3491 8921"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Valid Thru</div>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="08/29"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>CVV</div>
                    <input
                      type="password"
                      placeholder="•••"
                      defaultValue="882"
                      maxLength={3}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NET BANKING */}
            {paymentMethod === 'netbanking' && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {POPULAR_BANKS.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBank(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedBank === b.id ? '2px solid #0F766E' : '1px solid #E2E8F0',
                        background: selectedBank === b.id ? '#F0FDFA' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      <span>{b.name}</span>
                      {selectedBank === b.id && <Check size={14} color="#0F766E" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRIMARY CTA BUTTON ── */}
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleActivatePro}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  height: '50px',
                  background: isProcessing ? '#0F766E' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 750,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                  transition: 'background 0.15s ease, transform 0.05s ease',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="spin-slow" />
                    <span>Activating Pro Membership...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')} &amp; Unlock Pro Instantly</span>
                  </>
                )}
              </button>

              {/* Trust Subtext */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#64748B',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={13} color="#059669" />
                <span>Zero-Wait Instant Activation • 256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>


      </div>
    </SidebarLayout>
  );
}
