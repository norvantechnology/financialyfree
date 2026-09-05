import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your FinanciallyFree account',
};

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      background: `
        radial-gradient(ellipse 70% 50% at 50% 0%, hsl(221, 83%, 53%, 0.15), transparent),
        var(--bg-base)
      `,
    }}>
      {/* Logo */}
      <Link href="/" style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'white', fontSize: 18,
        }}>FF</div>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)' }}>FinanciallyFree</span>
      </Link>

      {/* Card */}
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-1)' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Sign in to continue your financial journey</p>
        </div>

        <LoginForm />

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Don&apos;t have an account?{' '}
          </span>
          <Link href="/auth/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Create one free
          </Link>
        </div>
      </div>

      {/* Compliance footer */}
      <div style={{ marginTop: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
        <Shield size={12} />
        AMFI Distributor ARN-350272 · Not investment advice
      </div>
    </div>
  );
}
