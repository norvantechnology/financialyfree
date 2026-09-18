'use client';

export interface StoredUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  entitlements?: string[];
  [key: string]: any;
}

/** Access cookie ~1 day (JWT itself is short-lived; refresh renews it). */
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24;
/** Remember-me refresh cookie: 60 days. */
export const REFRESH_COOKIE_MAX_AGE_REMEMBER = 60 * 60 * 24 * 60;
/** Without remember-me: 1 day refresh. */
export const REFRESH_COOKIE_MAX_AGE_SESSION = 60 * 60 * 24;

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Safely parse a JWT payload in the browser.
 */
export function parseJwtPayload(token: string): {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  sessionId?: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired (with an optional buffer in seconds, defaults to 5s).
 */
export function isTokenExpired(token: string, bufferSeconds = 5): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 - bufferSeconds * 1000 <= Date.now();
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

/**
 * Persist access + refresh tokens to localStorage and cookies.
 */
export function persistAuthTokens(opts: {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
  rememberMe?: boolean;
}): void {
  if (typeof window === 'undefined') return;
  const rememberMe = opts.rememberMe !== false;
  const accessMax = Math.max(60, opts.expiresIn || ACCESS_COOKIE_MAX_AGE);
  const refreshMax = rememberMe ? REFRESH_COOKIE_MAX_AGE_REMEMBER : REFRESH_COOKIE_MAX_AGE_SESSION;

  try {
    localStorage.setItem('accessToken', opts.accessToken);
    writeCookie('accessToken', opts.accessToken, accessMax);
    localStorage.setItem('ff_remember_me', rememberMe ? '1' : '0');

    if (opts.refreshToken) {
      localStorage.setItem('refreshToken', opts.refreshToken);
      writeCookie('refreshToken', opts.refreshToken, refreshMax);
    }
  } catch {
    /* ignore quota / private mode */
  }
  dispatchAuthChange();
}

function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = localStorage.getItem('ff_remember_me');
    if (v === '0') return false;
  } catch {}
  return true;
}

/**
 * Retrieve a non-expired access token from localStorage or cookie.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('accessToken');

  if (!token) {
    token = readCookie('accessToken');
    if (token) {
      try {
        localStorage.setItem('accessToken', token);
      } catch {}
    }
  }

  if (!token) return null;
  if (isTokenExpired(token)) return null;

  if (typeof document !== 'undefined' && !document.cookie.includes('accessToken=')) {
    writeCookie('accessToken', token, ACCESS_COOKIE_MAX_AGE);
  }

  return token;
}

/**
 * Retrieve a non-expired refresh token from localStorage or cookie.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('refreshToken');

  if (!token) {
    token = readCookie('refreshToken');
    if (token) {
      try {
        localStorage.setItem('refreshToken', token);
      } catch {}
    }
  }

  if (!token) return null;
  if (isTokenExpired(token)) return null;

  if (typeof document !== 'undefined' && !document.cookie.includes('refreshToken=')) {
    writeCookie(
      'refreshToken',
      token,
      getRememberMePreference() ? REFRESH_COOKIE_MAX_AGE_REMEMBER : REFRESH_COOKIE_MAX_AGE_SESSION,
    );
  }

  return token;
}

/**
 * Ensure a valid access token - silently refresh when expired.
 * Returns null and clears auth when refresh is impossible.
 */
export async function ensureFreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const existing = getStoredAccessToken();
  if (existing) return existing;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (!res.ok) {
        clearAuthStorage();
        return null;
      }
      const data = await res.json();
      const newAccess = data.tokens?.accessToken || data.accessToken;
      const newRefresh = data.tokens?.refreshToken || data.refreshToken;
      const expiresIn = data.tokens?.expiresIn || data.expiresIn || 900;
      if (!newAccess) {
        clearAuthStorage();
        return null;
      }
      persistAuthTokens({
        accessToken: newAccess,
        refreshToken: newRefresh || refreshToken,
        expiresIn,
        rememberMe: getRememberMePreference(),
      });
      return newAccess;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Redirect to login with callbackUrl when the session cannot be restored.
 */
export function redirectToLogin(callbackPath?: string): void {
  if (typeof window === 'undefined') return;
  clearAuthStorage();
  const path = callbackPath || window.location.pathname + window.location.search;
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(path || '/options-lab')}`;
  window.location.href = loginUrl;
}

/**
 * Retrieve the current user profile from localStorage.
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;

  let user: StoredUser | null = null;
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      user = JSON.parse(stored);
    }
  } catch {}

  if (!user) {
    const token = getStoredAccessToken() || getStoredRefreshToken();
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload && payload.email) {
        user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role || 'user',
        };
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch {}
      }
    }
  }

  return user;
}

export function dispatchAuthChange(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('ff_auth_state_changed'));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('ff_active_sub');
    localStorage.removeItem('ff_remember_me');

    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
    }
    dispatchAuthChange();
  } catch {}
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export function isAllAccessFreeMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('ff_access_mode');
  if (stored === 'SUBSCRIPTION') return false;
  return true;
}

export async function fetchAppAccessMode(): Promise<{
  mode: 'FREE' | 'SUBSCRIPTION';
  isAllAccessFree: boolean;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/app-config/access-mode`);
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined' && data?.mode) {
        const prev = localStorage.getItem('ff_access_mode');
        localStorage.setItem('ff_access_mode', data.mode);
        if (prev !== data.mode) {
          window.dispatchEvent(new Event('ff_auth_state_changed'));
          window.dispatchEvent(new Event('storage'));
        }
      }
      return {
        mode: data.mode === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'FREE',
        isAllAccessFree: data.mode !== 'SUBSCRIPTION',
      };
    }
  } catch (err) {
    console.warn('Could not fetch app access mode', err);
  }
  return {
    mode: isAllAccessFreeMode() ? 'FREE' : 'SUBSCRIPTION',
    isAllAccessFree: isAllAccessFreeMode(),
  };
}

export function isUserSubscribed(): {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  isAllAccessFree: boolean;
  tier: 'guest' | 'authenticated' | 'entitled' | 'admin';
  user: StoredUser | null;
} {
  const isFree = isAllAccessFreeMode();
  if (typeof window === 'undefined') {
    return {
      isLoggedIn: false,
      isSubscribed: isFree,
      isAllAccessFree: isFree,
      tier: isFree ? 'entitled' : 'guest',
      user: null,
    };
  }

  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const storedUser = getStoredUser();

  if (!token && !refreshToken) {
    return {
      isLoggedIn: false,
      isSubscribed: isFree,
      isAllAccessFree: isFree,
      tier: isFree ? 'entitled' : 'guest',
      user: null,
    };
  }

  if (storedUser?.role === 'admin') {
    return {
      isLoggedIn: true,
      isSubscribed: true,
      isAllAccessFree: isFree,
      tier: 'admin',
      user: storedUser,
    };
  }

  let hasActiveSub = false;
  try {
    const subStr = localStorage.getItem('ff_active_sub');
    if (subStr) {
      const parsed = JSON.parse(subStr);
      if (parsed?.active) hasActiveSub = true;
    }
  } catch {}

  const hasEntitlement =
    isFree ||
    hasActiveSub ||
    storedUser?.role === 'investor' ||
    (Array.isArray(storedUser?.entitlements) &&
      storedUser.entitlements.some((s: string) =>
        ['course_lifetime', 'tools_1yr', 'bundle_all', 'bundle_diy'].includes(s),
      ));

  if (hasEntitlement) {
    return {
      isLoggedIn: true,
      isSubscribed: true,
      isAllAccessFree: isFree,
      tier: 'entitled',
      user: storedUser,
    };
  }

  return {
    isLoggedIn: true,
    isSubscribed: false,
    isAllAccessFree: isFree,
    tier: 'authenticated',
    user: storedUser,
  };
}
