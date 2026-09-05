import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)',
      background: 'var(--bg-base)',
    }}>
      <Link href="/" style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 18 }}>FF</div>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)' }}>FinanciallyFree</span>
      </Link>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-1)' }}>Reset password</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Enter your email and we&apos;ll send a reset link</p>
        </div>
        <ForgotPasswordForm />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <Link href="/auth/login" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--font-size-sm)' }}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
