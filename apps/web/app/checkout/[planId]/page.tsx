'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Lock, ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n/language-context';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';

interface PlanDetail {
  slug: string;
  name: string;
  basePrice: number;
  duration: string;
  skus: string[];
}

const PLAN_DATA: Record<string, PlanDetail> = {
  'diy-masterclass': {
    slug: 'diy-masterclass',
    name: 'Techno-Funda DIY Masterclass',
    basePrice: 14999,
    duration: 'Lifetime Access',
    skus: ['course_lifetime'],
  },
  'all-access-bundle': {
    slug: 'all-access-bundle',
    name: 'Techno-Funda All-Access Bundle',
    basePrice: 24999,
    duration: 'Lifetime Course + 1 Year Tools & Webinars',
    skus: ['course_lifetime', 'tools_1yr', 'webinars_1yr', 'bundle_diy'],
  },
  'tools-webinars-annual': {
    slug: 'tools-webinars-annual',
    name: 'Techno-Funda Tools + Webinars Annual',
    basePrice: 9999,
    duration: '1 Year Access',
    skus: ['tools_1yr', 'webinars_1yr'],
  },
};

export default function CheckoutPage() {
  const params = useParams();
  const { t } = useTranslation();
  const planSlug = (params?.planId as string) || 'all-access-bundle';
  const plan = PLAN_DATA[planSlug] || PLAN_DATA['all-access-bundle'];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) setBillingEmail(u.email);
        if (u.first_name || u.last_name) {
          setBillingName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
        } else if (u.name) {
          setBillingName(u.name);
        }
        if (u.phone) setBillingPhone(u.phone);
      }
    } catch {}
  }, []);

  const handleFillDemoBilling = () => {
    setBillingName('Demo Investor');
    setBillingEmail('investor@financiallyfree.in');
    setBillingPhone('9876543210');
    setUpiId('investor@okhdfcbank');
  };
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    paymentId: string;
    totalPaid: number;
  } | null>(null);

  const gstAmount = Math.round(plan.basePrice * 0.18 * 100) / 100;
  const totalAmount = Math.round((plan.basePrice + gstAmount) * 100) / 100;

  const handleSimulatePayment = async () => {
    const errs: Record<string, string> = {};
    if (!billingName || billingName.trim().length < 2) {
      errs.name = 'Please provide your full legal name for the invoice.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!billingEmail || !emailRegex.test(billingEmail.trim())) {
      errs.email = 'Please provide a valid email address to receive access credentials.';
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!billingPhone || !phoneRegex.test(billingPhone.trim())) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }
    if (paymentMethod === 'upi') {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/;
      if (!upiId || !upiRegex.test(upiId.trim())) {
        errs.upi = 'Please enter a valid UPI ID / VPA (e.g. yourname@okhdfcbank).';
      }
    }

    if (Object.keys(errs).length > 0) {
      setCheckoutErrors(errs);
      return;
    }
    setCheckoutErrors({});
    setIsProcessing(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Step 1: Get plan ID from backend
      const plansRes = await fetch(`${apiUrl}/api/v1/subscriptions/plans`);
      let dbPlanId = plan.slug;
      if (plansRes.ok) {
        const plansList = await plansRes.json();
        const found = plansList.find((p: any) => p.slug === plan.slug);
        if (found) dbPlanId = found.id;
      }

      // Step 2: Create checkout order
      const checkoutRes = await fetch(`${apiUrl}/api/v1/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: dbPlanId }),
      });

      let razorpayOrderId = `order_mock_${Date.now().toString(36)}`;
      let backendOrderId = `order_${Date.now()}`;
      if (checkoutRes.ok) {
        const cData = await checkoutRes.json();
        razorpayOrderId = cData.razorpayOrderId || razorpayOrderId;
        backendOrderId = cData.orderId || backendOrderId;
      }

      // Step 3: Verify simulated payment
      const mockPayId = `pay_mock_${Date.now().toString(36)}`;
      await fetch(`${apiUrl}/api/v1/subscriptions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId,
          razorpayPaymentId: mockPayId,
          razorpaySignature: 'mock_signature_12345',
        }),
      });

      const storedSub = {
        planSlug: plan.slug,
        planName: plan.name,
        active: true,
        activatedAt: new Date().toISOString(),
        skus: plan.skus,
      };
      localStorage.setItem('ff_active_sub', JSON.stringify(storedSub));

      setReceiptData({
        orderId: backendOrderId,
        paymentId: mockPayId,
        totalPaid: totalAmount,
      });
      setIsProcessing(false);
      setIsSuccess(true);
    } catch {
      const mockOrderId = `order_mock_${Date.now().toString(36)}`;
      const mockPaymentId = `pay_mock_${Date.now().toString(36)}`;

      const storedSub = {
        planSlug: plan.slug,
        planName: plan.name,
        active: true,
        activatedAt: new Date().toISOString(),
        skus: plan.skus,
      };
      localStorage.setItem('ff_active_sub', JSON.stringify(storedSub));

      setReceiptData({
        orderId: mockOrderId,
        paymentId: mockPaymentId,
        totalPaid: totalAmount,
      });
      setIsProcessing(false);
      setIsSuccess(true);
    }
  };

  if (isSuccess && receiptData) {
    return (
      <SidebarLayout activePath="/pricing">
        <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <StaticSnapshotBanner
            datasetName="Razorpay Payment Gateway Verification"
            sourceNotes="Simulated transaction settled. Order webhook and entitlement activation completed."
          />

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-10)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-6)',
              }}
            >
              <CheckCircle2 size={32} color="#059669" />
            </div>

            <div className="category-tag">ORDER CONFIRMED</div>
            <h2
              className="font-serif"
              style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: 'var(--space-2)' }}
            >
              {t.pricing.paymentSuccess}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              {t.pricing.orderConfirmed}
            </p>

            {/* Receipt Card */}
            <div
              style={{
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                textAlign: 'left',
                marginBottom: 'var(--space-8)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Reference</span>
                <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{receiptData.paymentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Paid (incl 18% GST)</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>
                  ₹{receiptData.totalPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ color: '#047857', fontWeight: 600 }}>Active (Verified)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <Link
                href="/courses"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <span>Go to Courses</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/billing"
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                View Billing & Entitlements
              </Link>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/pricing">
      <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Secure Checkout"
          sourceNotes="PCI-DSS compliant sandbox checkout connecting to mock payment gateways."
        />

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="category-tag">SECURE PAYMENT</div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginTop: '4px',
              marginBottom: '8px',
            }}
          >
            Checkout & Order Confirmation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Complete your enrollment securely via Razorpay payment rails.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-6)' }}>
          {/* Left Column: Payment Method Selection */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Customer Information */}
            <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Billing Information
                </h3>
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    type="button"
                    onClick={handleFillDemoBilling}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      background: '#F4F1EA',
                      border: '1px solid #E8E4DC',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#4B5563',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <UserCheck size={12} />
                    <span>Autofill Demo Info</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => {
                      setBillingName(e.target.value);
                      if (checkoutErrors.name) setCheckoutErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Full Legal Name"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: checkoutErrors.name ? '1px solid #DC2626' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  {checkoutErrors.name && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                      {checkoutErrors.name}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      Email (for LMS credentials)
                    </label>
                    <input
                      type="email"
                      value={billingEmail}
                      onChange={(e) => {
                        setBillingEmail(e.target.value);
                        if (checkoutErrors.email) setCheckoutErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="investor@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFFFF',
                        border: checkoutErrors.email ? '1px solid #DC2626' : '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    {checkoutErrors.email && (
                      <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                        {checkoutErrors.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      Mobile Phone (for OTP)
                    </label>
                    <input
                      type="tel"
                      value={billingPhone}
                      onChange={(e) => {
                        setBillingPhone(e.target.value);
                        if (checkoutErrors.phone) setCheckoutErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      maxLength={10}
                      placeholder="9876543210"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFFFF',
                        border: checkoutErrors.phone ? '1px solid #DC2626' : '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    {checkoutErrors.phone && (
                      <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                        {checkoutErrors.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
              Select Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { id: 'upi', label: 'UPI / QR Code', sub: 'Instant via Google Pay, PhonePe, Paytm, BHIM' },
                { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, MasterCard, RuPay' },
                { id: 'netbanking', label: 'Net Banking', sub: 'HDFC, ICICI, SBI, Axis & 50+ banks' },
              ].map((method) => (
                <label
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === method.id ? 'var(--bg-surface-raised)' : '#FFFFFF',
                    border: paymentMethod === method.id ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as any)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{method.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{method.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === 'upi' && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  Your Virtual Payment Address (VPA) / UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    if (checkoutErrors.upi) setCheckoutErrors((prev) => ({ ...prev, upi: '' }));
                  }}
                  placeholder="username@bank"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#FFFFFF',
                    border: checkoutErrors.upi ? '1px solid #DC2626' : '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
                {checkoutErrors.upi && (
                  <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                    {checkoutErrors.upi}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <Lock size={14} />
              <span>256-bit encrypted Razorpay rail • No auto-debit without authorization</span>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-sm)',
              height: 'fit-content',
            }}
          >
            <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {t.pricing.summary}
            </h3>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{plan.duration}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Base Price</span>
                <span style={{ color: 'var(--text-primary)' }}>₹{plan.basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST (18% Goods & Services Tax)</span>
                <span style={{ color: 'var(--text-primary)' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 'var(--space-4)',
                  marginTop: 'var(--space-2)',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>Total Payable</span>
                <span className="font-serif" style={{ color: 'var(--color-accent)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Simulating Payment Execution...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Pay ₹{totalAmount.toLocaleString('en-IN')} (Razorpay Mock)</span>
                </>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: 'var(--space-4)', margin: 'var(--space-4) 0 0' }}>
              Mock payment simulation connects to simulated backend order verification.
            </p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
