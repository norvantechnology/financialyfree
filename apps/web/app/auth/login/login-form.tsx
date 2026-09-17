'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { loginSchema, type LoginInput } from '@ff/validators';
import { getApiBaseUrl, dispatchAuthChange } from '../../../lib/auth-client';

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
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as {
        user?: { role: string; email: string; firstName?: string; lastName?: string; id?: string };
        tokens?: { accessToken: string; refreshToken?: string; expiresIn?: number };
        message?: string | string[];
      };
      if (!res.ok) {
        const errorMsg = Array.isArray(json.message)
          ? json.message.join(', ')
          : (json.message || 'Invalid email or password. Please check your credentials.');
        setApiError(errorMsg);
        return;
      }
      // Store tokens in both localStorage and cookies for seamless session persistence across reloads & SSR
      if (json.tokens?.accessToken) {
        localStorage.setItem('accessToken', json.tokens.accessToken);
        document.cookie = `accessToken=${json.tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      if (json.tokens?.refreshToken) {
        localStorage.setItem('refreshToken', json.tokens.refreshToken);
        document.cookie = `refreshToken=${json.tokens.refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (json.user) {
        localStorage.setItem('user', JSON.stringify(json.user));
      }
      // Dispatch immediate notification to all headers and components
      dispatchAuthChange();

      // Check for callbackUrl query parameter (set by auth middleware on protected route access)
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const callbackUrl = searchParams?.get('callbackUrl');
      const redirectParam = searchParams?.get('redirect'); // legacy fallback
      const destination = (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('/auth'))
        ? callbackUrl
        : (redirectParam && redirectParam.startsWith('/') ? redirectParam : null);

      if (destination) {
        window.location.href = destination;
      } else if (json.user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard/goals';
      }
    } catch {
      setApiError('Unable to connect to service. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [googleNotice, setGoogleNotice] = useState(false);

  const handleGoogleClick = () => {
    setGoogleNotice(true);
    setTimeout(() => setGoogleNotice(false), 5000);
  };

  return (
    <form
      method="POST"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        className="auth-google-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
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

      {googleNotice && (
        <div
          style={{
            fontSize: '11.5px',
            color: '#B45309',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '10px 12px',
            lineHeight: 1.45,
          }}
        >
          Google OAuth is enabled in production when <code>GOOGLE_CLIENT_ID</code> is configured. Please sign in with your email & password below.
        </div>
      )}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        <span style={{ padding: '0 12px', fontWeight: 600 }}>or email</span>
        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
      </div>

      {/* API Error */}
      {apiError && (
        <div
          style={{
            padding: '10px 12px',
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Email */}
      <div className="auth-form-group">
        <label htmlFor="login-email" className="auth-form-label">
          <span>Email address</span>
        </label>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Mail size={16} />
          </div>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="name@example.com"
            className={`auth-input ${errors.email ? 'has-error' : ''}`}
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email && <span className="auth-error-msg">{errors.email.message}</span>}
      </div>

      {/* Password */}
      <div className="auth-form-group">
        <div className="auth-form-label">
          <label htmlFor="login-password">Password</label>
          <Link
            href="/auth/forgot-password"
            style={{ fontSize: '12px', color: '#0F766E', textDecoration: 'none', fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Lock size={16} />
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            className={`auth-input ${errors.password ? 'has-error' : ''}`}
            style={{ paddingRight: '44px' }}
            autoComplete="current-password"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="auth-password-toggle-btn"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <span className="auth-error-msg">{errors.password.message}</span>}
      </div>

      {/* Remember me option */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0 6px' }}>
        <input
          id="remember-me"
          type="checkbox"
          defaultChecked
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#0F766E',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        />
        <label htmlFor="remember-me" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
          Keep me signed in on this device
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="auth-submit-btn"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
