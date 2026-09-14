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

/**
 * Safely parse a JWT payload in the browser.
 */
export function parseJwtPayload(token: string): { sub?: string; email?: string; role?: string; exp?: number; sessionId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
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
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 - bufferSeconds * 1000 <= Date.now();
}

/**
 * Retrieve the current access token from localStorage or document.cookie,
 * keeping both synchronized.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('accessToken');

  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (match && match[1]) {
      token = match[1];
      try {
        localStorage.setItem('accessToken', token);
      } catch {}
    }
  }

  // If token is found in localStorage but not cookie, sync to cookie
  if (token && typeof document !== 'undefined' && !document.cookie.includes('accessToken=')) {
    try {
      document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  }

  return token;
}

/**
 * Retrieve the refresh token from localStorage or document.cookie,
 * keeping both synchronized.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('refreshToken');

  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]+)/);
    if (match && match[1]) {
      token = match[1];
      try {
        localStorage.setItem('refreshToken', token);
      } catch {}
    }
  }

  if (token && typeof document !== 'undefined' && !document.cookie.includes('refreshToken=')) {
    try {
      document.cookie = `refreshToken=${token}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {}
  }

  return token;
}

/**
 * Retrieve the current user profile from localStorage.
 * If missing, attempts to reconstruct from the JWT access token payload.
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

  // Fallback: reconstruct minimal user profile from active JWT token
  if (!user) {
    const token = getStoredAccessToken();
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

/**
 * Notify all components and tabs of an auth state update.
 */
export function dispatchAuthChange(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('ff_auth_state_changed'));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

/**
 * Clear all authentication storage, cookies, and entitlements.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('ff_active_sub');

    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
    }
    dispatchAuthChange();
  } catch {}
}

/**
 * Get API base URL or relative path for client calls.
 * In browser, returns empty string so requests to `/api/v1/...` go through Next.js proxy rewrite,
 * eliminating CORS, devtunnel drops, and localhost network mismatches across devices.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Check if the database-backed global access mode is set to FREE.
 * Default is true per requirement. If explicitly set to 'SUBSCRIPTION' in DB/storage, returns false.
 */
export function isAllAccessFreeMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('ff_access_mode');
  if (stored === 'SUBSCRIPTION') return false;
  return true;
}

/**
 * Fetch and cache current platform access mode from backend API.
 */
export async function fetchAppAccessMode(): Promise<{ mode: 'FREE' | 'SUBSCRIPTION'; isAllAccessFree: boolean }> {
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

/**
 * Synchronously evaluate user authentication and pro subscription/entitlement status.
 * Automatically unlocks access for all users when isAllAccessFreeMode() is active.
 */
export function isUserSubscribed(): {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  isAllAccessFree: boolean;
  tier: 'guest' | 'authenticated' | 'entitled' | 'admin';
  user: StoredUser | null;
} {
  const isFree = isAllAccessFreeMode();
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, isSubscribed: isFree, isAllAccessFree: isFree, tier: isFree ? 'entitled' : 'guest', user: null };
  }

  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const storedUser = getStoredUser();

  if (!token && !refreshToken && !storedUser) {
    return { isLoggedIn: false, isSubscribed: isFree, isAllAccessFree: isFree, tier: isFree ? 'entitled' : 'guest', user: null };
  }

  if (storedUser?.role === 'admin') {
    return { isLoggedIn: true, isSubscribed: true, isAllAccessFree: isFree, tier: 'admin', user: storedUser };
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
        ['course_lifetime', 'tools_1yr', 'bundle_all', 'bundle_diy'].includes(s)
      ));

  if (hasEntitlement) {
    return { isLoggedIn: true, isSubscribed: true, isAllAccessFree: isFree, tier: 'entitled', user: storedUser };
  }

  return { isLoggedIn: true, isSubscribed: false, isAllAccessFree: isFree, tier: 'authenticated', user: storedUser };
}
