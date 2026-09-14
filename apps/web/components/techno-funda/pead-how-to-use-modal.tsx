'use client';

import React from 'react';
import { X, BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';
import { useBodyScrollLock } from '../../lib/use-body-scroll-lock';

interface PeadHowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PeadHowToUseModal({ isOpen, onClose }: PeadHowToUseModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-fixed"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog-contained card"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: 'calc(100dvh - 32px)',
          background: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          overscrollBehavior: 'contain',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Sticky, Dark Navy + Emerald Gradient) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0D1522 0%, #0F172A 60%, #0F766E 100%)',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(20, 184, 166, 0.2)',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2DD4BF',
              }}
            >
              <BookOpen size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                How To Use The PEAD Tool
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#94A3B8' }}>
                Post-Earnings-Announcement Drift Screener &amp; Setup Playbook
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content (Scrollable with Containment) */}
        <div
          className="modal-scroll-body space-y-4"
          style={{
            padding: '20px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Concept Overview Card */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.65 }}>
              <strong style={{ color: '#0F172A' }}>Post-Earnings-Announcement Drift (PEAD)</strong> is an established market phenomenon where stock prices continue to drift in the direction of an earnings surprise for <span style={{ color: '#0F766E', fontWeight: 700 }}>2 to 60 trading days</span> following quarterly financial disclosure.
            </div>
          </div>

          {/* Core Scoring & Column Metrics */}
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={15} color="#0F766E" />
              <span>Core Scoring &amp; Metric Reference</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Score > 30 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#DCFCE7',
                    color: '#166534',
                    border: '1px solid #86EFAC',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Score &gt; 30
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0F172A' }}>Strong Positive Surprise:</strong> Actual PAT significantly beats market expectations and guidance. Offers high probability of sustained 20–60 day momentum.
                </span>
              </div>

              {/* Score 0 to 30 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Score 0 to 30
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0F172A' }}>Moderate Expansion:</strong> Earnings inline or modest guidance upgrade. Potential for steady, controlled accumulation.
                </span>
              </div>

              {/* Score < 0 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Score &lt; 0
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0F172A' }}>Negative Surprise:</strong> Revenue miss or margin compression setup. Drift is prone to post-earnings selling pressure.
                </span>
              </div>

              {/* Current vs Forward PE */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#EEF2FF',
                    color: '#4338CA',
                    border: '1px solid #C7D2FE',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  PE Valuation
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0F172A' }}>Current PE vs Forward PE:</strong> Highlights valuation re-rating potential. A large forward compression indicates rapid EPS acceleration.
                </span>
              </div>

              {/* Returns vs Daily Ret */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Drift Returns
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0F172A' }}>Returns vs Daily Ret:</strong> Tracks cumulative drift since result disclosure alongside immediate single-day post-announcement reaction.
                </span>
              </div>
            </div>
          </div>

          {/* Execution Workflow */}
          <div
            style={{
              background: '#F0FDFA',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #99F6E4',
              borderLeft: '4px solid #0F766E',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#0F766E',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} color="#0F766E" />
              <span>Recommended Execution Workflow</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  1
                </div>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  Filter by <strong style={{ color: '#0F172A' }}>Current Quarter</strong> for fresh result announcements.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  2
                </div>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  Screen for companies with <strong style={{ color: '#166534' }}>PEAD Score &gt; 30</strong> and positive 20-day drift.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  3
                </div>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  Confirm technical support above the 20 DMA and 100 DMA.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  4
                </div>
                <span style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                  Verify guidance details and management commentary in exchange disclosures.
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ textAlign: 'right', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)',
                transition: 'background 0.15s ease',
              }}
            >
              Got it, continue to screener
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

