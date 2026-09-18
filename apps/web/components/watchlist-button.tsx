'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2 } from 'lucide-react';
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

/**
 * Compact, high-contrast watchlist control for light Market Tracker tables.
 * Icon-only by default - no heavy fills or colorful accents.
 */
export function WatchlistButton({
  symbol,
  companyName,
  size = 'sm',
  variant = 'icon',
  initialWatchlisted = false,
  onWatchlistToggled,
}: WatchlistButtonProps) {
  const router = useRouter();
  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(initialWatchlisted);
  const [itemId, setItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const cleanSymbol = (symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
  const iconPx = size === 'sm' ? 15 : 17;
  const boxPx = size === 'sm' ? 28 : 32;

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
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    setLoading(true);
    const baseUrl = getApiBaseUrl();

    try {
      if (isWatchlisted) {
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

  const label = isWatchlisted
    ? `Remove ${cleanSymbol} from Watchlist`
    : `Add ${cleanSymbol} to Watchlist`;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={label}
        aria-label={label}
        aria-pressed={isWatchlisted}
        className="ff-watchlist-icon-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: boxPx,
          height: boxPx,
          padding: 0,
          borderRadius: '6px',
          border: '1px solid transparent',
          background: 'transparent',
          color: isWatchlisted ? '#0F766E' : '#64748B',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
          flexShrink: 0,
        }}
      >
        {loading ? (
          <Loader2 size={iconPx} strokeWidth={2} className="animate-spin" />
        ) : (
          <Star
            size={iconPx}
            strokeWidth={2}
            fill={isWatchlisted ? 'currentColor' : 'none'}
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={label}
      aria-label={label}
      aria-pressed={isWatchlisted}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: size === 'sm' ? '28px' : '32px',
        padding: size === 'sm' ? '0 10px' : '0 12px',
        borderRadius: '6px',
        fontSize: size === 'sm' ? '12px' : '12.5px',
        fontWeight: 650,
        border: isWatchlisted ? '1px solid #99F6E4' : '1px solid #CBD5E1',
        background: isWatchlisted ? '#F0FDFA' : '#FFFFFF',
        color: isWatchlisted ? '#0F766E' : '#334155',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <Loader2 size={13} strokeWidth={2} className="animate-spin" />
      ) : (
        <Star
          size={13}
          strokeWidth={2}
          fill={isWatchlisted ? 'currentColor' : 'none'}
        />
      )}
      <span>{isWatchlisted ? 'Watching' : 'Watchlist'}</span>
    </button>
  );
}
