import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join FinanciallyFree — start your goal-based investing journey today',
};

export default function RegisterPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      background: `
        radial-gradient(ellipse 70% 50% at 50% 0%, hsl(158, 64%, 42%, 0.12), transparent),
        var(--bg-base)
      `,
    }}>
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

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-1)' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Free to join. Set your first goal in minutes.</p>
        </div>

        <RegisterForm />

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Already have an account? </span>
          <Link href="/auth/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Sign in
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', maxWidth: 380 }}>
        <Shield size={12} style={{ flexShrink: 0 }} />
        AMFI Distributor ARN-350272 · Education platform · Not investment advice · Mutual fund investments are subject to market risk
      </div>
    </div>
  );
}
