'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle2, ShieldAlert, Check } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@ff/validators';
import { getApiBaseUrl, dispatchAuthChange } from '../../../lib/auth-client';

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = watch('password', '') || '';

  // Requirement checks matching schema
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passwordStrength = (() => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score;
  })();

  const strengthColors = ['#E2E8F0', '#DC2626', '#D97706', '#D97706', '#0F766E'];
  const strengthLabels = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong'];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const apiBase = getApiBaseUrl();

      // Clean and sanitize payload
      const cleanedPhone = data.phone?.trim()
        ? data.phone.trim().replace(/\D/g, '').slice(-10)
        : undefined;

      const payload = {
        ...data,
        phone: cleanedPhone && cleanedPhone.length === 10 ? cleanedPhone : undefined,
      };

      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        tokens?: { accessToken: string; refreshToken?: string };
        user?: any;
        message?: string | string[];
      };
      if (!res.ok) {
        const errorMsg = Array.isArray(json.message)
          ? json.message.join(', ')
          : (json.message || 'Registration failed. Please try again.');
        setApiError(errorMsg);
        return;
      }
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
      dispatchAuthChange();
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard/goals';
      }, 1200);
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <CheckCircle2 size={48} color="#0F766E" style={{ margin: '0 auto 16px' }} />
        <h3 className="auth-header-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
          Account Created Successfully!
        </h3>
        <p style={{ color: '#64748B', fontSize: '13.5px' }}>Taking you to your workspace…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
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
            marginBottom: '14px',
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Responsive Name Row (2-col on Laptop, Stacked on Mobile) */}
      <div className="auth-grid-2col">
        {/* First Name */}
        <div className="auth-form-group">
          <label htmlFor="reg-fname" className="auth-form-label">
            <span>First name</span>
          </label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <User size={15} />
            </div>
            <input
              id="reg-fname"
              placeholder="e.g. Arjun"
              autoComplete="given-name"
              className={`auth-input ${errors.firstName ? 'has-error' : ''}`}
              {...register('firstName')}
            />
          </div>
          {errors.firstName && <span className="auth-error-msg">{errors.firstName.message}</span>}
        </div>

        {/* Last Name */}
        <div className="auth-form-group">
          <label htmlFor="reg-lname" className="auth-form-label">
            <span>Last name</span>
          </label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <User size={15} />
            </div>
            <input
              id="reg-lname"
              placeholder="e.g. Shah"
              autoComplete="family-name"
              className={`auth-input ${errors.lastName ? 'has-error' : ''}`}
              {...register('lastName')}
            />
          </div>
          {errors.lastName && <span className="auth-error-msg">{errors.lastName.message}</span>}
        </div>
      </div>

      {/* Email */}
      <div className="auth-form-group">
        <label htmlFor="reg-email" className="auth-form-label">
          <span>Work or personal email</span>
        </label>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Mail size={15} />
          </div>
          <input
            id="reg-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="arjun@example.com"
            autoComplete="email"
            className={`auth-input ${errors.email ? 'has-error' : ''}`}
            {...register('email')}
          />
        </div>
        {errors.email && <span className="auth-error-msg">{errors.email.message}</span>}
      </div>

      {/* Phone (Optional) */}
      <div className="auth-form-group">
        <label htmlFor="reg-phone" className="auth-form-label">
          <span>Mobile phone <span style={{ fontWeight: 400, color: '#64748B' }}>(optional)</span></span>
        </label>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Phone size={15} />
          </div>
          <input
            id="reg-phone"
            type="tel"
            inputMode="tel"
            placeholder="10-digit mobile number"
            autoComplete="tel"
            className={`auth-input ${errors.phone ? 'has-error' : ''}`}
            {...register('phone', {
              setValueAs: (val) => {
                if (!val || typeof val !== 'string' || !val.trim()) return undefined;
                const digits = val.replace(/\D/g, '').slice(-10);
                return digits.length === 10 ? digits : val.trim();
              },
            })}
          />
        </div>
        {errors.phone && <span className="auth-error-msg">{errors.phone.message}</span>}
      </div>

      {/* Password */}
      <div className="auth-form-group">
        <label htmlFor="reg-password" className="auth-form-label">
          <span>Password</span>
        </label>
        <div className="auth-input-wrapper">
          <div className="auth-input-icon">
            <Lock size={15} />
          </div>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            className={`auth-input ${errors.password ? 'has-error' : ''}`}
            style={{ paddingRight: '44px' }}
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

        {/* Real-time Requirement Checklist */}
        <div className="auth-req-list">
          <div className={`auth-req-item ${hasMinLength ? 'met' : ''}`}>
            {hasMinLength ? <Check size={12} color="#0F766E" /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />}
            <span>8+ characters</span>
          </div>
          <div className={`auth-req-item ${hasUppercase ? 'met' : ''}`}>
            {hasUppercase ? <Check size={12} color="#0F766E" /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />}
            <span>1 uppercase (A-Z)</span>
          </div>
          <div className={`auth-req-item ${hasNumber ? 'met' : ''}`}>
            {hasNumber ? <Check size={12} color="#0F766E" /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />}
            <span>1 number (0-9)</span>
          </div>
          <div className={`auth-req-item ${hasSpecial ? 'met' : ''}`}>
            {hasSpecial ? <Check size={12} color="#0F766E" /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />}
            <span>1 special symbol</span>
          </div>
        </div>

        {/* Strength Progress Meter */}
        {password.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '999px', overflow: 'hidden' }}>
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    background: passwordStrength >= level ? strengthColors[passwordStrength] : '#E2E8F0',
                    transition: 'background 0.2s ease',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Security: <strong style={{ color: strengthColors[passwordStrength] }}>{strengthLabels[passwordStrength]}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Terms & Privacy checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '6px 0 10px' }}>
        <input
          id="reg-terms"
          type="checkbox"
          defaultChecked
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#0F766E',
            cursor: 'pointer',
            borderRadius: '4px',
            marginTop: '2px',
          }}
        />
        <label htmlFor="reg-terms" style={{ fontSize: '12px', color: '#64748B', cursor: 'pointer', lineHeight: 1.45 }}>
          I agree to the <Link href="/legal/terms" target="_blank" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link> and <Link href="/legal/privacy-policy" target="_blank" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
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
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create Free Account</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
