'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { getStoredAccessToken, getApiBaseUrl } from '../lib/auth-client';
import { useRouter } from 'next/navigation';

export interface WatchlistButtonProps {
  symbol: string;
  companyName?: string;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'icon';
  initialWatchlisted?: boolean;
  onWatchlistToggled?: (isWatchlisted: boolean) => void;
}

export function WatchlistButton({
  symbol,
  companyName,
  size = 'sm',
  variant = 'pill',
  initialWatchlisted = false,
  onWatchlistToggled,
}: WatchlistButtonProps) {
  const router = useRouter();
  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(initialWatchlisted);
  const [itemId, setItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const cleanSymbol = (symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');

  // Check initial state from backend if user is authenticated
  const checkStatus = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token || !cleanSymbol) return;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/watchlist/check/${encodeURIComponent(cleanSymbol)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsWatchlisted(data.isWatchlisted);
        if (data.item?.id) {
          setItemId(data.item.id);
        }
      }
    } catch {}
  }, [cleanSymbol]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Synchronize with external events from other buttons on the page
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.symbol === cleanSymbol) {
        setIsWatchlisted(e.detail.isWatchlisted);
        if (e.detail.itemId) setItemId(e.detail.itemId);
      }
    };
    window.addEventListener('ff_watchlist_changed', handleSync as EventListener);
    return () => window.removeEventListener('ff_watchlist_changed', handleSync as EventListener);
  }, [cleanSymbol]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const token = getStoredAccessToken();
    if (!token) {
      // Direct guest user to login preserving current route
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    setLoading(true);
    const baseUrl = getApiBaseUrl();

    try {
      if (isWatchlisted) {
        // Remove from watchlist
        // If itemId is unknown, fetch it or query
        let idToDelete = itemId;
        if (!idToDelete) {
          const checkRes = await fetch(`${baseUrl}/api/v1/watchlist/check/${encodeURIComponent(cleanSymbol)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            idToDelete = checkData.item?.id;
          }
        }

        if (idToDelete) {
          const res = await fetch(`${baseUrl}/api/v1/watchlist/${idToDelete}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setIsWatchlisted(false);
            setItemId(null);
            onWatchlistToggled?.(false);
            window.dispatchEvent(
              new CustomEvent('ff_watchlist_changed', {
                detail: { symbol: cleanSymbol, isWatchlisted: false },
              }),
            );
          }
        }
      } else {
        // Add to watchlist
        const res = await fetch(`${baseUrl}/api/v1/watchlist`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: cleanSymbol,
            companyName: companyName || cleanSymbol,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsWatchlisted(true);
          setItemId(data.id);
          onWatchlistToggled?.(true);
          window.dispatchEvent(
            new CustomEvent('ff_watchlist_changed', {
              detail: { symbol: cleanSymbol, isWatchlisted: true, itemId: data.id },
            }),
          );
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={isWatchlisted ? `Remove ${cleanSymbol} from Watchlist` : `Add ${cleanSymbol} to Watchlist`}
        aria-label={isWatchlisted ? `Remove ${cleanSymbol} from Watchlist` : `Add ${cleanSymbol} to Watchlist`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'sm' ? '28px' : '34px',
          height: size === 'sm' ? '28px' : '34px',
          borderRadius: '6px',
          border: isWatchlisted ? '1px solid #D97706' : '1px solid #334155',
          background: isWatchlisted ? 'rgba(245, 158, 11, 0.12)' : 'rgba(30, 41, 59, 0.6)',
          color: isWatchlisted ? '#F59E0B' : '#94A3B8',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 13 : 16} className="animate-spin" />
        ) : (
          <Bookmark size={size === 'sm' ? 13 : 16} fill={isWatchlisted ? '#F59E0B' : 'none'} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isWatchlisted ? `In your Watchlist (${cleanSymbol})` : `Add ${cleanSymbol} to Watchlist`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '3px 9px' : '6px 12px',
        borderRadius: '6px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        border: isWatchlisted ? '1px solid #F59E0B' : '1px solid #334155',
        background: isWatchlisted ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.7)',
        color: isWatchlisted ? '#F59E0B' : '#94A3B8',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isWatchlisted ? (
        <>
          <Check size={12} strokeWidth={2.5} />
          <span>Watching</span>
        </>
      ) : (
        <>
          <Bookmark size={12} />
          <span>+ Watchlist</span>
        </>
      )}
    </button>
  );
}
