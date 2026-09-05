'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface FundScheme {
  schemeCode: string;
  schemeName: string;
  amcName: string;
  category: string;
  navCurrent: number;
  returns1yr: number;
  returns3yr: number;
  returns5yr: number;
  expenseRatio: number;
  riskLevel: string;
  minSipAmount: number;
}

const CURATED_FUNDS: FundScheme[] = [
  {
    schemeCode: '119551',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amcName: 'PPFAS Mutual Fund',
    category: 'Equity - Flexi Cap',
    navCurrent: 82.45,
    returns1yr: 28.5,
    returns3yr: 21.2,
    returns5yr: 24.8,
    expenseRatio: 0.62,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '120503',
    schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    amcName: 'Mirae Asset Mutual Fund',
    category: 'Equity - Large Cap',
    navCurrent: 112.38,
    returns1yr: 24.1,
    returns3yr: 16.5,
    returns5yr: 18.2,
    expenseRatio: 0.54,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '118778',
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    amcName: 'Nippon India Mutual Fund',
    category: 'Equity - Small Cap',
    navCurrent: 174.62,
    returns1yr: 38.4,
    returns3yr: 28.7,
    returns5yr: 31.4,
    expenseRatio: 0.69,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '120847',
    schemeName: 'ICICI Prudential Liquid Fund - Direct Plan - Growth',
    amcName: 'ICICI Prudential Mutual Fund',
    category: 'Debt - Liquid',
    navCurrent: 365.12,
    returns1yr: 7.2,
    returns3yr: 6.5,
    returns5yr: 5.9,
    expenseRatio: 0.2,
    riskLevel: 'Low',
    minSipAmount: 500,
  },
];

export default function InvestDiscoveryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalFund, setActiveModalFund] = useState<FundScheme | null>(null);

  // SIP setup state
  const [sipAmount, setSipAmount] = useState<number>(5000);
  const [sipDay, setSipDay] = useState<number>(10);
  const [selectedGoal, setSelectedGoal] = useState<string>('Early Retirement (FIRE 45)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sipSuccess, setSipSuccess] = useState<{
    bseRegNo: string;
    bseOrderNo: string;
  } | null>(null);

  const filteredFunds = CURATED_FUNDS.filter((f) => {
    const matchesCat =
      selectedCategory === 'all' ||
      f.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      f.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.amcName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePlaceSip = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const bseReg = `BSE_SIP_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 900 + 100)}`;
      const bseOrder = `ORD_BSE_${Date.now().toString(36).toUpperCase()}`;

      // Store in local simulated portfolio
      const existingHoldings = JSON.parse(localStorage.getItem('ff_portfolio') || '[]');
      const updatedHoldings = [
        ...existingHoldings,
        {
          schemeCode: activeModalFund?.schemeCode,
          schemeName: activeModalFund?.schemeName,
          amcName: activeModalFund?.amcName,
          sipAmount,
          sipDay,
          goalName: selectedGoal,
          bseRegNo: bseReg,
          startedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('ff_portfolio', JSON.stringify(updatedHoldings));

      setSipSuccess({
        bseRegNo: bseReg,
        bseOrderNo: bseOrder,
      });
    }, 1200);
  };

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
            <ShieldCheck size={14} />
            <span>BSE StAR MF Order Execution Rail</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
            Curated Mutual Fund Discovery
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Institutional-grade mutual fund schemes mapped to your personal financial goals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/kyc"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ShieldCheck size={14} color="var(--color-success-400)" />
            <span>Check KYC Status</span>
          </Link>
          <Link
            href="/dashboard/portfolio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              color: 'var(--color-primary-300)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Layers size={14} />
            <span>View Portfolio</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Funds' },
            { id: 'flexi', label: 'Flexi Cap' },
            { id: 'large', label: 'Large Cap' },
            { id: 'small', label: 'Small Cap' },
            { id: 'liquid', label: 'Liquid / Debt' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: selectedCategory === cat.id ? 'var(--color-primary-500)' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                border: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AMC or Scheme..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: 'var(--text-xs)',
            }}
          />
        </div>
      </div>

      {/* Schemes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-12)',
        }}
      >
        {filteredFunds.map((fund) => {
          return (
            <div
              key={fund.schemeCode}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                    {fund.category}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Risk: {fund.riskLevel}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.3, marginBottom: '6px' }}>
                  {fund.schemeName}
                </h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                  {fund.amcName} • NAV: <strong>₹{fund.navCurrent.toFixed(2)}</strong>
                </div>

                {/* Returns Table */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3)',
                    textAlign: 'center',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>1Y Return</span>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success-400)' }}>
                      +{fund.returns1yr}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>3Y CAGR</span>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success-400)' }}>
                      +{fund.returns3yr}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>5Y CAGR</span>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success-400)' }}>
                      +{fund.returns5yr}%
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveModalFund(fund);
                  setSipSuccess(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
                }}
              >
                <span>Start Goal-Linked SIP</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Goal-Linked SIP Setup Modal */}
      {activeModalFund && (
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
              maxWidth: '560px',
              width: '100%',
              padding: 'var(--space-8)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            {!sipSuccess ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                      BSE StAR MF SIP Execution
                    </span>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginTop: '2px' }}>
                      {activeModalFund.schemeName}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveModalFund(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Map to Goal */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Map to Financial Goal
                  </label>
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
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
                    <option value="Early Retirement (FIRE 45)">Early Retirement (FIRE 45)</option>
                    <option value="Aarav's Overseas Masters Degree">Aarav's Overseas Masters Degree</option>
                    <option value="3BHK Villa Down Payment">3BHK Villa Down Payment</option>
                  </select>
                </div>

                {/* Monthly SIP Amount */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Monthly SIP Amount: <strong>₹{sipAmount.toLocaleString('en-IN')}</strong>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSipAmount(amt)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          background: sipAmount === amt ? 'var(--color-primary-500)' : 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ₹{amt / 1000}k
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={fundMin(activeModalFund.minSipAmount)}
                    max={50000}
                    step={500}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-primary-500)' }}
                  />
                </div>

                {/* SIP Debit Date */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    SIP Monthly Auto-Debit Day
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 5, 10, 15, 20, 25].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSipDay(d)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          background: sipDay === d ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: sipDay === d ? '1px solid var(--color-primary-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: sipDay === d ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {d}th
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePlaceSip}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Confirm SIP via BSE StAR MF</span>
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                  }}
                >
                  <CheckCircle2 size={32} color="var(--color-success-400)" />
                </div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                  SIP Registered Successfully!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-6)' }}>
                  BSE StAR MF AutoPay Mandate has been scheduled for {selectedGoal}.
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>BSE Registration No:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{sipSuccess.bseRegNo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly SIP:</span>
                    <strong style={{ color: 'var(--color-primary-400)' }}>₹{sipAmount.toLocaleString('en-IN')}/mo</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Debit Schedule:</span>
                    <span>{sipDay}th of every month</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    onClick={() => setActiveModalFund(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    Done
                  </button>
                  <Link
                    href="/dashboard/portfolio"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 'var(--text-xs)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>View in Portfolio</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function fundMin(val?: number) {
  return val || 500;
}
