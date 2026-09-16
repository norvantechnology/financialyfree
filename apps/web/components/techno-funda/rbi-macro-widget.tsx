'use client';

import React, { useState } from 'react';
import { Landmark, Calendar, Download} from 'lucide-react';
import { exportTableToCsv } from '../../lib/csv-export';
import { TfLoadingState } from './tf-loading-state';

export interface RbiMacroData {
  lastUpdated: string;
  source: string;
  message?: string;
  currentRates: {
    repoRate: number | null;
    standingDepositFacility: number | null;
    marginalStandingFacility: number | null;
    bankRate: number | null;
    cashReserveRatio: number | null;
    statutoryLiquidityRatio: number | null;
  } | null;
  nextMpcMeeting: {
    startDate: string;
    decisionDate: string;
    expectedAction: string;
    status: string;
  } | null;
  policyStance: string | null;
  rateHistory: Array<{
    date: string;
    repoRate: number;
    changeBps: number;
    direction: 'HIKE' | 'CUT' | 'PAUSE';
  }> | null;
  macroIndicators: {
    cpiInflation: number | null;
    cpiTarget: string | null;
    gdpGrowthFy26: number | null;
    gsec10Y: number | null;
  } | null;
}

interface RbiMacroWidgetProps {
  data: RbiMacroData | null;
  isLoading?: boolean;
}

function fmtPct(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '—' : `${value.toFixed(2)}%`;
}

export function RbiMacroWidget({ data, isLoading }: RbiMacroWidgetProps) {

  if (isLoading && !data) {
    return (
      <TfLoadingState
        title="Loading RBI macro radar…"
        subtitle="Fetching policy rates and MPC calendar from live RBI sources."
        variant="cards"
        rows={4}
      />
    );
  }

  if (!data) return null;

  const rates = data.currentRates;
  const mpc = data.nextMpcMeeting;
  const macro = data.macroIndicators;
  const history = Array.isArray(data.rateHistory) ? data.rateHistory : [];
  const decisionDate = mpc?.decisionDate ?? 'TBD';
  const expectedAction = mpc?.expectedAction ?? 'Unavailable';
  const policyStance = data.policyStance ?? 'Unavailable';

  const handleExportCsv = () => {
    const headers = ['Metric / Indicator', 'Current Value', 'Details'];
    const rows = [
      ['Policy Repo Rate', fmtPct(rates?.repoRate), 'Benchmark Lending Rate'],
      ['Standing Deposit Facility (SDF)', fmtPct(rates?.standingDepositFacility), 'Liquidity Absorption Floor'],
      ['Marginal Standing Facility (MSF)', fmtPct(rates?.marginalStandingFacility), 'Overnight Liquidity Ceiling'],
      ['Cash Reserve Ratio (CRR)', fmtPct(rates?.cashReserveRatio), 'Bank Reserve Requirement'],
      ['Retail CPI Inflation', fmtPct(macro?.cpiInflation), `Target: ${macro?.cpiTarget ?? '—'}`],
      ['10-Yr Benchmark G-Sec Yield', fmtPct(macro?.gsec10Y), 'Sovereign Yield Anchor'],
      ['Next MPC Decision Date', decisionDate, `Expected: ${expectedAction}`],
      ['Policy Stance', policyStance, 'Official RBI Stance'],
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>


      {data.message && (
        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{data.message}</p>
      )}

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
            flexShrink: 0 }}>
            <Landmark size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 750, color: '#0F172A', margin: 0 }}>
              RBI Macro
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Policy rates &amp; MPC calendar
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
            whiteSpace: 'nowrap' }}>
            <Calendar size={12} />
            Next MPC: {decisionDate}
          </div>
        </div>
      </div>

      {/* ── Core Rate Cards Grid (2-col on Mobile, 4-col on Desktop) ── */}
      <div className="tf-kpi-grid-responsive">
        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Policy Repo Rate
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {fmtPct(rates?.repoRate)}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 650 }}>
            Benchmark Lending Rate
          </div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Standing Deposit (SDF)
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {fmtPct(rates?.standingDepositFacility)}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 650 }}>
            Liquidity Absorption Floor
          </div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Retail CPI Inflation
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {fmtPct(macro?.cpiInflation)}
          </div>
          <div className="tf-kpi-sub" style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 650 }}>
            {macro?.cpiTarget ? `Target: ${macro.cpiTarget}` : 'CPI target unavailable'}
          </div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            10-Yr Benchmark G-Sec
          </div>
          <div className="tf-kpi-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {fmtPct(macro?.gsec10Y)}
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
        fontSize: '12px' }}>
        <div>
          <span style={{ color: '#64748B' }}>Monetary Policy Stance:</span>{' '}
          <strong style={{ color: '#0F172A' }}>{policyStance}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B' }}>Market Expectation:</span>{' '}
          <strong style={{ color: '#4338CA' }}>{expectedAction}</strong>
        </div>
      </div>

      {/* ── Historical Rate Cycle Steps ── */}
      <div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Recent Policy Rate Trajectory
        </div>
        {history.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>No recent rate history available from live RBI sources.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {history.map((step) => (
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
                  gap: '5px' }}
              >
                <span style={{ color: '#64748B' }}>{step.date}:</span>
                <strong style={{ color: '#0F172A' }}>{fmtPct(step.repoRate)}</strong>
                <span style={{
                  color: step.direction === 'HIKE' ? '#059669' : '#DC2626',
                  fontWeight: 750,
                  fontSize: '10.5px' }}>
                  ({step.changeBps >= 0 ? '+' : ''}{step.changeBps} bps)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
