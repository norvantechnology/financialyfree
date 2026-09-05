'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function KycOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pan, setPan] = useState('ABCDE1234F');
  const [dob, setDob] = useState('15-08-1990');
  const [aadhaarLast4, setAadhaarLast4] = useState('5678');
  const [bankAccount, setBankAccount] = useState('50100234567890');
  const [ifsc, setIfsc] = useState('HDFC0000060');

  const [isLoading, setIsLoading] = useState(false);
  const [kraResult, setKraResult] = useState<{
    verified: boolean;
    name: string;
    kra: string;
    ucc: string;
  } | null>(null);

  const handleVerifyPan = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setKraResult({
        verified: true,
        name: 'RAHUL SHARMA',
        kra: 'CVL KRA (SEBI Registered)',
        ucc: `UCC_FF_${pan.slice(0, 5)}_${Date.now().toString(36).toUpperCase()}`,
      });
      setStep(2);
    }, 1200);
  };

  const handleDigiLocker = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleCompleteKyc = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Store in localStorage to simulate verified KYC
      localStorage.setItem(
        'ff_kyc_status',
        JSON.stringify({
          status: 'verified',
          pan: `XXXXX${pan.slice(5)}`,
          ucc: kraResult?.ucc,
          verifiedAt: new Date().toISOString(),
        }),
      );
      setStep(3);
      alert('KYC Verified successfully! BSE StAR MF UCC activated.');
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '780px', margin: 'var(--space-12) auto', padding: '0 var(--space-6)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
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
          <ShieldCheck size={14} />
          <span>SEBI & AMFI Mandated Investor Onboarding</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Mutual Fund KYC Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '540px', margin: '0 auto' }}>
          One-time paperless identity verification per SEBI Master Circular on KYC for Mutual Fund investments.
        </p>
      </div>

      {/* Stepper Progress */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0,
          }}
        />
        {[
          { num: 1, title: 'PAN & KRA Check', icon: FileText },
          { num: 2, title: 'DigiLocker e-KYC', icon: CreditCard },
          { num: 3, title: 'BSE UCC & Bank', icon: Building },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: isDone
                    ? 'var(--color-success-500)'
                    : isCurrent
                    ? 'var(--color-primary-500)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isCurrent ? '3px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  boxShadow: isCurrent ? '0 4px 14px rgba(14, 165, 233, 0.4)' : 'none',
                }}
              >
                {isDone ? <CheckCircle2 size={20} /> : <Icon size={18} />}
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content Cards */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        }}
      >
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Step 1: Enter PAN & Date of Birth
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              We will instantly query CVL KRA and CAMS KRA to see if you are already KYC-compliant.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: 'var(--text-base)',
                    letterSpacing: '0.1em',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Date of Birth (as per PAN)
                </label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              <AlertCircle size={16} color="var(--color-primary-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Your PAN is stored encrypted using AES-256 and only used to query SEBI-registered KYC Registration
                Agencies (KRAs) and BSE StAR MF.
              </span>
            </div>

            <button
              onClick={handleVerifyPan}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
              <span>Verify with KRA</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Step 2: DigiLocker Aadhaar e-KYC Verification
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              KRA check verified. Confirm your Aadhaar details via paperless DigiLocker OTP authentication.
            </p>

            {kraResult && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>KRA Match Status</div>
                  <strong style={{ color: 'var(--color-success-400)', fontSize: 'var(--text-sm)' }}>
                    Verified — {kraResult.name}
                  </strong>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Agency: {kraResult.kra}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Aadhaar Last 4 Digits
              </label>
              <input
                type="text"
                value={aadhaarLast4}
                onChange={(e) => setAadhaarLast4(e.target.value)}
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  letterSpacing: '0.2em',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '14px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={handleDigiLocker}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Simulate DigiLocker OTP Verification</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Step 3: Bank Account & BSE StAR MF UCC Activation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              Set up your investment bank account for automated SIP debits via BSE StAR MF NACH / AutoPay mandate.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            {kraResult && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>BSE Unique Client Code (UCC):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                    {kraResult.ucc}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Distributor Partner ARN:</span>
                  <span style={{ fontWeight: 600 }}>ARN-350272</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCompleteKyc}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: 'var(--space-4)',
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Complete Verification & Activate BSE UCC</span>
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link
                href="/dashboard/invest"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-primary-400)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <span>Proceed directly to Mutual Fund Discovery</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
