'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { StockPulseData } from './master-tracker-tab';
import { useBodyScrollLock } from '../../lib/use-body-scroll-lock';

interface EarningsPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  symbol: string;
  data?: StockPulseData | null;
}

export const DEFAULT_LEAP_PULSE = null;

/** Compute bar heights proportionally (max = 38px, min = 6px) */
function barHeights(a: number, b: number, c: number): [number, number, number] {
  const maxVal = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), 0.01);
  return [
    Math.max(6, Math.round((Math.abs(a) / maxVal) * 38)),
    Math.max(6, Math.round((Math.abs(b) / maxVal) * 38)),
    Math.max(6, Math.round((Math.abs(c) / maxVal) * 38)),
  ];
}

const PULSE_COLOR: Record<string, string> = {
  Exceptional: '#059669',
  Good: '#2563EB',
  Neutral: '#64748B',
  Weak: '#DC2626',
};
const PULSE_BG: Record<string, string> = {
  Exceptional: '#ECFDF5',
  Good: '#EFF6FF',
  Neutral: '#F1F5F9',
  Weak: '#FEF2F2',
};

export function EarningsPulseModal({
  isOpen,
  onClose,
  companyName,
  symbol,
  data,
}: EarningsPulseModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  if (!data) {
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
        }}
        onClick={onClose}
      >
        <div
          className="modal-dialog-contained card"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            overscrollBehavior: 'contain',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{companyName}</h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>{symbol}</span>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
              <X size={18} color="#64748B" />
            </button>
          </div>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: '20px 0' }}>
            Earnings pulse detailed metrics are not yet available for this company. Quarterly result XBRL analysis is ongoing.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 650,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { labels } = data;

  const renderDelta = (val?: number, isBps = false) => {
    if (val === undefined || val === null) return <span style={{ color: '#94A3B8' }}>-</span>;
    const isPos = val > 0;
    const isNeg = val < 0;
    const color = isPos ? '#16A34A' : isNeg ? '#DC2626' : '#64748B';
    const unit = isBps ? ' bps' : '%';
    return (
      <span style={{ color, fontWeight: 700 }}>
        {isPos ? '+' : ''}
        {val}
        {unit}
      </span>
    );
  };

  const pulseColor = PULSE_COLOR[data.pulseRating] ?? '#64748B';
  const pulseBg = PULSE_BG[data.pulseRating] ?? '#F1F5F9';

  // Dynamic bar heights
  const [rh1, rh2, rh3] = barHeights(data.metrics.sales.prevYear, data.metrics.sales.prev, data.metrics.sales.cur);
  const [ph1, ph2, ph3] = barHeights(data.metrics.pat.prevYear, data.metrics.pat.prev, data.metrics.pat.cur);
  const [eh1, eh2, eh3] = barHeights(data.metrics.eps.prevYear, data.metrics.eps.prev, data.metrics.eps.cur);

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
          maxWidth: '540px',
          maxHeight: 'calc(100dvh - 32px)',
          background: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          overscrollBehavior: 'contain',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dark Header (Sticky) ────────────────────────────────────────────── */}
        <div
          style={{
            background: '#0D1522',
            color: '#FFFFFF',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>Earnings Pulse</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              {data.quarterLabel} · Latest quarterly results
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable Body Area ────────────────────────────────────── */}
        <div
          className="modal-scroll-body"
          style={{
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            flex: 1,
            minHeight: 0,
          }}
        >

        {/* ── Company Header ─────────────────────────────────────────── */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: pulseColor,
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {companyName.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {companyName}
                </h3>
                <span
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {symbol}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>{data.quarterLabel}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>·</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: pulseColor,
                    background: pulseBg,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${pulseColor}30`,
                  }}
                >
                  Pulse: {data.pulseRating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Metric Table ───────────────────────────────────────────── */}
        <div style={{ padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#2B3547', color: '#FFFFFF' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '4px 0 0 4px' }}>Metric</th>
                <th style={{ padding: '8px 6px', textAlign: 'center' }}>QoQ</th>
                <th style={{ padding: '8px 6px', textAlign: 'center' }}>YoY</th>
                <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800 }}>{labels.cur}</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>{labels.prev}</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 4px 0' }}>{labels.prevYear}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>Sales (₹ Cr)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.sales.qoq)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.sales.yoy)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{data.metrics.sales.cur}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>{data.metrics.sales.prev}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{data.metrics.sales.prevYear}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>Other Inc. (₹ Cr)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94A3B8' }}>-</td>
                <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94A3B8' }}>-</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>{data.metrics.otherInc.cur}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>{data.metrics.otherInc.prev}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{data.metrics.otherInc.prevYear}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>Oper. Profit (₹ Cr)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.op.qoq)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.op.yoy)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{data.metrics.op.cur}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>{data.metrics.op.prev}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{data.metrics.op.prevYear}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>OPM %</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.opmBps.qoq, true)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.opmBps.yoy, true)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>{data.metrics.opmBps.cur}%</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>{data.metrics.opmBps.prev}%</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{data.metrics.opmBps.prevYear}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>PAT (₹ Cr)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.pat.qoq)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.pat.yoy)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{data.metrics.pat.cur}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>{data.metrics.pat.prev}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{data.metrics.pat.prevYear}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>EPS (₹)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.eps.qoq)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{renderDelta(data.metrics.eps.yoy)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>₹{data.metrics.eps.cur}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748B' }}>₹{data.metrics.eps.prev}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>₹{data.metrics.eps.prevYear}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Mini Bar Charts (dynamic heights) ─────────────────────── */}
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {/* Revenue */}
          <div style={{ background: '#F8FAFC', padding: '12px 8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#4F46E5', letterSpacing: '0.03em', marginBottom: '12px' }}>REVENUE (₹ Cr)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', height: '72px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.sales.prevYear}</span>
                <div style={{ width: '18px', height: `${rh1}px`, background: '#C7D2FE', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prevYear}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.sales.prev}</span>
                <div style={{ width: '18px', height: `${rh2}px`, background: '#A5B4FC', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prev}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#4F46E5' }}>{data.metrics.sales.cur}</span>
                <div style={{ width: '18px', height: `${rh3}px`, background: '#6366F1', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#4F46E5' }}>{labels.cur}</span>
              </div>
            </div>
          </div>

          {/* PAT */}
          <div style={{ background: '#F8FAFC', padding: '12px 8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#059669', letterSpacing: '0.03em', marginBottom: '12px' }}>PAT (₹ Cr)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', height: '72px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.pat.prevYear}</span>
                <div style={{ width: '18px', height: `${ph1}px`, background: '#A7F3D0', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prevYear}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.pat.prev}</span>
                <div style={{ width: '18px', height: `${ph2}px`, background: '#6EE7B7', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prev}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669' }}>{data.metrics.pat.cur}</span>
                <div style={{ width: '18px', height: `${ph3}px`, background: '#059669', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#059669' }}>{labels.cur}</span>
              </div>
            </div>
          </div>

          {/* EPS */}
          <div style={{ background: '#F8FAFC', padding: '12px 8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#DC2626', letterSpacing: '0.03em', marginBottom: '12px' }}>EPS (₹)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', height: '72px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.eps.prevYear}</span>
                <div style={{ width: '18px', height: `${eh1}px`, background: '#FECACA', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prevYear}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>{data.metrics.eps.prev}</span>
                <div style={{ width: '18px', height: `${eh2}px`, background: '#FCA5A5', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 500 }}>{labels.prev}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#DC2626' }}>{data.metrics.eps.cur}</span>
                <div style={{ width: '18px', height: `${eh3}px`, background: '#DC2626', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#DC2626' }}>{labels.cur}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 20px',
            background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#475569',
          }}
        >
          <div>CMP : <strong>₹{data.cmp}</strong></div>
          <div>{data.marketCapText}</div>
          <div>P/E : <strong>{data.peRatio}</strong></div>
        </div>
        <div style={{ padding: '8px 20px', textAlign: 'center', fontSize: '10px', color: '#94A3B8', background: '#FFFFFF' }}>
          Data sourced from official quarterly financial statements.
        </div>
        </div>
      </div>
    </div>
  );
}
