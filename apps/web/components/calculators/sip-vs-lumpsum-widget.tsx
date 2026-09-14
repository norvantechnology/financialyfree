'use client';

import React, { useState, useMemo } from 'react';
import { Download, CheckCircle2, TrendingUp, Sliders, Info } from 'lucide-react';
import { calculateSipVsLumpsum, MarketRegime } from '@ff/calc';
import { exportTableToCsv } from '../../lib/csv-export';

export function SipVsLumpsumWidget() {
  const [totalCapital, setTotalCapital] = useState<number>(600000);
  const [sipDurationMonths, setSipDurationMonths] = useState<number>(12);
  const [holdingHorizonYears, setHoldingHorizonYears] = useState<number>(5);
  const [expectedAnnualReturnPct, setExpectedAnnualReturnPct] = useState<number>(12);
  const [marketRegime, setMarketRegime] = useState<MarketRegime>('STEADY_GROWTH');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateSipVsLumpsum({
      totalCapital,
      sipDurationMonths,
      holdingHorizonYears,
      expectedAnnualReturnPct,
      marketRegime,
    });
  }, [totalCapital, sipDurationMonths, holdingHorizonYears, expectedAnnualReturnPct, marketRegime]);

  const handleExportCsv = () => {
    const headers = ['Year', 'Lumpsum Corpus (₹)', 'SIP Corpus (₹)', 'Delta Value (₹)'];
    const rows = result.trajectory.map((t) => [
      `Year ${t.year}`,
      t.lumpsumValue,
      t.sipValue,
      t.lumpsumValue - t.sipValue,
    ]);
    exportTableToCsv('SIP_vs_Lumpsum_Simulation', headers, rows);
  };

  const isLumpsumWinner = result.winner === 'LUMPSUM';

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
            <span>Mathematical Basis: Time in Market vs. Rupee Cost Averaging</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Lumpsum Premium:</strong> Over 70% of historical rolling 5-year periods in Nifty 50, lumpsum investing beats SIP because markets trend upward ~72% of trading days, maximizing compounding time.</p>
            <p><strong>SIP Downside Protection:</strong> If a major drawdown (&gt;15%) occurs in year 1, SIP vastly outperforms by accumulating units at beaten-down NAVs.</p>
            <p><strong>STP Compromise:</strong> Parking lumpsum capital in an overnight/liquid fund earning ~6.5% and executing an STP (Systematic Transfer Plan) over 6–12 months blends both benefits.</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#EEF2FF', color: '#4338CA', padding: '3px 8px', borderRadius: '4px' }}>
              LAB 01 &bull; ALLOCATION TIMING
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              SIP vs. Lumpsum Visualiser
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Quantifies the exact returns difference between deploying a lump-sum now vs. staggering via SIP / STP.
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
          Export Simulation CSV
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
            Capital to Invest (₹)
          </label>
          <input
            type="number"
            step="50000"
            min="50000"
            value={totalCapital}
            onChange={(e) => setTotalCapital(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            SIP Period ({sipDurationMonths} Months)
          </label>
          <input
            type="range"
            min="3"
            max="36"
            value={sipDurationMonths}
            onChange={(e) => setSipDurationMonths(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>₹{Math.round(totalCapital / sipDurationMonths).toLocaleString('en-IN')}/mo</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Horizon ({holdingHorizonYears} Years)
          </label>
          <input
            type="range"
            min="1"
            max="25"
            value={holdingHorizonYears}
            onChange={(e) => setHoldingHorizonYears(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Holding period</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Expected Return ({expectedAnnualReturnPct}% CAGR)
          </label>
          <input
            type="range"
            min="5"
            max="22"
            value={expectedAnnualReturnPct}
            onChange={(e) => setExpectedAnnualReturnPct(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: '#64748B' }}>Nifty Long Term ~12.5%</span>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Market Regime Scenario
          </label>
          <select
            value={marketRegime}
            onChange={(e) => setMarketRegime(e.target.value as MarketRegime)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 650, background: '#FFFFFF' }}
          >
            <option value="STEADY_GROWTH">Steady Growth (Normal)</option>
            <option value="EARLY_CRASH">Early Crash (-20% Drop in Year 1)</option>
            <option value="HIGH_VOLATILITY">High Volatility (Sideways Choppy)</option>
            <option value="BULL_RUN">Runaway Bull Run (+25% Front-loaded)</option>
          </select>
        </div>
      </div>

      {/* Outcome Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Lumpsum Result Card */}
        <div
          style={{
            border: isLumpsumWinner ? '2px solid #10B981' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            background: isLumpsumWinner ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, #FFFFFF 100%)' : '#FFFFFF',
            position: 'relative',
          }}
        >
          {isLumpsumWinner && (
            <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              HIGHER RETURN
            </span>
          )}
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            Lumpsum Final Corpus
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            ₹{result.lumpsumFinalValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            +₹{(result.lumpsumFinalValue - totalCapital).toLocaleString('en-IN')} total gains
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '12px' }}>
            Effective IRR: <strong>{result.lumpsumIrrPct.toFixed(2)}%</strong>
          </div>
        </div>

        {/* SIP Result Card */}
        <div
          style={{
            border: !isLumpsumWinner ? '2px solid #10B981' : '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            background: !isLumpsumWinner ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, #FFFFFF 100%)' : '#FFFFFF',
            position: 'relative',
          }}
        >
          {!isLumpsumWinner && (
            <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              HIGHER RETURN
            </span>
          )}
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            SIP / STP Final Corpus
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            ₹{result.sipFinalValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            +₹{(result.sipFinalValue - totalCapital).toLocaleString('en-IN')} total gains
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '12px' }}>
            Effective IRR: <strong>{result.sipIrrPct.toFixed(2)}%</strong>
          </div>
        </div>

        {/* Alpha Difference Card */}
        <div
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            background: '#F8FAFC',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase' }}>
            Corpus Advantage
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4338CA', marginTop: '6px' }}>
            ₹{result.differenceRupees.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: 650, marginTop: '4px' }}>
            {result.differencePct.toFixed(1)}% advantage for {result.winner}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '12px' }}>
            Scenario: <strong>{marketRegime.replace('_', ' ')}</strong>
          </div>
        </div>
      </div>

      {/* Institutional Recommendation Box */}
      <div
        style={{
          background: isLumpsumWinner ? '#F0FDF4' : '#EFF6FF',
          border: `1px solid ${isLumpsumWinner ? '#BBF7D0' : '#BFDBFE'}`,
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '13.5px', fontWeight: 750, color: isLumpsumWinner ? '#166534' : '#1E40AF' }}>
          Strategic Verdict: {isLumpsumWinner ? 'Lumpsum Front-Loading Leads' : 'SIP / STP Downside Buffer Leads'}
        </div>
        <div style={{ fontSize: '12.5px', color: '#334155' }}>
          {result.verdict}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
          <strong>Actionable Rule of Thumb:</strong> {result.recommendation}
        </div>
      </div>

      {/* Trajectory Table */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', marginBottom: '10px' }}>
          Annual Wealth Progression Comparison
        </h3>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Milestone</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Lumpsum Corpus</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>SIP Corpus</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Delta (Lump - SIP)</th>
              </tr>
            </thead>
            <tbody>
              {result.trajectory.map((t) => {
                const delta = t.lumpsumValue - t.sipValue;
                return (
                  <tr key={t.year} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                      Year {t.year}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                      ₹{t.lumpsumValue.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                      ₹{t.sipValue.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 750, color: delta >= 0 ? '#059669' : '#DC2626' }}>
                      {delta >= 0 ? `+₹${delta.toLocaleString('en-IN')}` : `-₹${Math.abs(delta).toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
