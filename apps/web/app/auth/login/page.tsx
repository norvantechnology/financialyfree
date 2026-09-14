import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In | FinanciallyFree Wealth & Research',
  description: 'Sign in to access your wealth planning and research room',
};

export default function LoginPage() {
  return (
    <div className="auth-page-container">
      {/* Top back navigation */}
      <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
        <Link
          href="/"
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
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Centered Institutional Modern Card */}
      <div className="auth-card-modern">
        {/* Emblem & Brand */}
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

          <h1 className="auth-header-title">Welcome back</h1>
          <p className="auth-header-subtitle">
            Sign in to access your research room & portfolios
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Switch link */}
        <div
          style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748B',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '16px',
          }}
        >
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            style={{ color: '#0F766E', fontWeight: 650, textDecoration: 'none' }}
          >
            Create account
          </Link>
        </div>
      </div>

      {/* AMFI Regulatory Tag */}
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
        <span>AMFI ARN-350272 • 256-bit SSL Security • DPDP Ready</span>
      </div>
    </div>
  );
}
