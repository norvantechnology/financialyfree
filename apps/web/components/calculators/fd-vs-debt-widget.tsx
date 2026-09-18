'use client';

import React, { useState, useMemo } from 'react';
import { Download, Info } from 'lucide-react';
import { calculateFdVsDebt, DebtAlternativeType, InvestorTaxSlab } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

export function FdVsDebtWidget() {
  const [depositAmount, setDepositAmount] = useState<number>(1000000);
  const [durationYears, setDurationYears] = useState<number>(3);
  const [fdInterestRatePct, setFdInterestRatePct] = useState<number>(7.1);
  const [debtAlternativeRatePct, setDebtAlternativeRatePct] = useState<number>(7.25);
  const [investorSlabPct, setInvestorSlabPct] = useState<InvestorTaxSlab>(30);
  const [debtProductType, setDebtProductType] = useState<DebtAlternativeType>('ARBITRAGE_FUND');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateFdVsDebt({
      depositAmount,
      durationYears,
      fdInterestRatePct,
      debtAlternativeRatePct,
      investorSlabPct,
      debtProductType,
    });
  }, [depositAmount, durationYears, fdInterestRatePct, debtAlternativeRatePct, investorSlabPct, debtProductType]);

  const handleExportCsv = () => {
    const headers = ['Metric', 'Bank Fixed Deposit', 'Debt / Arbitrage Alternative', 'Advantage'];
    const rows = [
      ['Gross Maturity Value (₹)', result.fdGrossMaturity, result.debtGrossMaturity, result.debtGrossMaturity - result.fdGrossMaturity],
      ['Total Tax Paid / TDS (₹)', result.fdTaxDeducted, result.debtTaxPayable, result.fdTaxDeducted - result.debtTaxPayable],
      ['Net In-Hand Maturity (₹)', result.fdNetInHand, result.debtNetInHand, result.netAdvantageRupees],
      ['Net Post-Tax CAGR (%)', `${result.fdPostTaxCagrPct.toFixed(2)}%`, `${result.debtPostTaxCagrPct.toFixed(2)}%`, `+${(result.debtPostTaxCagrPct - result.fdPostTaxCagrPct).toFixed(2)}%`],
    ];
    exportTableToCsv('FD_vs_Debt_Alternative_Tax_Audit', headers, rows);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* ── Contextual Methodology Guide ── */}
      <div className="tf-methodology-card" style={{ margin: 0 }}>
        <div className="tf-methodology-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <div className="tf-methodology-title">
            <Info size={14} />
            <span>Tax Arbitrage Guide: Post-Finance Act 2023 Regulations</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Bank FD Drag:</strong> FDs attract 10% TDS annually, and interest is added to income and taxed at slab rates (up to 30%+). Annual tax deduction destroys the compounding of unpaid interest.</p>
            <p><strong>Debt MF Deferral:</strong> While post-April 2023 debt funds are taxed at slab rates, <em>no tax is deducted until redemption</em>, yielding superior compounding.</p>
            <p><strong>Arbitrage Alpha:</strong> Arbitrage funds are classified as Equity for tax purposes (12.5% LTCG after 1 yr, 20% STCG), saving up to 18.7% tax for 30% slab investors with near-zero equity risk.</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '4px' }}>
              LAB 02 &bull; POST-TAX YIELD OPTIMIZER
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              FD vs. Debt / Arbitrage After-Tax Calculator
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Audits the real post-tax in-hand yield after annual TDS drag, slab taxation, and Section 112A capital gains.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 650,
            cursor: 'pointer',
            color: '#334155',
          }}
        >
          <Download size={13} />
          Export Tax Comparison
        </button>
      </div>

      {/* Controls Grid */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Deposit Principal (₹)
          </label>
          <input
            type="number"
            step="100000"
            min="50000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Tenure ({durationYears} Years)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Lock-in / Holding period</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            FD Interest Rate ({fdInterestRatePct}%)
          </label>
          <input
            type="range"
            min="5"
            max="9.5"
            step="0.1"
            value={fdInterestRatePct}
            onChange={(e) => setFdInterestRatePct(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Top bank rack rate ~7.0-7.25%</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Your Income Tax Slab
          </label>
          <select
            value={investorSlabPct}
            onChange={(e) => setInvestorSlabPct(Number(e.target.value) as InvestorTaxSlab)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: '#FFFFFF' }}
          >
            <option value={30}>30% Slab (Highest)</option>
            <option value={20}>20% Slab</option>
            <option value={15}>15% Slab (New Regime)</option>
            <option value={10}>10% Slab</option>
            <option value={5}>5% Slab</option>
            <option value={0}>0% Slab (No Tax)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Alternative Debt Vehicle
          </label>
          <select
            value={debtProductType}
            onChange={(e) => setDebtProductType(e.target.value as DebtAlternativeType)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 650, background: '#FFFFFF' }}
          >
            <option value="ARBITRAGE_FUND">Arbitrage Mutual Fund (Equity Taxed 12.5%)</option>
            <option value="PURE_DEBT_MF">Pure Debt MF (Tax-Deferred Slab)</option>
            <option value="CORPORATE_BOND">Target Maturity / Corporate Bond</option>
          </select>
        </div>
      </div>

      {/* Comparison Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {/* FD Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px' }}>
              BANK FIXED DEPOSIT
            </span>
            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>
              Annual TDS Drag
            </span>
          </div>

          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
              Net In-Hand Maturity
            </span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              ₹{result.fdNetInHand.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
              <span>Gross Return:</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{(result.fdGrossMaturity - depositAmount).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
              <span>Total Tax Eroded:</span>
              <span style={{ fontWeight: 750 }}>-₹{result.fdTaxDeducted.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Effective Post-Tax CAGR:</span>
              <span style={{ fontWeight: 750, color: '#0F172A' }}>{result.fdPostTaxCagrPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Alternative Card */}
        <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '4px' }}>
              {debtProductType.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 750 }}>
              Zero TDS / Deferral
            </span>
          </div>

          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '11.5px', color: '#065F46', textTransform: 'uppercase', fontWeight: 700 }}>
              Net In-Hand Maturity
            </span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
              ₹{result.debtNetInHand.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderTop: '1px solid #BBF7D0', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#065F46' }}>
              <span>Gross Return:</span>
              <span style={{ fontWeight: 600, color: '#064E3B' }}>₹{(result.debtGrossMaturity - depositAmount).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
              <span>Final Tax on Redemption:</span>
              <span style={{ fontWeight: 750 }}>-₹{result.debtTaxPayable.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#065F46' }}>
              <span>Effective Post-Tax CAGR:</span>
              <span style={{ fontWeight: 750, color: '#047857' }}>{result.debtPostTaxCagrPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Net Advantage Banner */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            Extra In-Hand Alpha
          </span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: result.netAdvantageRupees >= 0 ? '#059669' : '#DC2626', marginTop: '4px' }}>
            {result.netAdvantageRupees >= 0 ? `+₹${result.netAdvantageRupees.toLocaleString('en-IN')}` : `-₹${Math.abs(result.netAdvantageRupees).toLocaleString('en-IN')}`}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            {result.reasoning}
          </p>
        </div>
      </div>

      {/* Tax Rules & Compounding Insights */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 18px', fontSize: '12.5px', color: '#334155' }}>
        <strong>Key Regulatory Nuance for FY 2025-26:</strong>
        <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>
            <strong>Arbitrage Funds:</strong> Treated as Equity MFs under Section 112A. LTCG (&gt;1 year) is taxed at just <strong>12.5%</strong> (with ₹1.25L annual exemption), completely bypassing your 30% slab rate!
          </li>
          <li>
            <strong>Compounding Advantage:</strong> In bank FDs, tax is deducted every year, reducing the balance that compounds. In Mutual Funds, zero tax is deducted until the day you redeem, allowing unpaid taxes to compound for you.
          </li>
        </ul>
      </div>
    </div>
  );
}
