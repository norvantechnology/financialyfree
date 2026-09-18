'use client';

import React, { useState, useMemo } from 'react';
import { Download, Infinity as InfinityIcon, Info } from 'lucide-react';
import { calculateSwpPlan } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

export function SwpPlannerWidget() {
  const [initialCorpus, setInitialCorpus] = useState<number>(10000000); // 1 Cr
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<number>(50000); // 50k / mo
  const [expectedGrowthRatePct, setExpectedGrowthRatePct] = useState<number>(9); // 9% Hybrid
  const [annualStepUpPct, setAnnualStepUpPct] = useState<number>(5); // 5% inflation step-up
  const [investorTaxSlabPct, setInvestorTaxSlabPct] = useState<number>(30); // 30% slab
  const [horizonYears, setHorizonYears] = useState<number>(25);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateSwpPlan({
      initialCorpus,
      monthlyWithdrawal,
      expectedGrowthRatePct,
      annualStepUpPct,
      investorTaxSlabPct,
      horizonYears,
    });
  }, [initialCorpus, monthlyWithdrawal, expectedGrowthRatePct, annualStepUpPct, investorTaxSlabPct, horizonYears]);

  const handleExportCsv = () => {
    const headers = [
      'Year',
      'Opening Balance (₹)',
      'Total Withdrawn (₹)',
      'Investment Growth (₹)',
      'Closing Balance (₹)',
      'SWP Capital Gains Tax (₹)',
      'FD / Dividend Tax Equivalent (₹)',
    ];
    const rows = result.schedule.map((s) => [
      `Year ${s.year}`,
      s.openingBalance,
      s.withdrawnAmount,
      s.growthAmount,
      s.closingBalance,
      s.swpTax,
      s.fdDividendTax,
    ]);
    exportTableToCsv('SWP_Retirement_Cashflow_Plan', headers, rows);
  };

  const isPerpetual = result.isSustainableForever;

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
            <span>Retirement Cashflow Strategy: The Principal Redemption Shield</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Why SWP Beats Dividend/FD:</strong> In an FD or Dividend plan, 100% of the cash received is taxed at your marginal slab rate (up to 30%+). In an SWP, each withdrawal is a redemption of units comprising both principal and capital gains. <em>Only the gain portion is taxed</em>, drastically lowering effective tax.</p>
            <p><strong>The Safe Withdrawal Rate (SWR):</strong> With an initial withdrawal rate under 6% and a balanced portfolio earning ~9%, your corpus can absorb a 5% annual inflation step-up perpetually without depleting.</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '4px' }}>
              LAB 03 &bull; RETIREMENT CASHFLOW ENGINE
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              SWP Tax-Optimised Cashflow Planner
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Simulates corpus longevity, annual inflation step-up, and calculates tax savings vs. FD / Dividend payouts.
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
          Export Schedule CSV
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
            Starting Corpus (₹)
          </label>
          <input
            type="number"
            step="500000"
            min="1000000"
            value={initialCorpus}
            onChange={(e) => setInitialCorpus(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Monthly Withdrawal (₹)
          </label>
          <input
            type="number"
            step="5000"
            min="10000"
            value={monthlyWithdrawal}
            onChange={(e) => setMonthlyWithdrawal(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700 }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Initial Rate: {((monthlyWithdrawal * 12 / initialCorpus) * 100).toFixed(1)}%/yr
          </span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Portfolio CAGR ({expectedGrowthRatePct}%)
          </label>
          <input
            type="range"
            min="6"
            max="15"
            step="0.5"
            value={expectedGrowthRatePct}
            onChange={(e) => setExpectedGrowthRatePct(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Equity Savings / Hybrid ~9-11%</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Inflation Step-Up ({annualStepUpPct}%/yr)
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={annualStepUpPct}
            onChange={(e) => setAnnualStepUpPct(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Cost of living hike</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Income Tax Slab
          </label>
          <select
            value={investorTaxSlabPct}
            onChange={(e) => setInvestorTaxSlabPct(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: '#FFFFFF' }}
          >
            <option value={30}>30% Slab (High Earner)</option>
            <option value={20}>20% Slab</option>
            <option value={15}>15% Slab</option>
            <option value={10}>10% Slab</option>
          </select>
        </div>
      </div>

      {/* Outcome KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Longevity Status */}
        <div
          style={{
            border: isPerpetual ? '2px solid #10B981' : '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '20px',
            background: isPerpetual ? '#F0FDF4' : '#FFFBEB',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: isPerpetual ? '#15803D' : '#B45309', textTransform: 'uppercase' }}>
            Corpus Longevity
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isPerpetual ? (
              <>
                <InfinityIcon size={26} color="#059669" />
                <span>Sustainable</span>
              </>
            ) : (
              <span>{result.depletionYear ? `Depletes in Yr ${result.depletionYear}` : `Lasts >${horizonYears} Yrs`}</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            {isPerpetual
              ? 'Portfolio growth outpaces annual withdrawals + inflation.'
              : `Corpus projected to zero out around Year ${result.depletionYear}.`}
          </div>
        </div>

        {/* Total Cashflow Withdrawn */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            Total In-Pocket Cashflow
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            ₹{result.totalWithdrawn.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            Final Residual: ₹{result.finalRemainingCorpus.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Tax Saved by SWP vs FD/Dividend */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            Tax Saved via SWP Structure
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
            ₹{result.taxSavedVsFd.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            SWP Tax: ₹{result.totalTaxUnderSwp.toLocaleString('en-IN')} vs. FD: ₹{result.totalTaxUnderFd.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Tactical Strategy Note */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 20px', fontSize: '12.5px', color: '#334155' }}>
        <strong>Why SWP is unmatched for Indian Retirees:</strong>
        <p style={{ margin: '4px 0 0 0', lineHeight: 1.5 }}>
          When you receive bank FD interest or mutual fund dividends (IDCW), the entire payout is added to your income and taxed at your marginal slab rate ({investorTaxSlabPct}%).
          With an <strong>SWP</strong>, you only pay LTCG tax on the small capital gain portion embedded in the units sold. The principal component is completely tax-free! Over {horizonYears} years, this saves you <strong>₹{result.taxSavedVsFd.toLocaleString('en-IN')}</strong> in taxes alone.
        </p>
      </div>

      {/* Schedule Preview Table */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', marginBottom: '10px' }}>
          Year-by-Year Cashflow & Balance Progression
        </h3>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px', fontWeight: 700 }}>Year</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Annual Withdrawn</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Portfolio Growth</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Year-End Corpus</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>SWP Tax</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right', color: '#059669' }}>Tax Saved</th>
              </tr>
            </thead>
            <tbody>
              {result.schedule.slice(0, 10).map((s) => (
                <tr key={s.year} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>Year {s.year}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 650, color: '#0F172A' }}>
                    ₹{s.withdrawnAmount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#059669', fontWeight: 650 }}>
                    +₹{s.growthAmount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: s.closingBalance > 0 ? '#0F172A' : '#DC2626' }}>
                    ₹{s.closingBalance.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748B' }}>
                    ₹{s.swpTax.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    +₹{(s.fdDividendTax - s.swpTax).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.schedule.length > 10 && (
          <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748B', marginTop: '6px' }}>
            Showing first 10 years. Export CSV to view complete {horizonYears}-year timeline.
          </div>
        )}
      </div>
    </div>
  );
}
