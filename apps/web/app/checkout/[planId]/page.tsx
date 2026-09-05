'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n/language-context';

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
  const [upiId, setUpiId] = useState('investor@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    paymentId: string;
    totalPaid: number;
  } | null>(null);

  const gstAmount = Math.round(plan.basePrice * 0.18 * 100) / 100;
  const totalAmount = Math.round((plan.basePrice + gstAmount) * 100) / 100;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    // Simulate Razorpay order creation and signature callback
    setTimeout(() => {
      const mockOrderId = `order_mock_${Date.now().toString(36)}`;
      const mockPaymentId = `pay_mock_${Date.now().toString(36)}`;

      // Store in local storage to simulate active subscription session
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
    }, 1200);
  };

  if (isSuccess && receiptData) {
    return (
      <div style={{ maxWidth: '640px', margin: 'var(--space-12) auto', padding: '0 var(--space-6)' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-10)',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-6)',
            }}
          >
            <CheckCircle2 size={36} color="var(--color-success-400)" />
          </div>

          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            {t.pricing.paymentSuccess}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            {t.pricing.orderConfirmed}
          </p>

          {/* Receipt Card */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'left',
              marginBottom: 'var(--space-8)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
              <span style={{ fontWeight: 600 }}>{plan.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Reference</span>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{receiptData.paymentId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Paid (incl 18% GST)</span>
              <span style={{ fontWeight: 700, color: 'var(--color-success-400)' }}>
                ₹{receiptData.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span style={{ color: 'var(--color-success-400)', fontWeight: 600 }}>Active (Verified)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
              }}
            >
              <span>Go to Courses</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/billing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              View Billing & Entitlements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: 'var(--space-12) auto', padding: '0 var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Checkout & Order Confirmation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Complete your enrollment securely via Razorpay payment rails.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Payment Method Selection */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
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
                  background: paymentMethod === method.id ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: paymentMethod === method.id ? '1px solid var(--color-primary-500)' : '1px solid rgba(255, 255, 255, 0.06)',
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
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{method.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{method.sub}</div>
                </div>
              </label>
            ))}
          </div>

          {paymentMethod === 'upi' && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Your Virtual Payment Address (VPA) / UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@bank"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: 'var(--text-sm)',
                }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <Lock size={14} />
            <span>256-bit encrypted Razorpay test rail • No auto-debit without authorization</span>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            {t.pricing.summary}
          </h3>

          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: '4px' }}>{plan.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{plan.duration}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Base Price</span>
              <span>₹{plan.basePrice.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>GST (18% Goods & Services Tax)</span>
              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-lg)',
                fontWeight: 800,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: 'var(--space-4)',
                marginTop: 'var(--space-2)',
              }}
            >
              <span>Total Payable</span>
              <span style={{ color: 'var(--color-primary-400)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
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

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>
            Mock payment simulation connects to simulated backend order verification.
          </p>
        </div>
      </div>
    </div>
  );
}
