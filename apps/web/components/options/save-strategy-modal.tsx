'use client';

import React, { useState } from 'react';
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
      const res = await fetch('/api/v1/options/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          underlying,
          legs,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save strategy');
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onSaveSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Error saving strategy. Please log in first.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Save Strategy</h2>
            <p className="text-xs text-neutral-400">
              Persist this {legs.length}-leg {underlying} strategy to your account
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        {isSaved ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Strategy Saved!</h3>
            <p className="text-xs text-neutral-400">Available across your devices</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Strategy Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., NIFTY Expiry Iron Condor"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Notes / Thesis (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rationale, target profit, stop loss rule..."
                rows={3}
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs space-y-1">
              <div className="text-neutral-400">Underlying: <strong className="text-white">{underlying}</strong></div>
              <div className="text-neutral-400">Legs: <strong className="text-amber-400">{legs.length} active legs</strong></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Strategy'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
