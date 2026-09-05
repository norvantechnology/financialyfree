'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@ff/validators';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      setSent(true); // Always show success to prevent email enumeration
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
        <CheckCircle2 size={40} color="var(--color-accent)" style={{ margin: '0 auto var(--space-3)' }} />
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Check your email</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          If an account exists for that email, a reset link has been sent. Check your spam folder if you don't see it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="form-group">
        <label htmlFor="fp-email" className="form-label">Email address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input id="fp-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" style={{ paddingLeft: 40 }} {...register('email')} />
        </div>
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <>Send Reset Link <ArrowRight size={16} /></>}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
