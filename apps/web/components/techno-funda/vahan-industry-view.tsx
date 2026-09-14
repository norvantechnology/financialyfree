'use client';

import React, { useState, useMemo } from 'react';
import {
  Globe,
  BarChart3,
  MapPin,
  Cpu,
  Clock,
  Activity,
} from 'lucide-react';

export interface IndustryViewProps {
  categories?: Array<{
    category: string;
    label: string;
    registrations: number;
    formattedRegistrations: string;
    yoyChange: number | null;
    momChange?: number | null;
  }>;
  states?: Array<{
    stateCode: string;
    stateName: string;
    totalRegistrations: number;
    formattedCount: string;
  }>;
  totalRegistrations?: number;
}

interface RegionalCluster {
  id: string;
  name: string;
  statesCovered: string[];
  totalVehiclesCr: number;
  formattedCount: string;
  shareOfNationalFleet: number;
  dominantSegments: string;
  growthDriver: string;
  topStates: string[];
  color: string;
  bg: string;
  border: string;
}

interface AncillarySegment {
  sector: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  correlation: string;
  demandCatalyst: string;
  contentPerVehicleTrend: string;
  topStocks: Array<{ symbol: string; name: string; catalyst: string }>;
}

const SEGMENT_COLORS: Record<string, string> = {
  '2W': '#0F766E',
  PV: '#2563EB',
  '3W': '#7C3AED',
  CV: '#D97706',
  Tractor: '#059669',
};

export function VahanIndustryView({ categories = [], states = [], totalRegistrations = 0 }: IndustryViewProps) {
  const [selectedClusterTab, setSelectedClusterTab] = useState<string>('all');
  const [activeAncillarySector, setActiveAncillarySector] = useState<string | null>(null);

  const totalMonthlyVol = totalRegistrations > 0 ? totalRegistrations : 0;
  const annualizedRunRateCr = totalMonthlyVol > 0 ? ((totalMonthlyVol * 12) / 10000000).toFixed(2) : '—';
  const topStateName = states[0]?.stateName || '—';
  const topStateCount = states[0]?.formattedCount || '—';

  // Segment Mix Breakdown — live categories only; never fabricate default volumes
  const segmentMix = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    return categories.map((match) => {
      const share =
        totalMonthlyVol > 0
          ? parseFloat(((match.registrations / totalMonthlyVol) * 100).toFixed(1))
          : 0;
      return {
        code: match.category,
        label: match.label,
        count: match.registrations,
        share,
        color: SEGMENT_COLORS[match.category] || '#64748B',
        mom: match.momChange !== undefined && match.momChange !== null ? match.momChange : 0,
      };
    });
  }, [categories, totalMonthlyVol]);

  // Regional clusters derived only from live Vahan state registrations
  const regionalClusters: RegionalCluster[] = useMemo(() => {
    if (!states || states.length === 0) return [];

    const totalFleet = states.reduce((sum, s) => sum + (s.totalRegistrations || 0), 0);
    const clustersDef = [
      {
        id: 'north',
        name: 'Northern Belt',
        codes: ['UP', 'RJ', 'DL', 'PB', 'HR', 'UK', 'HP', 'JK', 'CH'],
        color: '#0F766E',
        bg: '#F0FDFA',
        border: '#CCFBF1',
      },
      {
        id: 'west',
        name: 'Western Corridor',
        codes: ['MH', 'GJ', 'GA', 'DD', 'DN'],
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
      },
      {
        id: 'south',
        name: 'Southern Hub',
        codes: ['TN', 'KA', 'KL', 'AP', 'TS', 'PY'],
        color: '#7C3AED',
        bg: '#FAF5FF',
        border: '#E9D5FF',
      },
      {
        id: 'east_central',
        name: 'Central & Eastern',
        codes: ['MP', 'WB', 'BR', 'OD', 'JH', 'CG', 'AS'],
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
      },
    ];

    return clustersDef
      .map((def) => {
        const matched = states.filter((s) => def.codes.includes((s.stateCode || '').toUpperCase()));
        if (matched.length === 0) return null;
        const clusterTotal = matched.reduce((sum, s) => sum + (s.totalRegistrations || 0), 0);
        const cr = clusterTotal / 10000000;
        return {
          id: def.id,
          name: def.name,
          statesCovered: matched.map((s) => s.stateName),
          totalVehiclesCr: parseFloat(cr.toFixed(2)),
          formattedCount: `${cr.toFixed(2)} Cr vehicles`,
          shareOfNationalFleet:
            totalFleet > 0 ? parseFloat(((clusterTotal / totalFleet) * 100).toFixed(1)) : 0,
          dominantSegments: 'Live Vahan state fleet',
          growthDriver: 'Derived from MoRTH Vahan live state registrations',
          topStates: matched
            .slice(0, 4)
            .map((s) => `${s.stateCode} (${s.formattedCount || s.totalRegistrations})`),
          color: def.color,
          bg: def.bg,
          border: def.border,
        } as RegionalCluster;
      })
      .filter((c): c is RegionalCluster => c !== null);
  }, [states]);

  // Ancillary sectors listed without fabricated stock catalysts
  const ancillarySectors: AncillarySegment[] = useMemo(() => [], []);

  const filteredClusters = useMemo(() => {
    if (selectedClusterTab === 'all') return regionalClusters;
    return regionalClusters.filter((c) => c.id === selectedClusterTab);
  }, [regionalClusters, selectedClusterTab]);

  return (
    <div className="card" style={{ padding: '20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header & Macro Title */}
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
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
            }}>
              <Globe size={15} />
            </span>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              National Automotive Industry Dashboard
            </h3>
          </div>
          <p style={{ color: '#64748B', fontSize: '12.5px', margin: '2px 0 8px' }}>
            All-India automotive intelligence, regional geographic consumption corridors, and upstream supply-chain value spillover.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11.5px', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} style={{ color: '#0F766E' }} />
              MoRTH Vahan Sewa Integration
            </span>
            <span>·</span>
            <span>Active National Fleet: <strong style={{ color: '#0F172A' }}>34.8 Crore vehicles</strong></span>
            <span>·</span>
            <span>Listed Auto Ecosystem Cap: <strong style={{ color: '#0F766E' }}>₹18.4 Lakh Cr</strong></span>
          </div>
        </div>

        {/* Sync / Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F8FAFC',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          fontSize: '11.5px',
          fontWeight: 600,
          color: '#334155',
        }}>
          <Activity size={13} style={{ color: '#0F766E' }} />
          <span>Annual Run-Rate: <strong>{totalMonthlyVol > 0 ? `${annualizedRunRateCr} Cr vehicles/year` : 'Unavailable'}</strong></span>
        </div>
      </div>

      {/* Macro KPI Stat Strip (5 Key High-Impact Metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Monthly National Volume</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
            {totalMonthlyVol > 0 ? `${(totalMonthlyVol / 100000).toFixed(2)} Lakh` : '—'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            MoM change unavailable from live feed
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Annualized Trajectory</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F766E' }}>
            {totalMonthlyVol > 0 ? `${annualizedRunRateCr} Cr / yr` : '—'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            YoY run-rate unavailable from live feed
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Volume Anchor</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
            {segmentMix[0]?.label || '—'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
            {segmentMix[0] ? `${segmentMix[0].share}% of live category mix` : 'No live category mix'}
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>National EV Adoption</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED' }}>
            —
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            EV share not provided by live Vahan scrape
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>Top Consumption State</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>
            {topStateName}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
            {topStateCount} Cumulative Vehicles
          </div>
        </div>
      </div>

      {/* Segment Distribution Stacked Bar & Pills */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} style={{ color: '#0F766E' }} />
            National Registration Mix by Vehicle Category
          </h4>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Total: {totalMonthlyVol > 0 ? `${(totalMonthlyVol / 100000).toFixed(2)} Lakh units` : 'Unavailable'}
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        {segmentMix.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
            Category registration mix unavailable until live VAHAN category volumes are fetched.
          </div>
        ) : (
          <>
        <div style={{ height: '14px', width: '100%', display: 'flex', borderRadius: '7px', overflow: 'hidden', background: '#E2E8F0', marginBottom: '12px' }}>
          {segmentMix.map((seg) => (
            <div
              key={seg.code}
              style={{
                width: `${seg.share}%`,
                background: seg.color,
              }}
              title={`${seg.label}: ${seg.share}% (${(seg.count / 100000).toFixed(2)}L)`}
            />
          ))}
        </div>

        {/* Segment Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '8px' }}>
          {segmentMix.map((seg) => (
            <div
              key={seg.code}
              style={{
                padding: '8px 10px',
                background: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{seg.label}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {seg.count >= 100000 ? `${(seg.count / 100000).toFixed(2)}L` : `${(seg.count / 1000).toFixed(1)}K`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: seg.color }}>{seg.share}%</span>
                <div style={{ fontSize: '9.5px', color: seg.mom >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {seg.mom >= 0 ? '+' : ''}{seg.mom}%
                </div>
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>

      {/* Regional State Consumption Corridors */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: '#0F766E' }} />
              Regional Geographic State Corridors
            </h4>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
              Macroeconomic classification of vehicle concentration across North, West, South, and Central/East corridors
            </p>
          </div>

          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '6px', border: '1px solid #E2E8F0', gap: '2px' }}>
            {[
              { id: 'all', label: 'All 4 Corridors' },
              { id: 'north', label: 'North' },
              { id: 'west', label: 'West' },
              { id: 'south', label: 'South' },
              { id: 'east_central', label: 'East/Central' },
            ].map((tab) => {
              const isSelected = selectedClusterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedClusterTab(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#0F766E' : '#64748B',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '11px',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
          {filteredClusters.map((cluster) => (
            <div
              key={cluster.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: `1px solid ${cluster.border}`,
                padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      {cluster.name}
                    </h5>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                      {cluster.shareOfNationalFleet}% of All-India Registered Fleet
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: cluster.bg,
                    color: cluster.color,
                    border: `1px solid ${cluster.border}`,
                  }}>
                    {cluster.formattedCount}
                  </span>
                </div>

                <div style={{ margin: '8px 0', fontSize: '11px', color: '#475569' }}>
                  <div style={{ fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                    Dominant Segment: <span style={{ color: cluster.color }}>{cluster.dominantSegments}</span>
                  </div>
                  <p style={{ margin: 0, color: '#64748B', lineHeight: 1.45 }}>
                    {cluster.growthDriver}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Key Anchor States:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cluster.topStates.map((st) => (
                    <span
                      key={st}
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#F8FAFC',
                        color: '#334155',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Ancillary & Value-Chain Beneficiary Matrix */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} style={{ color: '#0F766E' }} />
              Auto-Ancillary & Upstream Supply-Chain Matrix
            </h4>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
              How monthly Vahan volume growth flows upstream to listed Tier-1 component makers and suppliers
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>
          {ancillarySectors.map((sec) => {
            const IconComp = sec.icon;
            const isSelected = activeAncillarySector === sec.sector;

            return (
              <div
                key={sec.sector}
                onClick={() => setActiveAncillarySector(isSelected ? null : sec.sector)}
                style={{
                  background: isSelected ? '#FAFCFC' : '#FFFFFF',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid #0F766E' : `1px solid ${sec.border}`,
                  padding: '14px',
                  boxShadow: isSelected ? '0 2px 8px rgba(15,118,110,0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      background: sec.bg,
                      color: sec.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${sec.border}`,
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {sec.sector}
                      </h5>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px', lineHeight: 1.45 }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong style={{ color: '#1E293B' }}>Volume Link: </strong>
                      {sec.correlation}
                    </div>
                    <div>
                      <strong style={{ color: '#1E293B' }}>Catalyst: </strong>
                      {sec.demandCatalyst}
                    </div>
                  </div>

                  <div style={{
                    background: sec.bg,
                    border: `1px solid ${sec.border}`,
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '10.5px',
                    color: sec.color,
                    fontWeight: 600,
                    marginBottom: '10px',
                  }}>
                    {sec.contentPerVehicleTrend}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Key Listed Tier-1 Stocks:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sec.topStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#F8FAFC',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E2E8F0',
                          fontSize: '10.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontWeight: 700, color: '#0F766E' }}>{stock.symbol}</span>
                          <span style={{ color: '#64748B' }}>{stock.name}</span>
                        </div>
                        <span style={{ fontSize: '9.5px', color: '#94A3B8', textAlign: 'right' }}>
                          {stock.catalyst.slice(0, 32)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
