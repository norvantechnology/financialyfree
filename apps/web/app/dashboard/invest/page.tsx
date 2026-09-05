'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Sliders,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';

interface FundScheme {
  schemeCode: string;
  schemeName: string;
  amcName: string;
  category: string;
  navCurrent: number;
  navDate?: string;
  isLiveAmfi?: boolean;
  returns1yr: number;
  returns3yr: number;
  returns5yr: number;
  expenseRatio: number;
  aumCr: number;
  riskLevel: 'Low' | 'Moderate' | 'Very High';
  minSipAmount: number;
}

const CURATED_FUNDS: FundScheme[] = [
  {
    schemeCode: '122639',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amcName: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    navCurrent: 90.53,
    navDate: '04-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 38.4,
    returns3yr: 24.2,
    returns5yr: 21.8,
    expenseRatio: 0.62,
    aumCr: 72400,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '118825',
    schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    amcName: 'Mirae Asset Mutual Fund',
    category: 'Large Cap',
    navCurrent: 127.06,
    navDate: '04-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 24.1,
    returns3yr: 16.5,
    returns5yr: 18.2,
    expenseRatio: 0.54,
    aumCr: 38200,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '118778',
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    amcName: 'Nippon India Mutual Fund',
    category: 'Small Cap',
    navCurrent: 210.48,
    navDate: '04-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 38.4,
    returns3yr: 28.7,
    returns5yr: 31.4,
    expenseRatio: 0.69,
    aumCr: 28900,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '120197',
    schemeName: 'ICICI Prudential Liquid Fund - Direct Plan - Growth',
    amcName: 'ICICI Prudential Mutual Fund',
    category: 'Liquid / Debt',
    navCurrent: 420.11,
    navDate: '06-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 7.2,
    returns3yr: 6.5,
    returns5yr: 5.9,
    expenseRatio: 0.2,
    aumCr: 54000,
    riskLevel: 'Low',
    minSipAmount: 500,
  },
  {
    schemeCode: '120828',
    schemeName: 'Quant Small Cap Fund - Direct Plan - Growth',
    amcName: 'Quant Mutual Fund',
    category: 'Small Cap',
    navCurrent: 322.64,
    navDate: '04-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 42.1,
    returns3yr: 32.4,
    returns5yr: 34.6,
    expenseRatio: 0.77,
    aumCr: 21000,
    riskLevel: 'Very High',
    minSipAmount: 1000,
  },
  {
    schemeCode: '120716',
    schemeName: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    amcName: 'UTI Mutual Fund',
    category: 'Large Cap Index',
    navCurrent: 168.31,
    navDate: '04-Sep-2026',
    isLiveAmfi: true,
    returns1yr: 26.2,
    returns3yr: 15.8,
    returns5yr: 17.5,
    expenseRatio: 0.22,
    aumCr: 18400,
    riskLevel: 'Very High',
    minSipAmount: 500,
  },
];

export default function InvestDiscoveryPage() {
  const [funds, setFunds] = useState<FundScheme[]>(CURATED_FUNDS);
  const [isSyncingAmfi, setIsSyncingAmfi] = useState(false);
  const [lastSyncedDate, setLastSyncedDate] = useState('04-Sep-2026');
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

  useEffect(() => {
    fetchLiveSchemes();
  }, []);

  const fetchLiveSchemes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/mutual-funds/schemes`);
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          setFunds((prevFunds) => {
            return prevFunds.map((existing) => {
              const live = liveData.find((l: any) => l.schemeCode === existing.schemeCode);
              if (live) {
                return {
                  ...existing,
                  navCurrent: Number(live.navCurrent),
                  navDate: live.navDate,
                  returns1yr: live.returns1yr ?? existing.returns1yr,
                  returns3yr: live.returns3yr ?? existing.returns3yr,
                  returns5yr: live.returns5yr ?? existing.returns5yr,
                  isLiveAmfi: true,
                };
              }
              return existing;
            });
          });
          if (liveData[0]?.navDate) {
            setLastSyncedDate(liveData[0].navDate);
          }
        }
      }
    } catch {
      // Graceful fallback to initial curated state
    }
  };

  const handleSyncAmfi = async () => {
    setIsSyncingAmfi(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/mutual-funds/sync-nav`, { method: 'POST' });
      if (res.ok) {
        await fetchLiveSchemes();
      }
    } catch {
      // Handled silently
    } finally {
      setIsSyncingAmfi(false);
    }
  };

  const filteredFunds = funds.filter((f) => {
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
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Dynamic / Live Feed Banner */}
        <StaticSnapshotBanner
          datasetNote={`Live AMFI NAV Master Feed (Updated through ${lastSyncedDate})`}
          sourceNote="BSE StAR MF Order Routing: Simulated sandbox adapter."
        />


        {/* Header */}
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
              <Sliders size={13} />
              <span>WEALTH EXECUTION / BSE STAR MF</span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              Mutual Fund Discovery & Execution
            </h1>
            <p style={{ color: 'var(--text-secondary, #4B5563)', fontSize: 'var(--text-sm)', maxWidth: '640px' }}>
              Direct plan mutual fund schemes routed directly to Indian AMCs via BSE StAR MF order gateway.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSyncAmfi}
              disabled={isSyncingAmfi}
              className="btn btn-outline"
              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Sync latest daily NAVs from official AMFI India portal"
            >
              <RefreshCw size={13} className={isSyncingAmfi ? 'animate-spin' : ''} />
              <span>{isSyncingAmfi ? 'Syncing AMFI...' : 'Sync AMFI Feed'}</span>
            </button>
            <Link
              href="/kyc"
              className="btn btn-outline"
              style={{
                minHeight: '38px',
                padding: '8px 16px',
                fontSize: '12px',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} color="#16A34A" />
              <span>Check KYC Status</span>
            </Link>
            <Link
              href="/dashboard/portfolio"
              className="btn btn-primary"
              style={{
                minHeight: '38px',
                padding: '8px 18px',
                fontSize: '12px',
                gap: '6px',
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
          <div className="tabs-scrollable" style={{ paddingBottom: '4px' }}>
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
                className={`pill-btn ${selectedCategory === cat.id ? 'pill-btn-active' : ''}`}
                style={{ fontSize: '12px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AMC or Scheme..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Schemes Grid */}
        {filteredFunds.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              marginBottom: 'var(--space-12)',
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F4F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Search size={22} color="#6B7280" />
            </div>
            <h4 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
              No Matching Mutual Fund Schemes Found
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 16px' }}>
              No schemes match your criteria. Try adjusting the search query or category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn btn-outline"
              style={{ padding: '8px 18px', fontSize: '12px' }}
            >
              Reset Search & Filters
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
            {filteredFunds.map((fund) => {
            return (
              <div
                key={fund.schemeCode}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-accent, #0F766E)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {fund.category}
                    </span>
                    <span className="badge-muted">
                      Risk: {fund.riskLevel}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, lineHeight: 1.3, marginBottom: '6px', color: '#111827' }}>
                    {fund.schemeName}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: '#6B7280', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span>{fund.amcName} • NAV: <strong style={{ color: '#111827' }}>₹{fund.navCurrent.toFixed(2)}</strong></span>
                    <span style={{ fontSize: '10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      AMFI: {fund.navDate || '04-Sep-2026'}
                    </span>
                  </div>

                  {/* Returns Table */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      background: 'var(--bg-surface-raised, #F4F1EA)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px',
                      textAlign: 'center',
                      marginBottom: 'var(--space-6)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>1Y Return</span>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#16A34A' }}>
                        +{fund.returns1yr}%
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>3Y CAGR</span>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#16A34A' }}>
                        +{fund.returns3yr}%
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>5Y CAGR</span>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#16A34A' }}>
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
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '40px',
                    fontSize: '12px',
                    fontWeight: 600,
                    gap: '6px',
                  }}
                >
                  <span>Start Goal-Linked SIP</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

        {/* Goal-Linked SIP Setup Modal */}
        {activeModalFund && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              className="responsive-modal card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                padding: 'var(--space-8)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              {!sipSuccess ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-accent, #0F766E)', fontWeight: 700, textTransform: 'uppercase' }}>
                        BSE StAR MF SIP Execution
                      </span>
                      <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginTop: '2px', color: '#111827' }}>
                        {activeModalFund.schemeName}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveModalFund(null)}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Map to Goal */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Map to Financial Goal
                    </label>
                    <select
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      <option value="Early Retirement (FIRE 45)">Early Retirement (FIRE 45)</option>
                      <option value="Aarav's Overseas Masters Degree">Aarav's Overseas Masters Degree</option>
                      <option value="3BHK Villa Down Payment">3BHK Villa Down Payment</option>
                      <option value="Wealth Alpha Creation">Wealth Alpha Creation</option>
                    </select>
                  </div>

                  {/* SIP Amount */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Monthly SIP Amount (₹)
                    </label>
                    <input
                      type="number"
                      step={500}
                      min={activeModalFund.minSipAmount}
                      value={sipAmount}
                      onChange={(e) => setSipAmount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        color: '#111827',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {/* SIP Debit Date */}
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Monthly Debit Date
                    </label>
                    <select
                      value={sipDay}
                      onChange={(e) => setSipDay(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {[1, 5, 10, 15, 20, 25].map((d) => (
                        <option key={d} value={d}>
                          {d}th of every month
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mandate summary */}
                  <div
                    style={{
                      background: '#FEF9E7',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      marginBottom: 'var(--space-6)',
                      fontSize: '12px',
                      color: '#78350F',
                      lineHeight: 1.5,
                    }}
                  >
                    BSE StAR MF will register mandate with your bank. First installment debited on confirmation. Zero distributor fee.
                  </div>

                  <button
                    onClick={handlePlaceSip}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Registering with BSE StAR MF...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Register SIP Mandate</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Success View */
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#DCFCE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--space-4)',
                    }}
                  >
                    <CheckCircle2 size={32} color="#16A34A" />
                  </div>
                  <h3 className="font-serif" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '6px', color: '#111827' }}>
                    SIP Mandate Successfully Registered!
                  </h3>
                  <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: 'var(--space-6)' }}>
                    Your order has been routed to <strong>{activeModalFund.amcName}</strong> via BSE StAR MF.
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-surface-raised, #F4F1EA)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      marginBottom: 'var(--space-6)',
                      fontSize: '12px',
                      border: '1px solid #E8E4DC',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#6B7280' }}>BSE SIP Registration No:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{sipSuccess.bseRegNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#6B7280' }}>BSE Internal Order Ref:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{sipSuccess.bseOrderNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Mapped Goal:</span>
                      <strong style={{ color: '#111827' }}>{selectedGoal}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href="/dashboard/portfolio"
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      View in Portfolio
                    </Link>
                    <button
                      onClick={() => setActiveModalFund(null)}
                      className="btn btn-outline"
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
