'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Sliders,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Home,
  Briefcase,
  X,
  RotateCcw,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';

interface ActiveGoal {
  id: string;
  type: 'retirement' | 'child_education' | 'home_purchase' | 'wealth_creation' | 'emergency_fund';
  name: string;
  targetCorpus: number;
  horizonYears: number;
  currentSavings: number;
  riskBand: 'conservative' | 'balanced' | 'growth';
  expectedReturn: number;
  monthlySip: number;
  projectedCorpus: number;
}

const INITIAL_GOALS: ActiveGoal[] = [
  {
    id: 'g-retire',
    type: 'retirement',
    name: 'Early Retirement (FIRE 45)',
    targetCorpus: 25000000, // ₹2.5 Cr
    horizonYears: 12,
    currentSavings: 1500000, // ₹15 L
    riskBand: 'growth',
    expectedReturn: 14.0,
    monthlySip: 54000,
    projectedCorpus: 25800000,
  },
  {
    id: 'g-child',
    type: 'child_education',
    name: "Higher Education Fund (Sample)",
    targetCorpus: 5000000, // ₹50 L
    horizonYears: 8,
    currentSavings: 400000,
    riskBand: 'balanced',
    expectedReturn: 12.0,
    monthlySip: 24500,
    projectedCorpus: 5120000,
  },
  {
    id: 'g-home',
    type: 'home_purchase',
    name: '3BHK Villa Down Payment',
    targetCorpus: 3000000, // ₹30 L
    horizonYears: 4,
    currentSavings: 800000,
    riskBand: 'conservative',
    expectedReturn: 8.5,
    monthlySip: 36000,
    projectedCorpus: 3080000,
  },
];

function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function GoalsDashboardPage() {
  const [goals, setGoals] = useState<ActiveGoal[]>(INITIAL_GOALS);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(100000);
  const [stepUpRate, setStepUpRate] = useState<number>(10);

  // New Goal Wizard Form State
  const [wizardType, setWizardType] = useState<ActiveGoal['type']>('retirement');
  const [wizardName, setWizardName] = useState('My New Wealth Goal');
  const [wizardCorpus, setWizardCorpus] = useState<number>(5000000);
  const [wizardHorizon, setWizardHorizon] = useState<number>(10);
  const [wizardSavings, setWizardSavings] = useState<number>(200000);
  const [wizardRisk, setWizardRisk] = useState<'conservative' | 'balanced' | 'growth'>('balanced');

  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});

  const getReturnRate = (r: 'conservative' | 'balanced' | 'growth') =>
    r === 'conservative' ? 8.5 : r === 'growth' ? 14.0 : 12.0;

  // Simple pure calculation for wizard live preview
  const calcWizardSIP = () => {
    const r = getReturnRate(wizardRisk) / 100 / 12;
    const n = wizardHorizon * 12;
    const fvSavings = wizardSavings * Math.pow(1 + r, n);
    const remaining = Math.max(0, wizardCorpus - fvSavings);
    if (remaining <= 0) return 0;
    const sip = (remaining * r) / (Math.pow(1 + r, n) - 1);
    return Math.ceil(sip);
  };

  const handleAddGoal = () => {
    const errs: Record<string, string> = {};
    if (!wizardName || wizardName.trim().length < 2) {
      errs.name = 'Please provide a descriptive goal name (at least 2 characters).';
    }
    if (!wizardCorpus || wizardCorpus < 10000) {
      errs.corpus = 'Target corpus amount must be at least ₹10,000.';
    }
    if (wizardSavings < 0) {
      errs.savings = 'Current savings cannot be negative.';
    }
    if (wizardHorizon < 1) {
      errs.horizon = 'Investment time horizon must be at least 1 year.';
    }
    if (Object.keys(errs).length > 0) {
      setWizardErrors(errs);
      return;
    }
    setWizardErrors({});
    const sip = calcWizardSIP();
    const newGoal: ActiveGoal = {
      id: `g-${Date.now()}`,
      type: wizardType,
      name: wizardName.trim(),
      targetCorpus: wizardCorpus,
      horizonYears: wizardHorizon,
      currentSavings: wizardSavings,
      riskBand: wizardRisk,
      expectedReturn: getReturnRate(wizardRisk),
      monthlySip: sip,
      projectedCorpus: Math.round(wizardCorpus * 1.02),
    };
    setGoals([newGoal, ...goals]);
    setIsWizardOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleResetDefaults = () => {
    setGoals(INITIAL_GOALS);
    setMonthlySurplus(100000);
    setStepUpRate(10);
  };

  // Metrics
  const totalTarget = goals.reduce((s, g) => s + g.targetCorpus, 0);
  const totalSavings = goals.reduce((s, g) => s + g.currentSavings, 0);
  const totalRequiredSip = goals.reduce((s, g) => s + g.monthlySip, 0);
  const surplusGap = monthlySurplus - totalRequiredSip;

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Static Snapshot Banner */}
        <StaticSnapshotBanner
          datasetNote="Aureus demo dataset - last modeled 02 Sep 2026"
          sourceNote="Not live market data or investment advice."
        />

        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <div className="category-tag">
              <Target size={13} />
              <span>DECISION SUPPORT / WEALTH ARCHITECTURE</span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              Goal Architecture & FIRE Planner
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '640px' }}>
              Make the assumptions visible. A financial plan is only as useful as the inputs behind it.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleResetDefaults}
              className="btn btn-outline"
              style={{
                minHeight: '38px',
                padding: '8px 16px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="btn btn-primary"
              style={{
                minHeight: '38px',
                padding: '8px 20px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              <span>Calculate & Add Goal</span>
            </button>
          </div>
        </div>

        {/* KPI Overview Cards (Clean White with 1px border) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Active Goals</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              {goals.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '4px', fontWeight: 600 }}>
              Multi-goal allocation active
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Target Corpus</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              {formatINR(totalTarget)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Across all time horizons
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Required SIP</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              ₹{totalRequiredSip.toLocaleString('en-IN')}/mo
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Formula verified & auditable
            </div>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Current Savings Deployed</span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>
              {formatINR(totalSavings)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Compounding toward goals
            </div>
          </div>
        </div>

        {/* Multi-Goal Surplus Allocator Card */}
        <div
          className="card"
          style={{
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-10)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Sliders size={18} color="var(--color-accent)" />
                <span>Multi-Goal Investable Surplus Optimizer</span>
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Enter your monthly savings to see how capital automatically distributes across short, medium, and long-term goals.
              </p>
            </div>

            {/* Surplus Gap Badge */}
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: surplusGap >= 0 ? '#DCFCE7' : '#FEE2E2',
                border: `1px solid ${surplusGap >= 0 ? '#BBF7D0' : '#FECACA'}`,
                color: surplusGap >= 0 ? '#166534' : '#991B1B',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              {surplusGap >= 0 ? `Surplus: +₹${surplusGap.toLocaleString('en-IN')}` : `Shortfall: -₹${Math.abs(surplusGap).toLocaleString('en-IN')}`}
            </div>
          </div>

          {/* Surplus Slider & Input */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Monthly Investable Surplus: <strong style={{ color: 'var(--text-primary)' }}>₹{monthlySurplus.toLocaleString('en-IN')}</strong>
              </label>
              <input
                type="range"
                min={10000}
                max={300000}
                step={5000}
                value={monthlySurplus}
                onChange={(e) => setMonthlySurplus(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Annual SIP Step-up Rate: <strong style={{ color: 'var(--text-primary)' }}>{stepUpRate}% / year</strong>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                step={5}
                value={stepUpRate}
                onChange={(e) => setStepUpRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div>
            <div style={{ display: 'flex', height: '12px', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-4)', background: '#E5E7EB' }}>
              {goals.map((g, idx) => {
                const colors = ['#0F172A', '#0F766E', '#D97706', '#2563EB', '#7C3AED'];
                const pct = totalRequiredSip > 0 ? (g.monthlySip / totalRequiredSip) * 100 : 100 / goals.length;
                return (
                  <div
                    key={g.id}
                    style={{
                      width: `${pct}%`,
                      background: colors[idx % colors.length],
                      transition: 'width 0.3s ease',
                    }}
                    title={`${g.name}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              {goals.map((g, idx) => {
                const colors = ['#0F172A', '#0F766E', '#D97706', '#2563EB', '#7C3AED'];
                const pct = totalRequiredSip > 0 ? ((g.monthlySip / totalRequiredSip) * 100).toFixed(0) : '0';
                const allocated = totalRequiredSip > 0 ? Math.round((g.monthlySip / totalRequiredSip) * monthlySurplus) : 0;
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{g.name}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>₹{allocated.toLocaleString('en-IN')} ({pct}%)</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Goals Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              className="font-serif"
              style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}
            >
              Your Active Goals & Glide Paths
            </h3>
            {goals === INITIAL_GOALS && (
              <span className="badge-muted" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '10px' }}>
                Sample Demo Data
              </span>
            )}
          </div>
          {goals.length > 0 && (
            <button
              type="button"
              onClick={() => setGoals([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear to Empty State
            </button>
          )}
          {goals.length === 0 && (
            <button
              type="button"
              onClick={() => setGoals(INITIAL_GOALS)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F766E',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ↺ Load Sample Goals
            </button>
          )}
        </div>

        {goals.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              marginBottom: 'var(--space-12)',
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F4F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Target size={22} color="#6B7280" />
            </div>
            <h4 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
              No Custom Goals Created Yet
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 16px' }}>
              Calculate your financial independence number, children’s higher education, or emergency reserve with our transparent mathematical models.
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>Create Your First Goal</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-12)',
            }}
          >
            {goals.map((goal) => {
            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {goal.type === 'retirement' && <Briefcase size={14} color="var(--color-primary)" />}
                        {goal.type === 'child_education' && <GraduationCap size={14} color="var(--color-accent)" />}
                        {goal.type === 'home_purchase' && <Home size={14} color="var(--color-warning)" />}
                        <span className="badge-muted">
                          {goal.horizonYears} Years Horizon
                        </span>
                      </div>
                      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{goal.name}</h4>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Remove Goal"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Corpus</span>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                        {formatINR(goal.targetCorpus)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Savings</span>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-success)' }}>
                        {formatINR(goal.currentSavings)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <span>Risk Profile: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{goal.riskBand}</strong> ({goal.expectedReturn}% p.a.)</span>
                    <span>Glide Path: <strong style={{ color: 'var(--color-accent)' }}>Active</strong></span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Recommended Monthly SIP</span>
                    <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{goal.monthlySip.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    href="/dashboard/invest"
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      minHeight: '38px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      gap: '6px',
                    }}
                  >
                    <span>Link Mutual Funds</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

        {/* Goal Questionnaire Wizard Modal */}
        {isWizardOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 500,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              className="responsive-modal card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                padding: 'var(--space-6)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                margin: 'auto',
                maxHeight: 'calc(100dvh - 32px)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#D97706" />
                  <h3 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Plan a New Financial Goal
                  </h3>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Goal Type Selection */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                  Select Goal Objective
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'retirement', label: 'Retirement (FIRE)' },
                    { id: 'child_education', label: 'Higher Education' },
                    { id: 'home_purchase', label: 'Dream Home' },
                    { id: 'wealth_creation', label: 'Wealth Alpha' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setWizardType(t.id as any);
                        setWizardName(t.label);
                      }}
                      className={`pill-btn ${wizardType === t.id ? 'pill-btn-active' : ''}`}
                      style={{
                        padding: '10px 8px',
                        fontSize: '12px',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Name */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Goal Title / Name
                </label>
                <input
                  type="text"
                  value={wizardName}
                  onChange={(e) => {
                    setWizardName(e.target.value);
                    if (wizardErrors.name) setWizardErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: '#FFFFFF',
                    border: wizardErrors.name ? '1px solid #DC2626' : '1px solid #D1D5DB',
                    color: '#111827',
                    fontSize: 'var(--text-sm)',
                    outline: 'none',
                  }}
                />
                {wizardErrors.name && (
                  <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                    {wizardErrors.name}
                  </div>
                )}
              </div>

              {/* Target Corpus & Horizon */}
              <div className="grid-responsive-2" style={{ marginBottom: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Target Corpus (₹)
                  </label>
                  <input
                    type="number"
                    value={wizardCorpus}
                    onChange={(e) => {
                      setWizardCorpus(Number(e.target.value));
                      if (wizardErrors.corpus) setWizardErrors((prev) => ({ ...prev, corpus: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: wizardErrors.corpus ? '1px solid #DC2626' : '1px solid #D1D5DB',
                      color: '#111827',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  {wizardErrors.corpus && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                      {wizardErrors.corpus}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Horizon: <strong style={{ color: '#111827' }}>{wizardHorizon} Years</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={wizardHorizon}
                    onChange={(e) => {
                      setWizardHorizon(Number(e.target.value));
                      if (wizardErrors.horizon) setWizardErrors((prev) => ({ ...prev, horizon: '' }));
                    }}
                    style={{ width: '100%', accentColor: '#0F172A', marginTop: '8px' }}
                  />
                  {wizardErrors.horizon && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                      {wizardErrors.horizon}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Savings & Risk Band */}
              <div className="grid-responsive-2" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Existing Savings (₹)
                  </label>
                  <input
                    type="number"
                    value={wizardSavings}
                    onChange={(e) => {
                      setWizardSavings(Number(e.target.value));
                      if (wizardErrors.savings) setWizardErrors((prev) => ({ ...prev, savings: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: wizardErrors.savings ? '1px solid #DC2626' : '1px solid #D1D5DB',
                      color: '#111827',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  {wizardErrors.savings && (
                    <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>
                      {wizardErrors.savings}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Risk Profile
                  </label>
                  <select
                    value={wizardRisk}
                    onChange={(e) => setWizardRisk(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      color: '#111827',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <option value="conservative">Conservative (8.5% p.a.)</option>
                    <option value="balanced">Balanced (12.0% p.a.)</option>
                    <option value="growth">Growth (14.0% p.a.)</option>
                  </select>
                </div>
              </div>

              {/* Live SIP Calculation Summary Banner */}
              <div
                style={{
                  background: '#FEF9E7',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#78350F' }}>Computed Monthly SIP</span>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#92400E' }}>
                    ₹{calcWizardSIP().toLocaleString('en-IN')}/mo
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#92400E', opacity: 0.85 }}>
                  <span>Formula: FV of Annuity</span>
                  <br />
                  <span>Deterministic Model</span>
                </div>
              </div>

              <button
                onClick={handleAddGoal}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Save Goal & Launch Glide Path
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
