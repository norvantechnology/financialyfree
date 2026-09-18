'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@ff/validators';
import { getApiBaseUrl } from '../../../lib/auth-client';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/api/v1/auth/forgot-password`, {
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
      <div style={{ textAlign: 'center', padding: '24px 8px' }}>
        <CheckCircle2 size={44} color="#0F766E" style={{ margin: '0 auto 14px' }} />
        <h3 className="auth-header-title" style={{ fontSize: '18px', marginBottom: '6px' }}>
          Check your email
        </h3>
        <p style={{ color: '#64748B', fontSize: '13px', lineHeight: 1.5 }}>
          If an account exists for that address, recovery instructions have been sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="auth-form-group">
        <label htmlFor="fp-email" className="auth-form-label">
          <span>Email address</span>
        </label>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Mail size={15} />
          </div>
          <input
            id="fp-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="name@example.com"
            autoComplete="email"
            className={`auth-input ${errors.email ? 'has-error' : ''}`}
            {...register('email')}
          />
        </div>
        {errors.email && <span className="auth-error-msg">{errors.email.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="auth-submit-btn"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Sending recovery link...</span>
          </>
        ) : (
          <>
            <span>Send Reset Link</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
