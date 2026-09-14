'use client';

import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, Download, SlidersHorizontal } from 'lucide-react';
import { calculatePortfolioRebalancing, HoldingAssetInput } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

interface PortfolioRebalancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Array<{
    schemeName: string;
    currentValue: number;
    assetClass?: 'equity' | 'debt' | 'gold' | 'cash';
  }>;
}

export function PortfolioRebalancingModal({ isOpen, onClose, holdings }: PortfolioRebalancingModalProps) {
  // Target allocations in percentage
  const [targetEquity, setTargetEquity] = useState<number>(70);
  const [targetDebt, setTargetDebt] = useState<number>(20);
  const [targetGold, setTargetGold] = useState<number>(10);
  const [targetCash, setTargetCash] = useState<number>(0);
  const [thresholdPct, setThresholdPct] = useState<number>(5);

  const totalTarget = targetEquity + targetDebt + targetGold + targetCash;
  const isTargetValid = totalTarget === 100;

  // Classify holdings if not explicitly provided
  const classifiedHoldings: HoldingAssetInput[] = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return [];
    }
    return holdings.map((h) => {
      let assetClass: 'equity' | 'debt' | 'gold' | 'cash' = h.assetClass || 'equity';
      const nameLower = h.schemeName.toLowerCase();
      if (nameLower.includes('debt') || nameLower.includes('bond') || nameLower.includes('liquid') || nameLower.includes('money market') || nameLower.includes('overnight')) {
        assetClass = 'debt';
      } else if (nameLower.includes('gold') || nameLower.includes('silver') || nameLower.includes('precious')) {
        assetClass = 'gold';
      } else if (nameLower.includes('cash') || nameLower.includes('savings')) {
        assetClass = 'cash';
      }
      return {
        schemeName: h.schemeName,
        currentValue: h.currentValue,
        assetClass,
      };
    });
  }, [holdings]);

  const hasHoldings = classifiedHoldings.length > 0;

  const rebalanceResult = useMemo(() => {
    if (!hasHoldings) {
      return null;
    }
    return calculatePortfolioRebalancing({
      holdings: classifiedHoldings,
      targetAllocation: {
        equity: targetEquity,
        debt: targetDebt,
        gold: targetGold,
        cash: targetCash,
      },
      driftThresholdPct: thresholdPct,
    });
  }, [hasHoldings, classifiedHoldings, targetEquity, targetDebt, targetGold, targetCash, thresholdPct]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    if (!rebalanceResult) return;
    const headers = ['Asset Class', 'Current Value (₹)', 'Current Weight %', 'Target Weight %', 'Drift %', 'Action', 'Rebalance Amount (₹)'];
    const rows = rebalanceResult.drifts.map((d) => [
      d.assetClass.toUpperCase(),
      d.currentValue,
      `${d.currentAllocationPct.toFixed(1)}%`,
      `${d.targetAllocationPct.toFixed(1)}%`,
      `${d.driftPct >= 0 ? '+' : ''}${d.driftPct.toFixed(1)}%`,
      d.action,
      d.recommendedAmount,
    ]);
    exportTableToCsv('Portfolio_Rebalancing_Plan', headers, rows);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#EEF2FF', color: '#4338CA', padding: '3px 8px', borderRadius: '4px' }}>
                ASSET DRIFT ENGINE
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
                Portfolio Rebalancing Alert &amp; Execution Plan
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              Detects asset allocation drift beyond your risk tolerance threshold and provides exact rupee adjustments.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!hasHoldings || !rebalanceResult ? (
            <div
              style={{
                padding: '32px 24px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                No holdings to rebalance
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Add live portfolio holdings to compute asset allocation drift. Sample or fabricated holdings are not used.
              </p>
            </div>
          ) : (
            <>
          {/* Status Alert Banner */}
          {rebalanceResult.hasDrift ? (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: rebalanceResult.urgency === 'high' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${rebalanceResult.urgency === 'high' ? '#FECACA' : '#FDE68A'}`,
                color: rebalanceResult.urgency === 'high' ? '#991B1B' : '#92400E',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ marginTop: '2px', fontWeight: 800 }}>!</div>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block' }}>
                  {rebalanceResult.urgency === 'high' ? 'High Drift Alert: ' : 'Moderate Drift Alert: '}
                  {rebalanceResult.maxDriftAsset.toUpperCase()} is drifted by {rebalanceResult.maxDriftPct.toFixed(1)}% (Threshold: &plusmn;{thresholdPct}%)
                </strong>
                <span style={{ fontSize: '12.5px', marginTop: '2px', display: 'block' }}>
                  To restore your risk profile, execute the recommended ₹{rebalanceResult.turnoverAmount.toLocaleString('en-IN')} rebalance turnover below.
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '13px', fontWeight: 650 }}>
                Portfolio within safe tolerance (&plusmn;{thresholdPct}%). No rebalancing required today.
              </span>
            </div>
          )}

          {/* Allocation Controls Tray */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} color="#475569" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Target Asset Allocation &amp; Threshold</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: isTargetValid ? '#059669' : '#DC2626' }}>
                Total Target: {totalTarget}% {isTargetValid ? '(100% Balanced)' : '(Must equal 100%)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Equity %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetEquity}
                  onChange={(e) => setTargetEquity(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 650 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Debt %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetDebt}
                  onChange={(e) => setTargetDebt(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 650 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Gold %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetGold}
                  onChange={(e) => setTargetGold(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 650 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Cash %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetCash}
                  onChange={(e) => setTargetCash(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 650 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Drift Trigger (&plusmn;%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={thresholdPct}
                  onChange={(e) => setThresholdPct(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 650 }}
                />
              </div>
            </div>
          </div>

          {/* Allocation Drift Breakdown Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
                Asset Breakdown &amp; Rebalance Orders
              </h3>
              <button
                onClick={handleExportCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                <Download size={12} />
                Export Plan
              </button>
            </div>

            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Asset Class</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Current Value</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Current %</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Target %</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Drift %</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Order Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rebalanceResult.drifts.map((d) => {
                    const isSell = d.action === 'SELL';
                    const isBuy = d.action === 'BUY';
                    return (
                      <tr key={d.assetClass} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 750, color: '#0F172A', textTransform: 'capitalize' }}>
                          {d.assetClass}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 650, color: '#334155' }}>
                          ₹{d.currentValue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                          {d.currentAllocationPct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>
                          {d.targetAllocationPct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: d.driftPct > 0 ? '#DC2626' : d.driftPct < 0 ? '#059669' : '#64748B' }}>
                          {d.driftPct >= 0 ? `+${d.driftPct.toFixed(1)}%` : `${d.driftPct.toFixed(1)}%`}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: isSell ? '#FEE2E2' : isBuy ? '#DCFCE7' : '#F1F5F9',
                              color: isSell ? '#DC2626' : isBuy ? '#15803D' : '#64748B',
                            }}
                          >
                            {d.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: isSell ? '#DC2626' : isBuy ? '#059669' : '#64748B' }}>
                          {d.recommendedAmount > 0 ? `₹${d.recommendedAmount.toLocaleString('en-IN')}` : 'Balanced'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Steps */}
          {rebalanceResult.rebalanceRecommendations.length > 0 && (
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase' }}>Recommended Execution Steps</span>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {rebalanceResult.rebalanceRecommendations.map((step, idx) => (
                  <li key={idx}><strong>{step}</strong></li>
                ))}
              </ul>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Portfolio Value:{' '}
            <strong>
              {rebalanceResult
                ? `₹${rebalanceResult.totalPortfolioValue.toLocaleString('en-IN')}`
                : '—'}
            </strong>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close Plan
          </button>
        </div>
      </div>
    </div>
  );
}
