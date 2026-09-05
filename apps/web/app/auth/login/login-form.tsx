'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldAlert, User, ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginInput } from '@ff/validators';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const fillInvestorCreds = () => {
    setValue('email', 'investor@financiallyfree.in', { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
  };

  const fillAdminCreds = () => {
    setValue('email', 'admin@financiallyfree.in', { shouldValidate: true });
    setValue('password', 'AdminPassword123!', { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as {
        user?: { role: string; email: string };
        tokens?: { accessToken: string };
        message?: string;
      };
      if (!res.ok) {
        setApiError(json.message ?? 'Login failed. Please check credentials.');
        return;
      }
      // Store tokens
      if (json.tokens?.accessToken) {
        localStorage.setItem('accessToken', json.tokens.accessToken);
      }
      if (json.user) {
        localStorage.setItem('user', JSON.stringify(json.user));
      }
      // Role-aware redirect
      if (json.user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard/goals';
      }
    } catch {
      setApiError('Network error connecting to API. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Google Sign In Button (Reference Screenshot 1 Match) */}
      <button
        type="button"
        onClick={fillInvestorCreds}
        className="btn btn-outline"
        style={{
          width: '100%',
          minHeight: '42px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          color: '#374151',
          fontSize: '13px',
          fontWeight: 500,
          gap: '8px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', color: '#9CA3AF', fontSize: '11px' }}>
        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        <span style={{ padding: '0 10px', textTransform: 'uppercase' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
      </div>

      {/* 1-Click Demo Credentials Panel */}
      <div
        style={{
          background: 'var(--bg-surface-raised, #F4F1EA)',
          border: '1px solid var(--border-color, #E8E4DC)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #4B5563)', marginBottom: '8px' }}>
          <KeyRound size={12} color="var(--color-accent, #0F766E)" />
          <span>Demo Autofill Credentials:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={fillInvestorCreds}
            style={{
              padding: '6px 10px',
              minHeight: '34px',
              borderRadius: 'var(--radius-sm, 4px)',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: '#111827',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <User size={13} color="#4B5563" />
            <span>Investor</span>
          </button>
          <button
            type="button"
            onClick={fillAdminCreds}
            style={{
              padding: '6px 10px',
              minHeight: '34px',
              borderRadius: 'var(--radius-sm, 4px)',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: '#111827',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} color="#4B5563" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div
          style={{
            padding: '10px 12px',
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-md)',
            color: '#991B1B',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={15} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Email */}
      <div className="form-group">
        <label htmlFor="login-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          Email address
        </label>
        <div style={{ position: 'relative' }}>
          <Mail
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }}
          />
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email address"
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

      {/* Password */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label htmlFor="login-password" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            style={{ fontSize: '11px', color: '#4B5563', textDecoration: 'underline' }}
          >
            Forgot password?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }}
          />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            style={{
              width: '100%',
              padding: '10px 40px 10px 38px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: `1px solid ${errors.password ? '#EF4444' : '#D1D5DB'}`,
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
            }}
            autoComplete="current-password"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.password.message}</span>}
      </div>

      {/* Submit Button (Dark Navy Solid with Arrow) */}
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
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
