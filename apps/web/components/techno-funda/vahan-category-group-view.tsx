'use client';

import React, { useState, useMemo } from 'react';
import {
  Car,
  Truck,
  Zap,
  Clock,
  Layers,
  BarChart3,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface CategoryGroupProps {
  categories?: Array<{
    category: string;
    label: string;
    registrations: number;
    formattedRegistrations: string;
    yoyChange: number | null;
    momChange?: number | null;
    keyOEMs: string[];
  }>;
  totalRegistrations?: number;
}

interface MacroGroup {
  id: string;
  name: string;
  shortCode: string;
  tagline: string;
  volumeUnits: number;
  formattedVolume: string;
  sharePct: number;
  momChange: number;
  yoyChange: number;
  icon: React.ElementType;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  subSegments: string[];
  primaryDrivers: string[];
  marginProfile: string;
  cycleStage: string;
  keyStocks: Array<{ symbol: string; name: string; role: string }>;
}

export function VahanCategoryGroupView({ categories = [], totalRegistrations = 0 }: CategoryGroupProps) {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('All');
  const [expandedStockGroup, setExpandedStockGroup] = useState<string | null>(null);

  // Live aggregates only - never fabricate SIAM/Vahan volume fallbacks
  const twoWheeler = categories.find((c) => c.category === '2W')?.registrations || 0;
  const pv = categories.find((c) => c.category === 'PV')?.registrations || 0;
  const cv = categories.find((c) => c.category === 'CV')?.registrations || 0;
  const threeWheeler = categories.find((c) => c.category === '3W')?.registrations || 0;
  const tractor = categories.find((c) => c.category === 'Tractor')?.registrations || 0;

  const totalVol =
    totalRegistrations > 0
      ? totalRegistrations
      : twoWheeler + pv + cv + threeWheeler + tractor;

  // Macro Groups
  const macroGroups: MacroGroup[] = useMemo(() => {
    const personalVol = twoWheeler + pv;
    const commercialVol = cv + threeWheeler;
    const agriVol = tractor;
    const evVol = 0;
    const pct = (part: number) =>
      totalVol > 0 ? parseFloat(((part / totalVol) * 100).toFixed(1)) : 0;

    return [
      {
        id: 'personal',
        name: 'Personal Mobility',
        shortCode: '2W + PV',
        tagline: 'Individual commuter and family passenger transportation across urban and semi-urban India',
        volumeUnits: personalVol,
        formattedVolume: totalVol > 0 ? `${(personalVol / 100000).toFixed(2)} Lakh units` : '-',
        sharePct: pct(personalVol),
        momChange: 0,
        yoyChange: 0,
        icon: Car,
        themeColor: '#0F766E',
        badgeBg: '#F0FDFA',
        badgeBorder: '#CCFBF1',
        subSegments: ['Two-Wheelers (Commuter & Premium)', 'Passenger Cars', 'SUVs & Compact UVs'],
        primaryDrivers: [],
        marginProfile: '-',
        cycleStage: '-',
        keyStocks: [],
      },
      {
        id: 'commercial',
        name: 'Commercial & Logistics',
        shortCode: 'CV + 3W',
        tagline: 'Industrial freight haulage, infrastructure tippers, and last-mile urban cargo solutions',
        volumeUnits: commercialVol,
        formattedVolume: totalVol > 0 ? `${(commercialVol / 100000).toFixed(2)} Lakh units` : '-',
        sharePct: pct(commercialVol),
        momChange: 0,
        yoyChange: 0,
        icon: Truck,
        themeColor: '#D97706',
        badgeBg: '#FFFBEB',
        badgeBorder: '#FDE68A',
        subSegments: ['Medium & Heavy CVs (M&HCV)', 'Light Commercial Vehicles (LCV)', 'Three-Wheeler Goods & Pax'],
        primaryDrivers: [],
        marginProfile: '-',
        cycleStage: '-',
        keyStocks: [],
      },
      {
        id: 'agri',
        name: 'Rural & Agri Mechanization',
        shortCode: 'Tractors',
        tagline: 'Farm tractors, crop harvesters, and mechanization implements driving rural productivity',
        volumeUnits: agriVol,
        formattedVolume: totalVol > 0 ? `${(agriVol / 1000).toFixed(1)}K units` : '-',
        sharePct: pct(agriVol),
        momChange: 0,
        yoyChange: 0,
        icon: Layers,
        themeColor: '#059669',
        badgeBg: '#ECFDF5',
        badgeBorder: '#A7F3D0',
        subSegments: ['Utility Tractors (35-50 HP)', 'Heavy Duty Tractors (>50 HP)', 'Rotavators & Implements'],
        primaryDrivers: [],
        marginProfile: '-',
        cycleStage: '-',
        keyStocks: [],
      },
      {
        id: 'clean_tech',
        name: 'Clean Tech & EV Transition',
        shortCode: 'EV Across Segments',
        tagline: 'Zero-emission electric two-wheelers, three-wheelers, electric cars, and electric buses',
        volumeUnits: evVol,
        formattedVolume: '-',
        sharePct: 0,
        momChange: 0,
        yoyChange: 0,
        icon: Zap,
        themeColor: '#7C3AED',
        badgeBg: '#FAF5FF',
        badgeBorder: '#E9D5FF',
        subSegments: ['Electric 2-Wheelers', 'Electric 3-Wheelers (E-Rickshaw/Auto)', 'Electric Passenger Vehicles', 'E-Buses'],
        primaryDrivers: [],
        marginProfile: '-',
        cycleStage: '-',
        keyStocks: [],
      },
    ];
  }, [totalVol, twoWheeler, pv, cv, threeWheeler, tractor]);

  const filteredGroups = useMemo(() => {
    if (selectedGroupFilter === 'All') return macroGroups;
    return macroGroups.filter((g) => g.id === selectedGroupFilter);
  }, [macroGroups, selectedGroupFilter]);

  return (
    <div className="card" style={{ padding: '20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header & Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: '#F0FDFA',
              color: '#0F766E',
              border: '1px solid #CCFBF1',
            }}>
              <Layers size={15} />
            </span>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Automotive Category Groups
            </h3>
          </div>
          <p style={{ color: '#64748B', fontSize: '12.5px', margin: '2px 0 8px' }}>
            SIAM macro industry classification grouping personal transit, commercial freight haulage, rural agriculture, and clean mobility.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11.5px', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} style={{ color: '#0F766E' }} />
              Monthly Volume Pool:{' '}
              <strong style={{ color: '#0F172A' }}>
                {totalVol > 0 ? `${(totalVol / 100000).toFixed(2)} Lakh units` : 'Unavailable'}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Button: Filter / Focus Pills */}
        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0', gap: '3px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: 'All 4 Groups' },
            { id: 'personal', label: 'Personal' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'agri', label: 'Agri Farm' },
            { id: 'clean_tech', label: 'Clean Tech EV' },
          ].map((item) => {
            const isSelected = selectedGroupFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGroupFilter(item.id)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSelected ? '#FFFFFF' : 'transparent',
                  color: isSelected ? '#0F766E' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '11.5px',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Macro Share Distribution Stacked Bar */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11.5px', fontWeight: 600 }}>
          <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={13} style={{ color: '#0F766E' }} />
            National Industry Volume Share Distribution
          </span>
          <span style={{ color: '#64748B', fontSize: '11px' }}>
            Base Volume: {totalVol > 0 ? `${(totalVol / 100000).toFixed(2)} Lakh units` : 'Unavailable'}
          </span>
        </div>

        {totalVol > 0 ? (
          <>
            {/* Stacked Progress Bar from live sharePct */}
            <div style={{ height: '12px', width: '100%', display: 'flex', borderRadius: '6px', overflow: 'hidden', background: '#E2E8F0', marginBottom: '8px' }}>
              {macroGroups
                .filter((g) => g.id !== 'clean_tech' && g.sharePct > 0)
                .map((g) => (
                  <div
                    key={g.id}
                    title={`${g.name} ${g.sharePct}%`}
                    style={{ width: `${g.sharePct}%`, background: g.themeColor }}
                  />
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#475569' }}>
              {macroGroups.map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: g.themeColor }} />
                  <span>
                    {g.name}: <strong>{g.sharePct}%</strong>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '8px 0', fontSize: '12px', color: '#64748B' }}>
            Volume share unavailable until live category registrations are fetched.
          </div>
        )}
      </div>

      {/* 4 Macro Group KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px', marginBottom: '22px' }}>
        {filteredGroups.map((group) => {
          const IconComponent = group.icon;
          const isExpanded = expandedStockGroup === group.id;

          return (
            <div
              key={group.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: `1px solid ${group.badgeBorder}`,
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: group.badgeBg,
                      color: group.themeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${group.badgeBorder}`,
                    }}>
                      <IconComponent size={17} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {group.name}
                      </h4>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>
                        {group.shortCode}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: group.badgeBg,
                    color: group.themeColor,
                    border: `1px solid ${group.badgeBorder}`,
                  }}>
                    {group.sharePct}% Share
                  </span>
                </div>

                {/* Tagline */}
                <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.45, margin: '0 0 12px' }}>
                  {group.tagline}
                </p>

                {/* Volume & Growth Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
                    {group.formattedVolume}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: group.momChange >= 0 ? '#16A34A' : '#DC2626',
                      background: group.momChange >= 0 ? '#ECFDF5' : '#FEF2F2',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {group.momChange >= 0 ? '+' : ''}{group.momChange}% MoM
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: group.yoyChange >= 0 ? '#16A34A' : '#DC2626',
                      background: group.yoyChange >= 0 ? '#ECFDF5' : '#FEF2F2',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {group.yoyChange >= 0 ? '+' : ''}{group.yoyChange}% YoY
                    </span>
                  </div>
                </div>

                {/* Key Sub-segments Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '10px 0' }}>
                  {group.subSegments.map((seg) => (
                    <span
                      key={seg}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#F8FAFC',
                        color: '#334155',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {seg}
                    </span>
                  ))}
                </div>

                {/* Primary Drivers List */}
                <div style={{ margin: '10px 0', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Key Catalysts & Demand Drivers:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                    {group.primaryDrivers.map((driver, i) => (
                      <li key={i}>{driver}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Listed Stock Beneficiaries Drawer */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setExpandedStockGroup(isExpanded ? null : group.id)}
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: group.themeColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={12} />
                    {isExpanded ? 'Hide Beneficiary Stocks' : `View Beneficiary Stocks (${group.keyStocks.length})`}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.keyStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: '#FAFAFA',
                          border: '1px solid #F1F5F9',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#0F766E' }}>{stock.symbol}</span>
                          <span style={{ color: '#64748B', fontSize: '10.5px' }}>{stock.name}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'right' }}>
                          {stock.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Group Economics Matrix */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Group Economics & Beneficiary Comparison Matrix
            </h4>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
              Strategic comparison of growth velocity, margins, and listed equities across each automotive macro group
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Macro Group</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Constituent Segments</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Monthly Volume</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Market Share</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'right' }}>YoY Growth</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>EBITDA Margin Profile</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Cycle Stage</th>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Top Listed Beneficiaries</th>
              </tr>
            </thead>
            <tbody>
              {macroGroups.map((grp, idx) => (
                <tr key={grp.id} style={{ borderBottom: idx < macroGroups.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: grp.themeColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: grp.themeColor }} />
                      {grp.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                    {grp.shortCode}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                    {grp.formattedVolume}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0F766E' }}>
                    {grp.sharePct}%
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 600,
                      color: grp.yoyChange >= 0 ? '#16A34A' : '#DC2626',
                      background: grp.yoyChange >= 0 ? '#ECFDF5' : '#FEF2F2',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {grp.yoyChange >= 0 ? '+' : ''}{grp.yoyChange}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                    {grp.marginProfile}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748B' }}>
                    <span style={{ padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px', fontSize: '10.5px' }}>
                      {grp.cycleStage}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {grp.keyStocks.slice(0, 4).map((s) => (
                        <span
                          key={s.symbol}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: '#F0FDFA',
                            color: '#0F766E',
                            border: '1px solid #CCFBF1',
                          }}
                        >
                          {s.symbol}
                        </span>
                      ))}
                      {grp.keyStocks.length > 4 && (
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                          +{grp.keyStocks.length - 4} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
