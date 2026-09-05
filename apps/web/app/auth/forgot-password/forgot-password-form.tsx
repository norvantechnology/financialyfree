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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSent(true); // Always show success to prevent email enumeration
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
        <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto var(--space-3)' }} />
        <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#111827' }}>
          Check your email
        </h3>
        <p style={{ color: '#4B5563', fontSize: '13px', lineHeight: 1.5 }}>
          If an account exists for that address, recovery instructions have been sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <label htmlFor="fp-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          Email address
        </label>
        <div style={{ position: 'relative' }}>
          <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            id="fp-email"
            type="email"
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: `1px solid ${errors.email ? '#EF4444' : '#D1D5DB'}`,
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
            }}
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.email.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        style={{
          width: '100%',
          minHeight: '44px',
          marginTop: '6px',
          borderRadius: 'var(--radius-md)',
          background: '#0F172A',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          gap: '8px',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Sending recovery link…</span>
          </>
        ) : (
          <>
            <span>Send Reset Link</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
