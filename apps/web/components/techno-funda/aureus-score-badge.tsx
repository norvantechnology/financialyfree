'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Info,
  X,
} from 'lucide-react';
import { AureusScoreResult, calculateAureusScore, AureusScoreInput } from '@ff/calc';

interface AureusScoreBadgeProps {
  scoreResult?: AureusScoreResult | null;
  // Or direct inputs if pre-computation is needed
  inputs?: AureusScoreInput;
  size?: 'sm' | 'md' | 'lg';
  showDetailsModal?: boolean;
}

export function AureusScoreBadge({
  scoreResult: propResult,
  inputs,
  size = 'md',
  showDetailsModal = true,
}: AureusScoreBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Compute if only inputs provided
  const result: AureusScoreResult = React.useMemo(() => {
    if (propResult) return propResult;
    if (inputs) return calculateAureusScore(inputs);
    return calculateAureusScore({ roce: null, debtToEquity: null, promoterHoldingPercent: null });
  }, [propResult, inputs]);

  const { score, tier, tierLabel, tierColor, isPartial, summary, subScores, totalWeightAvailable } = result;

  const isInsufficient = tier === 'INSUFFICIENT_DATA' || score === null;

  const getTierBg = () => {
    switch (tier) {
      case 'EXCEPTIONAL':
      case 'STRONG':
        return '#F0FDFA';
      case 'MODERATE':
        return '#F8FAFC';
      case 'CAUTION':
      case 'HIGH_RISK':
        return '#F8FAFC';
      default:
        return '#F8FAFC';
    }
  };

  const getTierBorder = () => {
    switch (tier) {
      case 'EXCEPTIONAL':
      case 'STRONG':
        return '#99F6E4';
      case 'MODERATE':
      case 'CAUTION':
      case 'HIGH_RISK':
        return '#E2E8F0';
      default:
        return '#E2E8F0';
    }
  };

  const getTierText = () => {
    switch (tier) {
      case 'EXCEPTIONAL':
      case 'STRONG':
        return '#0F766E';
      case 'MODERATE':
        return '#334155';
      case 'CAUTION':
      case 'HIGH_RISK':
        return '#475569';
      default:
        return '#64748B';
    }
  };

  const pillPadding = size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 12px' : '3px 8px';
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          if (!showDetailsModal) return;
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={`Aureus Score: ${score !== null ? `${score}/100` : 'N/A'} (${tierLabel})${isPartial ? ' - Partial calculation' : ''}. Click to inspect 4 pillars.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: pillPadding,
          borderRadius: '6px',
          background: getTierBg(),
          border: `1px solid ${getTierBorder()}`,
          color: getTierText(),
          fontSize,
          fontWeight: 700,
          cursor: showDetailsModal ? 'pointer' : 'default',
          transition: 'all 0.15s ease-in-out',
          outline: 'none',
          whiteSpace: 'nowrap',
        }}
        className="hover:shadow-sm"
      >
        <span>Aureus {score !== null ? score : '—'}</span>
        {isPartial && !isInsufficient && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              padding: '1px 4px',
              borderRadius: '4px',
              background: '#F1F5F9',
              color: '#64748B',
              textTransform: 'uppercase',
            }}
          >
            Partial
          </span>
        )}
      </button>

      {/* Details Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color="#10B981" />
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94A3B8' }}>
                    Fundamental Quality Engine (Section 43)
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Aureus Score: {result.symbol ? `${result.symbol} — ` : ''}{score !== null ? `${score} / 100` : 'Data Pending'}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#38BDF8', fontWeight: 600, marginTop: '2px' }}>
                  {tierLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              {/* Summary */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: getTierBg(),
                  border: `1px solid ${getTierBorder()}`,
                  marginBottom: '20px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#1E293B',
                }}
              >
                {summary}
              </div>

              {/* Coverage Notice */}
              {isPartial && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    fontSize: '12px',
                    color: '#92400E',
                    marginBottom: '18px',
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Partial Scoring Active ({totalWeightAvailable}% available weight).</strong> Weights of available pillars have been mathematically normalized to 100% per platform transparency principles.
                  </div>
                </div>
              )}

              {/* 4 Pillars Breakdown */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '10px' }}>
                  Verified Quality Pillars
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.values(subScores).map((sub) => {
                    const isAvailable = sub.score !== null;
                    const statusColor =
                      sub.status === 'OPTIMAL'
                        ? '#10B981'
                        : sub.status === 'HEALTHY'
                          ? '#06B6D4'
                          : sub.status === 'MODERATE'
                            ? '#F59E0B'
                            : sub.status === 'WEAK'
                              ? '#F97316'
                              : sub.status === 'CRITICAL'
                                ? '#EF4444'
                                : '#94A3B8';

                    return (
                      <div
                        key={sub.metric}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          background: isAvailable ? '#F8FAFC' : '#F1F5F9',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                              {sub.label}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                              (Weight: {sub.weight}%)
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                              {sub.displayValue}
                            </span>
                            {isAvailable ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: statusColor,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.8)',
                                  border: `1px solid ${statusColor}`,
                                }}
                              >
                                {sub.score} pts
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#64748B',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: '#E2E8F0',
                                }}
                              >
                                OMITTED
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: isAvailable ? '#475569' : '#64748B', lineHeight: '1.4' }}>
                          {sub.notes}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Methodology Audit Footer */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '14px',
                  lineHeight: '1.5',
                }}
              >
                <strong>FinanciallyFree Honesty Guarantee:</strong> Aureus Scores are deterministically calculated using live/audited exchange disclosures. If an exchange feed omits data (e.g. numeric pledge in BSE/NSE master broadcast), the system never fabricates 0%. Instead, weights are normalized and the omission is prominently labeled.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * AureusScoreCard — Full analytical card for Valuation Lab & Shareholding tab
 */
export function AureusScoreCard({
  scoreResult: propResult,
  inputs,
}: {
  scoreResult?: AureusScoreResult | null;
  inputs?: AureusScoreInput;
}) {
  const result: AureusScoreResult = React.useMemo(() => {
    if (propResult) return propResult;
    if (inputs) return calculateAureusScore(inputs);
    return calculateAureusScore({ roce: null, debtToEquity: null, promoterHoldingPercent: null });
  }, [propResult, inputs]);

  const { isPartial, summary, subScores, totalWeightAvailable } = result;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="#0F766E" />
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Aureus Stock Quality Score
          </h4>
        </div>
        <AureusScoreBadge scoreResult={result} size="md" />
      </div>

      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '16px' }}>
        {summary}
      </p>

      {/* 4 Pillars Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        {Object.values(subScores).map((sub) => {
          const isAvailable = sub.score !== null;
          return (
            <div
              key={sub.metric}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                <span>{sub.label}</span>
                <span>{sub.displayValue}</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                <div
                  style={{
                    height: '100%',
                    width: isAvailable ? `${sub.score}%` : '0%',
                    background:
                      sub.score && sub.score >= 80
                        ? '#10B981'
                        : sub.score && sub.score >= 60
                          ? '#06B6D4'
                          : sub.score && sub.score >= 40
                            ? '#F59E0B'
                            : '#EF4444',
                    borderRadius: '3px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B' }}>
                <span>Effective Wt: {sub.weight}%</span>
                <span>{isAvailable ? `${sub.score} pts` : 'No Data'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Info size={13} />
        <span>
          {isPartial
            ? `Normalized across ${totalWeightAvailable}% baseline coverage. Missing metrics never assume 0.`
            : '100% 4-pillar fundamental coverage verified.'}
        </span>
      </div>
    </div>
  );
}
