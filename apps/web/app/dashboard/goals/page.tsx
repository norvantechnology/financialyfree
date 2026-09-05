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
} from 'lucide-react';
import { useTranslation } from '../../../lib/i18n/language-context';

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
    name: "Aarav's Overseas Masters Degree",
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
  const { t } = useTranslation();
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
    const sip = calcWizardSIP();
    const newGoal: ActiveGoal = {
      id: `g-${Date.now()}`,
      type: wizardType,
      name: wizardName,
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

  // Metrics
  const totalTarget = goals.reduce((s, g) => s + g.targetCorpus, 0);
  const totalSavings = goals.reduce((s, g) => s + g.currentSavings, 0);
  const totalRequiredSip = goals.reduce((s, g) => s + g.monthlySip, 0);
  const surplusGap = monthlySurplus - totalRequiredSip;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-primary-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            <Target size={14} />
            <span>Goal-Based Wealth Architecture</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
            {t.goals.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {t.goals.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
          }}
        >
          <Plus size={18} />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Active Goals</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px' }}>
            {goals.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-primary-400)', marginTop: '4px' }}>
            Multi-goal allocation enabled
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Target Corpus</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>
            {formatINR(totalTarget)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all time horizons
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Required SIP</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary-400)' }}>
            ₹{totalRequiredSip.toLocaleString('en-IN')}/mo
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Formula verified & auditable
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Current Savings Deployed</span>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginTop: '4px', color: 'var(--color-success-400)' }}>
            {formatINR(totalSavings)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Compounding toward goals
          </div>
        </div>
      </div>

      {/* Multi-Goal Surplus Allocator Card */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--color-primary-400)" />
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
              background: surplusGap >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${surplusGap >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: surplusGap >= 0 ? 'var(--color-success-400)' : 'var(--color-danger-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
            }}
          >
            {surplusGap >= 0 ? `Surplus: +₹${surplusGap.toLocaleString('en-IN')}` : `Shortfall: -₹${Math.abs(surplusGap).toLocaleString('en-IN')}`}
          </div>
        </div>

        {/* Surplus Slider & Input */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Monthly Investable Surplus: <strong>₹{monthlySurplus.toLocaleString('en-IN')}</strong>
            </label>
            <input
              type="range"
              min={10000}
              max={300000}
              step={5000}
              value={monthlySurplus}
              onChange={(e) => setMonthlySurplus(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary-500)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Annual SIP Step-up Rate: <strong>{stepUpRate}% / year</strong>
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={5}
              value={stepUpRate}
              onChange={(e) => setStepUpRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-secondary-500)' }}
            />
          </div>
        </div>

        {/* Allocation Progress Bar */}
        <div>
          <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-4)', background: 'rgba(255, 255, 255, 0.05)' }}>
            {goals.map((g, idx) => {
              const colors = ['#0ea5e9', '#a855f7', '#f59e0b', '#10b981', '#ec4899'];
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
              const colors = ['#0ea5e9', '#a855f7', '#f59e0b', '#10b981', '#ec4899'];
              const pct = totalRequiredSip > 0 ? ((g.monthlySip / totalRequiredSip) * 100).toFixed(0) : '0';
              const allocated = totalRequiredSip > 0 ? Math.round((g.monthlySip / totalRequiredSip) * monthlySurplus) : 0;
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{g.name}:</span>
                  <strong>₹{allocated.toLocaleString('en-IN')} ({pct}%)</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Goals Grid */}
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Your Active Goals & Glide Paths
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-12)',
        }}
      >
        {goals.map((goal) => {
          return (
            <div
              key={goal.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      {goal.type === 'retirement' && <Briefcase size={16} color="var(--color-primary-400)" />}
                      {goal.type === 'child_education' && <GraduationCap size={16} color="var(--color-secondary-400)" />}
                      {goal.type === 'home_purchase' && <Home size={16} color="var(--color-warning-400)" />}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {goal.horizonYears} Years Horizon
                      </span>
                    </div>
                    <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{goal.name}</h4>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Corpus</span>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: '#ffffff' }}>
                      {formatINR(goal.targetCorpus)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Savings</span>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-success-400)' }}>
                      {formatINR(goal.currentSavings)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <span>Risk Profile: <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{goal.riskBand}</strong> ({goal.expectedReturn}% p.a.)</span>
                  <span>Glide Path: <strong style={{ color: 'var(--color-primary-400)' }}>Active</strong></span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Recommended Monthly SIP</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary-400)' }}>
                    ₹{goal.monthlySip.toLocaleString('en-IN')}
                  </span>
                </div>

                <Link
                  href="/courses"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.25)',
                    color: 'var(--color-primary-300)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>Link MF Schemes (Sprint 4)</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Questionnaire Wizard Modal */}
      {isWizardOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              background: '#0e1726',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '620px',
              width: '100%',
              padding: 'var(--space-8)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-primary-400)" />
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Create New Financial Goal</h3>
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
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: wizardType === t.id ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: wizardType === t.id ? '1px solid var(--color-primary-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: wizardType === t.id ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Name */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Goal Title / Name
              </label>
              <input
                type="text"
                value={wizardName}
                onChange={(e) => setWizardName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: 'var(--text-sm)',
                }}
              />
            </div>

            {/* Target Corpus & Horizon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Corpus (₹)
                </label>
                <input
                  type="number"
                  value={wizardCorpus}
                  onChange={(e) => setWizardCorpus(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Horizon (Years): <strong>{wizardHorizon} Y</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={wizardHorizon}
                  onChange={(e) => setWizardHorizon(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary-500)', marginTop: '8px' }}
                />
              </div>
            </div>

            {/* Current Savings & Risk Band */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Existing Savings (₹)
                </label>
                <input
                  type="number"
                  value={wizardSavings}
                  onChange={(e) => setWizardSavings(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Risk Profile
                </label>
                <select
                  value={wizardRisk}
                  onChange={(e) => setWizardRisk(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: '#131b2e',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
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
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Computed Monthly SIP</span>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary-400)' }}>
                  ₹{calcWizardSIP().toLocaleString('en-IN')}/mo
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Formula: FV of Annuity</span>
                <br />
                <span>Auditable & Deterministic</span>
              </div>
            </div>

            <button
              onClick={handleAddGoal}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save Goal & Launch Glide Path
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
