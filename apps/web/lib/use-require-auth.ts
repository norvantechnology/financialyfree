'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  ensureFreshAccessToken,
  clearAuthStorage,
} from './auth-client';

/**
 * Client-side auth guard. Redirects to login when there is no valid access
 * or refresh token. Attempts a silent refresh once before redirecting.
 */
export function useRequireAuth(
  redirectTo = '/auth/login',
  enabled = true,
): { isAuthenticated: boolean; isLoading: boolean } {
  const router = useRouter();
  const checked = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    let cancelled = false;

    const goLogin = () => {
      if (checked.current) return;
      checked.current = true;
      clearAuthStorage();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const loginUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
    };

    const check = async () => {
      const access = getStoredAccessToken();
      const refresh = getStoredRefreshToken();
      if (access || refresh) {
        const token = await ensureFreshAccessToken();
        if (cancelled) return;
        if (token) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }
      if (cancelled) return;
      setIsAuthenticated(false);
      setIsLoading(false);
      goLogin();
    };

    void check();

    const onAuthChange = () => {
      checked.current = false;
      void check();
    };
    window.addEventListener('ff_auth_state_changed', onAuthChange);
    window.addEventListener('storage', onAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener('ff_auth_state_changed', onAuthChange);
      window.removeEventListener('storage', onAuthChange);
    };
  }, [enabled, redirectTo, router]);

  return { isAuthenticated, isLoading };
}
