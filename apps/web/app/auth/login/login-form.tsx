'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema, type LoginInput } from '@ff/validators';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { tokens?: { accessToken: string }; message?: string };
      if (!res.ok) {
        setApiError(json.message ?? 'Login failed. Please try again.');
        return;
      }
      // Store tokens and redirect
      localStorage.setItem('accessToken', json.tokens?.accessToken ?? '');
      window.location.href = '/dashboard/goals';
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* API Error */}
      {apiError && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-danger-muted)',
          border: '1px solid hsl(4, 86%, 58%, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          fontSize: 'var(--font-size-sm)',
        }}>
          {apiError}
        </div>
      )}

      {/* Email */}
      <div className="form-group">
        <label htmlFor="login-email" className="form-label">Email address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="login-email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="you@example.com"
            style={{ paddingLeft: 40 }}
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="login-password" className="form-label">Password</label>
          <Link href="/auth/forgot-password" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-light)' }}>
            Forgot password?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            style={{ paddingLeft: 40, paddingRight: 44 }}
            autoComplete="current-password"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <span className="form-error">{errors.password.message}</span>}
      </div>

      {/* Submit */}
      <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: 'var(--space-2)' }}>
        {isLoading ? (
          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
        ) : (
          <>Sign In <ArrowRight size={16} /></>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
