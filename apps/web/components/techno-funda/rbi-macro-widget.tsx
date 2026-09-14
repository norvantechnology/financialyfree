'use client';

import React, { useState } from 'react';
import { Landmark, Calendar, Download, Info } from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';

export interface RbiMacroData {
  lastUpdated: string;
  source: string;
  currentRates: {
    repoRate: number;
    standingDepositFacility: number;
    marginalStandingFacility: number;
    bankRate: number;
    cashReserveRatio: number;
    statutoryLiquidityRatio: number;
  };
  nextMpcMeeting: {
    startDate: string;
    decisionDate: string;
    expectedAction: string;
    status: string;
  };
  policyStance: string;
  rateHistory: Array<{
    date: string;
    repoRate: number;
    changeBps: number;
    direction: 'HIKE' | 'CUT' | 'PAUSE';
  }>;
  macroIndicators: {
    cpiInflation: number;
    cpiTarget: string;
    gdpGrowthFy26: number;
    gsec10Y: number;
  };
}

interface RbiMacroWidgetProps {
  data: RbiMacroData | null;
  isLoading?: boolean;
}

export function RbiMacroWidget({ data, isLoading: _isLoading }: RbiMacroWidgetProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  if (!data) return null;

  const handleExportCsv = () => {
    const headers = ['Metric / Indicator', 'Current Value', 'Details'];
    const rows = [
      ['Policy Repo Rate', `${data.currentRates.repoRate.toFixed(2)}%`, 'Benchmark Lending Rate'],
      ['Standing Deposit Facility (SDF)', `${data.currentRates.standingDepositFacility.toFixed(2)}%`, 'Liquidity Absorption Floor'],
      ['Marginal Standing Facility (MSF)', `${data.currentRates.marginalStandingFacility.toFixed(2)}%`, 'Overnight Liquidity Ceiling'],
      ['Cash Reserve Ratio (CRR)', `${data.currentRates.cashReserveRatio.toFixed(2)}%`, 'Bank Reserve Requirement'],
      ['Retail CPI Inflation', `${data.macroIndicators.cpiInflation.toFixed(2)}%`, `Target: ${data.macroIndicators.cpiTarget}`],
      ['10-Yr Benchmark G-Sec Yield', `${data.macroIndicators.gsec10Y.toFixed(2)}%`, 'Sovereign Yield Anchor'],
      ['Next MPC Decision Date', data.nextMpcMeeting.decisionDate, `Expected: ${data.nextMpcMeeting.expectedAction}`],
      ['Policy Stance', data.policyStance, 'Official RBI Stance'],
    ];
    exportTableToCsv('RBI_Monetary_Policy_Macro', headers, rows);
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      {/* ── Contextual Methodology Guide ── */}
      <div className="tf-methodology-card" style={{ margin: 0 }}>
        <div className="tf-methodology-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <div className="tf-methodology-title">
            <Info size={14} />
            <span>Monetary Transmission, Net Interest Margins &amp; Yield Curve Dynamics</span>
          </div>
          <span className="tf-methodology-toggle">{isGuideOpen ? 'Hide Guide' : 'Show Guide'}</span>
        </div>
        {isGuideOpen && (
          <div className="tf-methodology-body">
            <p><strong>Repo Rate Impact on Equities:</strong> Changes in repo rate directly transmit to external benchmark-linked lending rates (EBLR). Rate cuts lower corporate borrowing costs and expand equity valuation multiples.</p>
            <p><strong>Bank NIM Sensitivity:</strong> When RBI holds or cuts rates, banks with high CASA deposits witness delayed repricing on liabilities while lending yields adjust faster, impacting Net Interest Margins (NIM).</p>
            <p><strong>10-Year G-Sec Yield:</strong> Acts as the sovereign hurdle rate for equity risk premiums (ERP). Falling bond yields stimulate institutional liquidity flows toward equities.</p>
          </div>
        )}
      </div>

      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(67, 56, 202, 0.1)',
            color: '#4338CA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Landmark size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              RBI Monetary Policy &amp; Macro Radar
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Policy Repo Rate, MPC meeting calendar, and yield curve telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            className="tf-export-btn"
            title="Download macro data to CSV"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: '#EEF2FF',
            color: '#4338CA',
            fontSize: '11.5px',
            fontWeight: 700,
            border: '1px solid #C7D2FE',
            whiteSpace: 'nowrap',
          }}>
            <Calendar size={12} />
            Next MPC: {data.nextMpcMeeting.decisionDate}
          </div>
        </div>
      </div>

      {/* ── Core Rate Cards Grid (2-col on Mobile, 4-col on Desktop) ── */}
      <div className="tf-kpi-grid-responsive">
        {/* Repo Rate */}
        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Policy Repo Rate
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {data.currentRates.repoRate.toFixed(2)}%
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 650 }}>
            Benchmark Lending Rate
          </div>
        </div>

        {/* SDF */}
        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Standing Deposit (SDF)
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {data.currentRates.standingDepositFacility.toFixed(2)}%
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 650 }}>
            Liquidity Absorption Floor
          </div>
        </div>

        {/* CPI Inflation */}
        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Retail CPI Inflation
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {data.macroIndicators.cpiInflation.toFixed(2)}%
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 650 }}>
            Inside 4.0% Target Band
          </div>
        </div>

        {/* 10Y G-Sec Yield */}
        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            10-Yr Benchmark G-Sec
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {data.macroIndicators.gsec10Y.toFixed(2)}%
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 650 }}>
            Sovereign Yield Curve Anchor
          </div>
        </div>
      </div>

      {/* ── Policy Stance & Next Meeting Details ── */}
      <div style={{
        background: '#F8FAFC',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
      }}>
        <div>
          <span style={{ color: '#64748B' }}>Monetary Policy Stance:</span>{' '}
          <strong style={{ color: '#0F172A' }}>{data.policyStance}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B' }}>Market Expectation:</span>{' '}
          <strong style={{ color: '#4338CA' }}>{data.nextMpcMeeting.expectedAction}</strong>
        </div>
      </div>

      {/* ── Historical Rate Cycle Steps ── */}
      <div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Recent Policy Rate Trajectory
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {data.rateHistory.map((step) => (
            <div
              key={step.date}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ color: '#64748B' }}>{step.date}:</span>
              <strong style={{ color: '#0F172A' }}>{step.repoRate.toFixed(2)}%</strong>
              <span style={{
                color: step.direction === 'HIKE' ? '#059669' : '#DC2626',
                fontWeight: 750,
                fontSize: '10.5px',
              }}>
                (+{step.changeBps} bps)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
