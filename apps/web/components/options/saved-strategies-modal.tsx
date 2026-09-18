'use client';

import React, { useCallback, useEffect, useState } from 'react';
import '../../styles/options-lab.css';
import { Library, Loader2, Trash2, X } from 'lucide-react';
import { SavedStrategyDto, StrategyLegDto } from '@ff/types';

interface SavedStrategiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (strategy: { name: string; underlying: string; legs: StrategyLegDto[] }) => void;
}

export const SavedStrategiesModal: React.FC<SavedStrategiesModalProps> = ({
  isOpen,
  onClose,
  onLoad,
}) => {
  const [items, setItems] = useState<SavedStrategyDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { getStoredAccessToken } = await import('../../lib/auth-client');
      const token = getStoredAccessToken();
      if (!token) {
        setError('Sign in to view saved strategies.');
        setItems([]);
        return;
      }
      const res = await fetch('/api/v1/options/strategies', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.status === 401) {
        setError('Session expired - sign in again.');
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || 'Could not load saved strategies.');
        return;
      }
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setError('Network error loading strategies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void loadList();
  }, [isOpen, loadList]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved strategy?')) return;
    setBusyId(id);
    try {
      const { getStoredAccessToken } = await import('../../lib/auth-client');
      const token = getStoredAccessToken();
      if (!token) {
        setError('Sign in required.');
        return;
      }
      const res = await fetch(`/api/v1/options/strategies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        setError(json?.message || 'Delete failed.');
        return;
      }
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Network error deleting strategy.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="opt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-strategies-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="opt-save-modal-card" style={{ maxWidth: '32rem' }}>
        <button type="button" className="opt-save-modal-close" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        <div className="opt-save-modal-header">
          <div className="opt-save-modal-icon">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h2 id="saved-strategies-title" className="opt-save-modal-title">
              Saved Strategies
            </h2>
            <p className="opt-save-modal-sub">Load a strategy into the builder or delete it.</p>
          </div>
        </div>

        {error && <div className="opt-save-modal-error">{error}</div>}

        {isLoading ? (
          <div className="opt-save-modal-success">
            <Loader2 className="w-6 h-6 animate-spin" style={{ margin: '0 auto', color: '#0F766E' }} />
            <p>Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="opt-save-modal-success">
            <h3>No saved strategies yet</h3>
            <p>Build legs and tap Save to store a strategy.</p>
          </div>
        ) : (
          <div className="opt-saved-list">
            {items.map((s) => (
              <div key={s.id} className="opt-saved-item">
                <div className="opt-saved-item-main">
                  <div className="opt-saved-item-name">{s.name}</div>
                  <div className="opt-saved-item-meta">
                    {s.underlying} · {s.legs?.length || 0} legs
                    {s.notes ? ` · ${s.notes.slice(0, 48)}${s.notes.length > 48 ? '...' : ''}` : ''}
                  </div>
                </div>
                <div className="opt-saved-item-actions">
                  <button
                    type="button"
                    className="opt-save-btn primary"
                    onClick={() => {
                      onLoad({
                        name: s.name,
                        underlying: s.underlying,
                        legs: (s.legs || []) as StrategyLegDto[],
                      });
                      onClose();
                    }}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="opt-save-btn secondary"
                    disabled={busyId === s.id}
                    onClick={() => void handleDelete(s.id)}
                    title="Delete"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
