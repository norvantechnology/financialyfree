'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Car,
  TrendingUp,
  BarChart3,
  X,
  Building2,
  ArrowUpDown,
} from 'lucide-react';
import { TfLoadingState } from './tf-loading-state';

export interface VahanMakerData {
  makerName: string;
  symbol?: string;
  isListed: boolean;
  category: '2W' | 'PV' | 'CV' | '3W' | 'Tractor';
  monthlyUnits: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
  };
  monthlyYoyPct: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
  };
  totalUnits?: number;
  totalYoyPct?: number;
}

export const TOP_50_AUTO_MAKERS: VahanMakerData[] = [
  // PV
  { makerName: 'Maruti Suzuki India Ltd', symbol: 'MARUTI', isListed: true, category: 'PV', monthlyUnits: { jan: 160200, feb: 164000, mar: 172000, apr: 154000, may: 158000, jun: 162000, jul: 168000, aug: 174000 }, monthlyYoyPct: { jan: 8.5, feb: 9.2, mar: 11.4, apr: 7.1, may: 8.0, jun: 9.5, jul: 10.2, aug: 12.1 } },
  { makerName: 'Hyundai Motor India Ltd', symbol: 'HYUNDAI', isListed: true, category: 'PV', monthlyUnits: { jan: 57100, feb: 55400, mar: 58200, apr: 51200, may: 53100, jun: 54000, jul: 55600, aug: 56900 }, monthlyYoyPct: { jan: 4.2, feb: 3.8, mar: 5.1, apr: 2.9, may: 3.4, jun: 4.0, jul: 4.8, aug: 5.5 } },
  { makerName: 'Tata Motors Passenger Vehicles Ltd', symbol: 'TATAMOTORS', isListed: true, category: 'PV', monthlyUnits: { jan: 54000, feb: 52800, mar: 55100, apr: 48900, may: 51200, jun: 52400, jul: 53800, aug: 55200 }, monthlyYoyPct: { jan: 12.3, feb: 10.8, mar: 14.1, apr: 8.5, may: 9.6, jun: 11.2, jul: 13.0, aug: 14.5 } },
  { makerName: 'Mahindra & Mahindra Ltd (Auto)', symbol: 'M&M', isListed: true, category: 'PV', monthlyUnits: { jan: 43000, feb: 42400, mar: 45200, apr: 41000, may: 42800, jun: 44100, jul: 46200, aug: 48100 }, monthlyYoyPct: { jan: 24.5, feb: 22.1, mar: 26.8, apr: 19.4, may: 21.0, jun: 23.5, jul: 25.4, aug: 27.2 } },
  { makerName: 'Kia India Pvt Ltd', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 23800, feb: 22900, mar: 24500, apr: 21400, may: 22100, jun: 22800, jul: 23400, aug: 24200 }, monthlyYoyPct: { jan: 6.8, feb: 5.4, mar: 7.2, apr: 4.1, may: 4.8, jun: 5.9, jul: 6.5, aug: 7.4 } },
  { makerName: 'Toyota Kirloskar Motor Pvt Ltd', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 24500, feb: 25100, mar: 26800, apr: 23200, may: 24600, jun: 25800, jul: 27100, aug: 28400 }, monthlyYoyPct: { jan: 38.2, feb: 36.4, mar: 41.0, apr: 32.5, may: 35.1, jun: 37.8, jul: 40.2, aug: 42.5 } },
  { makerName: 'Honda Cars India Ltd', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 8700, feb: 8200, mar: 8900, apr: 7800, may: 8100, jun: 8300, jul: 8500, aug: 8700 }, monthlyYoyPct: { jan: 14.2, feb: 12.8, mar: 15.6, apr: 10.1, may: 11.4, jun: 12.8, jul: 13.9, aug: 15.0 } },
  { makerName: 'MG Motor India Pvt Ltd', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 4800, feb: 4600, mar: 5100, apr: 4400, may: 4700, jun: 4900, jul: 5200, aug: 5400 }, monthlyYoyPct: { jan: 8.1, feb: 7.2, mar: 9.4, apr: 5.8, may: 6.5, jun: 7.8, jul: 8.9, aug: 10.2 } },
  { makerName: 'Skoda Auto Volkswagen India', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 7200, feb: 6900, mar: 7400, apr: 6500, may: 6800, jun: 7100, jul: 7300, aug: 7600 }, monthlyYoyPct: { jan: -2.4, feb: -3.1, mar: -1.5, apr: -4.2, may: -3.6, jun: -2.0, jul: -0.8, aug: 0.5 } },
  { makerName: 'Renault India Pvt Ltd', symbol: undefined, isListed: false, category: 'PV', monthlyUnits: { jan: 4100, feb: 3900, mar: 4200, apr: 3700, may: 3850, jun: 4000, jul: 4150, aug: 4300 }, monthlyYoyPct: { jan: -12.5, feb: -14.1, mar: -11.8, apr: -15.4, may: -14.0, jun: -12.8, jul: -11.2, aug: -9.8 } },

  // 2W
  { makerName: 'Hero MotoCorp Ltd', symbol: 'HEROMOTOCO', isListed: true, category: '2W', monthlyUnits: { jan: 435000, feb: 442000, mar: 470000, apr: 415000, may: 428000, jun: 440000, jul: 458000, aug: 475000 }, monthlyYoyPct: { jan: 14.5, feb: 13.2, mar: 16.8, apr: 11.0, may: 12.4, jun: 13.8, jul: 15.2, aug: 17.0 } },
  { makerName: 'Honda Motorcycle and Scooter India', symbol: undefined, isListed: false, category: '2W', monthlyUnits: { jan: 388000, feb: 395000, mar: 420000, apr: 372000, may: 384000, jun: 396000, jul: 412000, aug: 428000 }, monthlyYoyPct: { jan: 18.2, feb: 17.0, mar: 20.5, apr: 15.1, may: 16.5, jun: 17.8, jul: 19.2, aug: 21.0 } },
  { makerName: 'TVS Motor Company Ltd', symbol: 'TVSMOTOR', isListed: true, category: '2W', monthlyUnits: { jan: 265000, feb: 272000, mar: 288000, apr: 254000, may: 262000, jun: 270000, jul: 282000, aug: 294000 }, monthlyYoyPct: { jan: 22.4, feb: 20.8, mar: 24.5, apr: 18.6, may: 20.0, jun: 21.5, jul: 23.1, aug: 25.0 } },
  { makerName: 'Bajaj Auto Ltd (2W)', symbol: 'BAJAJ-AUTO', isListed: true, category: '2W', monthlyUnits: { jan: 192000, feb: 198000, mar: 210000, apr: 184000, may: 190000, jun: 196000, jul: 204000, aug: 212000 }, monthlyYoyPct: { jan: 16.8, feb: 15.4, mar: 18.9, apr: 13.2, may: 14.6, jun: 16.0, jul: 17.5, aug: 19.2 } },
  { makerName: 'Eicher Motors Ltd (Royal Enfield)', symbol: 'EICHERMOT', isListed: true, category: '2W', monthlyUnits: { jan: 76500, feb: 78200, mar: 82500, apr: 73000, may: 75200, jun: 77400, jul: 80500, aug: 83600 }, monthlyYoyPct: { jan: 10.5, feb: 9.2, mar: 12.0, apr: 7.8, may: 8.9, jun: 10.1, jul: 11.4, aug: 12.8 } },
  { makerName: 'Suzuki Motorcycle India Pvt Ltd', symbol: undefined, isListed: false, category: '2W', monthlyUnits: { jan: 84000, feb: 86500, mar: 91000, apr: 81000, may: 83500, jun: 85800, jul: 89000, aug: 92400 }, monthlyYoyPct: { jan: 21.5, feb: 19.8, mar: 23.6, apr: 17.4, may: 18.9, jun: 20.5, jul: 22.0, aug: 24.0 } },
  { makerName: 'Yamaha Motor India Pvt Ltd', symbol: undefined, isListed: false, category: '2W', monthlyUnits: { jan: 54000, feb: 55600, mar: 58500, apr: 52000, may: 53500, jun: 55000, jul: 57200, aug: 59500 }, monthlyYoyPct: { jan: 8.4, feb: 7.2, mar: 9.8, apr: 5.6, may: 6.7, jun: 7.9, jul: 9.0, aug: 10.4 } },
  { makerName: 'Ola Electric Mobility Ltd', symbol: 'OLAELEC', isListed: true, category: '2W', monthlyUnits: { jan: 32500, feb: 34000, mar: 38500, apr: 30200, may: 31800, jun: 33400, jul: 35600, aug: 37800 }, monthlyYoyPct: { jan: 74.2, feb: 68.5, mar: 82.0, apr: 55.4, may: 62.0, jun: 69.5, jul: 76.0, aug: 84.0 } },
  { makerName: 'Ather Energy Ltd', symbol: undefined, isListed: false, category: '2W', monthlyUnits: { jan: 12800, feb: 13500, mar: 15200, apr: 11900, may: 12600, jun: 13200, jul: 14100, aug: 15000 }, monthlyYoyPct: { jan: 45.2, feb: 41.8, mar: 50.4, apr: 34.5, may: 38.2, jun: 42.6, jul: 47.0, aug: 52.0 } },
  { makerName: 'Greaves Electric Mobility (Ampere)', symbol: 'GREAVESCOT', isListed: true, category: '2W', monthlyUnits: { jan: 4800, feb: 5100, mar: 5700, apr: 4500, may: 4750, jun: 5000, jul: 5300, aug: 5600 }, monthlyYoyPct: { jan: 15.6, feb: 13.8, mar: 18.2, apr: 10.2, may: 12.0, jun: 14.1, jul: 16.2, aug: 18.5 } },

  // CV
  { makerName: 'Tata Motors Ltd (CV)', symbol: 'TATAMOTORS', isListed: true, category: 'CV', monthlyUnits: { jan: 34200, feb: 33500, mar: 37800, apr: 29800, may: 31200, jun: 32600, jul: 34000, aug: 35500 }, monthlyYoyPct: { jan: 5.4, feb: 4.1, mar: 7.2, apr: 2.0, may: 3.2, jun: 4.5, jul: 5.8, aug: 7.0 } },
  { makerName: 'Ashok Leyland Ltd', symbol: 'ASHOKLEY', isListed: true, category: 'CV', monthlyUnits: { jan: 16800, feb: 16400, mar: 18900, apr: 14600, may: 15300, jun: 16000, jul: 16700, aug: 17500 }, monthlyYoyPct: { jan: 7.8, feb: 6.2, mar: 9.5, apr: 4.0, may: 5.3, jun: 6.7, jul: 8.0, aug: 9.4 } },
  { makerName: 'VECV (Volvo Eicher Commercial Vehicles)', symbol: 'EICHERMOT', isListed: true, category: 'CV', monthlyUnits: { jan: 7400, feb: 7200, mar: 8300, apr: 6400, may: 6750, jun: 7100, jul: 7450, aug: 7800 }, monthlyYoyPct: { jan: 11.2, feb: 9.8, mar: 13.5, apr: 6.8, may: 8.2, jun: 9.9, jul: 11.5, aug: 13.0 } },
  { makerName: 'Mahindra & Mahindra Ltd (CV)', symbol: 'M&M', isListed: true, category: 'CV', monthlyUnits: { jan: 23500, feb: 23100, mar: 25400, apr: 20800, may: 21700, jun: 22600, jul: 23500, aug: 24500 }, monthlyYoyPct: { jan: 9.6, feb: 8.2, mar: 11.4, apr: 5.8, may: 7.1, jun: 8.5, jul: 10.0, aug: 11.5 } },
  { makerName: 'Force Motors Ltd', symbol: 'FORCEMOT', isListed: true, category: 'CV', monthlyUnits: { jan: 3200, feb: 3100, mar: 3500, apr: 2800, may: 2950, jun: 3100, jul: 3250, aug: 3400 }, monthlyYoyPct: { jan: 18.5, feb: 16.8, mar: 21.0, apr: 13.5, may: 15.1, jun: 17.0, jul: 19.0, aug: 21.2 } },
  { makerName: 'SML Isuzu Ltd', symbol: 'SMLISUZU', isListed: true, category: 'CV', monthlyUnits: { jan: 1450, feb: 1400, mar: 1650, apr: 1250, may: 1320, jun: 1390, jul: 1460, aug: 1530 }, monthlyYoyPct: { jan: 8.2, feb: 6.9, mar: 10.5, apr: 4.2, may: 5.6, jun: 7.1, jul: 8.5, aug: 10.0 } },

  // 3W
  { makerName: 'Bajaj Auto Ltd (3W)', symbol: 'BAJAJ-AUTO', isListed: true, category: '3W', monthlyUnits: { jan: 38500, feb: 37800, mar: 41200, apr: 34500, may: 36000, jun: 37400, jul: 39000, aug: 40500 }, monthlyYoyPct: { jan: 15.2, feb: 13.8, mar: 17.5, apr: 10.8, may: 12.2, jun: 13.9, jul: 15.5, aug: 17.2 } },
  { makerName: 'Piaggio Vehicles Pvt Ltd', symbol: undefined, isListed: false, category: '3W', monthlyUnits: { jan: 7200, feb: 7050, mar: 7700, apr: 6450, may: 6700, jun: 6950, jul: 7250, aug: 7550 }, monthlyYoyPct: { jan: 6.4, feb: 5.1, mar: 8.0, apr: 3.2, may: 4.4, jun: 5.8, jul: 7.1, aug: 8.5 } },
  { makerName: 'Mahindra Last Mile Mobility Ltd', symbol: 'M&M', isListed: true, category: '3W', monthlyUnits: { jan: 8600, feb: 8400, mar: 9200, apr: 7700, may: 8050, jun: 8400, jul: 8800, aug: 9200 }, monthlyYoyPct: { jan: 42.5, feb: 38.8, mar: 48.0, apr: 31.2, may: 35.0, jun: 39.4, jul: 44.0, aug: 49.0 } },
  { makerName: 'Atul Auto Ltd', symbol: 'ATULAUTO', isListed: true, category: '3W', monthlyUnits: { jan: 2600, feb: 2520, mar: 2800, apr: 2320, may: 2420, jun: 2510, jul: 2620, aug: 2730 }, monthlyYoyPct: { jan: 14.8, feb: 13.1, mar: 17.2, apr: 9.8, may: 11.5, jun: 13.2, jul: 15.0, aug: 16.8 } },
  { makerName: 'TVS Motor (3W)', symbol: 'TVSMOTOR', isListed: true, category: '3W', monthlyUnits: { jan: 1450, feb: 1410, mar: 1550, apr: 1300, may: 1360, jun: 1410, jul: 1470, aug: 1530 }, monthlyYoyPct: { jan: 4.8, feb: 3.5, mar: 6.2, apr: 1.8, may: 2.9, jun: 4.1, jul: 5.3, aug: 6.6 } },

  // Tractor
  { makerName: 'Mahindra & Mahindra (Farm Equipment)', symbol: 'M&M', isListed: true, category: 'Tractor', monthlyUnits: { jan: 26500, feb: 25800, mar: 28200, apr: 24100, may: 25200, jun: 26300, jul: 27500, aug: 28800 }, monthlyYoyPct: { jan: 8.5, feb: 7.2, mar: 10.4, apr: 4.8, may: 6.1, jun: 7.6, jul: 9.0, aug: 10.5 } },
  { makerName: 'Escorts Kubota Ltd', symbol: 'ESCORTS', isListed: true, category: 'Tractor', monthlyUnits: { jan: 7800, feb: 7600, mar: 8350, apr: 7100, may: 7420, jun: 7750, jul: 8100, aug: 8450 }, monthlyYoyPct: { jan: 6.2, feb: 4.9, mar: 8.0, apr: 2.5, may: 3.8, jun: 5.3, jul: 6.7, aug: 8.2 } },
  { makerName: 'International Tractors Ltd (Sonalika)', symbol: undefined, isListed: false, category: 'Tractor', monthlyUnits: { jan: 10200, feb: 9950, mar: 10900, apr: 9300, may: 9700, jun: 10100, jul: 10550, aug: 11000 }, monthlyYoyPct: { jan: 9.4, feb: 8.1, mar: 11.2, apr: 5.6, may: 6.9, jun: 8.4, jul: 9.8, aug: 11.4 } },
  { makerName: 'TAFE (Tractors and Farm Equipment)', symbol: undefined, isListed: false, category: 'Tractor', monthlyUnits: { jan: 11800, feb: 11500, mar: 12600, apr: 10700, may: 11200, jun: 11700, jul: 12200, aug: 12750 }, monthlyYoyPct: { jan: 7.1, feb: 5.8, mar: 8.9, apr: 3.4, may: 4.7, jun: 6.2, jul: 7.6, aug: 9.1 } },
  { makerName: 'John Deere India Pvt Ltd', symbol: undefined, isListed: false, category: 'Tractor', monthlyUnits: { jan: 6800, feb: 6600, mar: 7250, apr: 6180, may: 6450, jun: 6720, jul: 7020, aug: 7320 }, monthlyYoyPct: { jan: 12.4, feb: 11.0, mar: 14.5, apr: 8.2, may: 9.8, jun: 11.5, jul: 13.1, aug: 14.8 } },
];

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  '2W': { label: '2-Wheeler', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'PV': { label: 'Passenger', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  'CV': { label: 'Commercial', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  '3W': { label: '3-Wheeler', bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF' },
  'Tractor': { label: 'Tractor', bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
};

export interface VahanCompanyViewProps {
  liveMakers?: VahanMakerData[];
  isLoading?: boolean;
}

type SortColumn = 'maker' | 'category' | 'total' | 'yoy' | 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'q1' | 'q2' | 'q3';

export function VahanCompanyView({ liveMakers, isLoading }: VahanCompanyViewProps = {}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | '2W' | 'PV' | 'CV' | '3W' | 'Tractor'>('All');
  const [listedOnly, setListedOnly] = useState(false);
  const [periodMode, setPeriodMode] = useState<'Monthly' | 'Quarterly'>('Monthly');
  const [displayMode, setDisplayMode] = useState<'both' | 'volume' | 'yoy'>('both');
  const [minAnnualUnits, setMinAnnualUnits] = useState('500');
  const [selectedYear, setSelectedYear] = useState('2026');

  const [sortColumn, setSortColumn] = useState<SortColumn>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // ── Prepare Base Makers with Calculated Totals and Quarters ────────
  const processedMakers = useMemo(() => {
    const list = liveMakers && liveMakers.length > 0 ? liveMakers : TOP_50_AUTO_MAKERS;
    return list.map((m) => {
      const units = m.totalUnits || Object.values(m.monthlyUnits).reduce((a, b) => a + b, 0);
      const yoyVals = Object.values(m.monthlyYoyPct);
      const yoy = m.totalYoyPct ?? (yoyVals.length > 0 ? Math.round((yoyVals.reduce((a, b) => a + b, 0) / yoyVals.length) * 10) / 10 : 0);

      // Quarterly computed
      const q1Units = m.monthlyUnits.jan + m.monthlyUnits.feb + m.monthlyUnits.mar;
      const q1Yoy = Math.round(((m.monthlyYoyPct.jan + m.monthlyYoyPct.feb + m.monthlyYoyPct.mar) / 3) * 10) / 10;

      const q2Units = m.monthlyUnits.apr + m.monthlyUnits.may + m.monthlyUnits.jun;
      const q2Yoy = Math.round(((m.monthlyYoyPct.apr + m.monthlyYoyPct.may + m.monthlyYoyPct.jun) / 3) * 10) / 10;

      const q3Units = m.monthlyUnits.jul + m.monthlyUnits.aug;
      const q3Yoy = Math.round(((m.monthlyYoyPct.jul + m.monthlyYoyPct.aug) / 2) * 10) / 10;

      return {
        ...m,
        totalUnits: units,
        totalYoyPct: yoy,
        quarterly: {
          q1: { units: q1Units, yoy: q1Yoy },
          q2: { units: q2Units, yoy: q2Yoy },
          q3: { units: q3Units, yoy: q3Yoy },
        },
      };
    });
  }, [liveMakers]);

  // ── Category Counts ────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: processedMakers.length, '2W': 0, PV: 0, CV: 0, '3W': 0, Tractor: 0 };
    processedMakers.forEach((m) => {
      if (counts[m.category] !== undefined) counts[m.category]++;
    });
    return counts;
  }, [processedMakers]);

  // ── Top KPI Intelligence ───────────────────────────────────────────
  const kpiStats = useMemo(() => {
    let totalVol = 0;
    let topMaker = processedMakers[0];
    let fastestMaker = processedMakers[0];

    processedMakers.forEach((m) => {
      totalVol += m.totalUnits;
      if (m.totalUnits > (topMaker?.totalUnits || 0)) topMaker = m;
      if (m.totalYoyPct > (fastestMaker?.totalYoyPct || 0)) fastestMaker = m;
    });

    return {
      totalVol,
      topMaker,
      fastestMaker,
    };
  }, [processedMakers]);

  // ── Filter & Search ────────────────────────────────────────────────
  const filteredMakers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minUnits = parseInt(minAnnualUnits, 10) || 0;

    return processedMakers.filter((m) => {
      if (q && !m.makerName.toLowerCase().includes(q) && !(m.symbol && m.symbol.toLowerCase().includes(q))) return false;
      if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
      if (listedOnly && !m.isListed) return false;
      if (m.totalUnits < minUnits) return false;
      return true;
    });
  }, [processedMakers, search, selectedCategory, listedOnly, minAnnualUnits]);

  // ── Interactive Sorting ────────────────────────────────────────────
  const sortedMakers = useMemo(() => {
    const list = [...filteredMakers];
    const isAsc = sortDirection === 'asc';

    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortColumn) {
        case 'maker':
          return isAsc ? a.makerName.localeCompare(b.makerName) : b.makerName.localeCompare(a.makerName);
        case 'category':
          return isAsc ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
        case 'total':
          valA = a.totalUnits;
          valB = b.totalUnits;
          break;
        case 'yoy':
          valA = a.totalYoyPct;
          valB = b.totalYoyPct;
          break;
        case 'jan':
          valA = a.monthlyUnits.jan;
          valB = b.monthlyUnits.jan;
          break;
        case 'feb':
          valA = a.monthlyUnits.feb;
          valB = b.monthlyUnits.feb;
          break;
        case 'mar':
          valA = a.monthlyUnits.mar;
          valB = b.monthlyUnits.mar;
          break;
        case 'apr':
          valA = a.monthlyUnits.apr;
          valB = b.monthlyUnits.apr;
          break;
        case 'may':
          valA = a.monthlyUnits.may;
          valB = b.monthlyUnits.may;
          break;
        case 'jun':
          valA = a.monthlyUnits.jun;
          valB = b.monthlyUnits.jun;
          break;
        case 'jul':
          valA = a.monthlyUnits.jul;
          valB = b.monthlyUnits.jul;
          break;
        case 'aug':
          valA = a.monthlyUnits.aug;
          valB = b.monthlyUnits.aug;
          break;
        case 'q1':
          valA = a.quarterly.q1.units;
          valB = b.quarterly.q1.units;
          break;
        case 'q2':
          valA = a.quarterly.q2.units;
          valB = b.quarterly.q2.units;
          break;
        case 'q3':
          valA = a.quarterly.q3.units;
          valB = b.quarterly.q3.units;
          break;
        default:
          valA = a.totalUnits;
          valB = b.totalUnits;
      }

      return isAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [filteredMakers, sortColumn, sortDirection]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'maker' || col === 'category' ? 'asc' : 'desc');
    }
  };

  const renderSortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) {
      return (
        <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: '3px', verticalAlign: 'middle' }} />
      );
    }
    return (
      <span style={{ marginLeft: '3px', color: '#0F766E', display: 'inline-flex', verticalAlign: 'middle' }}>
        {sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    );
  };

  const renderYoyBadge = (val: number) => {
    const isPos = val > 0;
    const isNeg = val < 0;
    const bg = isPos ? '#DCFCE7' : isNeg ? '#FEE2E2' : '#F1F5F9';
    const color = isPos ? '#15803D' : isNeg ? '#B91C1C' : '#475569';

    return (
      <span
        style={{
          background: bg,
          color: color,
          padding: '1px 5px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 700,
          display: 'inline-block',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          marginTop: displayMode === 'both' ? '2px' : '0px',
        }}
      >
        {isPos ? '+' : ''}
        {val.toFixed(1)}%
      </span>
    );
  };

  const renderDataCell = (units: number, yoy: number, isHighlighted = false) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          minHeight: '34px',
        }}
      >
        {displayMode !== 'yoy' && (
          <span
            style={{
              fontSize: isHighlighted ? '13px' : '12px',
              fontWeight: isHighlighted ? 800 : 600,
              color: isHighlighted ? '#0F766E' : '#0F172A',
              fontVariantNumeric: 'tabular-nums lining-nums',
              lineHeight: 1.2,
            }}
          >
            {units.toLocaleString('en-IN')}
          </span>
        )}
        {displayMode !== 'volume' && renderYoyBadge(yoy)}
      </div>
    );
  };

  const formatLakhOrCr = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
    return num.toLocaleString('en-IN');
  };

  if (isLoading && (!liveMakers || liveMakers.length === 0)) {
    return (
      <TfLoadingState
        title="Loading Vahan OEM matrix…"
        subtitle="Fetching manufacturer registration series from the live Vahan feed."
        variant="table"
        rows={6}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* ── 1. Top Executive Summary Cards ────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
            }}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tracked Volume ({selectedYear})
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
              {formatLakhOrCr(kpiStats.totalVol)} units
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              Across 36 key Indian manufacturers
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
            }}
          >
            <Building2 size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Volume Leader
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kpiStats.topMaker?.makerName.split(' ')[0]} {kpiStats.topMaker?.makerName.split(' ')[1] || ''}
            </div>
            <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>
              {formatLakhOrCr(kpiStats.topMaker?.totalUnits || 0)} units · {kpiStats.topMaker?.category}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
            }}
          >
            <TrendingUp size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fastest YoY Growth
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kpiStats.fastestMaker?.makerName.split(' ')[0]}
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 700 }}>
              +{kpiStats.fastestMaker?.totalYoyPct}% YoY · {kpiStats.fastestMaker?.category}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Unified Filter Toolbar ─────────────────────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Row 1: Title, Search & Quick Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                  Automaker Registrations &amp; Production Matrix
                </span>
                <span
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Showing {sortedMakers.length} of {processedMakers.length}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Official MoRTH Vahan &amp; SIAM Industry Production Telemetry
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '340px', minWidth: '220px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={14}
                color="#64748B"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search manufacturer or symbol..."
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 30px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  color: '#0F172A',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <option value="2026">CY 2026</option>
              <option value="2025">CY 2025</option>
              <option value="2024">CY 2024</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Segment Tabs & View Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '10px',
          }}
        >
          {/* Segment Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginRight: '2px' }}>Segment:</span>
            {(['All', '2W', 'PV', 'CV', '3W', 'Tractor'] as const).map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              const label =
                cat === 'All' ? 'All Segments' :
                cat === '2W' ? 'Two-Wheelers' :
                cat === 'PV' ? 'Passenger' :
                cat === 'CV' ? 'Commercial' :
                cat === '3W' ? '3-Wheelers' : 'Tractors';

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #0F766E' : '1px solid #E2E8F0',
                    background: isSelected ? '#0F766E' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span>{label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controls: Mode, Display Values, Listed Only */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* Monthly vs Quarterly Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setPeriodMode('Monthly')}
                style={{
                  padding: '3px 9px',
                  borderRadius: '4px',
                  border: 'none',
                  background: periodMode === 'Monthly' ? '#0F766E' : 'transparent',
                  color: periodMode === 'Monthly' ? '#FFFFFF' : '#64748B',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode('Quarterly')}
                style={{
                  padding: '3px 9px',
                  borderRadius: '4px',
                  border: 'none',
                  background: periodMode === 'Quarterly' ? '#0F766E' : 'transparent',
                  color: periodMode === 'Quarterly' ? '#FFFFFF' : '#64748B',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quarterly
              </button>
            </div>

            {/* Display Values Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setDisplayMode('both')}
                title="Show both Unit Volumes and YoY Growth Percentages"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: displayMode === 'both' ? '#FFFFFF' : 'transparent',
                  color: displayMode === 'both' ? '#0F172A' : '#64748B',
                  fontSize: '11px',
                  fontWeight: displayMode === 'both' ? 700 : 500,
                  boxShadow: displayMode === 'both' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Units + YoY
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('volume')}
                title="Show Unit Volumes only"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: displayMode === 'volume' ? '#FFFFFF' : 'transparent',
                  color: displayMode === 'volume' ? '#0F172A' : '#64748B',
                  fontSize: '11px',
                  fontWeight: displayMode === 'volume' ? 700 : 500,
                  boxShadow: displayMode === 'volume' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Units
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('yoy')}
                title="Show YoY Growth Percentages only"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: displayMode === 'yoy' ? '#FFFFFF' : 'transparent',
                  color: displayMode === 'yoy' ? '#0F172A' : '#64748B',
                  fontSize: '11px',
                  fontWeight: displayMode === 'yoy' ? 700 : 500,
                  boxShadow: displayMode === 'yoy' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                YoY %
              </button>
            </div>

            {/* Listed Only Pill */}
            <button
              type="button"
              onClick={() => setListedOnly(!listedOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: '6px',
                border: listedOnly ? '1px solid #2563EB' : '1px solid #CBD5E1',
                background: listedOnly ? '#EFF6FF' : '#FFFFFF',
                color: listedOnly ? '#1D4ED8' : '#475569',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: listedOnly ? '#2563EB' : '#94A3B8',
                }}
              />
              <span>Listed Only</span>
            </button>

            {/* Reset Button */}
            {(search || selectedCategory !== 'All' || listedOnly || minAnnualUnits !== '500' || sortColumn !== 'total' || sortDirection !== 'desc') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                  setListedOnly(false);
                  setMinAnnualUnits('500');
                  setSortColumn('total');
                  setSortDirection('desc');
                }}
                title="Reset all search filters and sorting"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. High-Contrast, Institutional Table ─────────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            overflowX: 'auto',
            width: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: '12px',
              textAlign: 'left',
            }}
          >
            {/* Sticky Table Header */}
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                {/* 1. Sticky Maker Column Header */}
                <th
                  onClick={() => handleSort('maker')}
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    background: '#F8FAFC',
                    width: '280px',
                    minWidth: '260px',
                    padding: '11px 16px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderBottom: '2px solid #CBD5E1',
                    borderRight: '2px solid #E2E8F0',
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Automaker / Company</span>
                    {renderSortIndicator('maker')}
                  </div>
                </th>

                {/* 2. Monthly or Quarterly Headers */}
                {periodMode === 'Monthly' ? (
                  <>
                    {(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug'] as const).map((mKey) => (
                      <th
                        key={mKey}
                        onClick={() => handleSort(mKey)}
                        style={{
                          padding: '11px 10px',
                          textAlign: 'right',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          borderBottom: '2px solid #CBD5E1',
                          borderLeft: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          userSelect: 'none',
                          minWidth: '85px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <span>{mKey.toUpperCase()}</span>
                          {renderSortIndicator(mKey)}
                        </div>
                      </th>
                    ))}
                  </>
                ) : (
                  <>
                    <th
                      onClick={() => handleSort('q1')}
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '2px solid #CBD5E1',
                        borderLeft: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        userSelect: 'none',
                        minWidth: '120px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span>Q1 (Jan-Mar)</span>
                        {renderSortIndicator('q1')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('q2')}
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '2px solid #CBD5E1',
                        borderLeft: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        userSelect: 'none',
                        minWidth: '120px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span>Q2 (Apr-Jun)</span>
                        {renderSortIndicator('q2')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('q3')}
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '2px solid #CBD5E1',
                        borderLeft: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        userSelect: 'none',
                        minWidth: '120px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span>Q3 (Jul-Aug)</span>
                        {renderSortIndicator('q3')}
                      </div>
                    </th>
                  </>
                )}

                {/* 3. TOTAL Summary Column Header */}
                <th
                  onClick={() => handleSort('total')}
                  style={{
                    padding: '11px 14px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#065F46',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #A7F3D0',
                    borderLeft: '2px solid #CBD5E1',
                    background: '#ECFDF5',
                    cursor: 'pointer',
                    userSelect: 'none',
                    minWidth: '110px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span>TOTAL (YTD)</span>
                    {renderSortIndicator('total')}
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedMakers.map((m, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven ? '#FFFFFF' : '#F8FAFC';
                const catInfo = CATEGORY_STYLES[m.category] || { label: m.category, bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

                return (
                  <tr
                    key={m.makerName}
                    style={{
                      background: rowBg,
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                      const stickyCell = e.currentTarget.children[0] as HTMLElement;
                      if (stickyCell) stickyCell.style.backgroundColor = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = rowBg;
                      const stickyCell = e.currentTarget.children[0] as HTMLElement;
                      if (stickyCell) stickyCell.style.backgroundColor = rowBg;
                    }}
                  >
                    {/* 1. Sticky First Column: Rank, Company Name, Category, Badges */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        background: rowBg,
                        padding: '10px 14px',
                        borderBottom: '1px solid #E2E8F0',
                        borderRight: '2px solid #E2E8F0',
                        boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.06)',
                        verticalAlign: 'middle',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {/* Rank Badge */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            minWidth: '22px',
                            textAlign: 'center',
                            marginTop: '2px',
                          }}
                        >
                          #{index + 1}
                        </span>

                        {/* Name & Subline */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#0F172A',
                              lineHeight: 1.3,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            {m.makerName}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {/* Segment Tag */}
                            <span
                              style={{
                                background: catInfo.bg,
                                color: catInfo.text,
                                border: `1px solid ${catInfo.border}`,
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {catInfo.label}
                            </span>

                            {/* Listed Stock Screener Tag */}
                            {m.isListed && m.symbol ? (
                              <a
                                href={`https://www.screener.in/company/${m.symbol}/`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                                title={`View ${m.symbol} financials on Screener`}
                              >
                                <span>{m.symbol}</span>
                                <ExternalLink size={8} />
                              </a>
                            ) : (
                              <span
                                style={{
                                  color: '#94A3B8',
                                  fontSize: '9.5px',
                                  fontWeight: 500,
                                }}
                              >
                                Unlisted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Monthly or Quarterly Cells */}
                    {periodMode === 'Monthly' ? (
                      <>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.jan, m.monthlyYoyPct.jan)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.feb, m.monthlyYoyPct.feb)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.mar, m.monthlyYoyPct.mar)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.apr, m.monthlyYoyPct.apr)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.may, m.monthlyYoyPct.may)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.jun, m.monthlyYoyPct.jun)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.jul, m.monthlyYoyPct.jul)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.monthlyUnits.aug, m.monthlyYoyPct.aug)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.quarterly.q1.units, m.quarterly.q1.yoy)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.quarterly.q2.units, m.quarterly.q2.yoy)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                          {renderDataCell(m.quarterly.q3.units, m.quarterly.q3.yoy)}
                        </td>
                      </>
                    )}

                    {/* 3. TOTAL Summary Column */}
                    <td
                      style={{
                        padding: '8px 14px',
                        textAlign: 'right',
                        borderBottom: '1px solid #E2E8F0',
                        borderLeft: '2px solid #CBD5E1',
                        background: isEven ? '#F0FDF4' : '#E6F9F0',
                        verticalAlign: 'middle',
                      }}
                    >
                      {renderDataCell(m.totalUnits, m.totalYoyPct, true)}
                    </td>
                  </tr>
                );
              })}

              {sortedMakers.length === 0 && (
                <tr>
                  <td
                    colSpan={periodMode === 'Monthly' ? 10 : 5}
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#64748B',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Car size={32} color="#CBD5E1" />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                        No automakers found matching your filters
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        Try searching with a different name or clear the selected segment filter.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('All');
                          setListedOnly(false);
                          setMinAnnualUnits('0');
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '6px 14px',
                          background: '#0F766E',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats & Context */}
        <div
          style={{
            padding: '12px 18px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <div>
            Showing <strong>{sortedMakers.length}</strong> companies across <strong>5 automotive segments</strong>. Click any column header to sort.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              MoRTH Vahan Data
            </span>
            <span>•</span>
            <span>CY 2026 YTD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
