'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Sliders,
  ArrowRight,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { calculateSIPRequired } from '@ff/calc';
import {
  GOAL_CATEGORIES,
  CanonicalGoalType,
  getGoalCategoryFallback,
} from '../../../lib/goal-categories';
import { useBodyScrollLock } from '../../../lib/use-body-scroll-lock';

interface ActiveGoal {
  id: string;
  type: CanonicalGoalType;
  name: string;
  targetCorpus: number;
  horizonYears: number;
  currentSavings: number;
  riskBand: 'conservative' | 'balanced' | 'growth';
  expectedReturn: number;
  monthlySip: number;
  projectedCorpus: number;
}

function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('accessToken');
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (match) token = match[1];
  }
  return token;
}

export default function GoalsDashboardPage() {
  const [goals, setGoals] = useState<ActiveGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(100000);
  const [stepUpRate, setStepUpRate] = useState<number>(10);

  useBodyScrollLock(isWizardOpen);

  // New Goal Wizard Form State (defaults to retirement category)
  const defaultCategory = GOAL_CATEGORIES[1]; // Retirement (FIRE)
  const [wizardType, setWizardType] = useState<CanonicalGoalType>(defaultCategory.id);
  const [wizardName, setWizardName] = useState(defaultCategory.label);
  const [wizardCorpus, setWizardCorpus] = useState<number>(defaultCategory.defaultCorpus);
  const [wizardHorizon, setWizardHorizon] = useState<number>(defaultCategory.defaultHorizonYears);
  const [wizardSavings, setWizardSavings] = useState<number>(defaultCategory.defaultSavings);
  const [wizardRisk, setWizardRisk] = useState<'conservative' | 'balanced' | 'growth'>(
    defaultCategory.defaultRiskBand,
  );
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});

  const getReturnRate = (r: 'conservative' | 'balanced' | 'growth') =>
    r === 'conservative' ? 8.5 : r === 'growth' ? 14.0 : 12.0;

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/api/v1/goals`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: ActiveGoal[] = data.map((g: any) => {
            const riskBand: 'conservative' | 'balanced' | 'growth' = g.riskBand || 'balanced';
            const expectedReturn = Number(g.expectedReturnPct || getReturnRate(riskBand));
            const targetCorpus = Number(g.targetAmount || 0);
            const horizonYears = Number(g.horizonYears || 5);
            const currentSavings = Number(g.currentSavings || 0);

            // Compute pure SIP requirement via @ff/calc
            const calcRes = calculateSIPRequired({
              targetCorpus,
              horizonYears,
              expectedReturnPct: expectedReturn,
              currentSavings,
            });

            return {
              id: g.id,
              type: (g.type === 'home_purchase' ? 'wealth_creation' : g.type) as CanonicalGoalType,
              name: g.name,
              targetCorpus,
              horizonYears,
              currentSavings,
              riskBand,
              expectedReturn,
              monthlySip: Number(g.monthlySipRequired) || calcRes.monthlySip,
              projectedCorpus: Number(g.projectedCorpus) || calcRes.projectedCorpus,
            };
          });
          setGoals(mapped);
        } else {
          setGoals([]);
        }
      } else {
        // If unauthenticated or no data, do NOT inject fake goals
        setGoals([]);
      }
    } catch (e) {
      console.warn('Goals fetch error:', e);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  // Pure calculation using @ff/calc for wizard live preview
  const calcWizardSIP = () => {
    const res = calculateSIPRequired({
      targetCorpus: wizardCorpus,
      horizonYears: wizardHorizon,
      expectedReturnPct: getReturnRate(wizardRisk),
      currentSavings: wizardSavings,
    });
    return res.monthlySip;
  };

  const handleSelectCategory = (cat: typeof GOAL_CATEGORIES[number]) => {
    setWizardType(cat.id);
    setWizardName(cat.label);
    setWizardCorpus(cat.defaultCorpus);
    setWizardHorizon(cat.defaultHorizonYears);
    setWizardSavings(cat.defaultSavings);
    setWizardRisk(cat.defaultRiskBand);
    setWizardErrors({});
  };

  const handleAddGoal = async () => {
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

    const returnRate = getReturnRate(wizardRisk);
    const sipRes = calculateSIPRequired({
      targetCorpus: wizardCorpus,
      horizonYears: wizardHorizon,
      expectedReturnPct: returnRate,
      currentSavings: wizardSavings,
    });

    const tempId = `g-${Date.now()}`;
    const tempGoal: ActiveGoal = {
      id: tempId,
      type: wizardType,
      name: wizardName.trim(),
      targetCorpus: wizardCorpus,
      horizonYears: wizardHorizon,
      currentSavings: wizardSavings,
      riskBand: wizardRisk,
      expectedReturn: returnRate,
      monthlySip: sipRes.monthlySip,
      projectedCorpus: sipRes.projectedCorpus,
    };
    setGoals((prev) => [tempGoal, ...prev]);
    setIsWizardOpen(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/api/v1/goals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: wizardType,
          name: wizardName.trim(),
          targetAmount: wizardCorpus,
          horizonYears: wizardHorizon,
          currentSavings: wizardSavings,
          riskBand: wizardRisk,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setGoals((prev) =>
          prev.map((g) =>
            g.id === tempId
              ? {
                  ...g,
                  id: saved.id,
                  monthlySip: Number(saved.monthlySipRequired) || g.monthlySip,
                }
              : g,
          ),
        );
      }
    } catch {
      // Kept in optimistic local state
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${apiUrl}/api/v1/goals/${id}`, { method: 'DELETE', headers });
    } catch {
      // Silent error handling
    }
  };

  const handleReset = () => {
    setMonthlySurplus(100000);
    setStepUpRate(10);
    loadGoals();
  };

  // Real live-computed metrics from DB goals
  const totalTarget = goals.reduce((s, g) => s + g.targetCorpus, 0);
  const totalSavings = goals.reduce((s, g) => s + g.currentSavings, 0);
  const totalRequiredSip = goals.reduce((s, g) => s + g.monthlySip, 0);
  const surplusGap = monthlySurplus - totalRequiredSip;

  const renderGoalCategoryIcon = (type: CanonicalGoalType) => {
    switch (type) {
      case 'emergency_fund':
        return <ShieldCheck size={14} color="#0F766E" />;
      case 'retirement':
        return <Briefcase size={14} color="#0F172A" />;
      case 'child_education':
        return <GraduationCap size={14} color="#0F766E" />;
      case 'wealth_creation':
      default:
        return <Layers size={14} color="#D97706" />;
    }
  };

  return (
    <SidebarLayout>
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}
            >
              Goal Architecture & FIRE Planner
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '640px', margin: 0 }}>
              Plan your financial horizons, optimize surplus allocation, and track progress toward your target corpus.
            </p>
          </div>

          <div className="btn-group-responsive" style={{ flexShrink: 0 }}>
            <button
              onClick={handleReset}
              className="btn btn-outline btn-mobile-full"
              title="Reset sliders and reload your saved goals"
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
              onClick={() => {
                handleSelectCategory(GOAL_CATEGORIES[1]);
                setIsWizardOpen(true);
              }}
              className="btn btn-primary btn-mobile-full"
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

        {/* 4-Stat Summary Metric Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Goals</span>
            <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary)' }}>
              {goals.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {goals.length === 0 ? 'None active' : `${goals.length} in progress`}
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Target</span>
            <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary)' }}>
              {formatINR(totalTarget)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Target corpus
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required SIP</span>
            <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.6rem)', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary)' }}>
              ₹{totalRequiredSip.toLocaleString('en-IN')}<span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Monthly investment
            </div>
          </div>

          <div className="kpi-card-compact">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Savings Deployed</span>
            <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 800, margin: '2px 0', color: 'var(--color-success)' }}>
              {formatINR(totalSavings)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Compounding
            </div>
          </div>
        </div>

        {/* Multi-Goal Surplus Allocator Card */}
        <div
          className="card"
          style={{
            padding: 'clamp(14px, 3vw, 24px)',
            marginBottom: 'var(--space-8)',
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
                max={500000}
                step={5000}
                value={monthlySurplus}
                onChange={(e) => setMonthlySurplus(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer', height: '24px' }}
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
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer', height: '24px' }}
              />
            </div>
          </div>

          {/* Allocation Progress Bar & Legend */}
          {goals.length === 0 ? (
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-surface-raised, #F4F1EA)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              No active goals created yet. Once you add goals below, your investable surplus will automatically distribute across them here.
            </div>
          ) : (
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
          )}
        </div>

        {/* Active Goals Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
          <h3
            className="font-serif"
            style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}
          >
            Your Active Goals & Glide Paths
          </h3>
          {!isLoading && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'} Configured
            </span>
          )}
        </div>

        {/* Real Goals List or Genuine Empty State */}
        {isLoading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-12)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Loading your saved goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              marginBottom: 'var(--space-12)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--bg-surface-raised, #F4F1EA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Target size={24} color="var(--color-primary)" />
            </div>
            <h4
              className="font-serif"
              style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}
            >
              You haven't created a goal yet  start here
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Define your financial independence targets, children’s higher education, or emergency reserve with our transparent mathematical models.
            </p>
            <button
              onClick={() => {
                handleSelectCategory(GOAL_CATEGORIES[0]);
                setIsWizardOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Plan Your First Goal</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-12)',
            }}
          >
            {goals.map((goal) => {
              const categoryConfig = getGoalCategoryFallback(goal.type);
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
                          {renderGoalCategoryIcon(goal.type)}
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {categoryConfig.label}
                          </span>
                          <span style={{ color: '#D1D5DB' }}>•</span>
                          <span className="badge-muted">
                            {goal.horizonYears} Y Horizon
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
                      <span>Risk: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{goal.riskBand}</strong> ({goal.expectedReturn}% p.a.)</span>
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
            className="modal-backdrop-fixed"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 500,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '12px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              className="responsive-modal card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                padding: 'clamp(14px, 4vw, 24px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                margin: 'auto',
                width: '100%',
                maxWidth: '540px',
                maxHeight: 'calc(100dvh - 24px)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} color="#0F766E" />
                  <h3 className="font-serif" style={{ fontSize: 'clamp(17px, 3.5vw, 20px)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Plan a New Financial Goal
                  </h3>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  aria-label="Close goal modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Goal Type Selection - Responsive 2x2 Grid with Word-Wrapping Pins */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                  Select Goal Objective
                </label>
                <div className="goal-wizard-categories">
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`goal-wizard-pill ${wizardType === cat.id ? 'goal-wizard-pill-active' : ''}`}
                    >
                      {cat.label}
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
                    boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
                    style={{ width: '100%', accentColor: '#0F172A', marginTop: '8px', cursor: 'pointer', height: '24px' }}
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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

              {/* SIP Calculation Summary Banner via @ff/calc */}
              <div
                style={{
                  background: '#FEF9E7',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  padding: 'clamp(10px, 3vw, 16px)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#78350F' }}>Recommended Monthly SIP</span>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#92400E' }}>
                    ₹{calcWizardSIP().toLocaleString('en-IN')}/mo
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#92400E', opacity: 0.85 }}>
                  <span>Target Timeline</span>
                  <br />
                  <span>{wizardHorizon} Years Planning Horizon</span>
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
                  fontWeight: 600,
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
