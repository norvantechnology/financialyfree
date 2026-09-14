'use client';

import React, { useState, useMemo } from 'react';
import { X, Download, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { scanTaxLossHarvesting, TaxLossHoldingInput } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

interface TaxLossHarvestingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Array<{
    schemeName: string;
    currentValue: number;
    investedAmount: number;
    purchaseDate?: string;
    unrealizedGain?: number;
  }>;
}

export function TaxLossHarvestingDrawer({ isOpen, onClose, holdings }: TaxLossHarvestingDrawerProps) {
  const [realizedGainsInput, setRealizedGainsInput] = useState<number>(150000);

  const scannedHoldings: TaxLossHoldingInput[] = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return [];
    }

    return holdings.map((h, idx) => {
      const invested = h.investedAmount || h.currentValue;
      return {
        id: String(idx + 1),
        symbolOrScheme: h.schemeName,
        currentValue: h.currentValue,
        investedAmount: invested,
        purchaseDate: h.purchaseDate || '2024-05-10',
        assetType: 'equity',
      };
    });
  }, [holdings]);

  const harvestResult = useMemo(() => {
    return scanTaxLossHarvesting({
      holdings: scannedHoldings,
      realizedLTCG: realizedGainsInput,
      realizedSTCG: 50000,
      financialYearEnd: '2026-03-31',
    });
  }, [scannedHoldings, realizedGainsInput]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Scheme / Asset', 'Invested (₹)', 'Current Value (₹)', 'Unrealized Loss (₹)', 'Holding Period (Days)', 'Loss Type', 'Est. Tax Savings (₹)', 'Harvest Priority'];
    const rows = harvestResult.harvestableOpportunities.map((op) => [
      op.symbolOrScheme,
      op.investedAmount,
      op.currentValue,
      op.unrealizedLoss,
      op.holdingPeriodDays,
      op.lossType.toUpperCase(),
      op.potentialTaxSavings,
      op.harvestPriority,
    ]);
    exportTableToCsv('Tax_Loss_Harvesting_Audit', headers, rows);
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
          maxWidth: '900px',
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
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '4px' }}>
                INCOME TAX ACT SEC 70/71
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
                Tax-Loss Harvesting Scanner
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              Identifies unrealized capital losses in your portfolio to legally offset taxable capital gains before March 31.
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
          {/* March 31 Deadline Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: harvestResult.isNearFiscalYearEnd ? '#FEF2F2' : '#EFF6FF',
              border: `1px solid ${harvestResult.isNearFiscalYearEnd ? '#FECACA' : '#BFDBFE'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div style={{ marginTop: '2px', fontWeight: 800, color: harvestResult.isNearFiscalYearEnd ? '#DC2626' : '#2563EB' }}>
              {harvestResult.isNearFiscalYearEnd ? '!' : 'i'}
            </div>
            <div style={{ fontSize: '13px', color: '#1E293B' }}>
              <strong>FY 2025-26 Deadline: </strong>
              <span>{harvestResult.fiscalYearEndReminder}</span>
            </div>
          </div>

          {/* KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                Harvestable Losses
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#991B1B', marginTop: '4px' }}>
                ₹{harvestResult.totalHarvestableLoss.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {harvestResult.harvestableOpportunities.length} holdings in red
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                Est. Tax Cash Savings
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                ₹{harvestResult.potentialTaxSavings.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Direct tax liability offset
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>
                STCL vs LTCL Loss Split
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 750, color: '#0F172A', marginTop: '6px' }}>
                STCL: ₹{harvestResult.totalSTCL.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                LTCL: ₹{harvestResult.totalLTCL.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Taxable Gains Input Tray */}
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: '#334155' }}>
              <strong>Simulate Taxable Gains to Offset:</strong> Enter already booked/expected capital gains for this FY:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>₹</span>
              <input
                type="number"
                value={realizedGainsInput}
                onChange={(e) => setRealizedGainsInput(Number(e.target.value))}
                style={{ width: '130px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Opportunities Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
                Loss Harvesting Candidate Holdings
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
                Export Audit
              </button>
            </div>

            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Scheme / Stock</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Invested</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Current Value</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Loss Amount</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>Holding Type</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Tax Saved</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {harvestResult.harvestableOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px 14px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                        No unrealized capital losses detected in current portfolio. All holdings are currently in profit or within tax-exempt thresholds.
                      </td>
                    </tr>
                  ) : (
                    harvestResult.harvestableOpportunities.map((op) => (
                      <tr key={op.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {op.symbolOrScheme}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>
                          ₹{op.investedAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                          ₹{op.currentValue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#DC2626' }}>
                          -₹{op.unrealizedLoss.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 750,
                              background: op.lossType === 'stcl' ? '#FEF3C7' : '#EDE9FE',
                              color: op.lossType === 'stcl' ? '#B45309' : '#6D28D9',
                            }}
                          >
                            {op.lossType === 'stcl' ? `STCL (${op.holdingPeriodDays}d)` : `LTCL (${op.holdingPeriodDays}d)`}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          ₹{op.potentialTaxSavings.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 750,
                              background: op.harvestPriority === 'HIGH' ? '#FEE2E2' : '#F1F5F9',
                              color: op.harvestPriority === 'HIGH' ? '#DC2626' : '#64748B',
                            }}
                          >
                            {op.harvestPriority}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Recommendations */}
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>SEBI &amp; Tax Compliance Guidelines</span>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {harvestResult.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
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
            Unabsorbed losses can be carried forward for up to <strong>8 consecutive Assessment Years</strong>.
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
