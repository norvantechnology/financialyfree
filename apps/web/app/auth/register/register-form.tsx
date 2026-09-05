'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@ff/validators';

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

  const password = watch('password', '');

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthColors = ['#DC2626', '#D97706', '#D97706', '#16A34A', '#0F766E'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { tokens?: { accessToken: string }; message?: string };
      if (!res.ok) {
        setApiError(json.message ?? 'Registration failed. Please try again.');
        return;
      }
      localStorage.setItem('accessToken', json.tokens?.accessToken ?? '');
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
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <CheckCircle2 size={48} color="#16A34A" style={{ margin: '0 auto var(--space-4)' }} />
        <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
          Account Created Successfully!
        </h3>
        <p style={{ color: '#4B5563', fontSize: '13px' }}>Taking you to your workspace…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {apiError && (
        <div
          style={{
            padding: '10px 12px',
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-md)',
            color: '#991B1B',
            fontSize: '12px',
          }}
        >
          {apiError}
        </div>
      )}

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
        <div>
          <label htmlFor="reg-fname" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            First name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              id="reg-fname"
              placeholder="Arjun"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: `1px solid ${errors.firstName ? '#EF4444' : '#D1D5DB'}`,
                color: '#111827',
                fontSize: '13px',
                outline: 'none',
              }}
              {...register('firstName')}
            />
          </div>
          {errors.firstName && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.firstName.message}</span>}
        </div>

        <div>
          <label htmlFor="reg-lname" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Last name
          </label>
          <input
            id="reg-lname"
            placeholder="Shah"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: `1px solid ${errors.lastName ? '#EF4444' : '#D1D5DB'}`,
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
            }}
            {...register('lastName')}
          />
          {errors.lastName && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.lastName.message}</span>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          Work or personal email
        </label>
        <div style={{ position: 'relative' }}>
          <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            id="reg-email"
            type="email"
            placeholder="arjun@example.com"
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
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

      {/* Phone */}
      <div>
        <label htmlFor="reg-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          Mobile phone (optional)
        </label>
        <div style={{ position: 'relative' }}>
          <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            id="reg-phone"
            type="tel"
            placeholder="+91 98765 43210"
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: `1px solid ${errors.phone ? '#EF4444' : '#D1D5DB'}`,
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
            }}
            {...register('phone')}
          />
        </div>
        {errors.phone && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.phone.message}</span>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="reg-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters"
            style={{
              width: '100%',
              padding: '9px 36px 9px 34px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: `1px solid ${errors.password ? '#EF4444' : '#D1D5DB'}`,
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
            }}
            autoComplete="new-password"
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
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{errors.password.message}</span>}

        {/* Strength meter */}
        {password && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    background: passwordStrength >= level ? strengthColors[passwordStrength] : '#E5E7EB',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
              Strength: {strengthLabels[passwordStrength]}
            </span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        style={{
          width: '100%',
          minHeight: '44px',
          marginTop: '8px',
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
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
