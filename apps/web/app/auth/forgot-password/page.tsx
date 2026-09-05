import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reset Password | Aureus / FinanciallyFree Research Room',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return (
    <div
      className="auth-wrapper"
      style={{
        background: 'var(--bg-base, #F8F6F1)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          border: '1px solid var(--border-color, #E8E4DC)',
          borderRadius: 'var(--radius-xl, 14px)',
          padding: 'clamp(24px, 5vw, 36px)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '1.5px solid #D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '20px',
                background: 'rgba(217, 119, 6, 0.08)',
                marginBottom: '6px',
              }}
            >
              A
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                color: '#111827',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.08em',
              }}
            >
              AUREUS
            </div>
            <div
              style={{
                fontSize: '9px',
                color: '#6B7280',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              RESEARCH ROOM
            </div>
          </Link>

          <h1
            className="font-serif"
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary, #111827)',
              marginBottom: '4px',
            }}
          >
            Reset password
          </h1>
          <p style={{ color: 'var(--text-secondary, #4B5563)', fontSize: '13px' }}>
            Enter your email to receive secure recovery credentials
          </p>
        </div>

        <ForgotPasswordForm />

        <div
          style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            fontSize: '13px',
            borderTop: '1px solid var(--border-color, #E8E4DC)',
            paddingTop: 'var(--space-4)',
          }}
        >
          <Link
            href="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-primary, #0F172A)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted, #6B7280)',
          fontSize: '11px',
        }}
      >
        <Shield size={13} color="var(--color-accent, #0F766E)" />
        <span>AMFI Registered Distributor ARN-350272</span>
      </div>
    </div>
  );
}
