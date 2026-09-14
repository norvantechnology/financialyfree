import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reset Password | FinanciallyFree Wealth & Research',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page-container">
      {/* Top back navigation */}
      <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
        <Link
          href="/auth/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            color: '#64748B',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to sign in</span>
        </Link>
      </div>

      <div className="auth-card-modern">
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <Link href="/" className="auth-brand-emblem">
            <div className="auth-emblem-circle">FF</div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                color: '#111827',
                fontWeight: 700,
                fontSize: '13.5px',
                letterSpacing: '0.08em',
              }}
            >
              FINANCIALLYFREE
            </div>
            <div
              style={{
                fontSize: '9px',
                color: '#64748B',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginTop: '1px',
              }}
            >
              WEALTH & RESEARCH
            </div>
          </Link>

          <h1 className="auth-header-title">Reset password</h1>
          <p className="auth-header-subtitle">
            Enter your email to receive secure recovery credentials
          </p>
        </div>

        <ForgotPasswordForm />

        <div
          style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '13px',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '16px',
          }}
        >
          <Link
            href="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0F766E',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to sign in</span>
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          color: '#64748B',
          fontSize: '11px',
          maxWidth: '100%',
          textAlign: 'center',
        }}
      >
        <Shield size={13} color="#0F766E" />
        <span>AMFI ARN-350272 • 256-bit SSL Security</span>
      </div>
    </div>
  );
}
