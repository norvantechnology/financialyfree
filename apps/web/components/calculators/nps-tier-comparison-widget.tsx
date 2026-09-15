'use client';

import React, { useState, useMemo } from 'react';
import { Download, Info } from 'lucide-react';
import { calculateNpsTierComparison } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

export function NpsTierComparisonWidget() {
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000); // 10k / mo
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [taxSlabPct, setTaxSlabPct] = useState<number>(30);
  const [equityAllocationPct, setEquityAllocationPct] = useState<number>(60); // 60% equity in NPS
  const [expectedEquityReturnPct, setExpectedEquityReturnPct] = useState<number>(12);
  const [expectedDebtReturnPct, setExpectedDebtReturnPct] = useState<number>(7.5);
  const [annuityPctAt60, setAnnuityPctAt60] = useState<number>(40); // 40% mandatory annuity
  const [expectedAnnuityRatePct, setExpectedAnnuityRatePct] = useState<number>(6.2);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateNpsTierComparison({
      monthlyContribution,
      currentAge,
      retirementAge,
      investorTaxSlabPct: taxSlabPct,
      equityAllocationPct,
      expectedEquityReturnPct,
      expectedDebtReturnPct,
      annuityPercentageAtRetirement: annuityPctAt60,
      expectedAnnuityRatePct,
    });
  }, [
    monthlyContribution,
    currentAge,
    retirementAge,
    taxSlabPct,
    equityAllocationPct,
    expectedEquityReturnPct,
    expectedDebtReturnPct,
    annuityPctAt60,
    expectedAnnuityRatePct,
  ]);

  const handleExportCsv = () => {
    const headers = ['Comparison Metric', 'NPS Tier 1 (Govt Scheme)', 'Mutual Fund SIP Alternative'];
    const rows = [
      ['Total Principal Invested', `₹${result.totalInvested}`, `₹${result.totalInvested}`],
      ['Upfront Tax Saved (80CCD 1B)', `₹${result.nps.annualTaxSavedUnder80Ccd1B * result.yearsToRetire}`, '₹0'],
      ['Total Corpus at 60', `₹${result.nps.totalCorpusAtRetirement}`, `₹${result.mutualFund.totalCorpusAtRetirement}`],
      ['Lump Sum Cash (Tax Free)', `₹${result.nps.lumpSumCorpus}`, `₹${result.mutualFund.netPostTaxLumpSum}`],
      ['Annuity Corpus Locked', `₹${result.nps.annuityCorpus}`, '₹0 (Liquid)'],
      ['Monthly Pension for Life', `₹${result.nps.monthlyPension}`, '₹0 (Generate via SWP)'],
      ['Lock-in Rules', 'Locked till age 60', 'Zero lock-in (Liquid)'],
    ];
    exportTableToCsv('NPS_vs_Mutual_Fund_Detailed_Comparison', headers, rows);
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
            <span>NPS Decision Framework: Tax Alpha vs. Liquidity Lock</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>The Section 80CCD(1B) Advantage:</strong> You get an exclusive ₹50,000 tax deduction over and above the ₹1.5 Lakh 80C limit. For someone in the 30% slab, this represents an instant 31.2% guaranteed return via tax savings in year 1.</p>
            <p><strong>The Annuity Trade-Off:</strong> At age 60, at least 40% of the NPS corpus must be converted into a life annuity. While this guarantees pension, annuity payouts are taxed at slab rates. Mutual funds provide 100% liquidity but no upfront tax deduction.</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '4px' }}>
              LAB 04 &bull; RETIREMENT & PENSION ARBITRAGE
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              NPS Tier-1 vs. Mutual Fund SIP & Annuity Simulator
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Compares 80CCD(1B) upfront tax deductions, retirement pension yield, and MF capital gains tax.
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
          Export Analysis CSV
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
            Monthly Contribution (₹)
          </label>
          <input
            type="number"
            step="1000"
            min="1000"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700 }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Annual: ₹{(monthlyContribution * 12).toLocaleString('en-IN')}</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Current Age / Retirement
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              min="18"
              max="59"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              style={{ width: '50%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
            />
            <span>to</span>
            <input
              type="number"
              min="60"
              max="75"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              style={{ width: '50%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Horizon: {result.yearsToRetire} Years</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            NPS Equity % ({equityAllocationPct}%)
          </label>
          <input
            type="range"
            min="20"
            max="75"
            step="5"
            value={equityAllocationPct}
            onChange={(e) => setEquityAllocationPct(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Scheme E (Max 75% under PFRDA)</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Income Tax Slab
          </label>
          <select
            value={taxSlabPct}
            onChange={(e) => setTaxSlabPct(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: '#FFFFFF' }}
          >
            <option value={30}>30% Slab (Max Tax Advantage)</option>
            <option value={20}>20% Slab</option>
            <option value={15}>15% Slab</option>
            <option value={10}>10% Slab</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Annuity % at 60 ({annuityPctAt60}%)
          </label>
          <input
            type="range"
            min="40"
            max="100"
            step="5"
            value={annuityPctAt60}
            onChange={(e) => setAnnuityPctAt60(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Min 40% mandatory by law</span>
        </div>
      </div>

      {/* Side-by-Side Architectural Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* NPS Tier-1 Plan */}
        <div
          style={{
            border: '2px solid #2563EB',
            borderRadius: '14px',
            padding: '20px',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                GOVERNMENT REGULATED (PFRDA)
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 750, color: '#0F172A', margin: '2px 0 0 0' }}>
                NPS Tier-1 Pension Scheme
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#DBEAFE', color: '#1E40AF', padding: '4px 8px', borderRadius: '4px' }}>
              EEE Status
            </span>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total Corpus at Age {retirementAge}</span>
            <div style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A' }}>
              ₹{result.nps.totalCorpusAtRetirement.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 650, marginTop: '2px' }}>
              Blended Return: {result.nps.blendedReturnPct.toFixed(1)}% CAGR
            </div>
          </div>

          {/* Breakdown Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Tax-Free Lump Sum ({(100 - annuityPctAt60)}%)</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                ₹{result.nps.lumpSumCorpus.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Monthly Pension for Life</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                ₹{result.nps.monthlyPension.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 80CCD Extra Advantage */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1E40AF' }}>
            <strong>80CCD(1B) Tax Shield:</strong> Saves <strong>₹{result.nps.annualTaxSavedUnder80Ccd1B.toLocaleString('en-IN')}</strong> in income tax every single year (Total: ₹{(result.nps.annualTaxSavedUnder80Ccd1B * result.yearsToRetire).toLocaleString('en-IN')} across your career).
          </div>
        </div>

        {/* Mutual Fund Alternative */}
        <div
          style={{
            border: '1px solid #CBD5E1',
            borderRadius: '14px',
            padding: '20px',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                COMMERCIAL WEALTH ENGINE
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 750, color: '#0F172A', margin: '2px 0 0 0' }}>
                Flexi-Cap / Index MF SIP
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>
              100% Liquid
            </span>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total Corpus at Age {retirementAge}</span>
            <div style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A' }}>
              ₹{result.mutualFund.totalCorpusAtRetirement.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 650, marginTop: '2px' }}>
              Assumed Pure Equity: 12.0% CAGR
            </div>
          </div>

          {/* Breakdown Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Net Post-Tax Lump Sum</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                ₹{result.mutualFund.netPostTaxLumpSum.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Estimated LTCG Tax (12.5%)</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>
                -₹{result.mutualFund.estimatedLtcgTaxAtRetirement.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Liquidity Note */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>
            <strong>Liquidity Advantage:</strong> No mandatory annuity locks. You can withdraw 100% cash whenever you desire or deploy a customized SWP for tax optimization.
          </div>
        </div>
      </div>

      {/* Decision Verdict Matrix */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 750, color: '#0F172A', margin: '0 0 8px 0' }}>
          Strategic Verdict for Indian Investors:
        </h4>
        <ul style={{ fontSize: '12.5px', color: '#334155', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
          <li>
            <strong>If in 30% Slab:</strong> Invest <strong>₹50,000/year (₹4,166/month)</strong> in NPS Tier-1 strictly to claim the Section 80CCD(1B) rebate. This yields an immediate 31.2% guaranteed tax saving.
          </li>
          <li>
            <strong>Surplus beyond ₹50k/year:</strong> Direct into <strong>Broad-based Mutual Funds (Nifty 50 / Flexi-Cap)</strong> to retain complete liquidity and avoid forced annuity lock-in at low yields.
          </li>
        </ul>
      </div>
    </div>
  );
}
