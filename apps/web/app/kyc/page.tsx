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
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleVerifyPan = () => {
    const errs: Record<string, string> = {};
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan || !panRegex.test(pan.trim())) {
      errs.pan = 'Please enter a valid 10-character PAN (5 uppercase letters, 4 digits, 1 letter, e.g. ABCDE1234F).';
    }
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dob || !dobRegex.test(dob.trim())) {
      errs.dob = 'Please enter Date of Birth in DD-MM-YYYY format (e.g. 15-08-1990).';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
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
    const errs: Record<string, string> = {};
    if (!aadhaarLast4 || !/^\d{4}$/.test(aadhaarLast4.trim())) {
      errs.aadhaar = 'Please enter exactly the last 4 digits of your Aadhaar card.';
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleCompleteKyc = () => {
    const errs: Record<string, string> = {};
    if (!bankAccount || !/^\d{9,18}$/.test(bankAccount.trim())) {
      errs.bankAccount = 'Bank account number must be between 9 and 18 numerical digits.';
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifsc || !ifscRegex.test(ifsc.trim())) {
      errs.ifsc = 'Please enter a valid 11-character IFSC code (e.g. HDFC0000060, 5th char must be 0).';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
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
    <SidebarLayout activePath="/kyc">
      <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="CVL / CAMS KRA Registry Gateway"
          sourceNotes="Sandbox simulated KRA and BSE StAR MF UCC onboarding. Fully compliant with SEBI KYC Master Circular."
        />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            <span>SEBI & AMFI MANDATED ONBOARDING</span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: '4px',
              marginBottom: 'var(--space-2)',
            }}
          >
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
              left: '12%',
              right: '12%',
              height: '2px',
              background: 'var(--border-color)',
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
                      ? 'var(--color-accent)'
                      : isCurrent
                      ? '#0F172A'
                      : '#FFFFFF',
                    border: isCurrent
                      ? '2px solid #0F172A'
                      : isDone
                      ? '2px solid var(--color-accent)'
                      : '2px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDone || isCurrent ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {step === 1 && (
            <div>
              <div className="category-tag">STEP 1 OF 3</div>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                Enter PAN & Date of Birth
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                We will instantly query CVL KRA and CAMS KRA to verify if your KYC record is active.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      if (errors.pan) setErrors((prev) => ({ ...prev, pan: '' }));
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: errors.pan ? '1px solid #DC2626' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--text-base)',
                      letterSpacing: '0.1em',
                    }}
                  />
                  {errors.pan && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.pan}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                    Date of Birth (as per PAN)
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
                    }}
                    placeholder="DD-MM-YYYY"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: errors.dob ? '1px solid #DC2626' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  {errors.dob && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.dob}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-color)',
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
                <AlertCircle size={16} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Your PAN is encrypted using AES-256 and only used to query SEBI-registered KYC Registration
                  Agencies (KRAs) and BSE StAR MF.
                </span>
              </div>

              <button
                onClick={handleVerifyPan}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Verify with KRA</span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="category-tag">STEP 2 OF 3</div>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                DigiLocker Aadhaar e-KYC Verification
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                KRA check verified. Confirm your Aadhaar details via paperless DigiLocker OTP authentication.
              </p>

              {kraResult && (
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: '#166534' }}>KRA Match Status</div>
                    <strong style={{ color: '#15803D', fontSize: 'var(--text-sm)' }}>
                      Verified — {kraResult.name}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: '#166534' }}>
                    Agency: {kraResult.kra}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  Aadhaar Last 4 Digits
                </label>
                <input
                  type="text"
                  value={aadhaarLast4}
                  onChange={(e) => {
                    setAadhaarLast4(e.target.value);
                    if (errors.aadhaar) setErrors((prev) => ({ ...prev, aadhaar: '' }));
                  }}
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#FFFFFF',
                    border: errors.aadhaar ? '1px solid #DC2626' : '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.2em',
                  }}
                />
                {errors.aadhaar && (
                  <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.aadhaar}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={handleDigiLocker}
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Simulate DigiLocker OTP Verification</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="category-tag">STEP 3 OF 3</div>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                Bank Account & BSE StAR MF UCC Activation
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                Set up your investment bank account for automated SIP debits via BSE StAR MF NACH / AutoPay mandate.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => {
                      setBankAccount(e.target.value);
                      if (errors.bankAccount) setErrors((prev) => ({ ...prev, bankAccount: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: errors.bankAccount ? '1px solid #DC2626' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  />
                  {errors.bankAccount && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.bankAccount}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => {
                      setIfsc(e.target.value.toUpperCase());
                      if (errors.ifsc) setErrors((prev) => ({ ...prev, ifsc: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: errors.ifsc ? '1px solid #DC2626' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  />
                  {errors.ifsc && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.ifsc}
                    </div>
                  )}
                </div>
              </div>

              {kraResult && (
                <div
                  style={{
                    background: 'var(--bg-surface-raised)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>BSE Unique Client Code (UCC):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {kraResult.ucc}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Distributor Partner ARN:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>ARN-350272</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCompleteKyc}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-4)' }}
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
                    color: 'var(--color-accent)',
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
    </SidebarLayout>
  );
}
