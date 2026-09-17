'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAccessToken, getStoredRefreshToken, getStoredUser } from './auth-client';

/**
 * useRequireAuth
 *
 * Client-side auth guard hook. Use this in any page/component that requires the
 * user to be logged in. It complements the Edge Middleware (which handles the
 * server-side redirect) to also handle cases where auth state changes while the
 * user is already on the page (e.g. token expiry, manual localStorage clear).
 *
 * @param redirectTo  The path to redirect to if unauthenticated. Defaults to '/auth/login'.
 * @param enabled     Set to false to disable the guard (e.g. on public pages). Defaults to true.
 */
export function useRequireAuth(
  redirectTo = '/auth/login',
  enabled = true,
): { isAuthenticated: boolean; isLoading: boolean } {
  const router = useRouter();
  const checked = useRef(false);

  // We use a ref for loading to avoid triggering re-renders inside useEffect
  const isLoadingRef = useRef(true);
  const isAuthRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      isLoadingRef.current = false;
      isAuthRef.current = true;
      return;
    }

    const check = () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();
      const user = getStoredUser();
      const isAuthenticated = !!(accessToken || refreshToken || user);

      isAuthRef.current = isAuthenticated;
      isLoadingRef.current = false;

      if (!isAuthenticated && !checked.current) {
        checked.current = true;
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const loginUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
        router.replace(loginUrl);
      }
    };

    // Run immediately
    check();

    // Also re-check when auth state changes (e.g. another tab logs out)
    const onAuthChange = () => check();
    window.addEventListener('ff_auth_state_changed', onAuthChange);
    window.addEventListener('storage', onAuthChange);

    return () => {
      window.removeEventListener('ff_auth_state_changed', onAuthChange);
      window.removeEventListener('storage', onAuthChange);
    };
  }, [enabled, redirectTo, router]);

  return {
    isAuthenticated: isAuthRef.current,
    isLoading: isLoadingRef.current,
  };
}
