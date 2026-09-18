'use client';

import React, { useEffect, useState } from 'react';
import '../../styles/options-lab.css';
import { X, Bookmark, Check } from 'lucide-react';
import { StrategyLegDto } from '@ff/types';

interface SaveStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  underlying: string;
  legs: StrategyLegDto[];
  onSaveSuccess: () => void;
}

export const SaveStrategyModal: React.FC<SaveStrategyModalProps> = ({
  isOpen,
  onClose,
  underlying,
  legs,
  onSaveSuccess,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setNotes('');
    setError(null);
    setIsSaved(false);
    setIsSaving(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for the strategy');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const { getStoredAccessToken } = await import('../../lib/auth-client');
      const token = getStoredAccessToken();
      if (!token) {
        throw new Error('Please sign in to save strategies.');
      }

      const res = await fetch('/api/v1/options/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          underlying,
          legs,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Failed to save strategy');
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onSaveSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Error saving strategy. Please sign in and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="opt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-strategy-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="opt-save-modal-card">
        <button
          type="button"
          onClick={onClose}
          className="opt-save-modal-close"
          aria-label="Close"
          disabled={isSaving}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="opt-save-modal-header">
          <div className="opt-save-modal-icon">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 id="save-strategy-title" className="opt-save-modal-title">
              Save Strategy
            </h2>
            <p className="opt-save-modal-sub">
              Persist this {legs.length}-leg {underlying} strategy to your account.
            </p>
          </div>
        </div>

        {error && <div className="opt-save-modal-error">{error}</div>}

        {isSaved ? (
          <div className="opt-save-modal-success">
            <div className="opt-save-modal-success-icon">
              <Check className="w-6 h-6" />
            </div>
            <h3>Strategy Saved</h3>
            <p>Available across your devices</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="opt-save-modal-form">
            <label className="opt-save-field">
              <span className="opt-save-label">Strategy Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., NIFTY Expiry Iron Condor"
                className="opt-save-input"
                autoFocus
                maxLength={80}
              />
            </label>

            <label className="opt-save-field">
              <span className="opt-save-label">Notes / Thesis (Optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rationale, target profit, stop loss rule..."
                rows={3}
                className="opt-save-textarea"
                maxLength={500}
              />
            </label>

            <div className="opt-save-summary">
              <div>
                Underlying: <strong>{underlying}</strong>
              </div>
              <div>
                Legs: <strong>{legs.length} active</strong>
              </div>
            </div>

            <div className="opt-save-actions">
              <button type="button" onClick={onClose} className="opt-save-btn secondary" disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving || !name.trim()} className="opt-save-btn primary">
                {isSaving ? 'Saving...' : 'Save Strategy'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
