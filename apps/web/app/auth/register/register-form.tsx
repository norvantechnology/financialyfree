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

  const strengthColors = ['var(--color-danger)', 'var(--color-warning)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-accent)'];
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
      const json = await res.json() as { tokens?: { accessToken: string }; message?: string };
      if (!res.ok) {
        setApiError(json.message ?? 'Registration failed. Please try again.');
        return;
      }
      localStorage.setItem('accessToken', json.tokens?.accessToken ?? '');
      setSuccess(true);
      setTimeout(() => { window.location.href = '/dashboard/goals'; }, 1200);
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <CheckCircle2 size={48} color="var(--color-accent)" style={{ margin: '0 auto var(--space-4)' }} />
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Account Created!</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Taking you to your goals…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {apiError && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-danger-muted)',
          border: '1px solid hsl(4, 86%, 58%, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          fontSize: 'var(--font-size-sm)',
        }}>{apiError}</div>
      )}

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group">
          <label htmlFor="reg-fname" className="form-label">First name</label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input id="reg-fname" className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Priya" style={{ paddingLeft: 36 }} {...register('firstName')} />
          </div>
          {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="reg-lname" className="form-label">Last name</label>
          <input id="reg-lname" className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Sharma" {...register('lastName')} />
          {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="reg-email" className="form-label">Email address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input id="reg-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" style={{ paddingLeft: 40 }} autoComplete="email" {...register('email')} />
        </div>
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </div>

      {/* Phone */}
      <div className="form-group">
        <label htmlFor="reg-phone" className="form-label">Mobile number <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
        <div style={{ position: 'relative' }}>
          <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input id="reg-phone" type="tel" className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="9876543210" style={{ paddingLeft: 40 }} inputMode="numeric" {...register('phone')} />
        </div>
        {errors.phone && <span className="form-error">{errors.phone.message}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="reg-password" className="form-label">Create password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="reg-password" type={showPassword ? 'text' : 'password'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            style={{ paddingLeft: 40, paddingRight: 44 }}
            autoComplete="new-password"
            {...register('password')}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide' : 'Show'}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Password strength meter */}
        {password.length > 0 && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  height: 3, flex: 1, borderRadius: 2,
                  background: i <= passwordStrength ? strengthColors[passwordStrength] : 'var(--bg-border)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: strengthColors[passwordStrength] }}>
              {strengthLabels[passwordStrength]}
            </span>
          </div>
        )}
        {errors.password && <span className="form-error">{errors.password.message}</span>}
      </div>

      <button type="submit" className="btn btn-accent" disabled={isLoading} style={{ marginTop: 'var(--space-2)' }}>
        {isLoading
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
          : <>Create Free Account <ArrowRight size={16} /></>}
      </button>

      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
