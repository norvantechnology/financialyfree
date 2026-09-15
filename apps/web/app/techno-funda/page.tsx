'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  Search,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Briefcase,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Filter,
  Gauge,
  BarChart3,
  ClipboardList,
  FileText,
  Shield,
  Car,
  Landmark,
  RefreshCw,
  ArrowUpDown,
  PieChart,
  Users,
  Layers,
  UserCheck,
} from 'lucide-react';
import { SidebarLayout } from '../../components/sidebar-layout';
import { TechnoFundaShell } from '../../components/techno-funda-shell';
import { Pagination } from '../../components/pagination';
import { TechnoFundaPaywallLock } from '../../components/techno-funda/techno-funda-paywall-lock';
import { isUserSubscribed, fetchAppAccessMode } from '../../lib/auth-client';
import { formatRelativeTime } from '../../lib/time-utils';
import { MasterTrackerTab, MasterStockItem, normalizeMasterStock } from '../../components/techno-funda/master-tracker-tab';
import type { StockPulseData } from '../../components/techno-funda/master-tracker-tab';
import { BankNbfcTab } from '../../components/techno-funda/bank-nbfc-tab';
import { OrderTrackerTab } from '../../components/techno-funda/order-tracker-tab';
import { EarningsPulseModal } from '../../components/techno-funda/earnings-pulse-modal';
import { PeadHowToUseModal } from '../../components/techno-funda/pead-how-to-use-modal';
import { VahanCompanyView } from '../../components/techno-funda/vahan-company-view';
import { VahanCategoryGroupView } from '../../components/techno-funda/vahan-category-group-view';
import { VahanIndustryView } from '../../components/techno-funda/vahan-industry-view';
import { FiftyTwoWeekScreener, FiftyTwoWeekData } from '../../components/techno-funda/fifty-two-week-screener';
import { BulkBlockDealsTab, BulkBlockDealsData } from '../../components/techno-funda/bulk-block-deals-tab';
import { FnoAnalyticsTab, FnoAnalyticsData } from '../../components/techno-funda/fno-analytics-tab';
import { InsiderTradingTab, InsiderTradingData } from '../../components/techno-funda/insider-trading-tab';
import { IpoTrackerTab, IpoTrackerData } from '../../components/techno-funda/ipo-tracker-tab';
import { DividendsCalendarTab, DividendsCalendarData } from '../../components/techno-funda/dividends-calendar-tab';
import { SectorHeatmapTab, SectorHeatmapData } from '../../components/techno-funda/sector-heatmap-tab';
import { DeliveryMomentumTab, DeliveryMomentumData } from '../../components/techno-funda/delivery-momentum-tab';
import { CircuitBreakersTab, CircuitBreakersData } from '../../components/techno-funda/circuit-breakers-tab';
import { RbiMacroWidget, RbiMacroData } from '../../components/techno-funda/rbi-macro-widget';
import { TfLoadingState } from '../../components/techno-funda/tf-loading-state';
import { WatchlistButton } from '../../components/watchlist-button';
import { AureusScoreBadge, AureusScoreCard } from '../../components/techno-funda/aureus-score-badge';
import {
  calculateDCF,
  calculatePE,
  calculatePB,
  calculateEV,
  calculateEVEBITDA,
  calculateEVSales,
  calculateReverseDCF,
  calculateGrahamValuation,
  calculatePeterLynchFairValue,
  calculateDividendDiscountModel,
  calculateAssetBasedValuation,
  calculateResidualIncome,
  calculateHistoricalMultipleRange,
  calculateBuybackReturn,
  calculateBuybackPremium,
  truncatePermittedExcerpt,
} from '@ff/calc';

function cleanHtmlText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, ' - ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function formatNewsTime(pubDate?: string): { timeStr: string; dateStr: string; relativeStr: string } {
  if (!pubDate) return { timeStr: '', dateStr: 'Recent', relativeStr: 'Recent' };
  try {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) return { timeStr: '', dateStr: 'Recent', relativeStr: 'Recent' };
    const relativeStr = formatRelativeTime(d) || 'Recent';
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return { timeStr, dateStr, relativeStr };
  } catch {
    return { timeStr: '', dateStr: 'Recent', relativeStr: 'Recent' };
  }
}

function detectOrderWinClient(text: string): boolean {
  const clean = (text || '').replace(/\bin order to\b/gi, '');
  return (
    /(?:receipt of|award of|awarded|bagged|secures?|wins?|receives?|won|signed)\s+(?:an?\s+)?(?:(?:mega|big|new|major|commercial|purchase|work|epc)\s+)?(?:order|contract|tender|project|mandate|deal)/i.test(clean) ||
    /(?:order|contract|tender|work order|purchase order|loa|letter of award)\s+(?:of|for|worth|valued at?|from)/i.test(clean) ||
    /(?:order book|new order|mega order|big order|major contract|commercial contract)/i.test(clean) ||
    /(?:emerged as|declared as)\s+(?:the\s+)?(?:l-?1|successful)\s+(?:bidder|contractor)/i.test(clean) ||
    /(?:bags?|won)\s+[\w\s]{0,20}(?:order|contract|tender|mandate)/i.test(clean) ||
    /award of order|receipt of order/i.test(clean)
  );
}

function extractOrderValueClient(text: string): string | undefined {
  if (!text) return undefined;
  const inrMatch = text.match(/(?:(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:cr(?:ore)?s?|lakhs?|mn|billion)?)|(?:([\d,]+(?:\.\d+)?)\s*(?:cr(?:ore)?s?)\b)/i);
  if (inrMatch) {
    const val = inrMatch[1] || inrMatch[2];
    const isCrore = /cr/i.test(inrMatch[0]);
    const isLakh = /lakh/i.test(inrMatch[0]);
    if (isCrore) return `₹${val} Cr`;
    if (isLakh) return `₹${val} Lakh`;
    return `₹${val}`;
  }
  const usdMatch = text.match(/(?:\$|usd)\s*([\d,]+(?:\.\d+)?)\s*(m(?:illion)?|b(?:illion)?)?/i);
  if (usdMatch) {
    return `$${usdMatch[1]}${usdMatch[2] ? usdMatch[2][0].toUpperCase() : 'M'}`;
  }
  return undefined;
}

function classifyNewsCategory(
  title: string,
  desc: string,
  isOrderWinExplicit?: boolean
): 'Orders' | 'Results' | 'Corporate Actions' | 'Fundraising' | 'Board' | 'General' {
  const fullText = `${title || ''} ${desc || ''}`;
  if (isOrderWinExplicit || detectOrderWinClient(fullText)) {
    return 'Orders';
  }
  const clean = fullText.replace(/\bin order to\b/gi, '');
  if (/financial result|quarterly result|unaudited financial|audited financial|q[1-4]\b|pat up|profit after tax|net profit|ebitda margin|quarter ended|q\d\s*(?:fy\d{2}|results)/i.test(clean)) {
    return 'Results';
  }
  if (/dividend|bonus|split|sub-division|record date|book closure|buyback|rights issue|face value|amalgamation|merger|demerger/i.test(clean)) {
    return 'Corporate Actions';
  }
  if (/fund raising|qip|preferential (?:issue|allotment)|rights issue|ncd|debenture|commercial paper|qualified institutional placement|warrants|issue of securities/i.test(clean)) {
    return 'Fundraising';
  }
  if (/board meeting|appointment|resignation|cessation|re-appointment|auditor|director|agm|egm|annual general meeting|postal ballot|scrutinizer|management/i.test(clean)) {
    return 'Board';
  }
  return 'General';
}

function TechnoFundaContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const symbolParam = (searchParams.get('symbol') || '').toUpperCase().trim();
  const validTabs = [
    'mmi',
    'sector-heatmap',
    '52w-screener',
    'delivery-momentum',
    'deals',
    'fno',
    'insider',
    'circuits',
    'ipo',
    'dividends',
    'master-tracker',
    'pead',
    'orders',
    'valuation',
    'results',
    'news',
    'shareholding',
    'vahan',
    'bank-nbfc',
    'buybacks',
  ] as const;
  const initialTab = tabParam && (validTabs as readonly string[]).includes(tabParam) ? (tabParam as typeof validTabs[number]) : 'mmi';
  const [activeTab, setActiveTab] = useState<typeof validTabs[number]>(initialTab);

  const [authStatus, setAuthStatus] = useState(() => isUserSubscribed());

  useEffect(() => {
    const sync = () => setAuthStatus(isUserSubscribed());
    sync();
    fetchAppAccessMode().then(() => sync()).catch(() => {});
    window.addEventListener('ff_auth_state_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ff_auth_state_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (tabParam && (validTabs as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Valuation Lab State  all 9 method tabs per PRD §14
  type ValuationMethod =
    | 'DCF'
    | 'Relative Valuation'
    | 'Reverse DCF'
    | 'Graham Number & NCAV'
    | 'Peter Lynch Fair Value'
    | 'Dividend Discount Model'
    | 'Asset-Based / Liquidation'
    | 'Residual Income Model'
    | 'Historical Multiple Range';
  const [method, setMethod] = useState<ValuationMethod>('DCF');
  const [methodCategory, setMethodCategory] = useState<'cashflow' | 'relative' | 'value'>('cashflow');
  const [showShareholdingNoticeDetails, setShowShareholdingNoticeDetails] = useState(false);

  // ── DCF State ──
  const [revenue, setRevenue] = useState(0);
  const [ebitda, setEbitda] = useState(0);
  const [growthRate, setGrowthRate] = useState(12.0);
  const [wacc, setWacc] = useState(10.5);
  const [terminalGrowth, setTerminalGrowth] = useState(4.5);
  const [netDebt, setNetDebt] = useState(0);
  const [sharesOutstanding, setSharesOutstanding] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  const [dcfOutput, setDcfOutput] = useState<{
    intrinsicPrice: number;
    equityValueCr: number;
    evCr: number;
    rangeLow: number;
    rangeHigh: number;
    bullCase: { intrinsicPrice: number; growth: number; wacc: number };
    baseCase: { intrinsicPrice: number; growth: number; wacc: number };
    bearCase: { intrinsicPrice: number; growth: number; wacc: number };
    sensitivityGrid: { wacc: number; tg: number; value: number }[];
  } | null>(null);

  // ── Relative Valuation Sub-Metric State ──
  const [relMetric, setRelMetric] = useState<'P/E' | 'EV/EBITDA' | 'EV/Sales' | 'P/B'>('P/E');
  // P/E State
  const [pePrice, setPePrice] = useState(0);
  const [peEps, setPeEps] = useState(0);
  const [peComparableMultiple, setPeComparableMultiple] = useState(0);
  const [peOutput, setPeOutput] = useState<{ currentPE: number | null; fairValue: number } | null>(null);
  const [peCalculated, setPeCalculated] = useState(false);

  // EV/EBITDA State
  const [evebMarketCap, setEvebMarketCap] = useState(0);
  const [evebDebt, setEvebDebt] = useState(0);
  const [evebCash, setEvebCash] = useState(0);
  const [evebEbitda, setEvebEbitda] = useState(0);
  const [evebComparableMultiple, setEvebComparableMultiple] = useState(0);
  const [evebOutput, setEvebOutput] = useState<{ currentMultiple: number | null; ev: number; fairEV: number; fairEquity: number; fairPrice: number } | null>(null);
  const [evebCalculated, setEvebCalculated] = useState(false);

  // EV/Sales State
  const [evsMarketCap, setEvsMarketCap] = useState(0);
  const [evsDebt, setEvsDebt] = useState(0);
  const [evsCash, setEvsCash] = useState(0);
  const [evsSales, setEvsSales] = useState(0);
  const [evsComparableMultiple, setEvsComparableMultiple] = useState(0);
  const [evsOutput, setEvsOutput] = useState<{ currentMultiple: number | null; ev: number; fairEV: number; fairEquity: number; fairPrice: number } | null>(null);
  const [evsCalculated, setEvsCalculated] = useState(false);

  // P/B State
  const [pbPrice, setPbPrice] = useState(0);
  const [pbBvps, setPbBvps] = useState(0);
  const [pbComparableMultiple, setPbComparableMultiple] = useState(0);
  const [pbOutput, setPbOutput] = useState<{ currentPB: number | null; fairValue: number } | null>(null);
  const [pbCalculated, setPbCalculated] = useState(false);

  // ── Reverse DCF State ──
  const [rdcfPrice, setRdcfPrice] = useState(0);
  const [rdcfLastFCF, setRdcfLastFCF] = useState(0);
  const [rdcfOutput, setRdcfOutput] = useState<{ impliedGrowthRate: number; impliedEquityValue: number } | null>(null);
  const [rdcfCalculated, setRdcfCalculated] = useState(false);

  // ── Graham Number & NCAV State ──
  const [grahamPrice, setGrahamPrice] = useState(0);
  const [grahamEps, setGrahamEps] = useState(0);
  const [grahamBvps, setGrahamBvps] = useState(0);
  const [grahamCurrentAssets, setGrahamCurrentAssets] = useState(0);
  const [grahamTotalLiab, setGrahamTotalLiab] = useState(0);
  const [grahamShares, setGrahamShares] = useState(0);
  const [grahamOutput, setGrahamOutput] = useState<{ grahamNumber: number | null; ncavPerShare: number | null } | null>(null);
  const [grahamCalculated, setGrahamCalculated] = useState(false);

  // ── Peter Lynch State ──
  const [lynchPrice, setLynchPrice] = useState(0);
  const [lynchEps, setLynchEps] = useState(0);
  const [lynchGrowth, setLynchGrowth] = useState(0);
  const [lynchOutput, setLynchOutput] = useState<{ fairValue: number | null; currentPEG: number | null; verdict: string } | null>(null);
  const [lynchCalculated, setLynchCalculated] = useState(false);

  // ── Dividend Discount Model State ──
  const [ddmPrice, setDdmPrice] = useState(0);
  const [ddmD0, setDdmD0] = useState(0);
  const [ddmGrowth, setDdmGrowth] = useState(0);
  const [ddmRequiredReturn, setDdmRequiredReturn] = useState(10.5);
  const [ddmOutput, setDdmOutput] = useState<{ intrinsicValue: number | null; dividendYield: number } | null>(null);
  const [ddmCalculated, setDdmCalculated] = useState(false);

  // ── Asset-Based / Liquidation State ──
  const [assetTotalAssets, setAssetTotalAssets] = useState(0);
  const [assetTotalLiab, setAssetTotalLiab] = useState(0);
  const [assetShares, setAssetShares] = useState(0);
  const [assetHaircut, setAssetHaircut] = useState(20);
  const [assetOutput, setAssetOutput] = useState<{ bookValuePerShare: number; liquidationValuePerShare: number } | null>(null);
  const [assetCalculated, setAssetCalculated] = useState(false);

  // ── Residual Income Model State ──
  const [riBvps, setRiBvps] = useState(0);
  const [riRoe, setRiRoe] = useState(0);
  const [riCostOfEquity, setRiCostOfEquity] = useState(10.5);
  const [riTerminalGrowth, setRiTerminalGrowth] = useState(4.0);
  const [riOutput, setRiOutput] = useState<{ intrinsicValue: number | null; residualIncomeYear1: number } | null>(null);
  const [riCalculated, setRiCalculated] = useState(false);

  // ── Historical Multiple Range State ──
  const [hmMetric, setHmMetric] = useState<'P/E' | 'EV/EBITDA'>('P/E');
  const [hmMetricValue, setHmMetricValue] = useState(0);
  const [hmHigh, setHmHigh] = useState(0);
  const [hmMedian, setHmMedian] = useState(0);
  const [hmLow, setHmLow] = useState(0);
  const [hmOutput, setHmOutput] = useState<{ highFairValue: number; medianFairValue: number; lowFairValue: number } | null>(null);
  const [hmCalculated, setHmCalculated] = useState(false);

  // ── DCF Handler  uses @ff/calc calculateDCF with Bull/Base/Bear + 3x3 Sensitivity ──
  const handleCalculateDCF = () => {
    if (sharesOutstanding <= 0 || revenue <= 0) {
      setDcfOutput(null);
      setIsCalculated(false);
      return;
    }

    const computeCase = (g: number, w: number, tg: number) => {
      const f1 = (ebitda * 0.7) * (1 + g / 100);
      const f2 = f1 * (1 + g / 100);
      const f3 = f2 * (1 + g / 100);
      const f4 = f3 * (1 + (g - 1) / 100);
      const f5 = f4 * (1 + (g - 2) / 100);
      return calculateDCF({
        fcfProjections: [f1, f2, f3, f4, f5],
        wacc: w,
        terminalGrowthRate: tg,
        netDebt,
        sharesOutstanding,
      });
    };

    const baseResult = computeCase(growthRate, wacc, terminalGrowth);
    const bullGrowth = Math.round((growthRate + 3) * 10) / 10;
    const bullWacc = Math.max(1, Math.round((wacc - 1.5) * 10) / 10);
    const bullTg = Math.min(bullWacc - 0.5, Math.round((terminalGrowth + 0.5) * 10) / 10);
    const bullResult = computeCase(bullGrowth, bullWacc, bullTg);

    const bearGrowth = Math.max(0, Math.round((growthRate - 3) * 10) / 10);
    const bearWacc = Math.round((wacc + 1.5) * 10) / 10;
    const bearTg = Math.max(1, Math.round((terminalGrowth - 0.5) * 10) / 10);
    const bearResult = computeCase(bearGrowth, bearWacc, bearTg);

    // Build 3×3 sensitivity grid (WACC: wacc-1, wacc, wacc+1; TG: tg-0.5, tg, tg+0.5)
    const waccValues = [wacc - 1, wacc, wacc + 1];
    const tgValues = [terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5];
    const sensitivityGrid: { wacc: number; tg: number; value: number }[] = [];
    for (const w of waccValues) {
      for (const tg of tgValues) {
        if (w / 100 <= tg / 100) {
          sensitivityGrid.push({ wacc: w, tg, value: NaN });
        } else {
          const r = computeCase(growthRate, w, tg);
          sensitivityGrid.push({ wacc: w, tg, value: Math.round(r.intrinsicValuePerShare) });
        }
      }
    }

    setDcfOutput({
      intrinsicPrice: Math.round(baseResult.intrinsicValuePerShare),
      equityValueCr: Math.round(baseResult.equityValue),
      evCr: Math.round(baseResult.enterpriseValue),
      rangeLow: Math.round(bearResult.intrinsicValuePerShare),
      rangeHigh: Math.round(bullResult.intrinsicValuePerShare),
      baseCase: {
        intrinsicPrice: Math.round(baseResult.intrinsicValuePerShare),
        growth: growthRate,
        wacc,
      },
      bullCase: {
        intrinsicPrice: Math.round(bullResult.intrinsicValuePerShare),
        growth: bullGrowth,
        wacc: bullWacc,
      },
      bearCase: {
        intrinsicPrice: Math.round(bearResult.intrinsicValuePerShare),
        growth: bearGrowth,
        wacc: bearWacc,
      },
      sensitivityGrid,
    });
    setIsCalculated(true);
  };

  const handleResetDCF = () => {
    setRevenue(valuationData.financialsCr.revenue || 0);
    setEbitda(valuationData.financialsCr.ebitda || 0);
    setGrowthRate(valuationData.valuationModelAssumptions.projectedGrowthRatePct || 12.0);
    setWacc(valuationData.valuationModelAssumptions.waccPct || 10.5);
    setTerminalGrowth(valuationData.valuationModelAssumptions.terminalGrowthPct || 4.5);
    setNetDebt(valuationData.financialsCr.netDebt || 0);
    setSharesOutstanding(valuationData.financialsCr.sharesOutstanding || 0);
    setIsCalculated(false);
    setDcfOutput(null);
  };

  // ── Reverse DCF Handler ──
  const handleCalculateReverseDCF = () => {
    const result = calculateReverseDCF({
      currentPrice: rdcfPrice,
      sharesOutstanding,
      netDebt,
      wacc,
      terminalGrowthRate: terminalGrowth,
      projectionYears: 5,
      lastFCF: rdcfLastFCF,
    });
    setRdcfOutput({ impliedGrowthRate: result.impliedGrowthRate, impliedEquityValue: result.impliedEquityValue });
    setRdcfCalculated(true);
  };

  // ── Relative Valuation Handlers ──
  const handleCalculatePE = () => {
    const currentPE = calculatePE(pePrice, peEps);
    const fairValue = peEps > 0 ? peEps * peComparableMultiple : NaN;
    setPeOutput({ currentPE, fairValue });
    setPeCalculated(true);
  };

  const handleCalculateEVEBITDA = () => {
    const ev = calculateEV(evebMarketCap, evebDebt, evebCash);
    const currentMultiple = calculateEVEBITDA(ev, evebEbitda);
    const fairEV = evebEbitda * evebComparableMultiple;
    const fairEquity = Math.max(0, fairEV - evebDebt + evebCash);
    const fairPrice = evebEbitda > 0 && sharesOutstanding > 0 ? Math.round(fairEquity / sharesOutstanding) : NaN;
    setEvebOutput({ currentMultiple, ev, fairEV, fairEquity, fairPrice });
    setEvebCalculated(true);
  };

  const handleCalculateEVSales = () => {
    const ev = calculateEV(evsMarketCap, evsDebt, evsCash);
    const currentMultiple = calculateEVSales(ev, evsSales);
    const fairEV = evsSales * evsComparableMultiple;
    const fairEquity = Math.max(0, fairEV - evsDebt + evsCash);
    const fairPrice = evsSales > 0 && sharesOutstanding > 0 ? Math.round(fairEquity / sharesOutstanding) : NaN;
    setEvsOutput({ currentMultiple, ev, fairEV, fairEquity, fairPrice });
    setEvsCalculated(true);
  };

  const handleCalculatePB = () => {
    const currentPB = calculatePB(pbPrice, pbBvps);
    const fairValue = pbBvps > 0 ? pbBvps * pbComparableMultiple : NaN;
    setPbOutput({ currentPB, fairValue });
    setPbCalculated(true);
  };

  // ── Extended Method Handlers ──
  const handleCalculateGraham = () => {
    const res = calculateGrahamValuation(grahamEps, grahamBvps, grahamCurrentAssets, grahamTotalLiab, grahamShares);
    setGrahamOutput(res);
    setGrahamCalculated(true);
  };

  const handleCalculateLynch = () => {
    const res = calculatePeterLynchFairValue(lynchPrice, lynchEps, lynchGrowth);
    setLynchOutput(res);
    setLynchCalculated(true);
  };

  const handleCalculateDDM = () => {
    const res = calculateDividendDiscountModel(ddmD0, ddmGrowth, ddmRequiredReturn, ddmPrice);
    setDdmOutput(res);
    setDdmCalculated(true);
  };

  const handleCalculateAsset = () => {
    const res = calculateAssetBasedValuation(assetTotalAssets, assetTotalLiab, assetShares, assetHaircut);
    setAssetOutput(res);
    setAssetCalculated(true);
  };

  const handleCalculateRI = () => {
    const res = calculateResidualIncome(riBvps, riRoe, riCostOfEquity, riTerminalGrowth);
    setRiOutput(res);
    setRiCalculated(true);
  };

  const handleCalculateHistoricalRange = () => {
    const res = calculateHistoricalMultipleRange(hmMetricValue, hmHigh, hmMedian, hmLow);
    setHmOutput(res);
    setHmCalculated(true);
  };

  // ── Generic reset for current method ──
  const handleResetMethod = () => {
    if (method === 'DCF') { handleResetDCF(); return; }
    const cmp = valuationData.currentMarketPrice || 0;
    const rev = valuationData.financialsCr.revenue || 0;
    const eb = valuationData.financialsCr.ebitda || 0;
    const nd = valuationData.financialsCr.netDebt || 0;
    const sh = valuationData.financialsCr.sharesOutstanding || 0;
    const mCap = cmp * sh;

    if (method === 'Relative Valuation') {
      setPePrice(cmp); setPeEps(sh > 0 ? Math.round((eb * 0.5) / sh) : 0); setPeComparableMultiple(0); setPeOutput(null); setPeCalculated(false);
      setEvebMarketCap(mCap); setEvebDebt(nd); setEvebCash(0); setEvebEbitda(eb); setEvebComparableMultiple(0); setEvebOutput(null); setEvebCalculated(false);
      setEvsMarketCap(mCap); setEvsDebt(nd); setEvsCash(0); setEvsSales(rev); setEvsComparableMultiple(0); setEvsOutput(null); setEvsCalculated(false);
      setPbPrice(cmp); setPbBvps(0); setPbComparableMultiple(0); setPbOutput(null); setPbCalculated(false);
      return;
    }
    if (method === 'Reverse DCF') { setRdcfPrice(cmp); setRdcfLastFCF(Math.round(eb * 0.5)); setRdcfOutput(null); setRdcfCalculated(false); return; }
    if (method === 'Graham Number & NCAV') { setGrahamPrice(cmp); setGrahamEps(0); setGrahamBvps(0); setGrahamCurrentAssets(0); setGrahamTotalLiab(nd); setGrahamShares(sh); setGrahamOutput(null); setGrahamCalculated(false); return; }
    if (method === 'Peter Lynch Fair Value') { setLynchPrice(cmp); setLynchEps(0); setLynchGrowth(0); setLynchOutput(null); setLynchCalculated(false); return; }
    if (method === 'Dividend Discount Model') { setDdmPrice(cmp); setDdmD0(0); setDdmGrowth(0); setDdmRequiredReturn(10.5); setDdmOutput(null); setDdmCalculated(false); return; }
    if (method === 'Asset-Based / Liquidation') { setAssetTotalAssets(0); setAssetTotalLiab(nd); setAssetShares(sh); setAssetHaircut(20); setAssetOutput(null); setAssetCalculated(false); return; }
    if (method === 'Residual Income Model') { setRiBvps(0); setRiRoe(0); setRiCostOfEquity(10.5); setRiTerminalGrowth(4.0); setRiOutput(null); setRiCalculated(false); return; }
    if (method === 'Historical Multiple Range') { setHmMetric('P/E'); setHmMetricValue(0); setHmHigh(0); setHmMedian(0); setHmLow(0); setHmOutput(null); setHmCalculated(false); return; }
  };

  // ── Generic calculate for current method ──
  const handleCalculateMethod = () => {
    if (method === 'DCF') handleCalculateDCF();
    else if (method === 'Relative Valuation') {
      if (relMetric === 'P/E') handleCalculatePE();
      else if (relMetric === 'EV/EBITDA') handleCalculateEVEBITDA();
      else if (relMetric === 'EV/Sales') handleCalculateEVSales();
      else if (relMetric === 'P/B') handleCalculatePB();
    }
    else if (method === 'Reverse DCF') handleCalculateReverseDCF();
    else if (method === 'Graham Number & NCAV') handleCalculateGraham();
    else if (method === 'Peter Lynch Fair Value') handleCalculateLynch();
    else if (method === 'Dividend Discount Model') handleCalculateDDM();
    else if (method === 'Asset-Based / Liquidation') handleCalculateAsset();
    else if (method === 'Residual Income Model') handleCalculateRI();
    else if (method === 'Historical Multiple Range') handleCalculateHistoricalRange();
  };

  const runAllCalculations = () => {
    if (revenue <= 0 && pePrice <= 0) return;
    handleCalculateDCF();
    handleCalculatePE();
    handleCalculateEVEBITDA();
    handleCalculateEVSales();
    handleCalculatePB();
    handleCalculateReverseDCF();
    handleCalculateGraham();
    handleCalculateLynch();
    handleCalculateDDM();
    handleCalculateAsset();
    handleCalculateRI();
    handleCalculateHistoricalRange();
  };

  const handleSelectValuationForSymbol = async (symbol: string) => {
    const symUpper = (symbol || '').toUpperCase().trim();
    if (!symUpper) return;

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'valuation');
      url.searchParams.set('symbol', symUpper);
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
    }
    setActiveTab('valuation');
    await loadValuationForSymbol(symUpper);
  };

  const loadValuationForSymbol = async (symbol: string) => {
    const symUpper = (symbol || '').toUpperCase().trim();
    if (!symUpper) return;
    setIsRefreshingFeeds(true);
    try {
      const apiUrl =
        typeof window !== 'undefined'
          ? ''
          : process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(
        `${apiUrl}/api/v1/techno-funda/valuation-financials?symbol=${encodeURIComponent(symUpper)}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (!res.ok || data?.error || data?.source === 'UNAVAILABLE' || !data?.financialsCr) {
        setValuationData({
          targetCompany: data?.targetCompany || symUpper,
          fiscalPeriod: '',
          financialsCr: { revenue: 0, ebitda: 0, netDebt: 0, sharesOutstanding: 0 },
          valuationModelAssumptions: {
            projectedGrowthRatePct: 0,
            waccPct: 0,
            terminalGrowthPct: 0,
            derivedIntrinsicFairPriceInr: 0,
          },
          sourceFiling: data?.message || 'Live valuation unavailable',
          refreshedAt: new Date().toISOString(),
          currentMarketPrice: data?.currentMarketPrice || 0,
          cmpChange: data?.cmpChange || 0,
          cmpChangePct: data?.cmpChangePct || 0,
          cmpSymbol: symUpper,
          cmpSource: data?.cmpSource || 'UNAVAILABLE',
          cmpLastUpdated: data?.cmpLastUpdated || '',
          aureusScore: null,
          sector: data?.sector || '',
        } as any);
        return;
      }

      applyValuationPayload(data);
    } catch {
      setValuationData((prev) => ({
        ...prev,
        targetCompany: symUpper,
        cmpSymbol: symUpper,
        financialsCr: { revenue: 0, ebitda: 0, netDebt: 0, sharesOutstanding: 0 },
        sourceFiling: 'Valuation fetch failed',
      }));
    } finally {
      setIsRefreshingFeeds(false);
    }
  };

  const applyValuationPayload = (data: any) => {
    const fin = data.financialsCr || {};
    const assumptions = data.valuationModelAssumptions || {};
    const cmp = data.currentMarketPrice != null ? Number(data.currentMarketPrice) : 0;
    const eps = fin.eps != null ? Number(fin.eps) : 0;
    const rev = fin.revenue != null ? Number(fin.revenue) : 0;
    const eb = fin.ebitda != null ? Number(fin.ebitda) : 0;
    const nd = fin.netDebt != null ? Number(fin.netDebt) : 0;
    const sh = fin.sharesOutstanding != null ? Number(fin.sharesOutstanding) : 0;
    const growth = assumptions.projectedGrowthRatePct != null ? Number(assumptions.projectedGrowthRatePct) : 0;

    setValuationData({
      targetCompany: data.targetCompany || data.cmpSymbol || '',
      fiscalPeriod: data.fiscalPeriod || '',
      financialsCr: {
        revenue: rev,
        ebitda: eb,
        netDebt: nd,
        sharesOutstanding: sh,
      },
      valuationModelAssumptions: {
        projectedGrowthRatePct: growth,
        waccPct: assumptions.waccPct != null ? Number(assumptions.waccPct) : 0,
        terminalGrowthPct: assumptions.terminalGrowthPct != null ? Number(assumptions.terminalGrowthPct) : 0,
        derivedIntrinsicFairPriceInr:
          assumptions.derivedIntrinsicFairPriceInr != null
            ? Number(assumptions.derivedIntrinsicFairPriceInr)
            : 0,
      },
      sourceFiling: data.sourceUrl || data.source || 'LIVE_FETCH',
      refreshedAt: data.refreshedAt || new Date().toISOString(),
      currentMarketPrice: cmp,
      cmpChange: data.cmpChange ?? 0,
      cmpChangePct: data.cmpChangePct ?? 0,
      cmpSymbol: data.cmpSymbol || '',
      cmpSource: data.cmpSource || '',
      cmpLastUpdated: data.cmpLastUpdated || '',
      aureusScore: data.aureusScore || null,
      sector: data.sector || '',
    } as any);

    setRevenue(rev);
    setEbitda(eb);
    setNetDebt(nd);
    setSharesOutstanding(sh);
    if (growth) setGrowthRate(growth);
    // WACC / terminal remain user model inputs — do not invent market facts
    if (assumptions.waccPct != null) setWacc(Number(assumptions.waccPct));
    if (assumptions.terminalGrowthPct != null) setTerminalGrowth(Number(assumptions.terminalGrowthPct));

    if (cmp > 0) {
      const liveCmp = Math.round(cmp * 100) / 100;
      setPePrice(liveCmp);
      setPbPrice(liveCmp);
      setGrahamPrice(liveCmp);
      setLynchPrice(liveCmp);
      setDdmPrice(liveCmp);
      setRdcfPrice(liveCmp);
      if (eps > 0) {
        setPeEps(eps);
        setLynchEps(eps);
        setGrahamEps(eps);
      }
      if (sh > 0) {
        setEvebMarketCap(Math.round(cmp * sh)); // CMP × shares(Cr) ≈ market cap (Cr)
        setEvebEbitda(eb);
        setEvebDebt(Math.max(0, nd));
        setEvsMarketCap(Math.round(cmp * sh));
        setEvsSales(rev);
      }
    }
    setTimeout(() => runAllCalculations(), 50);
  };

  useEffect(() => {
    runAllCalculations();
  }, []);

  // Fast first paint: core market feeds only (not all 23 endpoints)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLiveFeeds({ mode: 'core' });
  }, []);

  // Lazy-load the active tab’s heavy endpoints on demand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLiveFeeds({ mode: 'tab', tab: activeTab });
  }, [activeTab]);

  // Load valuation for URL ?symbol= when opening Valuation Lab from watchlist
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (symbolParam && (activeTab === 'valuation' || tabParam === 'valuation')) {
      loadValuationForSymbol(symbolParam);
    }
  }, [symbolParam, activeTab]);

  // Dynamic Market Feeds State
  const [indicesData, setIndicesData] = useState<{
    indices: Array<{
      symbol: string;
      name: string;
      current: number;
      change: number;
      changePct: number;
      dayHigh: number;
      dayLow: number;
      lastUpdated: string;
    }>;
    indiaVix: number;
    licensingNotice: string;
    technicalMetrics?: {
      dma50: number;
      dma200: number;
      maTrendScore: number;
      volume20dRatio: number;
      liquidityScore: number;
    };
  }>({
    indices: [],
    indiaVix: 0,
    licensingNotice: 'Delayed market quotes (15-min delay) provided for educational and research analysis.',
  });

  const [mmiData, setMmiData] = useState<{
    score: number;
    label: string;
    components: { breadth: number; vix: number; maPositioning: number; fiiDiiFlow: number };
    advisory: string;
    dataSource: string;
  } | null>(null);

  const [vahanData, setVahanData] = useState<{
    mode?: 'LIVE_FETCH' | 'STATIC_SEED';
    status?: string;
    retrievedAt?: string;
    isLiveScraped?: boolean;
    refreshCadence?: string;
    historicalSnapshotsCount?: number;
    categories?: Array<{
      category: string;
      label: string;
      registrations: number;
      formattedRegistrations: string;
      yoyChange: number | null;
      yoyStatusText: string;
      momChange?: number | null;
      keyOEMs: string[];
      oemDisclaimer: string;
      isModeled: boolean;
      volumeNote?: string;
    }>;
    topStates?: Array<{
      stateCode: string;
      stateName: string;
      totalRegistrations: number;
      formattedCount: string;
    }>;
  } | null>(null);

  const [vahanStates, setVahanStates] = useState<Array<{
    stateCode: string;
    stateName: string;
    totalRegistrations: number;
    formattedCount: string;
  }>>([]);

  const [isRefreshingFeeds, setIsRefreshingFeeds] = useState(true);

  // Dynamic 3rd-Party Data Feeds
  const [buybacksData, setBuybacksData] = useState<{
    source: string;
    sourceUrl: string;
    totalBuybacks?: number;
    buybacks?: Array<{
      id: string;
      symbol: string;
      company: string;
      actionSubject: string;
      buybackPrice: number | null;
      currentPrice: number | null;
      premiumPct: number | null;
      method: string;
      exDate: string;
      recordDate: string;
      openingDate: string | null;
      closingDate: string | null;
      promoterParticipation: string;
      status: string;
      dataSource: string;
    }>;
    totalActions: number;
    actions: Array<{
      symbol: string;
      company: string;
      actionSubject: string;
      exDate: string;
      recordDate: string;
      faceVal?: string;
      series?: string;
    }>;
    emptyStateMessage?: string;
    lastUpdated?: string;
  }>({
    source: 'LIVE_FETCH',
    sourceUrl: 'https://www.nseindia.com/api/corporates-corporateActions?index=equities',
    totalBuybacks: 0,
    buybacks: [],
    totalActions: 0,
    actions: [],
    emptyStateMessage: 'No active buybacks detected',
  });

  const [resultsData, setResultsData] = useState<{
    source: string;
    sourceUrl: string;
    totalEvents: number;
    meetings: Array<{
      symbol: string;
      company: string;
      meetingDate: string;
      purpose: string;
      details: string;
    }>;
    totalRecentResults?: number;
    recentResults?: Array<{
      symbol: string;
      company: string;
      quarter: string;
      financialYear: string;
      filingDate: string;
      audited: string;
      consolidated: string;
      revenue: string | null;
      pat: string | null;
      eps: string | null;
      xbrlUrl: string | null;
      hasXbrl: boolean;
    }>;
    lastUpdated?: string;
  }>({
    source: 'LIVE_FETCH',
    sourceUrl: 'https://www.nseindia.com/api/event-calendar',
    totalEvents: 0,
    meetings: [],
    totalRecentResults: 0,
    recentResults: [],
  });

  const [newsData, setNewsData] = useState<{
    source: string;
    feedSourceUrl: string;
    totalHeadlines: number;
    headlines: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      source?: 'NSE Filing' | 'BSE Filing' | 'Market News' | string;
      company?: string;
      symbol?: string;
      isOrderWin?: boolean;
      orderValue?: string;
      category?: string;
    }>;
    lastUpdated?: string;
  }>({
    source: 'LIVE_FETCH',
    feedSourceUrl: 'https://www.nseindia.com/api/corporate-announcements?index=equities',
    totalHeadlines: 0,
    headlines: [],
  });

  // Modal & Subview States matching Reference Screenshots
  const [pulseModalOpen, setPulseModalOpen] = useState(false);
  const [pulseCompanyName, setPulseCompanyName] = useState('');
  const [pulseSymbol, setPulseSymbol] = useState('');
  const [pulseModalData, setPulseModalData] = useState<StockPulseData | null>(null);
  const [peadHowToUseOpen, setPeadHowToUseOpen] = useState(false);
  const [peadQuarter, setPeadQuarter] = useState<'current' | 'previous'>('current');
  const [vahanSubTab, setVahanSubTab] = useState<'company' | 'category' | 'categoryGroup' | 'industry'>('company');

  const openEarningsPulse = (stock: MasterStockItem) => {
    setPulseCompanyName(stock.name);
    setPulseSymbol(stock.symbol);
    setPulseModalData(stock.pulseData || null);
    setPulseModalOpen(true);
  };

  // Used by PEAD table, shareholding table — no MasterStockItem available
  const openPulseByName = (companyName: string, symbol: string) => {
    setPulseCompanyName(companyName);
    setPulseSymbol(symbol);
    const found = masterTrackerData?.stocks?.find((s: any) => s.symbol === symbol);
    setPulseModalData(found?.pulseData || null);
    setPulseModalOpen(true);
  };

  const [shareholdingData, setShareholdingData] = useState<{
    source: string;
    sourceUrl: string;
    totalCompaniesReported: number;
    previewCount?: number;
    granularityNotice?: string;
    categoriesAvailable?: {
      promoter: boolean;
      public: boolean;
      employeeTrusts: boolean;
      fii: boolean;
      dii: boolean;
      mutualFunds: boolean;
      pledgeNumeric: boolean;
      pledgeDisclosuresInNotes: boolean;
    };
    broadcasts: Array<{
      symbol?: string;
      company: string;
      isin: string;
      quarterEnded: string;
      promoterHolding: string;
      publicHolding: string;
      employeeTrusts?: string;
      dematNotes?: string | null;
      hasPledgeMention?: boolean;
      xbrlUrl?: string | null;
      broadcastTimestamp: string;
    }>;
    lastUpdated?: string;
  }>({
    source: 'LIVE_FETCH',
    sourceUrl: 'https://www.nseindia.com/api/corporate-share-holdings-master?index=equities',
    totalCompaniesReported: 0,
    broadcasts: [],
  });

  const [selectedShareholdingIndex, setSelectedShareholdingIndex] = useState<number>(0);

  // Search filter states for dynamic tabs
  const [buybacksSearch, setBuybacksSearch] = useState('');
  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsSubTab, setResultsSubTab] = useState<'meetings' | 'reported'>('meetings');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsPage, setNewsPage] = useState<number>(1);
  const [corporateActionsPage, setCorporateActionsPage] = useState<number>(1);
  const [meetingsPage, setMeetingsPage] = useState<number>(1);
  const [reportedResultsPage, setReportedResultsPage] = useState<number>(1);
  const [shareholdingSearch, setShareholdingSearch] = useState('');
  const [shareholdingPage, setShareholdingPage] = useState<number>(1);

  // ── Multi-Tab Interactive Filter States ──
  // 1. News Desk Category Filter (Orders, Results, Actions, etc.)
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<string>('All');

  // 2. PEAD Screener Filters
  const [peadSearch, setPeadSearch] = useState<string>('');
  const [peadStageFilter, setPeadStageFilter] = useState<string>('All');
  const [peadMinSurprise, setPeadMinSurprise] = useState<string>('');
  const [peadMaxSurprise, setPeadMaxSurprise] = useState<string>('');
  const [peadMinDrift, setPeadMinDrift] = useState<string>('');
  const [peadMaxDrift, setPeadMaxDrift] = useState<string>('');

  // 3. Results Calendar Filters & Progressive Disclosure
  const [meetingsPurposeFilter, setMeetingsPurposeFilter] = useState<string>('All');
  const [reportedAuditFilter, setReportedAuditFilter] = useState<string>('All');
  const [expandedMeetingKey, setExpandedMeetingKey] = useState<string | null>(null);
  const [expandedResultKey, setExpandedResultKey] = useState<string | null>(null);

  // 4. Shareholding Patterns Promoter Holding Filters
  const [promoterPreset, setPromoterPreset] = useState<string>('All');
  const [promoterMinPct, setPromoterMinPct] = useState<string>('');
  const [promoterMaxPct, setPromoterMaxPct] = useState<string>('');

  // 5. Buybacks & Corporate Actions Filter & Progressive Disclosure
  const [activeBuybackSearch, setActiveBuybackSearch] = useState<string>('');
  const [activeBuybackMethod, setActiveBuybackMethod] = useState<'All' | 'Tender Offer' | 'Open Market'>('All');
  const [corporateActionTypeFilter, setCorporateActionTypeFilter] = useState<string>('All');
  const [expandedActionKey, setExpandedActionKey] = useState<string | null>(null);

  // 6. Vahan Auto Category Filter & Progressive Disclosure
  const [vahanCategoryFilter, setVahanCategoryFilter] = useState<string>('All');
  const [vahanExpandedOem, setVahanExpandedOem] = useState<string | null>(null);
  const [vahanShowAllStates, setVahanShowAllStates] = useState<boolean>(false);
  const [vahanStateViewMode, setVahanStateViewMode] = useState<'cards' | 'table'>('cards');

  // ── Multi-Tab Column Sorting States ──
  // Results Calendar Sorting
  const [resSortCol, setResSortCol] = useState<string>('quarter');
  const [resSortDir, setResSortDir] = useState<'asc' | 'desc'>('desc');
  const [meetingSortCol, setMeetingSortCol] = useState<string>('date');
  const [meetingSortDir, setMeetingSortDir] = useState<'asc' | 'desc'>('asc');
  const [corpActionSortCol, setCorpActionSortCol] = useState<string>('exDate');
  const [corpActionSortDir, setCorpActionSortDir] = useState<'asc' | 'desc'>('desc');

  // Shareholding Pattern Sorting
  const [shSortCol, setShSortCol] = useState<string>('promoter');
  const [shSortDir, setShSortDir] = useState<'asc' | 'desc'>('desc');

  // Buybacks Sorting
  const [bbSortCol, setBbSortCol] = useState<string>('premium');
  const [bbSortDir, setBbSortDir] = useState<'asc' | 'desc'>('desc');

  // Vahan State Registrations Sorting
  const [vahanStateSortCol, setVahanStateSortCol] = useState<string>('rank');
  const [vahanStateSortDir, setVahanStateSortDir] = useState<'asc' | 'desc'>('asc');

  // PEAD Screener Sorting
  const [peadSortCol, setPeadSortCol] = useState<string>('score');
  const [peadSortDir, setPeadSortDir] = useState<'asc' | 'desc'>('desc');

  const renderSortIcon = (activeCol: string, targetCol: string, dir: 'asc' | 'desc') => {
    if (activeCol !== targetCol) {
      return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: '3px', verticalAlign: 'middle' }} />;
    }
    return (
      <span style={{ marginLeft: '3px', color: '#0F766E', display: 'inline-flex', verticalAlign: 'middle' }}>
        {dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    );
  };

  // ── Unified Expand / Hide Feature States Across All Tabs ──
  const [showValuationSnapshot, setShowValuationSnapshot] = useState<boolean>(true);
  const [showBuybackCalculator, setShowBuybackCalculator] = useState<boolean>(true);
  const [showCaFilters, setShowCaFilters] = useState<boolean>(false);
  const [showResultsFilters, setShowResultsFilters] = useState<boolean>(false);
  const [showShareholdingFilters, setShowShareholdingFilters] = useState<boolean>(false);
  const [showPeadFilters, setShowPeadFilters] = useState<boolean>(false);

  // PRD Section 18: Buyback Arbitrage Calculator State
  const [bbInvestment, setBbInvestment] = useState<number>(100000);
  const [bbCmp, setBbCmp] = useState<number>(500);
  const [bbOfferPrice, setBbOfferPrice] = useState<number>(600);
  const [bbAcceptanceRatio, setBbAcceptanceRatio] = useState<number>(25);
  const [showBbDetails, setShowBbDetails] = useState<boolean>(false);

  const buybackCalcResult = React.useMemo(() => {
    const inv = Math.max(0, Number(bbInvestment) || 0);
    const cmp = Math.max(0, Number(bbCmp) || 0);
    const offer = Math.max(0, Number(bbOfferPrice) || 0);
    const ratio = Math.max(0, Math.min(100, Number(bbAcceptanceRatio) || 0));

    const res = calculateBuybackReturn(inv, cmp, offer, 0, 0, ratio);
    const premium = calculateBuybackPremium(cmp, offer);
    return {
      ...res,
      premiumPct: premium,
    };
  }, [bbInvestment, bbCmp, bbOfferPrice, bbAcceptanceRatio]);

  const [valuationData, setValuationData] = useState<{
    targetCompany: string;
    fiscalPeriod: string;
    financialsCr: {
      revenue: number;
      ebitda: number;
      netDebt: number;
      sharesOutstanding: number;
    };
    valuationModelAssumptions: {
      projectedGrowthRatePct: number;
      waccPct: number;
      terminalGrowthPct: number;
      derivedIntrinsicFairPriceInr: number;
    };
    sourceFiling: string;
    refreshedAt: string;
    currentMarketPrice?: number;
    cmpChange?: number;
    cmpChangePct?: number;
    cmpSymbol?: string;
    cmpSource?: string;
    cmpLastUpdated?: string;
  }>({
    targetCompany: '',
    fiscalPeriod: '',
    financialsCr: {
      revenue: 0,
      ebitda: 0,
      netDebt: 0,
      sharesOutstanding: 0,
    },
    valuationModelAssumptions: {
      projectedGrowthRatePct: 0,
      waccPct: 0,
      terminalGrowthPct: 0,
      derivedIntrinsicFairPriceInr: 0,
    },
    sourceFiling: '',
    refreshedAt: '',
    currentMarketPrice: 0,
    cmpChange: 0,
    cmpChangePct: 0,
    cmpSymbol: '',
    cmpSource: '',
    cmpLastUpdated: '',
  });

  const [peadFeed, setPeadFeed] = useState<Array<{
    symbol: string;
    name: string;
    surprise: number;
    yoyRev: number;
    yoyPat: number;
    drift20d: number;
    resultDate: string;
    stage: string;
    currentPe?: number | string;
    forwardPe?: number | string;
    dailyRet?: number;
  }> | null>(null);

  const [masterTrackerData, setMasterTrackerData] = useState<{ totalStocks: number; stocks: any[]; lastUpdated: string } | null>(null);
  const [orderTrackerData, setOrderTrackerData] = useState<{ totalOrdersCount: number; totalOrderValueCr: number; consolidated: any[]; orders: any[]; lastUpdated: string } | null>(null);
  const [bankNbfcData, setBankNbfcData] = useState<{ periods: string[]; costOfFunds: any[]; roa: any[]; deposits: any[]; lastUpdated: string } | null>(null);
  const [vahanMakersData, setVahanMakersData] = useState<{ totalMakers: number; makers: any[]; lastUpdated: string } | null>(null);
  const [fiftyTwoWeekData, setFiftyTwoWeekData] = useState<FiftyTwoWeekData | null>(null);
  const [bulkDealsData, setBulkDealsData] = useState<BulkBlockDealsData | null>(null);
  const [fnoData, setFnoData] = useState<FnoAnalyticsData | null>(null);
  const [insiderData, setInsiderData] = useState<InsiderTradingData | null>(null);
  const [ipoData, setIpoData] = useState<IpoTrackerData | null>(null);
  const [dividendsData, setDividendsData] = useState<DividendsCalendarData | null>(null);
  const [sectorHeatmapData, setSectorHeatmapData] = useState<SectorHeatmapData | null>(null);
  const [deliveryMomentumData, setDeliveryMomentumData] = useState<DeliveryMomentumData | null>(null);
  const [circuitBreakersData, setCircuitBreakersData] = useState<CircuitBreakersData | null>(null);
  const [rbiMacroData, setRbiMacroData] = useState<RbiMacroData | null>(null);
  const [feedLatencyMs, setFeedLatencyMs] = useState<number>(32);

  const [feedStatus, setFeedStatus] = useState<Record<string, { ok: boolean; timestamp?: string; error?: string }>>({});
  const [, setFailedFeedList] = useState<string[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('08-Sep-2026 15:00 IST');

  const loadedFeedsRef = useRef<Set<string>>(new Set());

  type FeedFetchOpts = { mode?: 'core' | 'tab' | 'refresh'; tab?: string };

  const CORE_FEED_KEYS = ['indices', 'market-mood', 'news'] as const;

  const TAB_FEED_KEYS: Record<string, string[]> = {
    mmi: ['indices', 'market-mood', 'rbi-macro'],
    'sector-heatmap': ['sector-heatmap'],
    '52w-screener': ['52w-high-low'],
    'delivery-momentum': ['delivery-screener'],
    deals: ['bulk-block-deals'],
    fno: ['fno-oi'],
    insider: ['insider-trading'],
    circuits: ['circuit-breakers'],
    ipo: ['ipo-tracker'],
    dividends: ['dividends'],
    'master-tracker': ['master-tracker'],
    pead: ['pead-feed'],
    orders: ['orders'],
    valuation: ['valuation-financials'],
    results: ['results-calendar'],
    news: ['news'],
    shareholding: ['shareholding'],
    vahan: ['vahan', 'vahan-makers'],
    'bank-nbfc': ['bank-nbfc'],
    buybacks: ['buybacks'],
  };

  const feedPath = (key: string) => {
    const base = {
      indices: '/api/v1/techno-funda/indices',
      'market-mood': '/api/v1/techno-funda/market-mood',
      vahan: '/api/v1/techno-funda/vahan',
      buybacks: '/api/v1/techno-funda/buybacks',
      'results-calendar': '/api/v1/techno-funda/results-calendar',
      news: '/api/v1/techno-funda/news',
      shareholding: '/api/v1/techno-funda/shareholding',
      'valuation-financials': `/api/v1/techno-funda/valuation-financials${symbolParam ? `?symbol=${encodeURIComponent(symbolParam)}` : ''}`,
      'pead-feed': '/api/v1/techno-funda/pead-feed',
      'master-tracker': '/api/v1/techno-funda/master-tracker',
      orders: '/api/v1/techno-funda/orders',
      'bank-nbfc': '/api/v1/techno-funda/bank-nbfc',
      'vahan-makers': '/api/v1/techno-funda/vahan-makers',
      '52w-high-low': '/api/v1/techno-funda/52w-high-low',
      'bulk-block-deals': '/api/v1/techno-funda/bulk-block-deals',
      'fno-oi': '/api/v1/techno-funda/fno-oi',
      'insider-trading': '/api/v1/techno-funda/insider-trading',
      'ipo-tracker': '/api/v1/techno-funda/ipo-tracker',
      dividends: '/api/v1/techno-funda/dividends',
      'sector-heatmap': '/api/v1/techno-funda/sector-heatmap',
      'delivery-screener': '/api/v1/techno-funda/delivery-screener',
      'circuit-breakers': '/api/v1/techno-funda/circuit-breakers',
      'rbi-macro': '/api/v1/techno-funda/rbi-macro',
    } as Record<string, string>;
    return base[key];
  };

  const fetchLiveFeeds = async (opts?: FeedFetchOpts | React.SyntheticEvent) => {
    const request: FeedFetchOpts =
      opts && typeof opts === 'object' && 'mode' in opts
        ? (opts as FeedFetchOpts)
        : { mode: 'refresh' };
    const mode = request.mode || 'refresh';
    const tab = request.tab || activeTab;

    let keys: string[] = [];
    if (mode === 'core') {
      keys = [...CORE_FEED_KEYS, ...(TAB_FEED_KEYS[tab] || [])];
    } else if (mode === 'tab') {
      keys = TAB_FEED_KEYS[tab] || [];
    } else {
      // Manual refresh: core + current tab only (never all 23)
      keys = [...CORE_FEED_KEYS, ...(TAB_FEED_KEYS[tab] || [])];
      keys.forEach((k) => loadedFeedsRef.current.delete(k));
    }

    // Skip feeds already warm unless explicit refresh
    if (mode !== 'refresh') {
      keys = keys.filter((k) => !loadedFeedsRef.current.has(k));
    }
    keys = Array.from(new Set(keys)).filter((k) => Boolean(feedPath(k)));
    if (keys.length === 0) return;

    setIsRefreshingFeeds(true);
    const startT = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const failed: string[] = [];
    const statusMap: Record<string, { ok: boolean; timestamp?: string; error?: string }> = { ...feedStatus };

    try {
      const apiUrl =
        typeof window !== 'undefined'
          ? ''
          : process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const fetchWithCheck = async (url: string, timeoutMs = 20000) => {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return await r.json();
        } catch (err) {
          if (url.startsWith('http') && !url.includes('localhost:3000')) {
            try {
              const path = url.replace(/^https?:\/\/[^/]+/, '');
              const localR = await fetch(path, { signal: AbortSignal.timeout(timeoutMs) });
              if (localR.ok) return await localR.json();
            } catch {}
          }
          throw err;
        }
      };

      const settled = await Promise.allSettled(
        keys.map((key) => fetchWithCheck(`${apiUrl}${feedPath(key)}`)),
      );

      const elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startT);
      setFeedLatencyMs(elapsed);

      const apply = (key: string, res: PromiseSettledResult<any>) => {
        const v = res.status === 'fulfilled' ? res.value : null;
        const ok = res.status === 'fulfilled' && v && !v.error;

        switch (key) {
          case 'indices':
            if (ok && v.indices) {
              setIndicesData(v);
              statusMap.indices = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.indices = { ok: false, error: 'Indices & India VIX live fetch failed' };
              failed.push('Indices & India VIX');
            }
            break;
          case 'market-mood':
            if (ok && v.score != null && v.dataSource !== 'UNAVAILABLE') {
              setMmiData(v);
              statusMap.mmi = { ok: true, timestamp: v.asOfDate || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.mmi = { ok: false, error: 'Market Mood Index calculation failed' };
              failed.push('Market Mood Index');
            }
            break;
          case 'vahan':
            if (ok) {
              setVahanData(v);
              if (v.topStates) setVahanStates(v.topStates);
              statusMap.vahan = {
                ok: true,
                timestamp: v.retrievedAt
                  ? new Date(v.retrievedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : new Date().toLocaleTimeString(),
              };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.vahan = { ok: false, error: 'Vehicle registration feed unavailable' };
              failed.push('Vehicle Registration');
            }
            break;
          case 'buybacks':
            if (ok && v.actions) {
              setBuybacksData(v);
              statusMap.buybacks = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.buybacks = { ok: false, error: 'BSE/NSE Corporate Actions live fetch failed' };
              failed.push('Corporate Buybacks');
            }
            break;
          case 'results-calendar':
            if (ok && v.meetings) {
              setResultsData(v);
              statusMap.results = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.results = { ok: false, error: 'NSE/BSE Results Calendar feed failed' };
              failed.push('Results Calendar');
            }
            break;
          case 'news':
            if (ok && v.headlines?.length > 0) {
              setNewsData(v);
              statusMap.news = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.news = { ok: false, error: 'Market News live RSS feed failed' };
              failed.push('Market News');
            }
            break;
          case 'shareholding':
            if (ok && v.broadcasts) {
              setShareholdingData(v);
              statusMap.shareholding = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.shareholding = { ok: false, error: 'BSE/NSE Shareholding Patterns feed failed' };
              failed.push('Shareholding Patterns');
            }
            break;
          case 'valuation-financials':
            if (ok && v.financialsCr && v.source !== 'UNAVAILABLE') {
              applyValuationPayload(v);
              statusMap.valuation = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.valuation = { ok: false, error: 'Live valuation financials unavailable' };
            }
            break;
          case 'pead-feed':
            if (ok && v.events) {
              setPeadFeed(v.events);
              statusMap.pead = { ok: true, timestamp: v.timestamp || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            } else {
              statusMap.pead = { ok: false, error: 'PEAD drift tracker feed failed' };
            }
            break;
          case 'master-tracker':
            if (ok && (v.stocks || v.companies) && !v.error) {
              const rawList = (v.stocks || v.companies || []) as any[];
              const stocks = rawList.map(normalizeMasterStock);
              setMasterTrackerData({
                ...v,
                stocks,
                totalStocks: v.totalStocks ?? v.companiesCount ?? stocks.length,
              });
              statusMap.masterTracker = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'orders':
            if (ok && v.orders) {
              setOrderTrackerData(v);
              statusMap.orders = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'bank-nbfc':
            if (ok && (v.banks || v.costOfFunds) && !v.error) {
              setBankNbfcData(v);
              statusMap.bankNbfc = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'vahan-makers':
            if (ok && v.makers) {
              setVahanMakersData(v);
              statusMap.vahanMakers = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case '52w-high-low':
            if (ok && v.highs) {
              setFiftyTwoWeekData(v);
              statusMap.fiftyTwoWeek = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'bulk-block-deals':
            if (ok && v.deals) {
              setBulkDealsData(v);
              statusMap.bulkDeals = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'fno-oi':
            if (ok && v.indices) {
              setFnoData(v);
              statusMap.fno = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'insider-trading':
            if (ok && v.transactions) {
              setInsiderData(v);
              statusMap.insider = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'ipo-tracker':
            if (ok && v.ipos) {
              setIpoData(v);
              statusMap.ipo = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'dividends':
            if (ok && v.corporateActions) {
              setDividendsData(v);
              statusMap.dividends = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'sector-heatmap':
            if (ok && v.sectors) {
              setSectorHeatmapData(v);
              statusMap.sectorHeatmap = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'delivery-screener':
            if (ok && v.stocks) {
              setDeliveryMomentumData(v);
              statusMap.deliveryMomentum = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'circuit-breakers':
            if (ok && v.upperCircuits) {
              setCircuitBreakersData(v);
              statusMap.circuitBreakers = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          case 'rbi-macro':
            if (ok && (v.currentRates || v.source)) {
              setRbiMacroData(v);
              statusMap.rbiMacro = { ok: true, timestamp: v.lastUpdated || new Date().toLocaleTimeString() };
              loadedFeedsRef.current.add(key);
            }
            break;
          default:
            break;
        }
      };

      keys.forEach((key, i) => apply(key, settled[i]));

      setFeedStatus(statusMap);
      setFailedFeedList(failed);
      if (failed.length === 0) {
        setLastSyncTimestamp(
          new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
        );
      }
    } catch {
      setFailedFeedList(['All External Feeds']);
    } finally {
      setIsRefreshingFeeds(false);
    }
  };

  const renderInputField = (
    label: string,
    value: number,
    setter: (val: number) => void,
    unit: string,
    step?: number
  ) => (
    <div key={label} className="tf-form-field-row">
      <label className="tf-form-field-label">{label}</label>
      <div className="tf-form-field-input-wrap">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => setter(Number(e.target.value))}
          className="tf-form-field-input"
        />
        <span className="tf-form-field-unit">{unit}</span>
      </div>
    </div>
  );

  const renderCmpComparisonHeader = (
    fairValue: number | null,
    methodLabel: string,
    impliedGrowthRate?: number
  ) => {
    const cmp = valuationData.currentMarketPrice || 0;
    const isReverseDcf = methodLabel.toLowerCase().includes('reverse');

    if (isReverseDcf) {
      return (
        <div className="tf-cmp-header-card" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
          <div className="tf-cmp-header-left">
            <span className="tf-cmp-header-label">CMP</span>
            <span className="tf-cmp-header-price">
              ₹{cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {valuationData.cmpChangePct != null && (
              <span className="tf-cmp-header-chg" style={{ color: valuationData.cmpChange && valuationData.cmpChange >= 0 ? '#16A34A' : '#DC2626' }}>
                {valuationData.cmpChangePct >= 0 ? '+' : ''}{valuationData.cmpChangePct.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="tf-cmp-header-badge">
            <span style={{ fontWeight: 800 }}>Target Benchmark</span>
            {impliedGrowthRate != null && !isNaN(impliedGrowthRate) && (
              <span>• Priced for {impliedGrowthRate.toFixed(1)}% Growth</span>
            )}
          </div>
        </div>
      );
    }

    if (fairValue == null || isNaN(fairValue)) {
      return (
        <div className="tf-cmp-header-card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="tf-cmp-header-left">
            <span className="tf-cmp-header-label">CMP</span>
            <span className="tf-cmp-header-price">
              ₹{cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
              ({valuationData.cmpSymbol || symbolParam || '—'})
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>
            Calculate to compare fair value
          </div>
        </div>
      );
    }

    const diffPct = ((fairValue - cmp) / cmp) * 100;
    const isUndervalued = diffPct > 0;
    const absPct = Math.abs(diffPct).toFixed(1);

    return (
      <div
        className="tf-cmp-header-card"
        style={{
          background: isUndervalued ? 'rgba(240, 253, 244, 0.8)' : 'rgba(254, 242, 242, 0.8)',
          border: `1px solid ${isUndervalued ? '#86EFAC' : '#FCA5A5'}`,
        }}
      >
        <div className="tf-cmp-header-left">
          <span className="tf-cmp-header-label">CMP</span>
          <span className="tf-cmp-header-price">
            ₹{cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {valuationData.cmpChangePct != null && (
            <span className="tf-cmp-header-chg" style={{ color: valuationData.cmpChangePct >= 0 ? '#16A34A' : '#DC2626' }}>
              {valuationData.cmpChangePct >= 0 ? '+' : ''}{valuationData.cmpChangePct.toFixed(2)}%
            </span>
          )}
          <span style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 500 }}>
            • {valuationData.cmpSymbol || symbolParam || '—'}
          </span>
        </div>

        <div
          className="tf-cmp-header-badge"
          style={{
            background: isUndervalued ? '#DCFCE7' : '#FEE2E2',
            color: isUndervalued ? '#166534' : '#991B1B',
            border: `1px solid ${isUndervalued ? '#4ADE80' : '#F87171'}`,
          }}
        >
          {isUndervalued ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{absPct}% {isUndervalued ? 'Undervalued' : 'Overvalued'}</span>
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Stale data silently indicated by ticker ribbon Cached badge */}

        {/* ── Shared Shell: Ticker Ribbon + Header + Tab Pills + Disclaimer ── */}
        <TechnoFundaShell
          indices={indicesData.indices}
          indiaVix={indicesData.indiaVix}
          isRefreshingFeeds={isRefreshingFeeds}
          onRefreshFeeds={fetchLiveFeeds}
          indicesStale={
            feedStatus.indices && !feedStatus.indices.ok
              ? { isStale: true, lastUpdated: feedStatus.indices.timestamp || lastSyncTimestamp }
              : undefined
          }
          feedLatencyMs={feedLatencyMs}
          lastSyncTimestamp={lastSyncTimestamp}
          tabs={[
            { id: 'mmi', label: 'Market Mood', shortLabel: 'Mood', icon: Gauge, isLocked: !authStatus.isSubscribed },
            { id: 'sector-heatmap', label: 'Sector Heatmap', shortLabel: 'Sectors', icon: PieChart, isLocked: !authStatus.isSubscribed },
            { id: '52w-screener', label: '52W High / Low', shortLabel: '52W H/L', icon: TrendingUp, isLocked: !authStatus.isSubscribed },
            { id: 'delivery-momentum', label: 'Delivery Momentum', shortLabel: 'Delivery', icon: Activity, isLocked: !authStatus.isSubscribed },
            { id: 'deals', label: 'Bulk & Block Deals', shortLabel: 'Deals', icon: Users, isLocked: !authStatus.isSubscribed },
            { id: 'fno', label: 'F&O Analytics', shortLabel: 'F&O', icon: Layers, isLocked: !authStatus.isSubscribed },
            { id: 'insider', label: 'Insider Trading', shortLabel: 'Insider', icon: UserCheck, isLocked: !authStatus.isSubscribed },
            { id: 'circuits', label: 'Circuit Watch', shortLabel: 'Circuits', icon: AlertTriangle, isLocked: !authStatus.isSubscribed },
            { id: 'ipo', label: 'IPO Tracker', shortLabel: 'IPO', icon: Briefcase, isLocked: !authStatus.isSubscribed },
            { id: 'dividends', label: 'Dividend Calendar', shortLabel: 'Dividends', icon: Calendar, isLocked: !authStatus.isSubscribed },
            { id: 'master-tracker', label: 'Master Tracker', shortLabel: 'Tracker', icon: TrendingUp, isLocked: !authStatus.isSubscribed },
            { id: 'pead', label: 'PEAD Screener', shortLabel: 'PEAD', icon: BarChart3, isLocked: !authStatus.isSubscribed },
            { id: 'orders', label: 'Order Tracker', shortLabel: 'Orders', icon: ClipboardList, isLocked: !authStatus.isSubscribed },
            { id: 'valuation', label: 'Valuation Lab', shortLabel: 'Valuation', icon: Calculator, isLocked: !authStatus.isSubscribed },
            { id: 'results', label: 'Results Calendar', shortLabel: 'Results', icon: Calendar, isLocked: !authStatus.isSubscribed },
            { id: 'news', label: 'News Desk', shortLabel: 'News', icon: FileText, isLocked: !authStatus.isSubscribed },
            { id: 'shareholding', label: 'Shareholding', shortLabel: 'Holdings', icon: Shield, isLocked: !authStatus.isSubscribed },
            { id: 'vahan', label: 'Vahan Auto', shortLabel: 'Vahan', icon: Car, isLocked: !authStatus.isSubscribed },
            { id: 'bank-nbfc', label: 'Bank / NBFC', shortLabel: 'Banking', icon: Landmark, isLocked: !authStatus.isSubscribed },
            { id: 'buybacks', label: 'Buybacks & Arbitrage', shortLabel: 'Buybacks', icon: RefreshCw, isLocked: !authStatus.isSubscribed },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          title={
            activeTab === 'mmi' ? 'Market Mood Index' :
            activeTab === 'sector-heatmap' ? 'Sectoral Performance & Rotation Heatmap' :
            activeTab === '52w-screener' ? '52-Week High & Low Breakout Screener' :
            activeTab === 'delivery-momentum' ? 'High Delivery % Momentum Screener' :
            activeTab === 'deals' ? 'NSE & BSE Bulk & Block Deals' :
            activeTab === 'fno' ? 'F&O Analytics & Open Interest' :
            activeTab === 'insider' ? 'SEBI PIT Insider Trading Disclosures' :
            activeTab === 'circuits' ? 'Circuit Breakers Watch (Upper & Lower Limits)' :
            activeTab === 'ipo' ? 'Mainboard & SME IPO Calendar & Subscription' :
            activeTab === 'dividends' ? 'Dividend & Corporate Action Calendar' :
            activeTab === 'master-tracker' ? 'Master Tracker' :
            activeTab === 'pead' ? 'PEAD Screener' :
            activeTab === 'orders' ? 'Order Tracker Dashboard' :
            activeTab === 'valuation' ? 'Valuation Lab' :
            activeTab === 'results' ? 'Results Calendar' :
            activeTab === 'news' ? 'News Desk' :
            activeTab === 'shareholding' ? 'Shareholding Patterns' :
            activeTab === 'vahan' ? 'Vahan Auto Dashboard' :
            activeTab === 'bank-nbfc' ? 'Bank / NBFC Dashboard' :
            'Buybacks & Arbitrage'
          }
          subtitle={
            activeTab === 'mmi' ? 'Composite indicator measuring market greed vs. fear across 4 factors with macro context.' :
            activeTab === 'sector-heatmap' ? 'Real-time performance across 11 key NSE sectoral indices with market breadth, rotation cycles, and P/E valuations.' :
            activeTab === '52w-screener' ? 'Live daily feed of equities hitting 52-week highs and lows with breakout margins, sector classification, and proximity filters.' :
            activeTab === 'delivery-momentum' ? 'High conviction screeners filtering stocks trading within 10% of their 52-week high backed by institutional delivery volumes (>50%).' :
            activeTab === 'deals' ? 'Track smart money movements, block trades, and large transactions exceeding 0.5% equity or ₹10 Cr with marquee investor tags.' :
            activeTab === 'fno' ? 'Options chain intelligence: Put-Call Ratio (PCR), Max Pain strikes, open interest buildup, and expiry rollover dynamics.' :
            activeTab === 'insider' ? 'Regulatory disclosures under SEBI PIT & SAST regulations detailing promoter and director acquisitions, market buys, and pledges.' :
            activeTab === 'circuits' ? 'Live monitoring of equities locked in 2%, 5%, 10%, and 20% price bands with pending order book queues and consecutive circuit streaks.' :
            activeTab === 'ipo' ? 'Upcoming, live bidding, and recently listed initial public offerings with real-time subscription multiples and GMP estimates.' :
            activeTab === 'dividends' ? 'Upcoming ex-dates and record dates for dividends, bonus issues, stock splits, and rights issues filterable by high yields.' :
            activeTab === 'master-tracker' ? 'Centralized tracking for winning compounders, key catalysts, and quarterly guidance vs actuals.' :
            activeTab === 'pead' ? 'Track post-earnings price drift over the 2-day to 20-day window.' :
            activeTab === 'orders' ? 'Consolidated order wins and contracts tracked as a percentage of annual company revenue.' :
            activeTab === 'valuation' ? 'Fair value estimates across 9 methods: DCF, peer multiples, Graham, Lynch and more.' :
            activeTab === 'results' ? 'Upcoming board meetings and recently reported quarterly results.' :
            activeTab === 'news' ? 'Market headlines, regulatory filings, and corporate updates.' :
            activeTab === 'shareholding' ? 'Promoter & institutional ownership trends across listed companies.' :
            activeTab === 'vahan' ? 'Nationwide vehicle registration data tracking automotive sector trends.' :
            activeTab === 'bank-nbfc' ? 'Historical Cost of Funds heatmaps, ROA benchmarking, and liability profiles across Indian banks.' :
            'Track active buybacks and calculate tender offer arbitrage returns.'
          }
        >

        {!authStatus.isSubscribed ? (
          <TechnoFundaPaywallLock
            activeTab={activeTab}
            tabTitle={
              activeTab === 'mmi' ? 'Market Mood Index' :
              activeTab === 'sector-heatmap' ? 'Sector Heatmap' :
              activeTab === '52w-screener' ? '52-Week High & Low' :
              activeTab === 'delivery-momentum' ? 'Delivery Momentum' :
              activeTab === 'deals' ? 'Bulk & Block Deals' :
              activeTab === 'fno' ? 'F&O Analytics' :
              activeTab === 'insider' ? 'Insider Trading' :
              activeTab === 'circuits' ? 'Circuit Breakers' :
              activeTab === 'ipo' ? 'IPO Tracker' :
              activeTab === 'dividends' ? 'Dividend Calendar' :
              activeTab === 'master-tracker' ? 'Master Tracker' :
              activeTab === 'pead' ? 'PEAD Screener' :
              activeTab === 'orders' ? 'Order Tracker Dashboard' :
              activeTab === 'valuation' ? 'Valuation Lab' :
              activeTab === 'results' ? 'Results Calendar' :
              activeTab === 'news' ? 'News Desk' :
              activeTab === 'shareholding' ? 'Shareholding Patterns' :
              activeTab === 'vahan' ? 'Vahan Auto Dashboard' :
              activeTab === 'bank-nbfc' ? 'Bank / NBFC Dashboard' :
              'Buybacks & Arbitrage'
            }
            isLoggedIn={authStatus.isLoggedIn}
            userEmail={authStatus.user?.email}
            userName={authStatus.user?.firstName || authStatus.user?.first_name}
          />
        ) : (
          <>
        {/* ── Tab: Sector Heatmap ────────────────── */}
        {activeTab === 'sector-heatmap' && (
          <SectorHeatmapTab
            data={sectorHeatmapData}
            isLoading={isRefreshingFeeds && !sectorHeatmapData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: 52-Week High & Low Screener ────────────────── */}
        {activeTab === '52w-screener' && (
          <FiftyTwoWeekScreener
            data={fiftyTwoWeekData}
            isLoading={isRefreshingFeeds && !fiftyTwoWeekData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Delivery Momentum Screener ────────────────── */}
        {activeTab === 'delivery-momentum' && (
          <DeliveryMomentumTab
            data={deliveryMomentumData}
            isLoading={isRefreshingFeeds && !deliveryMomentumData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Bulk & Block Deals Tracker ────────────────── */}
        {activeTab === 'deals' && (
          <BulkBlockDealsTab
            data={bulkDealsData}
            isLoading={isRefreshingFeeds && !bulkDealsData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: F&O Open Interest & Analytics ────────────────── */}
        {activeTab === 'fno' && (
          <FnoAnalyticsTab
            data={fnoData}
            isLoading={isRefreshingFeeds && !fnoData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Insider Trading Disclosures ────────────────── */}
        {activeTab === 'insider' && (
          <InsiderTradingTab
            data={insiderData}
            isLoading={isRefreshingFeeds && !insiderData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Circuit Breakers Watch ────────────────── */}
        {activeTab === 'circuits' && (
          <CircuitBreakersTab
            data={circuitBreakersData}
            isLoading={isRefreshingFeeds && !circuitBreakersData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: IPO Tracker ────────────────── */}
        {activeTab === 'ipo' && (
          <IpoTrackerTab
            data={ipoData}
            isLoading={isRefreshingFeeds && !ipoData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Dividend Calendar ────────────────── */}
        {activeTab === 'dividends' && (
          <DividendsCalendarTab
            data={dividendsData}
            isLoading={isRefreshingFeeds && !dividendsData}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab 1: Valuation Lab: All 9 methods ────────────────── */}
        {activeTab === 'valuation' && (
          <div>
            {isRefreshingFeeds && (!valuationData.targetCompany || valuationData.financialsCr.revenue === 0) ? (
              <TfLoadingState title="Loading Valuation Financials…" subtitle="Fetching live exchange and market data for this workspace." variant="panel" rows={4} />
            ) : (!valuationData.targetCompany || valuationData.financialsCr.revenue === 0) ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Valuation Financials Available</h3>
                <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                  Valuation financials could not be retrieved from the backend API.
                </p>
                <button
                  type="button"
                  onClick={fetchLiveFeeds}
                  style={{
                    padding: '8px 18px',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry / Reconnect Feed
                </button>
              </div>
            ) : (
              <>
            {/* ── Active Valuation Company Banner & Stock Selector ── */}
            {(() => {
              const sym = (valuationData.cmpSymbol || symbolParam || '').toUpperCase();
              const liveStock = masterTrackerData?.stocks?.find((s: any) => s.symbol.toUpperCase() === sym);
              const cleanCompanyName = valuationData.targetCompany
                ? valuationData.targetCompany.replace(/\s*\([^)]*\)/g, '').trim()
                : (liveStock?.name || sym || 'Select a symbol');
              const sectorName = (valuationData as any).sector || liveStock?.sector || '—';
              const cmp = valuationData.currentMarketPrice || liveStock?.price || 0;
              const cmpChangePct = valuationData.cmpChangePct ?? liveStock?.changePct ?? 0;

              return (
                <div
                  id="valuation-company-banner"
                  className="tf-valuation-banner"
                >
                  {/* Left: Company Identity & Financial Snapshot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                        letterSpacing: '-0.02em',
                        boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {sym.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                          {cleanCompanyName}
                        </h2>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1.5px 7px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {sym}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1.5px 7px',
                            borderRadius: '4px',
                            background: '#F0FDFA',
                            color: '#0F766E',
                            border: '1px solid #CCFBF1',
                          }}
                        >
                          {sectorName}
                        </span>
                        <WatchlistButton symbol={sym} companyName={cleanCompanyName} size="sm" />
                        <AureusScoreBadge
                          scoreResult={(valuationData as any).aureusScore || (liveStock as any)?.aureusScore}
                          inputs={(liveStock as any)?.fundamentals ? { symbol: sym, companyName: cleanCompanyName, ...(liveStock as any).fundamentals } : undefined}
                          size="sm"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11.5px', color: '#64748B', flexWrap: 'wrap' }}>
                        <span>Period: <strong style={{ color: '#334155' }}>{valuationData.fiscalPeriod || '—'}</strong></span>
                        <span>•</span>
                        <span>Rev: <strong style={{ color: '#0F172A' }}>₹{(valuationData.financialsCr?.revenue ?? 0).toLocaleString('en-IN')} Cr</strong></span>
                        <span>•</span>
                        <span>EBITDA: <strong style={{ color: '#0F172A' }}>₹{(valuationData.financialsCr?.ebitda ?? 0).toLocaleString('en-IN')} Cr</strong></span>
                        <span>•</span>
                        <span>Debt: <strong style={{ color: '#0F172A' }}>₹{(valuationData.financialsCr?.netDebt ?? 0).toLocaleString('en-IN')} Cr</strong></span>
                        <span>•</span>
                        <span>Shares: <strong style={{ color: '#0F172A' }}>{valuationData.financialsCr.sharesOutstanding} Cr</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live CMP & Stock Switcher Dropdown */}
                  <div className="tf-controls-row">
                    {/* Live Market Price Badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '34px',
                        padding: '0 12px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CMP</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '5px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                          ₹{cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '11.5px', fontWeight: 750, color: cmpChangePct >= 0 ? '#16A34A' : '#DC2626' }}>
                          {cmpChangePct >= 0 ? '+' : ''}{cmpChangePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Stock Switcher Selector */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: '1 1 auto' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 750, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                        Switch:
                      </span>
                      <select
                        id="valuation-stock-selector"
                        value={sym}
                        onChange={(e) => handleSelectValuationForSymbol(e.target.value)}
                        className="tf-unified-select"
                        style={{
                          height: '34px',
                          padding: '0 10px',
                          fontSize: '12.5px',
                          fontWeight: 650,
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          cursor: 'pointer',
                          outline: 'none',
                          minWidth: '180px',
                        }}
                      >
                        {(!masterTrackerData?.stocks || masterTrackerData.stocks.length === 0) ? (
                          <option value={sym || ''}>{sym || (isRefreshingFeeds ? 'Loading live companies...' : 'No live companies loaded')}</option>
                        ) : (
                          <>
                            {sym && !masterTrackerData.stocks.some((s: any) => s.symbol.toUpperCase() === sym) && (
                              <option value={sym}>
                                {sym} · {cleanCompanyName}
                                {cmp > 0 ? ` (₹${cmp.toLocaleString('en-IN')})` : ''}
                              </option>
                            )}
                            {masterTrackerData.stocks.map((stock: any) => {
                            const shortName = stock.name.replace(/\s*\([^)]*\)/g, '').trim();
                            return (
                              <option key={stock.symbol} value={stock.symbol}>
                                {stock.symbol} · {shortName} (₹{(stock.price || 0).toLocaleString('en-IN')})
                              </option>
                            );
                          })}
                          </>
                        )}
                      </select>
                    </div>

                    {/* Back to Master Tracker */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('master-tracker')}
                      className="tf-unified-btn"
                      style={{
                        height: '34px',
                        padding: '0 12px',
                        fontSize: '12px',
                        fontWeight: 650,
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ← Master Tracker
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Fundamental Quality Pillar Card (Aureus Score) ── */}
            <div style={{ marginBottom: '16px' }}>
              <AureusScoreCard
                scoreResult={(valuationData as any).aureusScore || null}
                inputs={{
                  symbol: valuationData.cmpSymbol || symbolParam || '',
                  companyName: valuationData.targetCompany,
                  roce: (valuationData as any).aureusScore?.subScores?.roce?.rawValue ?? null,
                  debtToEquity: (valuationData as any).aureusScore?.subScores?.debtToEquity?.rawValue ?? null,
                  promoterHoldingPercent: (valuationData as any).aureusScore?.subScores?.promoterHolding?.rawValue ?? null,
                  pledgePercent: null,
                }}
              />
            </div>

            {/* ── Valuation Snapshot Card (All 9 Methods at a Glance) ── */}
            {(() => {
              const cmp = valuationData.currentMarketPrice || 0;
              const sym = (valuationData.cmpSymbol || symbolParam || '').toUpperCase();
              const liveStock = masterTrackerData?.stocks?.find((s: any) => s.symbol.toUpperCase() === sym);
              const cleanCompanyName = valuationData.targetCompany
                ? valuationData.targetCompany.replace(/\s*\([^)]*\)/g, '').trim()
                : (liveStock?.name || sym || '—');

              const snapshotItems = [
                {
                  name: 'DCF (Base Case)',
                  method: 'DCF' as const,
                  category: 'cashflow' as const,
                  fairValue: dcfOutput ? dcfOutput.baseCase.intrinsicPrice : null,
                  displayValue: dcfOutput ? (isNaN(dcfOutput.baseCase.intrinsicPrice) ? 'N/A' : `₹${dcfOutput.baseCase.intrinsicPrice}`) : '—',
                },
                {
                  name: 'Relative P/E',
                  method: 'Relative Valuation' as const,
                  subMetric: 'P/E' as const,
                  category: 'relative' as const,
                  fairValue: peOutput ? peOutput.fairValue : null,
                  displayValue: peOutput ? (isNaN(peOutput.fairValue) ? 'N/A' : `₹${peOutput.fairValue}`) : '—',
                },
                {
                  name: 'EV/EBITDA',
                  method: 'Relative Valuation' as const,
                  subMetric: 'EV/EBITDA' as const,
                  category: 'relative' as const,
                  fairValue: evebOutput ? evebOutput.fairPrice : null,
                  displayValue: evebOutput ? (isNaN(evebOutput.fairPrice) ? 'N/A' : `₹${evebOutput.fairPrice}`) : '—',
                },
                {
                  name: 'P/B Multiple',
                  method: 'Relative Valuation' as const,
                  subMetric: 'P/B' as const,
                  category: 'relative' as const,
                  fairValue: pbOutput ? pbOutput.fairValue : null,
                  displayValue: pbOutput ? (isNaN(pbOutput.fairValue) ? 'N/A' : `₹${Math.round(pbOutput.fairValue)}`) : '—',
                },
                {
                  name: 'Graham Number',
                  method: 'Graham Number & NCAV' as const,
                  category: 'value' as const,
                  fairValue: grahamOutput?.grahamNumber ?? null,
                  displayValue: grahamOutput ? (grahamOutput.grahamNumber != null ? `₹${grahamOutput.grahamNumber}` : 'N/A') : '—',
                },
                {
                  name: 'Peter Lynch',
                  method: 'Peter Lynch Fair Value' as const,
                  category: 'value' as const,
                  fairValue: lynchOutput?.fairValue ?? null,
                  displayValue: lynchOutput ? (lynchOutput.fairValue != null && lynchOutput.fairValue > 0 ? `₹${lynchOutput.fairValue}` : 'N/A') : '—',
                },
                {
                  name: 'Dividend Discount',
                  method: 'Dividend Discount Model' as const,
                  category: 'cashflow' as const,
                  fairValue: ddmOutput?.intrinsicValue ?? null,
                  displayValue: ddmOutput ? (ddmOutput.intrinsicValue != null ? `₹${ddmOutput.intrinsicValue}` : 'N/A') : '—',
                },
                {
                  name: 'Residual Income',
                  method: 'Residual Income Model' as const,
                  category: 'cashflow' as const,
                  fairValue: riOutput?.intrinsicValue ?? null,
                  displayValue: riOutput ? (riOutput.intrinsicValue != null ? `₹${riOutput.intrinsicValue}` : 'N/A') : '—',
                },
                {
                  name: 'Asset Book Value',
                  method: 'Asset-Based / Liquidation' as const,
                  category: 'value' as const,
                  fairValue: assetOutput ? assetOutput.bookValuePerShare : null,
                  displayValue: assetOutput ? `₹${assetOutput.bookValuePerShare}` : '—',
                },
                {
                  name: 'Historical Median',
                  method: 'Historical Multiple Range' as const,
                  category: 'relative' as const,
                  fairValue: hmOutput ? hmOutput.medianFairValue : null,
                  displayValue: hmOutput ? (hmOutput.medianFairValue > 0 ? `₹${hmOutput.medianFairValue}` : 'N/A') : '—',
                },
                {
                  name: 'Reverse DCF',
                  method: 'Reverse DCF' as const,
                  category: 'cashflow' as const,
                  fairValue: null,
                  displayValue: rdcfOutput ? (!isNaN(rdcfOutput.impliedGrowthRate) ? `${rdcfOutput.impliedGrowthRate.toFixed(1)}% p.a.` : 'N/A') : '—',
                },
              ];

              return (
                <div
                  id="valuation-snapshot-card"
                  className="card tf-valuation-snapshot-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: showValuationSnapshot ? '12px' : '0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16.5px', fontWeight: 750, color: '#111827', margin: 0 }}>
                          Valuation Snapshot · {cleanCompanyName}
                        </h3>
                        <span style={{ fontSize: '11px', background: '#F0FDFA', color: '#0F766E', padding: '1.5px 8px', borderRadius: '9999px', fontWeight: 600, border: '1px solid #CCFBF1' }}>
                          9 Models At A Glance
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Live Market Price indicator */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>CMP</span>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                          ₹{cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {valuationData.cmpChangePct != null && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: valuationData.cmpChangePct >= 0 ? '#16A34A' : '#DC2626' }}>
                            {valuationData.cmpChangePct >= 0 ? '+' : ''}{valuationData.cmpChangePct.toFixed(2)}%
                          </span>
                        )}
                      </div>

                      {/* Expand / Hide Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowValuationSnapshot(!showValuationSnapshot)}
                        className="tf-section-toggle-btn"
                        title={showValuationSnapshot ? 'Hide 9-method snapshot grid' : 'Expand 9-method snapshot grid'}
                      >
                        {showValuationSnapshot ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{showValuationSnapshot ? 'Hide Models' : 'Show All 9 Models'}</span>
                      </button>
                    </div>
                  </div>

                  {!showValuationSnapshot ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#64748B' }}>Active Model:</span>
                        <strong style={{ color: '#0F172A', background: '#F1F5F9', padding: '1.5px 6px', borderRadius: '4px' }}>{method}</strong>
                        <span style={{ color: '#64748B' }}>· Stock: <strong>{sym}</strong></span>
                      </div>
                      <span style={{ color: '#0F766E', fontSize: '11px', fontWeight: 600 }}>Tap 'Show All 9 Models' for full comparison grid</span>
                    </div>
                  ) : (
                    <>
                      {/* Horizontal Wrap Grid of Method Chips */}
                      <div className="tf-snapshot-grid">
                        {snapshotItems.map((item) => {
                          const isReverseDcf = item.method === 'Reverse DCF';
                          const diffPct = !isReverseDcf && item.fairValue != null && !isNaN(item.fairValue)
                            ? ((item.fairValue - cmp) / cmp) * 100
                            : null;
                          const isUndervalued = diffPct != null && diffPct > 0;
                          const isSelected = method === item.method && (!item.subMetric || relMetric === item.subMetric);

                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setMethodCategory(item.category);
                                setMethod(item.method);
                                if (item.subMetric) setRelMetric(item.subMetric);
                              }}
                              className={`tf-snapshot-card ${isSelected ? 'tf-snapshot-card-selected' : ''}`}
                            >
                              <div className="tf-snapshot-card-title">
                                {item.name}
                              </div>
                              <div style={{ marginTop: '3px' }}>
                                <div className="tf-snapshot-card-val">
                                  {item.displayValue}
                                </div>
                                {isReverseDcf ? (
                                  <div style={{ marginTop: '2px', fontSize: '11px', fontWeight: 750, color: '#0F766E' }}>
                                    Implied Growth
                                  </div>
                                ) : diffPct != null ? (
                                  <div
                                    style={{
                                      marginTop: '2px',
                                      fontSize: '11px',
                                      fontWeight: 750,
                                      color: isUndervalued ? '#166534' : '#991B1B',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                  >
                                    {isUndervalued ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    <span>{Math.abs(diffPct).toFixed(0)}% {isUndervalued ? 'Under' : 'Over'}</span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>-</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Categorized Method Selector Card */}
            <div className="card tf-method-selector-card">
              {/* Category row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Valuation Framework:
                </div>
                <div className="method-category-strip" style={{ marginBottom: 0 }}>
                  {([
                    { id: 'cashflow', label: 'Cash Flow Models' },
                    { id: 'relative', label: 'Relative Multiples' },
                    { id: 'value', label: 'Deep Value & Balance Sheet' },
                  ] as const).map((cat) => (
                    <button
                      key={cat.id}
                      id={`method-cat-${cat.id}`}
                      onClick={() => {
                        setMethodCategory(cat.id);
                        const catMethods: Record<string, ValuationMethod> = {
                          cashflow: 'DCF',
                          relative: 'Relative Valuation',
                          value: 'Graham Number & NCAV',
                        };
                        setMethod(catMethods[cat.id]);
                      }}
                      className={`method-cat-btn ${methodCategory === cat.id ? 'method-cat-btn-active' : ''}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method pills for selected category */}
              <div className="method-pills-row" style={{ paddingTop: '6px', borderTop: '1px solid #F1F5F9', marginBottom: 0 }}>
                {methodCategory === 'cashflow' && (
                  ['DCF', 'Reverse DCF', 'Dividend Discount Model', 'Residual Income Model'] as const
                ).map((m) => (
                  <button key={m} id={`method-pill-${m.toLowerCase().replace(/[\s/&]/g, '-')}`} onClick={() => setMethod(m)} className={`pill-btn ${method === m ? 'pill-btn-active' : ''}`}>{m}</button>
                ))}
                {methodCategory === 'relative' && (
                  ['Relative Valuation', 'Historical Multiple Range'] as const
                ).map((m) => (
                  <button key={m} id={`method-pill-${m.toLowerCase().replace(/[\s/&]/g, '-')}`} onClick={() => setMethod(m)} className={`pill-btn ${method === m ? 'pill-btn-active' : ''}`}>{m}</button>
                ))}
                {methodCategory === 'value' && (
                  ['Graham Number & NCAV', 'Peter Lynch Fair Value', 'Asset-Based / Liquidation'] as const
                ).map((m) => (
                  <button key={m} id={`method-pill-${m.toLowerCase().replace(/[\s/&]/g, '-')}`} onClick={() => setMethod(m)} className={`pill-btn ${method === m ? 'pill-btn-active' : ''}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Split Card Layout */}
            <div className="tf-split-grid">

              {/* ═══ LEFT CARD: Inputs (per method) ═══ */}
              <div className="card">
                {/* ── 1. DCF Inputs ── */}
                {method === 'DCF' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>DCF Assumptions</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="input-section-label">Operating Metrics</div>
                    {renderInputField('Revenue', revenue, setRevenue, '₹ Cr')}
                    {renderInputField('EBITDA', ebitda, setEbitda, '₹ Cr')}

                    <div className="input-section-label" style={{ marginTop: '8px' }}>Growth &amp; Discount</div>
                    {renderInputField('Growth rate', growthRate, setGrowthRate, '%', 0.5)}
                    {renderInputField('WACC', wacc, setWacc, '%', 0.1)}
                    {renderInputField('Terminal growth', terminalGrowth, setTerminalGrowth, '%', 0.1)}

                    <div className="input-section-label" style={{ marginTop: '8px' }}>Capital Structure</div>
                    {renderInputField('Net debt', netDebt, setNetDebt, '₹ Cr')}
                    {renderInputField('Shares outstanding', sharesOutstanding, setSharesOutstanding, 'Cr')}
                  </div>
                </>)}

                {/* ── 2. Relative Valuation Inputs ── */}
                {method === 'Relative Valuation' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Relative Valuation</h3>

                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    {(['P/E', 'EV/EBITDA', 'EV/Sales', 'P/B'] as const).map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setRelMetric(sub)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: relMetric === sub ? '#FEF3C7' : '#FFFFFF',
                          color: relMetric === sub ? '#92400E' : '#4B5563',
                          cursor: 'pointer',
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  {relMetric === 'P/E' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {renderInputField('Current Price', pePrice, setPePrice, '₹')}
                      {renderInputField('EPS (TTM)', peEps, setPeEps, '₹')}
                      {renderInputField('Comparable P/E multiple', peComparableMultiple, setPeComparableMultiple, 'x', 0.5)}
                    </div>
                  )}

                  {relMetric === 'EV/EBITDA' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {renderInputField('Market Cap', evebMarketCap, setEvebMarketCap, '₹ Cr')}
                      {renderInputField('Total Debt', evebDebt, setEvebDebt, '₹ Cr')}
                      {renderInputField('Cash & Equiv.', evebCash, setEvebCash, '₹ Cr')}
                      {renderInputField('EBITDA', evebEbitda, setEvebEbitda, '₹ Cr')}
                      {renderInputField('Comparable EV/EBITDA', evebComparableMultiple, setEvebComparableMultiple, 'x', 0.5)}
                    </div>
                  )}

                  {relMetric === 'EV/Sales' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {renderInputField('Market Cap', evsMarketCap, setEvsMarketCap, '₹ Cr')}
                      {renderInputField('Total Debt', evsDebt, setEvsDebt, '₹ Cr')}
                      {renderInputField('Cash & Equiv.', evsCash, setEvsCash, '₹ Cr')}
                      {renderInputField('Revenue', evsSales, setEvsSales, '₹ Cr')}
                      {renderInputField('Comparable EV/Sales', evsComparableMultiple, setEvsComparableMultiple, 'x', 0.1)}
                    </div>
                  )}

                  {relMetric === 'P/B' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {renderInputField('Current Price', pbPrice, setPbPrice, '₹')}
                      {renderInputField('Book Value / Share', pbBvps, setPbBvps, '₹')}
                      {renderInputField('Comparable P/B multiple', pbComparableMultiple, setPbComparableMultiple, 'x', 0.1)}
                    </div>
                  )}
                </>)}

                {/* ── 3. Reverse DCF Inputs ── */}
                {method === 'Reverse DCF' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Reverse DCF</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Current Market Price', rdcfPrice, setRdcfPrice, '₹')}
                    {renderInputField('Last known FCF', rdcfLastFCF, setRdcfLastFCF, '₹ Cr')}
                    {renderInputField('WACC', wacc, setWacc, '%', 0.1)}
                    {renderInputField('Terminal growth', terminalGrowth, setTerminalGrowth, '%', 0.1)}
                    {renderInputField('Net debt', netDebt, setNetDebt, '₹ Cr')}
                    {renderInputField('Shares outstanding', sharesOutstanding, setSharesOutstanding, 'Cr')}
                  </div>
                </>)}

                {/* ── 4. Graham Number & NCAV Inputs ── */}
                {method === 'Graham Number & NCAV' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Benjamin Graham Deep Value</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Current Price', grahamPrice, setGrahamPrice, '₹')}
                    {renderInputField('EPS (TTM)', grahamEps, setGrahamEps, '₹')}
                    {renderInputField('Book Value / Share (BVPS)', grahamBvps, setGrahamBvps, '₹')}
                    {renderInputField('Current Assets', grahamCurrentAssets, setGrahamCurrentAssets, '₹ Cr')}
                    {renderInputField('Total Liabilities', grahamTotalLiab, setGrahamTotalLiab, '₹ Cr')}
                    {renderInputField('Shares Outstanding', grahamShares, setGrahamShares, 'Cr')}
                  </div>
                </>)}

                {/* ── 5. Peter Lynch Fair Value Inputs ── */}
                {method === 'Peter Lynch Fair Value' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Peter Lynch Fair Value</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Current Market Price', lynchPrice, setLynchPrice, '₹')}
                    {renderInputField('EPS (TTM)', lynchEps, setLynchEps, '₹')}
                    {renderInputField('Expected Growth Rate', lynchGrowth, setLynchGrowth, '%', 0.5)}
                  </div>
                </>)}

                {/* ── 6. Dividend Discount Model Inputs ── */}
                {method === 'Dividend Discount Model' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Dividend Discount Model</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Current Market Price', ddmPrice, setDdmPrice, '₹')}
                    {renderInputField('Last Dividend (D0)', ddmD0, setDdmD0, '₹', 0.5)}
                    {renderInputField('Expected Dividend Growth (g)', ddmGrowth, setDdmGrowth, '%', 0.1)}
                    {renderInputField('Required Rate of Return (r)', ddmRequiredReturn, setDdmRequiredReturn, '%', 0.1)}
                  </div>
                </>)}

                {/* ── 7. Asset-Based / Liquidation Inputs ── */}
                {method === 'Asset-Based / Liquidation' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Asset-Based Valuation</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Total Assets', assetTotalAssets, setAssetTotalAssets, '₹ Cr')}
                    {renderInputField('Total Liabilities', assetTotalLiab, setAssetTotalLiab, '₹ Cr')}
                    {renderInputField('Shares Outstanding', assetShares, setAssetShares, 'Cr')}
                    {renderInputField('Distressed Haircut', assetHaircut, setAssetHaircut, '%', 5)}
                  </div>
                </>)}

                {/* ── 8. Residual Income Model Inputs ── */}
                {method === 'Residual Income Model' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Residual Income Model</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renderInputField('Book Value / Share (BVPS)', riBvps, setRiBvps, '₹')}
                    {renderInputField('Return on Equity (ROE)', riRoe, setRiRoe, '%', 0.5)}
                    {renderInputField('Cost of Equity (r)', riCostOfEquity, setRiCostOfEquity, '%', 0.1)}
                    {renderInputField('Terminal Growth Rate (g)', riTerminalGrowth, setRiTerminalGrowth, '%', 0.1)}
                  </div>
                </>)}

                {/* ── 9. Historical Multiple Range Inputs ── */}
                {method === 'Historical Multiple Range' && (<>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Historical Multiple Range</h3>

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '38px' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Multiple Basis</span>
                      <select value={hmMetric} onChange={(e) => setHmMetric(e.target.value as 'P/E' | 'EV/EBITDA')} style={{ width: '158px', height: '34px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: 600, color: '#111827', boxSizing: 'border-box' }}>
                        <option value="P/E">P/E Multiple</option>
                        <option value="EV/EBITDA">EV/EBITDA Multiple</option>
                      </select>
                    </div>
                    {renderInputField(hmMetric === 'P/E' ? 'Underlying EPS' : 'Underlying EBITDA', hmMetricValue, setHmMetricValue, hmMetric === 'P/E' ? '₹' : '₹ Cr')}
                    {renderInputField('5-Year High Multiple', hmHigh, setHmHigh, 'x', 0.5)}
                    {renderInputField('5-Year Median Multiple', hmMedian, setHmMedian, 'x', 0.5)}
                    {renderInputField('5-Year Low Multiple', hmLow, setHmLow, 'x', 0.5)}
                  </div>
                </>)}

                {/* Quick Action Buttons for Inputs */}
                <div className="tf-form-actions-bar">
                  <button
                    type="button"
                    onClick={handleCalculateMethod}
                    className="btn btn-primary"
                    style={{ flex: 2, minHeight: '38px', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    <Calculator size={14} />
                    <span>Calculate {method === 'DCF' ? 'DCF' : method === 'Reverse DCF' ? 'Reverse DCF' : 'Fair Value'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMethod}
                    className="btn btn-outline"
                    style={{ flex: 1, minHeight: '38px', justifyContent: 'center', fontSize: '12px' }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>


              </div>

              {/* ═══ RIGHT CARD: Output (per method) ═══ */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* ── 1. DCF Output with Bull / Base / Bear + 3x3 Sensitivity ── */}
                  {method === 'DCF' && (<>
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '0' }}>DCF Valuation</h3>
                    </div>
                    {!isCalculated || !dcfOutput ? (
                      <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', margin: '8px 0 16px' }}>
                        <Calculator size={24} style={{ margin: '0 auto 6px', color: '#0F766E' }} />
                        <div style={{ fontSize: '13px', fontWeight: 650, color: '#1E293B', marginBottom: '2px' }}>Ready to Calculate DCF</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>Adjust assumptions on the left and tap Calculate to generate Bull, Base, and Bear intrinsic valuations.</div>
                      </div>
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(dcfOutput.baseCase.intrinsicPrice, 'DCF')}
                        {/* Bull / Base / Bear Cards: enlarged primary output numbers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                          <div style={{ padding: '14px 12px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#991B1B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bear</div>
                            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#991B1B', marginTop: '4px', lineHeight: 1 }}>{isNaN(dcfOutput.bearCase.intrinsicPrice) ? 'N/A' : `₹${dcfOutput.bearCase.intrinsicPrice}`}</div>
                            <div style={{ fontSize: '10px', color: '#7F1D1D', marginTop: '6px' }}>{dcfOutput.bearCase.growth}% g, {dcfOutput.bearCase.wacc}% WACC</div>
                          </div>
                          <div style={{ padding: '14px 12px', borderRadius: '10px', background: '#FEF3C7', border: '2px solid #F59E0B' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Base</div>
                            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#92400E', marginTop: '4px', lineHeight: 1 }}>{isNaN(dcfOutput.baseCase.intrinsicPrice) ? 'N/A' : `₹${dcfOutput.baseCase.intrinsicPrice}`}</div>
                            <div style={{ fontSize: '10px', color: '#78350F', marginTop: '6px' }}>{dcfOutput.baseCase.growth}% g, {dcfOutput.baseCase.wacc}% WACC</div>
                          </div>
                          <div style={{ padding: '14px 12px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bull</div>
                            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#166534', marginTop: '4px', lineHeight: 1 }}>{isNaN(dcfOutput.bullCase.intrinsicPrice) ? 'N/A' : `₹${dcfOutput.bullCase.intrinsicPrice}`}</div>
                            <div style={{ fontSize: '10px', color: '#14532D', marginTop: '6px' }}>{dcfOutput.bullCase.growth}% g, {dcfOutput.bullCase.wacc}% WACC</div>
                          </div>
                        </div>

                        {isNaN(dcfOutput.baseCase.intrinsicPrice) && (
                          <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', fontWeight: 600 }}>
                            N/A: WACC must exceed terminal growth rate (WACC &gt; Tg)
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Implied Enterprise Value</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{isNaN(dcfOutput.evCr) ? 'N/A' : `₹${dcfOutput.evCr.toLocaleString('en-IN')} Cr`}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Implied Equity Value</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{isNaN(dcfOutput.equityValueCr) ? 'N/A' : `₹${dcfOutput.equityValueCr.toLocaleString('en-IN')} Cr`}</div>
                          </div>
                        </div>

                        {/* 3×3 Sensitivity Matrix */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>3×3 Sensitivity Matrix: Intrinsic Value (₹/share)</div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '320px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '10px 8px', background: '#EEE9DF', border: '1px solid #E5E7EB', fontSize: '10px', color: '#6B7280', fontWeight: 700 }}>WACC ↓ / Tg →</th>
                                  {[terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5].map((tg) => (
                                    <th key={tg} style={{ padding: '10px 8px', background: '#EEE9DF', border: '1px solid #E5E7EB', fontWeight: 700, color: tg === terminalGrowth ? '#D97706' : '#374151' }}>{tg.toFixed(1)}%</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[wacc - 1, wacc, wacc + 1].map((w, wi) => (
                                  <tr key={w}>
                                    <td style={{ padding: '10px 8px', background: '#EEE9DF', border: '1px solid #E5E7EB', fontWeight: 700, color: w === wacc ? '#D97706' : '#374151' }}>{w.toFixed(1)}%</td>
                                    {dcfOutput.sensitivityGrid.slice(wi * 3, wi * 3 + 3).map((cell, ci) => {
                                      const isBase = cell.wacc === wacc && cell.tg === terminalGrowth;
                                      return (
                                        <td key={ci} style={{ padding: '10px 8px', border: '1px solid #E5E7EB', fontWeight: isBase ? 800 : 400, color: isNaN(cell.value) ? '#DC2626' : isBase ? '#FFFFFF' : cell.value < 0 ? '#DC2626' : '#111827', background: isBase ? '#D97706' : '#FFFFFF', fontSize: isBase ? '13px' : '12px' }}>
                                          {isNaN(cell.value) ? 'N/A' : `₹${cell.value}`}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px' }}>Amber cell = base case.</div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 2. Relative Valuation Output ── */}
                  {method === 'Relative Valuation' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Relative Valuation ({relMetric})</h3>
                    </div>

                    {relMetric === 'P/E' && (!peCalculated || !peOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(peOutput.fairValue, 'Relative P/E')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: isNaN(peOutput.fairValue) ? '18px' : '32px', fontWeight: 800, color: isNaN(peOutput.fairValue) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {isNaN(peOutput.fairValue) ? 'N/A (EPS must be positive)' : `₹${peOutput.fairValue}`}
                            {!isNaN(peOutput.fairValue) && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current P/E</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{peOutput.currentPE != null ? peOutput.currentPE.toFixed(1) + 'x' : 'N/A'}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Peer Multiple</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{peComparableMultiple}x</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {relMetric === 'EV/EBITDA' && (!evebCalculated || !evebOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(evebOutput.fairPrice, 'EV/EBITDA')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: isNaN(evebOutput.fairPrice) ? '18px' : '32px', fontWeight: 800, color: isNaN(evebOutput.fairPrice) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {isNaN(evebOutput.fairPrice) ? 'N/A (EBITDA must be positive)' : `₹${evebOutput.fairPrice}`}
                            {!isNaN(evebOutput.fairPrice) && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current EV/EBITDA</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{evebOutput.currentMultiple != null ? evebOutput.currentMultiple.toFixed(1) + 'x' : 'N/A'}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current EV</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>₹{evebOutput.ev.toLocaleString('en-IN')} Cr</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {relMetric === 'EV/Sales' && (!evsCalculated || !evsOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(evsOutput.fairPrice, 'EV/Sales')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: isNaN(evsOutput.fairPrice) ? '18px' : '32px', fontWeight: 800, color: isNaN(evsOutput.fairPrice) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {isNaN(evsOutput.fairPrice) ? 'N/A (Sales must be positive)' : `₹${evsOutput.fairPrice}`}
                            {!isNaN(evsOutput.fairPrice) && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current EV/Sales</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{evsOutput.currentMultiple != null ? evsOutput.currentMultiple.toFixed(2) + 'x' : 'N/A'}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current EV</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>₹{evsOutput.ev.toLocaleString('en-IN')} Cr</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {relMetric === 'P/B' && (!pbCalculated || !pbOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(pbOutput.fairValue, 'P/B Multiple')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: isNaN(pbOutput.fairValue) ? '18px' : '32px', fontWeight: 800, color: isNaN(pbOutput.fairValue) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {isNaN(pbOutput.fairValue) ? 'N/A (Book Value must be positive)' : `₹${Math.round(pbOutput.fairValue)}`}
                            {!isNaN(pbOutput.fairValue) && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#6B7280' }}>Current P/B Ratio</span>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{pbOutput.currentPB != null ? pbOutput.currentPB.toFixed(2) + 'x' : 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </>)}

                  {/* ── 3. Reverse DCF Output ── */}
                  {method === 'Reverse DCF' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Reverse DCF</h3>
                    </div>
                    {!rdcfCalculated || !rdcfOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(null, 'Reverse DCF', rdcfOutput.impliedGrowthRate)}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 16px', borderRadius: '8px', marginBottom: '14px' }}>
                          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Implied FCF Growth Rate
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: isNaN(rdcfOutput.impliedGrowthRate) ? '18px' : 'clamp(28px, 6vw, 36px)', fontWeight: 800, color: isNaN(rdcfOutput.impliedGrowthRate) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                              {isNaN(rdcfOutput.impliedGrowthRate) ? 'N/A (Check inputs)' : `${rdcfOutput.impliedGrowthRate.toFixed(1)}%`}
                            </span>
                            {!isNaN(rdcfOutput.impliedGrowthRate) && (
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>per annum</span>
                            )}
                          </div>
                          {!isNaN(rdcfOutput.impliedGrowthRate) && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '10px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                background: rdcfOutput.impliedGrowthRate > 25 ? '#FEF2F2' : '#F0FDF4',
                                color: rdcfOutput.impliedGrowthRate > 25 ? '#991B1B' : '#166534',
                                border: `1px solid ${rdcfOutput.impliedGrowthRate > 25 ? '#FECACA' : '#BBF7D0'}`,
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: rdcfOutput.impliedGrowthRate > 25 ? '#DC2626' : '#16A34A', flexShrink: 0 }} />
                              <span>{rdcfOutput.impliedGrowthRate > 25 ? 'High execution risk: aggressive market growth priced in' : 'Market expectations appear reasonable'}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF', fontSize: '12px' }}>
                          <span style={{ color: '#64748B', fontWeight: 500 }}>Implied Equity Value</span>
                          <div style={{ fontWeight: 800, fontSize: '17px', color: '#0F172A', marginTop: '3px', fontFamily: 'var(--font-mono, monospace)' }}>
                            ₹{Math.round(rdcfOutput.impliedEquityValue).toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 4. Graham Number & NCAV Output ── */}
                  {method === 'Graham Number & NCAV' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Benjamin Graham Deep Value</h3>
                    </div>
                    {!grahamCalculated || !grahamOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(grahamOutput.grahamNumber, 'Graham Number')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: grahamOutput.grahamNumber == null ? '18px' : '32px', fontWeight: 800, color: grahamOutput.grahamNumber == null ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {grahamOutput.grahamNumber != null ? `₹${grahamOutput.grahamNumber}` : 'N/A (EPS and BVPS must be positive)'}
                            {grahamOutput.grahamNumber != null && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                          {grahamOutput.grahamNumber != null && (
                            <div style={{ fontSize: '12px', color: grahamOutput.grahamNumber > grahamPrice ? '#16A34A' : '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                              {grahamOutput.grahamNumber > grahamPrice
                                ? `Undervalued: +${(((grahamOutput.grahamNumber - grahamPrice) / grahamPrice) * 100).toFixed(1)}% margin of safety`
                                : `Trading above Graham Number by ${(((grahamPrice - grahamOutput.grahamNumber) / grahamOutput.grahamNumber) * 100).toFixed(1)}%`}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Net Current Asset Value (NCAV)</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>
                              {grahamOutput.ncavPerShare != null ? `₹${grahamOutput.ncavPerShare} / share` : 'N/A'}
                            </div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current Market Price</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>₹{grahamPrice}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 5. Peter Lynch Fair Value Output ── */}
                  {method === 'Peter Lynch Fair Value' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Peter Lynch Fair Value</h3>
                    </div>
                    {!lynchCalculated || !lynchOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(lynchOutput.fairValue, 'Peter Lynch Fair Value')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: (lynchOutput.fairValue == null || lynchOutput.fairValue <= 0) ? '18px' : '32px', fontWeight: 800, color: (lynchOutput.fairValue == null || lynchOutput.fairValue <= 0) ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {lynchOutput.fairValue != null && lynchOutput.fairValue > 0 ? `₹${lynchOutput.fairValue}` : 'N/A (EPS and growth rate must be positive)'}
                            {lynchOutput.fairValue != null && lynchOutput.fairValue > 0 && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: lynchOutput.currentPEG != null && lynchOutput.currentPEG <= 1 ? '#16A34A' : '#D97706', marginTop: '4px', fontWeight: 600 }}>
                            {lynchOutput.verdict}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Current PEG Ratio</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{lynchOutput.currentPEG != null ? lynchOutput.currentPEG.toFixed(2) : 'N/A'}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Underlying P/E</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{lynchEps > 0 ? (lynchPrice / lynchEps).toFixed(1) + 'x' : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 6. Dividend Discount Model Output ── */}
                  {method === 'Dividend Discount Model' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Dividend Discount Model</h3>
                    </div>
                    {!ddmCalculated || !ddmOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(ddmOutput.intrinsicValue, 'Dividend Discount Model')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: ddmOutput.intrinsicValue == null ? '18px' : '32px', fontWeight: 800, color: ddmOutput.intrinsicValue == null ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {ddmOutput.intrinsicValue != null ? `₹${ddmOutput.intrinsicValue}` : 'N/A (Required return r must exceed growth rate g)'}
                            {ddmOutput.intrinsicValue != null && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                          {ddmOutput.intrinsicValue != null && (
                            <div style={{ fontSize: '12px', color: ddmOutput.intrinsicValue > ddmPrice ? '#16A34A' : '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                              {ddmOutput.intrinsicValue > ddmPrice
                                ? `Upside: +${(((ddmOutput.intrinsicValue - ddmPrice) / ddmPrice) * 100).toFixed(1)}%`
                                : `Downside: ${(((ddmOutput.intrinsicValue - ddmPrice) / ddmPrice) * 100).toFixed(1)}%`}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Dividend Yield</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{ddmOutput.dividendYield}%</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Spread (r - g)</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>{(ddmRequiredReturn - ddmGrowth).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 7. Asset-Based / Liquidation Output ── */}
                  {method === 'Asset-Based / Liquidation' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Asset-Based Valuation</h3>
                    </div>
                    {!assetCalculated || !assetOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(assetOutput.bookValuePerShare, 'Asset-Based / Liquidation')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
                            ₹{assetOutput.bookValuePerShare}
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>
                          </div>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#6B7280' }}>Distressed Liquidation Value ({assetHaircut}% Haircut)</span>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#DC2626', marginTop: '2px' }}>₹{assetOutput.liquidationValuePerShare} / share</div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 8. Residual Income Model Output ── */}
                  {method === 'Residual Income Model' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Residual Income Model</h3>
                    </div>
                    {!riCalculated || !riOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(riOutput.intrinsicValue, 'Residual Income Model')}
                        <div style={{ background: 'var(--bg-surface-raised, #F4F1EA)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <div style={{ fontSize: riOutput.intrinsicValue == null ? '18px' : '32px', fontWeight: 800, color: riOutput.intrinsicValue == null ? '#DC2626' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                            {riOutput.intrinsicValue != null ? `₹${riOutput.intrinsicValue}` : 'N/A (Cost of equity r must exceed terminal growth g)'}
                            {riOutput.intrinsicValue != null && <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>/ share</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Base BVPS</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>₹{riBvps}</div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Year 1 Residual Income</span>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>₹{riOutput.residualIncomeYear1}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}

                  {/* ── 9. Historical Multiple Range Output ── */}
                  {method === 'Historical Multiple Range' && (<>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Historical Multiple Bands</h3>
                    </div>
                    {!hmCalculated || !hmOutput ? (
                      null
                    ) : (
                      <div>
                        {renderCmpComparisonHeader(hmOutput.medianFairValue, 'Historical Multiple (Median)')}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 95px), 1fr))', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ padding: '10px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B' }}>5Y Low Band</div>
                            <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, color: '#991B1B', marginTop: '2px' }}>{hmOutput.lowFairValue > 0 ? `₹${hmOutput.lowFairValue}` : 'N/A'}</div>
                            <div style={{ fontSize: '10px', color: '#7F1D1D', marginTop: '2px' }}>{hmLow}x multiple</div>
                          </div>
                          <div style={{ padding: '10px', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E' }}>5Y Median Band</div>
                            <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, color: '#92400E', marginTop: '2px' }}>{hmOutput.medianFairValue > 0 ? `₹${hmOutput.medianFairValue}` : 'N/A'}</div>
                            <div style={{ fontSize: '10px', color: '#78350F', marginTop: '2px' }}>{hmMedian}x multiple</div>
                          </div>
                          <div style={{ padding: '10px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>5Y High Band</div>
                            <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, color: '#166534', marginTop: '2px' }}>{hmOutput.highFairValue > 0 ? `₹${hmOutput.highFairValue}` : 'N/A'}</div>
                            <div style={{ fontSize: '10px', color: '#14532D', marginTop: '2px' }}>{hmHigh}x multiple</div>
                          </div>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#6B7280' }}>Evaluation Metric</span>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginTop: '2px' }}>
                            {hmMetric} applied to {hmMetric === 'P/E' ? `EPS ₹${hmMetricValue}` : `EBITDA ₹${hmMetricValue} Cr`}
                          </div>
                        </div>
                      </div>
                    )}
                  </>)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )}

        {/* ── Tab: Master Tracker (PRD §0.1 & Screenshot media_1788803353114.png) ── */}
        {activeTab === 'master-tracker' && (
          <MasterTrackerTab
            liveStocks={masterTrackerData?.stocks}
            isLoading={isRefreshingFeeds && !masterTrackerData}
            lastUpdated={masterTrackerData?.lastUpdated}
            onRefresh={fetchLiveFeeds}
            onSelectValuation={handleSelectValuationForSymbol}
            onOpenPulse={openEarningsPulse}
          />
        )}

        {/* ── Tab: Bank / NBFC Dashboard (Screenshot media_1788803349596.png) ── */}
        {activeTab === 'bank-nbfc' && (
          <BankNbfcTab
            liveData={bankNbfcData || undefined}
            isLoading={isRefreshingFeeds && !(bankNbfcData?.banks?.length || bankNbfcData?.costOfFunds?.length)}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab: Order Tracker Dashboard (Screenshots media_1788803235245.png & 410.png) ── */}
        {activeTab === 'orders' && (
          <OrderTrackerTab
            liveOrders={orderTrackerData?.orders}
            liveConsolidated={orderTrackerData?.consolidated}
            isLoading={isRefreshingFeeds && !orderTrackerData}
            lastUpdated={orderTrackerData?.lastUpdated}
            onRefresh={fetchLiveFeeds}
          />
        )}

        {/* ── Tab 2: Buyback Research (PRD Section 18) ─────────────── */}
        {activeTab === 'buybacks' && (
          <div>
            {/* 1. PRD Section 18: Buyback Arbitrage Calculator */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              {/* Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: showBuybackCalculator ? '16px' : '0', borderBottom: showBuybackCalculator ? '1px solid #E8E4DC' : 'none', paddingBottom: showBuybackCalculator ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calculator size={16} color="#0F766E" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Buyback Arbitrage Calculator
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          background: bbInvestment > 200000 ? '#FFFBEB' : '#ECFDF5',
                          color: bbInvestment > 200000 ? '#B45309' : '#065F46',
                          border: bbInvestment > 200000 ? '1px solid #FDE68A' : '1px solid #A7F3D0',
                          padding: '1px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {bbInvestment > 200000 ? 'HNI Category (> ₹2L)' : 'Retail Quota (Up to ₹2L)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                      Model potential returns and acceptance scenarios for tender offer buybacks.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowBuybackCalculator(!showBuybackCalculator)}
                    className="tf-section-toggle-btn"
                    title={showBuybackCalculator ? 'Collapse calculator' : 'Expand calculator'}
                  >
                    {showBuybackCalculator ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    <span>{showBuybackCalculator ? 'Hide Calculator' : 'Open Calculator'}</span>
                  </button>

                  {showBuybackCalculator && (
                    <button
                      type="button"
                      onClick={() => {
                        setBbInvestment(100000);
                        setBbCmp(500);
                        setBbOfferPrice(600);
                        setBbAcceptanceRatio(25);
                      }}
                      className="btn btn-outline"
                      style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Reset calculator inputs to base scenario"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {!showBuybackCalculator ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748B' }}>Current Scenario:</span>
                    <span>Capital <strong>₹{bbInvestment.toLocaleString('en-IN')}</strong> · CMP: <strong>₹{bbCmp}</strong> · Offer: <strong>₹{bbOfferPrice}</strong> {buybackCalcResult.premiumPct !== null ? `(${buybackCalcResult.premiumPct >= 0 ? '+' : ''}${buybackCalcResult.premiumPct.toFixed(1)}% premium)` : ''} · Net Profit: <strong style={{ color: buybackCalcResult.expectedProfit >= 0 ? '#166534' : '#991B1B' }}>₹{Math.round(buybackCalcResult.expectedProfit).toLocaleString('en-IN')} ({buybackCalcResult.expectedReturnPct >= 0 ? '+' : ''}{buybackCalcResult.expectedReturnPct.toFixed(1)}%)</strong></span>
                  </div>
                  <span style={{ color: '#0F766E', fontSize: '11.5px', fontWeight: 600 }}>Click 'Open Calculator' to tweak capital & acceptance</span>
                </div>
              ) : (
                /* 2-Column Responsive Split */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                  {/* Left Column: Form Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Total Investment */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                          Total Capital Investment
                        </label>
                        <span style={{ fontSize: '11px', color: bbInvestment > 200000 ? '#B45309' : '#6B7280', fontWeight: bbInvestment > 200000 ? 600 : 400 }}>
                          {bbInvestment > 200000 ? 'Above retail limit' : 'Retail quota: Up to ₹2,00,000'}
                        </span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>₹</span>
                        <input
                          type="number"
                          value={bbInvestment}
                          onChange={(e) => setBbInvestment(Number(e.target.value))}
                          step={10000}
                          min={0}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 26px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        />
                      </div>
                      {/* Preset Chips */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        {[50000, 100000, 195000, 200000, 500000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setBbInvestment(amt)}
                            style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: bbInvestment === amt ? '1px solid #0F766E' : '1px solid #E5E7EB',
                              background: bbInvestment === amt ? '#F0FDFA' : '#FFFFFF',
                              color: bbInvestment === amt ? '#0F766E' : '#4B5563',
                              fontWeight: bbInvestment === amt ? 600 : 400,
                              cursor: 'pointer',
                            }}
                          >
                            ₹{(amt / 1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>
                    </div>


                  {/* CMP and Offer Price */}
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                          CMP (Market ₹)
                        </label>
                        <input
                          type="number"
                          value={bbCmp}
                          onChange={(e) => setBbCmp(Number(e.target.value))}
                          step="5"
                          min="1"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                          Buyback Price (₹)
                        </label>
                        <input
                          type="number"
                          value={bbOfferPrice}
                          onChange={(e) => setBbOfferPrice(Number(e.target.value))}
                          step="5"
                          min="1"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}
                        />
                      </div>
                    </div>

                    {/* Live Tender Premium Feedback Tag */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#64748B' }}>Tender Premium over CMP:</span>
                      {buybackCalcResult.premiumPct !== null ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: buybackCalcResult.premiumPct > 0 ? '#065F46' : '#991B1B',
                            background: buybackCalcResult.premiumPct > 0 ? '#ECFDF5' : '#FEF2F2',
                            border: `1px solid ${buybackCalcResult.premiumPct > 0 ? '#A7F3D0' : '#FECACA'}`,
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {buybackCalcResult.premiumPct > 0 ? '+' : ''}{buybackCalcResult.premiumPct.toFixed(2)}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Acceptance Ratio Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                        Expected Acceptance Ratio
                      </label>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#0F766E',
                          background: '#F0FDFA',
                          border: '1px solid #CCFBF1',
                          padding: '1px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {bbAcceptanceRatio}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={bbAcceptanceRatio}
                      onChange={(e) => setBbAcceptanceRatio(Number(e.target.value))}
                      className="tf-range-slider"
                      aria-label="Expected Acceptance Ratio"
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {[10, 25, 50, 100].map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setBbAcceptanceRatio(ratio)}
                          style={{
                            flex: 1,
                            padding: '3px 4px',
                            borderRadius: '4px',
                            border: bbAcceptanceRatio === ratio ? '1px solid #0F766E' : '1px solid #E2E8F0',
                            background: bbAcceptanceRatio === ratio ? '#F0FDFA' : '#F8FAFC',
                            color: bbAcceptanceRatio === ratio ? '#0F766E' : '#475569',
                            fontSize: '11px',
                            fontWeight: bbAcceptanceRatio === ratio ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {ratio}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Hero Result + Detailed Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Hero Outcome Card */}
                  <div
                    style={{
                      background: buybackCalcResult.expectedProfit >= 0
                        ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 100%)'
                        : 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                      border: `1.5px solid ${buybackCalcResult.expectedProfit >= 0 ? '#A7F3D0' : '#FECACA'}`,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: buybackCalcResult.expectedProfit >= 0 ? '#047857' : '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Expected Net Profit
                        </span>
                        <div style={{ fontSize: 'clamp(24px, 3.2vw, 30px)', fontWeight: 800, color: buybackCalcResult.expectedProfit >= 0 ? '#065F46' : '#991B1B', fontFamily: 'var(--font-display)', lineHeight: 1.15, marginTop: '2px' }}>
                          ₹{Math.round(buybackCalcResult.expectedProfit).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: buybackCalcResult.expectedReturnPct >= 0 ? '#047857' : '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Return on Capital
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '15px',
                            fontWeight: 800,
                            color: buybackCalcResult.expectedReturnPct >= 0 ? '#065F46' : '#991B1B',
                            background: buybackCalcResult.expectedReturnPct >= 0 ? '#D1FAE5' : '#FEE2E2',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            marginTop: '3px',
                          }}
                        >
                          {buybackCalcResult.expectedReturnPct >= 0 ? '+' : ''}{buybackCalcResult.expectedReturnPct.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Quick Summary Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${buybackCalcResult.expectedProfit >= 0 ? 'rgba(167, 243, 208, 0.7)' : 'rgba(254, 202, 202, 0.7)'}`, fontSize: '11.5px', color: '#475569' }}>
                      <span>
                        Accepted: <strong style={{ color: '#0F172A' }}>{buybackCalcResult.acceptedShares.toLocaleString('en-IN')}</strong> of {buybackCalcResult.eligibleShares.toLocaleString('en-IN')} shares
                      </span>
                      <span>
                        Total Proceeds: <strong style={{ color: '#0F172A' }}>₹{Math.round(buybackCalcResult.expectedProceeds).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Mobile Progressive Disclosure Toggle */}
                  <div className="tf-mobile-only" style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowBbDetails(!showBbDetails)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#0F766E',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{showBbDetails ? 'Hide Detailed Breakdown' : 'View Detailed Breakdown'}</span>
                      {showBbDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Detailed 4 Metric Cards (Always visible on Desktop, Expandable on Mobile) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                    className={!showBbDetails ? 'tf-desktop-only' : ''}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Eligible Shares</div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                          {buybackCalcResult.eligibleShares.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F0FDFA', border: '1px solid #CCFBF1' }}>
                        <div style={{ fontSize: '10.5px', color: '#0F766E', fontWeight: 600, textTransform: 'uppercase' }}>Accepted Shares</div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F766E', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                          {buybackCalcResult.acceptedShares.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Tender Premium</div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: buybackCalcResult.premiumPct && buybackCalcResult.premiumPct > 0 ? '#16A34A' : '#0F172A', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                          {buybackCalcResult.premiumPct !== null ? `${buybackCalcResult.premiumPct > 0 ? '+' : ''}${buybackCalcResult.premiumPct.toFixed(2)}%` : '-'}
                        </div>
                      </div>

                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Expected Proceeds</div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                          ₹{Math.round(buybackCalcResult.expectedProceeds).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Retail Quota Information Callout */}
                    <div style={{ padding: '8px 12px', background: bbInvestment > 200000 ? '#FFFBEB' : '#F8FAFC', border: bbInvestment > 200000 ? '1px solid #FDE68A' : '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                      <strong style={{ color: '#1E293B' }}>Retail quota rule:</strong>{' '}
                      {bbInvestment > 200000 ? (
                        <span style={{ color: '#B45309', fontWeight: 600 }}>Not applicable: capital exceeds ₹2L small-shareholder limit.</span>
                      ) : (
                        'Eligible for 15% priority retail reservation.'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* 2. PRD Section 18: Buyback Announcements Table */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Active Buybacks
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      background: (buybacksData.totalBuybacks || 0) > 0 ? '#ECFDF5' : '#F1F5F9',
                      color: (buybacksData.totalBuybacks || 0) > 0 ? '#065F46' : '#475569',
                      border: (buybacksData.totalBuybacks || 0) > 0 ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                      padding: '1px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {(buybacksData.totalBuybacks || 0)} Active
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                  Tender offers &amp; open-market repurchases
                </span>
              </div>

              {buybacksData.buybacks && buybacksData.buybacks.length > 0 ? (() => {
                const filteredBuybacks = (buybacksData.buybacks || []).filter((b) => {
                  if (activeBuybackMethod !== 'All') {
                    const m = (b.method || '').toLowerCase();
                    if (activeBuybackMethod === 'Tender Offer' && !m.includes('tender')) return false;
                    if (activeBuybackMethod === 'Open Market' && !m.includes('market') && !m.includes('open')) return false;
                  }
                  if (activeBuybackSearch.trim()) {
                    const q = activeBuybackSearch.trim().toLowerCase();
                    const matchCompany = (b.company || '').toLowerCase().includes(q);
                    const matchSymbol = (b.symbol || '').toLowerCase().includes(q);
                    if (!matchCompany && !matchSymbol) return false;
                  }
                  return true;
                });

                const sortedBuybacks = [...filteredBuybacks].sort((a, b) => {
                  let cmp = 0;
                  switch (bbSortCol) {
                    case 'company':
                      cmp = a.company.localeCompare(b.company);
                      break;
                    case 'method':
                      cmp = (a.method || '').localeCompare(b.method || '');
                      break;
                    case 'offerPrice':
                      cmp = (a.buybackPrice || 0) - (b.buybackPrice || 0);
                      break;
                    case 'cmp':
                      cmp = (a.currentPrice || 0) - (b.currentPrice || 0);
                      break;
                    case 'premium':
                      cmp = (a.premiumPct || 0) - (b.premiumPct || 0);
                      break;
                    case 'recordDate':
                      cmp = new Date(a.recordDate || '').getTime() - new Date(b.recordDate || '').getTime();
                      break;
                  }
                  return bbSortDir === 'asc' ? cmp : -cmp;
                });

                return (
                  <>
                    {/* Active Buybacks Filter Toolbar */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
                          <input
                            type="text"
                            value={activeBuybackSearch}
                            onChange={(e) => setActiveBuybackSearch(e.target.value)}
                            placeholder="Search company or symbol..."
                            style={{
                              padding: '5px 26px 5px 28px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '12px',
                              background: '#FFFFFF',
                              color: '#0F172A',
                              width: '200px',
                            }}
                          />
                          {activeBuybackSearch && (
                            <button
                              type="button"
                              onClick={() => setActiveBuybackSearch('')}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94A3B8',
                                fontSize: '13px',
                                lineHeight: 1,
                                padding: '2px',
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Method Filter Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', padding: '2px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                          {(['All', 'Tender Offer', 'Open Market'] as const).map((method) => {
                            const isSelected = activeBuybackMethod === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setActiveBuybackMethod(method)}
                                style={{
                                  padding: '3px 9px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: isSelected ? '#0F766E' : 'transparent',
                                  color: isSelected ? '#FFFFFF' : '#475569',
                                  fontSize: '11px',
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>

                        {/* Reset Button */}
                        {(activeBuybackSearch.trim() !== '' || activeBuybackMethod !== 'All') && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBuybackSearch('');
                              setActiveBuybackMethod('All');
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Count Badge */}
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                        Showing <strong style={{ color: '#0F172A' }}>{sortedBuybacks.length}</strong> of {(buybacksData.buybacks || []).length} buybacks
                      </span>
                    </div>

                    {/* Mobile Screen Cards for Buybacks (< 768px) */}
                    <div className="tf-mobile-only">
                      {sortedBuybacks.map((b, idx) => (
                        <div
                          key={b.id || idx}
                          className="card"
                          style={{
                            padding: '14px',
                            background: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0F172A' }}>{b.company}</strong>
                              <span style={{ marginLeft: '6px', fontSize: '11px', color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                                {b.symbol}
                              </span>
                            </div>
                            <span className="badge-muted" style={{ fontSize: '11px', background: '#F3F4F6', color: '#374151' }}>
                              {b.method}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              background: '#F8FAFC',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Offer Price</div>
                              <strong style={{ color: '#0F172A', fontSize: '13.5px' }}>
                                {b.buybackPrice ? `₹${b.buybackPrice.toLocaleString('en-IN')}` : 'Not specified'}
                              </strong>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>CMP</div>
                              <span style={{ color: '#4B5563', fontWeight: 600 }}>
                                {b.currentPrice ? `₹${b.currentPrice.toLocaleString('en-IN')}` : '-'}
                              </span>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Premium %</div>
                              {b.premiumPct !== null ? (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: b.premiumPct > 0 ? '#ECFDF5' : '#FEF2F2',
                                    color: b.premiumPct > 0 ? '#065F46' : '#991B1B',
                                  }}
                                >
                                  {b.premiumPct > 0 ? '+' : ''}{b.premiumPct.toFixed(2)}%
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>-</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                            <span>Record: <strong>{b.recordDate || 'Pending'}</strong></span>
                            <span>Window: {b.openingDate && b.closingDate ? `${b.openingDate} to ${b.closingDate}` : 'Not announced'}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>{b.promoterParticipation}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (b.buybackPrice) setBbOfferPrice(b.buybackPrice);
                                if (b.currentPrice) setBbCmp(b.currentPrice);
                              }}
                              className="btn btn-outline"
                              style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }}
                            >
                              Load in Calc
                            </button>
                          </div>
                        </div>
                      ))}
                      {sortedBuybacks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '12px' }}>
                          No buybacks match the current filter or search criteria.
                        </div>
                      )}
                    </div>

                    {/* Desktop View (≥ 768px): Polished Table with Sorting */}
                    <div className="tf-desktop-only table-scroll-container" style={{ border: 'none' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #E8E4DC', color: '#6B7280', fontSize: '11px' }}>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'company') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('company'); setBbSortDir('asc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'company' ? '#0F766E' : '#6B7280' }}
                            >
                              Company
                              {renderSortIcon(bbSortCol, 'company', bbSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'method') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('method'); setBbSortDir('asc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'method' ? '#0F766E' : '#6B7280' }}
                            >
                              Method
                              {renderSortIcon(bbSortCol, 'method', bbSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'offerPrice') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('offerPrice'); setBbSortDir('desc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'offerPrice' ? '#0F766E' : '#6B7280' }}
                            >
                              Offer Price
                              {renderSortIcon(bbSortCol, 'offerPrice', bbSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'cmp') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('cmp'); setBbSortDir('desc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'cmp' ? '#0F766E' : '#6B7280' }}
                            >
                              CMP
                              {renderSortIcon(bbSortCol, 'cmp', bbSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'premium') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('premium'); setBbSortDir('desc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'premium' ? '#0F766E' : '#6B7280' }}
                            >
                              Premium %
                              {renderSortIcon(bbSortCol, 'premium', bbSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (bbSortCol === 'recordDate') setBbSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setBbSortCol('recordDate'); setBbSortDir('desc'); }
                              }}
                              style={{ padding: '8px', color: bbSortCol === 'recordDate' ? '#0F766E' : '#6B7280' }}
                            >
                              Record Date
                              {renderSortIcon(bbSortCol, 'recordDate', bbSortDir)}
                            </th>
                            <th style={{ padding: '8px' }}>Tender Window</th>
                            <th style={{ padding: '8px' }}>Promoter Participation</th>
                            <th style={{ padding: '8px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBuybacks.map((b, idx) => (
                            <tr key={b.id || idx} style={{ borderBottom: '1px solid #F4F1EA' }}>
                              <td style={{ padding: '12px 8px' }}>
                                <strong style={{ color: '#111827' }}>{b.company}</strong>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>{b.symbol}</div>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <span className="badge-muted" style={{ fontSize: '11px', background: '#F3F4F6', color: '#374151' }}>
                                  {b.method}
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827' }}>
                                {b.buybackPrice ? `₹${b.buybackPrice.toLocaleString('en-IN')}` : 'Not specified'}
                              </td>
                              <td style={{ padding: '12px 8px', color: '#4B5563' }}>
                                {b.currentPrice ? `₹${b.currentPrice.toLocaleString('en-IN')}` : ''}
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                {b.premiumPct !== null ? (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: b.premiumPct > 0 ? '#ECFDF5' : '#FEF2F2',
                                    color: b.premiumPct > 0 ? '#065F46' : '#991B1B',
                                  }}>
                                    {b.premiumPct > 0 ? '+' : ''}{b.premiumPct.toFixed(2)}%
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '12px', color: '#4B5563' }}>
                                {b.recordDate || ''}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '11px', color: '#4B5563' }}>
                                {b.openingDate && b.closingDate ? `${b.openingDate} to ${b.closingDate}` : 'Not announced'}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '11px', color: '#6B7280' }}>
                                {b.promoterParticipation}
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (b.buybackPrice) setBbOfferPrice(b.buybackPrice);
                                    if (b.currentPrice) setBbCmp(b.currentPrice);
                                  }}
                                  className="btn btn-outline"
                                  style={{ minHeight: '28px', padding: '2px 8px', fontSize: '11px' }}
                                >
                                  Load in Calc
                                </button>
                              </td>
                            </tr>
                          ))}
                          {sortedBuybacks.length === 0 && (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '12.5px' }}>
                                No buybacks match the current filter or search criteria.
                                <div style={{ marginTop: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveBuybackSearch('');
                                      setActiveBuybackMethod('All');
                                    }}
                                    className="btn btn-outline"
                                    style={{ padding: '3px 10px', fontSize: '11px' }}
                                  >
                                    Clear Filters
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })() : (
                /* Compact Sleek Empty Banner (replaces bloated 250px dashed container) */
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldCheck size={16} color="#0F766E" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>No Active Tender Offers</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 }}>
                        There are currently no open buyback tender offers. Monitored each trading cycle.
                      </p>
                    </div>
                  </div>
                  <a
                    href="#corporate-actions-section"
                    style={{
                      fontSize: '11.5px',
                      color: '#0F766E',
                      fontWeight: 600,
                      background: '#FFFFFF',
                      border: '1px solid #CCFBF1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span>View {buybacksData.actions.length} Corporate Actions</span>
                    <span>↓</span>
                  </a>
                </div>
              )}
            </div>

            {/* 3. Broader Corporate Actions Register (Full Width) */}
            <div id="corporate-actions-section" className="card" style={{ marginBottom: 'var(--space-6)' }}>
              {/* Header Title */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Corporate Actions
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    Dividends, splits, bonus issues &amp; restructuring · {buybacksData.actions.length} announcements
                  </span>
                </div>
              </div>

              {/* Action Category Precomputations */}
              {(() => {
                const actions = buybacksData.actions || [];
                let div = 0, bon = 0, spl = 0, dem = 0, oth = 0;
                for (const a of actions) {
                  const s = (a.actionSubject || '').toLowerCase();
                  if (s.includes('dividend')) div++;
                  else if (s.includes('bonus')) bon++;
                  else if (s.includes('split') || s.includes('sub-division')) spl++;
                  else if (s.includes('demerger') || s.includes('amalgamation')) dem++;
                  else oth++;
                }
                const actionCounts = { All: actions.length, Dividend: div, Bonus: bon, Split: spl, Demerger: dem, Other: oth };

                const filteredActions = actions.filter((a) => {
                  if (corporateActionTypeFilter !== 'All') {
                    const sub = (a.actionSubject || '').toLowerCase();
                    if (corporateActionTypeFilter === 'Dividend' && !sub.includes('dividend')) return false;
                    if (corporateActionTypeFilter === 'Bonus' && !sub.includes('bonus')) return false;
                    if (corporateActionTypeFilter === 'Split' && !sub.includes('split') && !sub.includes('sub-division')) return false;
                    if (corporateActionTypeFilter === 'Demerger' && !sub.includes('demerger') && !sub.includes('amalgamation')) return false;
                    if (
                      corporateActionTypeFilter === 'Other' &&
                      (sub.includes('dividend') || sub.includes('bonus') || sub.includes('split') || sub.includes('sub-division') || sub.includes('demerger'))
                    ) {
                      return false;
                    }
                  }
                  const q = buybacksSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    a.company?.toLowerCase().includes(q) ||
                    a.symbol?.toLowerCase().includes(q) ||
                    a.actionSubject?.toLowerCase().includes(q)
                  );
                });

                const sortedActions = [...filteredActions].sort((a, b) => {
                  let cmp = 0;
                  switch (corpActionSortCol) {
                    case 'company':
                      cmp = (a.company || '').localeCompare(b.company || '');
                      break;
                    case 'purpose':
                      cmp = (a.actionSubject || '').localeCompare(b.actionSubject || '');
                      break;
                    case 'exDate':
                      cmp = new Date(a.exDate || '').getTime() - new Date(b.exDate || '').getTime();
                      break;
                    case 'recordDate':
                      cmp = new Date(a.recordDate || '').getTime() - new Date(b.recordDate || '').getTime();
                      break;
                    case 'faceVal':
                      cmp = (parseFloat(String(a.faceVal || '0')) || 0) - (parseFloat(String(b.faceVal || '0')) || 0);
                      break;
                    case 'series':
                      cmp = (a.series || '').localeCompare(b.series || '');
                      break;
                    case 'status':
                      cmp = ((a as any).status || 'Active').localeCompare((b as any).status || 'Active');
                      break;
                  }
                  return corpActionSortDir === 'asc' ? cmp : -cmp;
                });

                const caPerPage = 12;
                const caTotalPages = Math.max(1, Math.ceil(sortedActions.length / caPerPage));
                const caCurrentPage = Math.min(corporateActionsPage, caTotalPages);
                const paginatedActions = sortedActions.slice((caCurrentPage - 1) * caPerPage, caCurrentPage * caPerPage);

                return (
                  <>
                    {/* Modern Filter Toolbar: Search + Expandable Category Pills */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 200px)' }}>
                          <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            value={buybacksSearch}
                            onChange={(e) => {
                              setBuybacksSearch(e.target.value);
                              setCorporateActionsPage(1);
                            }}
                            placeholder="Search company, symbol, action..."
                            style={{ width: '100%', padding: '6px 28px 6px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px', background: '#FFFFFF' }}
                          />
                          {buybacksSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setBuybacksSearch('');
                                setCorporateActionsPage(1);
                              }}
                              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF' }}
                              aria-label="Clear search"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {/* Actions: Filter Toggle & Reset */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setShowCaFilters(!showCaFilters)}
                            className="tf-section-toggle-btn"
                            style={{
                              background: corporateActionTypeFilter !== 'All' ? '#F0FDFA' : '#FFFFFF',
                              borderColor: corporateActionTypeFilter !== 'All' ? '#0F766E' : '#D1D5DB',
                              color: corporateActionTypeFilter !== 'All' ? '#0F766E' : '#374151',
                            }}
                          >
                            <SlidersHorizontal size={12} />
                            <span>Categories</span>
                            {showCaFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>

                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {buybacksSearch || corporateActionTypeFilter !== 'All' ? (
                              <span style={{ color: '#0F766E' }}>{filteredActions.length} of {actions.length}</span>
                            ) : (
                              `${actions.length} items`
                            )}
                          </span>

                          {(buybacksSearch || corporateActionTypeFilter !== 'All') && (
                            <button
                              type="button"
                              onClick={() => {
                                setBuybacksSearch('');
                                setCorporateActionTypeFilter('All');
                                setCorporateActionsPage(1);
                              }}
                              className="btn btn-outline"
                              style={{ minHeight: '28px', height: '28px', padding: '0 8px', fontSize: '11px', gap: '4px' }}
                              title="Reset all filters"
                            >
                              <RotateCcw size={11} />
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable 1-Tap Category Pills */}
                      {showCaFilters && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', padding: '2px 0' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>Type:</span>
                          {[
                            { id: 'All', label: 'All', count: actionCounts.All },
                            { id: 'Dividend', label: 'Dividend', count: actionCounts.Dividend },
                            { id: 'Bonus', label: 'Bonus', count: actionCounts.Bonus },
                            { id: 'Split', label: 'Split', count: actionCounts.Split },
                            { id: 'Demerger', label: 'Demerger', count: actionCounts.Demerger },
                          ].map((cat) => {
                            const isSelected = corporateActionTypeFilter === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setCorporateActionTypeFilter(cat.id);
                                  setCorporateActionsPage(1);
                                }}
                                className={`tf-filter-pill ${isSelected ? 'tf-filter-pill-active' : ''}`}
                              >
                                <span>{cat.label}</span>
                                <span className="tf-filter-pill-badge">{cat.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Mobile View (< 768px): Touch Cards with Progressive Disclosure */}
                    <div className="tf-mobile-only">
                      {/* Mobile Sort Strip */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          marginBottom: '10px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#475569' }}>Sort:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={corpActionSortCol}
                            onChange={(e) => {
                              setCorpActionSortCol(e.target.value);
                              setCorporateActionsPage(1);
                            }}
                            style={{ height: '32px', padding: '0 26px 0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11.5px', background: '#FFFFFF', color: '#0F172A', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="exDate">Ex-Date</option>
                            <option value="recordDate">Record Date</option>
                            <option value="company">Company</option>
                            <option value="purpose">Action Type</option>
                            <option value="faceVal">Face Value</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                            style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 650, color: '#0F766E', cursor: 'pointer' }}
                          >
                            <ArrowUpDown size={12} />
                            <span>{corpActionSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                          </button>
                        </div>
                      </div>

                      {paginatedActions.map((a, i) => {
                        const key = `action-${a.symbol}-${i}`;
                        const isExpanded = expandedActionKey === key;
                        const sub = (a.actionSubject || '').toLowerCase();
                        let badgeColor = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
                        let actionLabel = 'Corporate Action';
                        if (sub.includes('dividend')) {
                          badgeColor = { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
                          actionLabel = 'Dividend';
                        } else if (sub.includes('bonus')) {
                          badgeColor = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
                          actionLabel = 'Bonus';
                        } else if (sub.includes('split') || sub.includes('sub-division')) {
                          badgeColor = { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
                          actionLabel = 'Split';
                        } else if (sub.includes('demerger') || sub.includes('amalgamation')) {
                          badgeColor = { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
                          actionLabel = 'Demerger';
                        }

                        return (
                          <div
                            key={key}
                            className="tf-mobile-card"
                            onClick={() => setExpandedActionKey(isExpanded ? null : key)}
                          >
                            <div className="tf-mobile-card-header">
                              <div>
                                <div className="tf-mobile-card-title">{a.company}</div>
                                <div className="tf-mobile-card-meta">
                                  <span className="badge-muted" style={{ fontSize: '10.5px', padding: '1px 6px', background: '#F1F5F9', color: '#475569' }}>
                                    {a.symbol}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                                    Series: {a.series || 'EQ'}
                                  </span>
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: badgeColor.bg,
                                  color: badgeColor.text,
                                  border: `1px solid ${badgeColor.border}`,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {actionLabel}
                              </span>
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>
                              {a.actionSubject}
                            </div>

                            {/* Key Dates Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Calendar size={10} style={{ color: '#0F766E' }} />
                                  <span>Ex-Date</span>
                                </div>
                                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginTop: '1px', fontFamily: 'monospace' }}>
                                  {a.exDate || '-'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Calendar size={10} style={{ color: '#64748B' }} />
                                  <span>Record Date</span>
                                </div>
                                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginTop: '1px', fontFamily: 'monospace' }}>
                                  {a.recordDate || '-'}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer with Details Toggle */}
                            <div className="tf-mobile-card-footer">
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                {a.faceVal ? `Face Value: ₹${a.faceVal}` : 'Corporate Action'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedActionKey(isExpanded ? null : key);
                                }}
                                className="tf-expand-toggle-btn"
                              >
                                {isExpanded ? <>Hide <ChevronUp size={11} /></> : <>Details <ChevronDown size={11} /></>}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="tf-details-drawer" onClick={(e) => e.stopPropagation()}>
                                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Corporate Action Details</div>
                                <div style={{ color: '#334155', lineHeight: 1.45 }}>
                                  {a.actionSubject}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0', fontSize: '10.5px', color: '#64748B' }}>
                                  <div><strong>Series:</strong> {a.series || 'EQ'}</div>
                                  <div><strong>Face Value:</strong> ₹{a.faceVal || '-'}</div>
                                  <div><strong>Ex-Date:</strong> {a.exDate}</div>
                                  <div><strong>Record Date:</strong> {a.recordDate || '-'}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {sortedActions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                          No corporate actions found matching &quot;{buybacksSearch}&quot;
                        </div>
                      )}
                    </div>

                    {/* Desktop View (≥ 768px): Polished Tabular Grid with Sticky Header */}
                    <div className="tf-desktop-only">
                      <div className="table-scroll-container" style={{ border: 'none' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }} className="tf-table-sticky-header">
                          <thead>
                            <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC' }}>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'company') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('company'); setCorpActionSortDir('asc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '220px', color: corpActionSortCol === 'company' ? '#0F766E' : '#475569' }}
                              >
                                Company
                                {renderSortIcon(corpActionSortCol, 'company', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'purpose') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('purpose'); setCorpActionSortDir('asc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '240px', color: corpActionSortCol === 'purpose' ? '#0F766E' : '#475569' }}
                              >
                                Action Type / Purpose
                                {renderSortIcon(corpActionSortCol, 'purpose', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'exDate') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('exDate'); setCorpActionSortDir('desc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '110px', color: corpActionSortCol === 'exDate' ? '#0F766E' : '#475569' }}
                              >
                                Ex-Date
                                {renderSortIcon(corpActionSortCol, 'exDate', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'recordDate') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('recordDate'); setCorpActionSortDir('desc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '110px', color: corpActionSortCol === 'recordDate' ? '#0F766E' : '#475569' }}
                              >
                                Record Date
                                {renderSortIcon(corpActionSortCol, 'recordDate', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'faceVal') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('faceVal'); setCorpActionSortDir('desc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '80px', textAlign: 'center', color: corpActionSortCol === 'faceVal' ? '#0F766E' : '#475569' }}
                              >
                                Face Value
                                {renderSortIcon(corpActionSortCol, 'faceVal', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'series') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('series'); setCorpActionSortDir('asc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '70px', textAlign: 'center', color: corpActionSortCol === 'series' ? '#0F766E' : '#475569' }}
                              >
                                Series
                                {renderSortIcon(corpActionSortCol, 'series', corpActionSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (corpActionSortCol === 'status') setCorpActionSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setCorpActionSortCol('status'); setCorpActionSortDir('asc'); }
                                }}
                                style={{ padding: '10px 12px', minWidth: '90px', textAlign: 'right', color: corpActionSortCol === 'status' ? '#0F766E' : '#475569' }}
                              >
                                Status
                                {renderSortIcon(corpActionSortCol, 'status', corpActionSortDir)}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedActions.map((a, i) => {
                              const sub = (a.actionSubject || '').toLowerCase();
                              let badgeColor = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
                              let actionLabel = 'Corporate Action';
                              if (sub.includes('dividend')) {
                                badgeColor = { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
                                actionLabel = 'Dividend';
                              } else if (sub.includes('bonus')) {
                                badgeColor = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
                                actionLabel = 'Bonus';
                              } else if (sub.includes('split') || sub.includes('sub-division')) {
                                badgeColor = { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
                                actionLabel = 'Split';
                              } else if (sub.includes('demerger') || sub.includes('amalgamation')) {
                                badgeColor = { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
                                actionLabel = 'Demerger';
                              }

                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <td style={{ padding: '12px' }}>
                                    <strong style={{ color: '#0F172A', fontSize: '13.5px' }}>{a.company}</strong>
                                    <div style={{ fontSize: '11px', color: '#64748B', display: 'inline-block', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, marginTop: '2px' }}>
                                      {a.symbol}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px', color: '#334155', maxWidth: '300px' }}>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: '10px',
                                        background: badgeColor.bg,
                                        color: badgeColor.text,
                                        border: `1px solid ${badgeColor.border}`,
                                        marginRight: '6px',
                                        display: 'inline-block',
                                        marginBottom: '2px',
                                      }}
                                    >
                                      {actionLabel}
                                    </span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{a.actionSubject}</span>
                                  </td>
                                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {a.exDate}
                                  </td>
                                  <td style={{ padding: '12px', color: '#475569', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {a.recordDate || '-'}
                                  </td>
                                  <td style={{ padding: '12px', color: '#475569', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center' }}>
                                    {a.faceVal ? `₹${a.faceVal}` : '-'}
                                  </td>
                                  <td style={{ padding: '12px', color: '#64748B', fontSize: '12px', textAlign: 'center' }}>
                                    <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                      {a.series || 'EQ'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <span
                                      style={{
                                        background: '#ECFDF5',
                                        color: '#065F46',
                                        border: '1px solid #A7F3D0',
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        padding: '3px 10px',
                                        borderRadius: '12px',
                                        display: 'inline-block',
                                      }}
                                    >
                                      Active
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredActions.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                                  No corporate actions found matching &quot;{buybacksSearch}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Pagination
                      currentPage={caCurrentPage}
                      totalPages={caTotalPages}
                      totalItems={filteredActions.length}
                      itemsPerPage={caPerPage}
                      onPageChange={setCorporateActionsPage}
                      itemName="announcements"
                    />
                  </>
                );
              })()}
            </div>

            {/* 4. Buyback Note */}
            <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#475569', marginBottom: 'var(--space-6)' }}>
              <Info size={16} color="#0F766E" style={{ flexShrink: 0 }} />
              <div>
                <strong>Arbitrage Note:</strong> Buybacks create value when repurchased below intrinsic fair value. Compare the tender price against our Valuation Lab models before tendering.
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Results Calendar (Screenshot 4 Match) ─────────────── */}
        {activeTab === 'results' && (
          <div>
            {isRefreshingFeeds && resultsData.meetings.length === 0 && (!resultsData.recentResults || resultsData.recentResults.length === 0) ? (
              <TfLoadingState title="Loading Results Calendar…" subtitle="Fetching live exchange and market data for this workspace." variant="panel" rows={4} />
            ) : resultsData.meetings.length === 0 && (!resultsData.recentResults || resultsData.recentResults.length === 0) ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Results Calendar Data Available</h3>
                <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                  No corporate board meetings or disclosed quarterly results were found.
                </p>
                <button
                  type="button"
                  onClick={fetchLiveFeeds}
                  style={{
                    padding: '8px 18px',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry / Reconnect Feed
                </button>
              </div>
            ) : (
            <div className="card tf-results-outer-card">
              {/* Segmented Sub-Tab Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #E5E7EB', paddingBottom: '14px', marginBottom: '16px' }}>
                <div className="tf-subtab-bar">
                  <button
                    type="button"
                    onClick={() => {
                      setResultsSubTab('meetings');
                      setExpandedMeetingKey(null);
                    }}
                    className={`tf-subtab-btn ${resultsSubTab === 'meetings' ? 'tf-subtab-btn-active' : ''}`}
                  >
                    <Calendar size={13} />
                    Upcoming Board Meetings
                    <span className="tf-subtab-count">
                      {resultsData.meetings.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResultsSubTab('reported');
                      setExpandedResultKey(null);
                    }}
                    className={`tf-subtab-btn ${resultsSubTab === 'reported' ? 'tf-subtab-btn-active' : ''}`}
                  >
                    <Briefcase size={13} />
                    Disclosed Results
                    <span className="tf-subtab-count">
                      {resultsData.recentResults?.length || 0}
                    </span>
                  </button>
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0F766E',
                    background: '#F0FDFA',
                    border: '1px solid #CCFBF1',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {resultsSubTab === 'meetings' ? 'Scheduled Board Meetings' : 'Quarterly Earnings Disclosures'}
                </span>
              </div>

              {/* Search & Filter Header with Expand/Hide Toggle */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  {/* Search Box */}
                  <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 'min(100%, 200px)' }}>
                    <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={resultsSearch}
                      onChange={(e) => {
                        setResultsSearch(e.target.value);
                        setMeetingsPage(1);
                        setReportedResultsPage(1);
                      }}
                      placeholder={
                        resultsSubTab === 'meetings'
                          ? 'Search company, symbol, agenda...'
                          : 'Search company, quarter, year...'
                      }
                      style={{ width: '100%', padding: '7px 28px 7px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px', background: '#FFFFFF' }}
                    />
                    {resultsSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setResultsSearch('');
                          setMeetingsPage(1);
                          setReportedResultsPage(1);
                        }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF' }}
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Actions: Filter Toggle & Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setShowResultsFilters(!showResultsFilters)}
                      className="tf-section-toggle-btn"
                      style={{
                        background: (resultsSubTab === 'meetings' ? meetingsPurposeFilter !== 'All' : reportedAuditFilter !== 'All') ? '#F0FDFA' : '#FFFFFF',
                        borderColor: (resultsSubTab === 'meetings' ? meetingsPurposeFilter !== 'All' : reportedAuditFilter !== 'All') ? '#0F766E' : '#D1D5DB',
                        color: (resultsSubTab === 'meetings' ? meetingsPurposeFilter !== 'All' : reportedAuditFilter !== 'All') ? '#0F766E' : '#374151',
                      }}
                    >
                      <SlidersHorizontal size={12} />
                      <span>Filters</span>
                      {showResultsFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>

                    {(resultsSearch || (resultsSubTab === 'meetings' ? meetingsPurposeFilter !== 'All' : reportedAuditFilter !== 'All')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setResultsSearch('');
                          setMeetingsPurposeFilter('All');
                          setReportedAuditFilter('All');
                          setMeetingsPage(1);
                          setReportedResultsPage(1);
                        }}
                        className="btn btn-outline"
                        style={{ minHeight: '30px', height: '30px', padding: '0 8px', fontSize: '11px', gap: '4px' }}
                        title="Reset all filters"
                      >
                        <RotateCcw size={11} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Filter Tray */}
                {showResultsFilters && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      {resultsSubTab === 'meetings' ? 'Agenda:' : 'Reporting Type:'}
                    </span>
                    {resultsSubTab === 'meetings' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'All', label: 'All Agendas' },
                          { id: 'Financial Results', label: 'Financial Results' },
                          { id: 'Dividend', label: 'Dividend' },
                          { id: 'Fund Raising', label: 'Fund Raising' },
                          { id: 'Other', label: 'Other Agendas' },
                        ].map((opt) => {
                          const isSelected = meetingsPurposeFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setMeetingsPurposeFilter(opt.id);
                                setMeetingsPage(1);
                              }}
                              style={{
                                padding: '3px 10px',
                                fontSize: '11px',
                                fontWeight: isSelected ? 700 : 500,
                                borderRadius: '14px',
                                border: isSelected ? '1px solid #0F766E' : '1px solid #CBD5E1',
                                background: isSelected ? '#0F766E' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'All', label: 'All Types' },
                          { id: 'Audited', label: 'Audited' },
                          { id: 'Unaudited', label: 'Unaudited' },
                          { id: 'Consolidated', label: 'Consolidated' },
                          { id: 'Standalone', label: 'Standalone' },
                        ].map((opt) => {
                          const isSelected = reportedAuditFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setReportedAuditFilter(opt.id);
                                setReportedResultsPage(1);
                              }}
                              style={{
                                padding: '3px 10px',
                                fontSize: '11px',
                                fontWeight: isSelected ? 700 : 500,
                                borderRadius: '14px',
                                border: isSelected ? '1px solid #0F766E' : '1px solid #CBD5E1',
                                background: isSelected ? '#0F766E' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* View 1: Upcoming Board Meetings */}
              {resultsSubTab === 'meetings' && (() => {
                const filteredMeetings = resultsData.meetings.filter((r) => {
                  if (meetingsPurposeFilter !== 'All') {
                    const p = `${r.purpose || ''} ${r.details || ''}`.toLowerCase();
                    if (meetingsPurposeFilter === 'Financial Results' && !p.includes('result') && !p.includes('financial')) return false;
                    if (meetingsPurposeFilter === 'Dividend' && !p.includes('dividend')) return false;
                    if (meetingsPurposeFilter === 'Fund Raising' && !p.includes('fund') && !p.includes('raising') && !p.includes('issue') && !p.includes('qip')) return false;
                    if (meetingsPurposeFilter === 'Other' && (p.includes('result') || p.includes('dividend') || p.includes('fund'))) return false;
                  }
                  const q = resultsSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.company?.toLowerCase().includes(q) ||
                    r.symbol?.toLowerCase().includes(q) ||
                    r.purpose?.toLowerCase().includes(q) ||
                    r.details?.toLowerCase().includes(q) ||
                    r.meetingDate?.toLowerCase().includes(q)
                  );
                });

                const sortedMeetings = [...filteredMeetings].sort((a, b) => {
                  let cmp = 0;
                  switch (meetingSortCol) {
                    case 'company':
                      cmp = (a.company || '').localeCompare(b.company || '');
                      break;
                    case 'date':
                      cmp = new Date(a.meetingDate || '').getTime() - new Date(b.meetingDate || '').getTime();
                      break;
                    case 'purpose':
                      cmp = (a.purpose || '').localeCompare(b.purpose || '');
                      break;
                  }
                  return meetingSortDir === 'asc' ? cmp : -cmp;
                });

                const mPerPage = 12;
                const mTotalPages = Math.max(1, Math.ceil(sortedMeetings.length / mPerPage));
                const mCurrentPage = Math.min(meetingsPage, mTotalPages);
                const paginatedMeetings = sortedMeetings.slice((mCurrentPage - 1) * mPerPage, mCurrentPage * mPerPage);

                return (
                  <>
                    {/* Mobile View (< 768px): Touch Cards with Progressive Disclosure */}
                    <div className="tf-mobile-only">
                      {/* Quick Mobile Sort Strip */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          marginBottom: '10px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#475569' }}>Sort:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={meetingSortCol}
                            onChange={(e) => {
                              setMeetingSortCol(e.target.value);
                              setMeetingsPage(1);
                            }}
                            style={{ height: '32px', padding: '0 26px 0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11.5px', background: '#FFFFFF', color: '#0F172A', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="date">Meeting Date</option>
                            <option value="company">Company</option>
                            <option value="purpose">Purpose</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setMeetingSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                            style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 650, color: '#0F766E', cursor: 'pointer' }}
                          >
                            <ArrowUpDown size={12} />
                            <span>{meetingSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                          </button>
                        </div>
                      </div>

                      {paginatedMeetings.map((r, idx) => {
                        const key = `${r.symbol}-${idx}`;
                        const isExpanded = expandedMeetingKey === key;
                        const rel = formatRelativeTime(r.meetingDate);
                        return (
                          <div
                            key={key}
                            className="tf-mobile-card"
                            onClick={() => setExpandedMeetingKey(isExpanded ? null : key)}
                          >
                            <div className="tf-mobile-card-header">
                              <div>
                                <div className="tf-mobile-card-title">{r.company}</div>
                                <div className="tf-mobile-card-meta">
                                  <span className="badge-muted" style={{ fontSize: '10.5px', padding: '1px 6px', background: '#F1F5F9', color: '#475569' }}>
                                    {r.symbol}
                                  </span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0F766E', fontWeight: 600 }}>
                                    <Clock size={11} />
                                    {r.meetingDate}
                                    {rel && !rel.includes('ago') && ` · ${rel}`}
                                  </span>
                                </div>
                              </div>
                              <span className="tf-badge-scheduled">
                                Scheduled
                              </span>
                            </div>

                            <div style={{ marginTop: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                                  {r.purpose || 'Board Meeting'}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedMeetingKey(isExpanded ? null : key);
                                  }}
                                  className="tf-expand-toggle-btn"
                                >
                                  {isExpanded ? (
                                    <>Less <ChevronUp size={12} /></>
                                  ) : (
                                    <>Details <ChevronDown size={12} /></>
                                  )}
                                </button>
                              </div>
                              {!isExpanded && r.details && (
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.details}
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="tf-details-drawer" onClick={(e) => e.stopPropagation()}>
                                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Agenda Disclosure</div>
                                <div style={{ color: '#334155', lineHeight: 1.45 }}>
                                  {r.details || 'Quarterly Financial Results Board Meeting intimation.'}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {sortedMeetings.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                          No board meetings found matching &quot;{resultsSearch}&quot;
                        </div>
                      )}
                    </div>

                    {/* Desktop View (≥ 768px): Clean Bloomberg Table */}
                    <div className="tf-desktop-only">
                      <div className="table-scroll-container" style={{ border: 'none' }}>
                        <table className="tf-table">
                          <thead>
                            <tr>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (meetingSortCol === 'company') setMeetingSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setMeetingSortCol('company'); setMeetingSortDir('asc'); }
                                }}
                                style={{ minWidth: '200px', color: meetingSortCol === 'company' ? '#0F766E' : '#475569' }}
                              >
                                Company &amp; Symbol
                                {renderSortIcon(meetingSortCol, 'company', meetingSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (meetingSortCol === 'date') setMeetingSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setMeetingSortCol('date'); setMeetingSortDir('asc'); }
                                }}
                                style={{ minWidth: '130px', color: meetingSortCol === 'date' ? '#0F766E' : '#475569' }}
                              >
                                Meeting Date
                                {renderSortIcon(meetingSortCol, 'date', meetingSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (meetingSortCol === 'purpose') setMeetingSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setMeetingSortCol('purpose'); setMeetingSortDir('asc'); }
                                }}
                                style={{ minWidth: '280px', color: meetingSortCol === 'purpose' ? '#0F766E' : '#475569' }}
                              >
                                Purpose &amp; Agenda
                                {renderSortIcon(meetingSortCol, 'purpose', meetingSortDir)}
                              </th>
                              <th style={{ minWidth: '100px', textAlign: 'right' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedMeetings.map((r, idx) => {
                              const key = `desk-${r.symbol}-${idx}`;
                              const isExpanded = expandedMeetingKey === key;
                              const rel = formatRelativeTime(r.meetingDate);
                              return (
                                <tr key={key}>
                                  <td>
                                    <strong style={{ color: '#111827' }}>{r.company}</strong>
                                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.symbol}</div>
                                  </td>
                                  <td style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }} title={r.meetingDate}>
                                    <div>{r.meetingDate}</div>
                                    {rel && !rel.includes('ago') && (
                                      <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>{rel}</div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                      <span style={{ color: '#374151', fontSize: '12px', fontWeight: 600 }}>{r.purpose}</span>
                                      {r.details && r.details.length > 40 && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedMeetingKey(isExpanded ? null : key)}
                                          className="tf-expand-toggle-btn"
                                        >
                                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6B7280', maxWidth: isExpanded ? '100%' : '420px', whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                      {r.details || 'Quarterly Financial Results Board Meeting'}
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className="tf-badge-scheduled">
                                      Scheduled
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {sortedMeetings.length === 0 && (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                                  No board meetings found matching &quot;{resultsSearch}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Pagination
                      currentPage={mCurrentPage}
                      totalPages={mTotalPages}
                      totalItems={sortedMeetings.length}
                      itemsPerPage={mPerPage}
                      onPageChange={setMeetingsPage}
                      itemName="board meetings"
                    />
                  </>
                );
              })()}

              {/* View 2: Recently Reported Results */}
              {resultsSubTab === 'reported' && (() => {
                const filteredResults = (resultsData.recentResults || []).filter((r) => {
                  if (reportedAuditFilter !== 'All') {
                    const a = `${r.audited || ''} ${r.consolidated || ''}`.toLowerCase();
                    if (!a.includes(reportedAuditFilter.toLowerCase())) return false;
                  }
                  const q = resultsSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.company?.toLowerCase().includes(q) ||
                    r.symbol?.toLowerCase().includes(q) ||
                    r.quarter?.toLowerCase().includes(q) ||
                    r.financialYear?.toLowerCase().includes(q) ||
                    r.audited?.toLowerCase().includes(q) ||
                    r.consolidated?.toLowerCase().includes(q) ||
                    (r.revenue && r.revenue.toLowerCase().includes(q)) ||
                    (r.pat && r.pat.toLowerCase().includes(q)) ||
                    (r.eps && r.eps.toLowerCase().includes(q))
                  );
                });

                const sortedResults = [...filteredResults].sort((a, b) => {
                  let cmp = 0;
                  switch (resSortCol) {
                    case 'company':
                      cmp = (a.company || '').localeCompare(b.company || '');
                      break;
                    case 'quarter':
                      cmp = (a.quarter || '').localeCompare(b.quarter || '');
                      break;
                    case 'revenue': {
                      const numA = parseFloat(String(a.revenue || '0').replace(/[^0-9.-]/g, '')) || 0;
                      const numB = parseFloat(String(b.revenue || '0').replace(/[^0-9.-]/g, '')) || 0;
                      cmp = numA - numB;
                      break;
                    }
                    case 'pat': {
                      const numA = parseFloat(String(a.pat || '0').replace(/[^0-9.-]/g, '')) || 0;
                      const numB = parseFloat(String(b.pat || '0').replace(/[^0-9.-]/g, '')) || 0;
                      cmp = numA - numB;
                      break;
                    }
                    case 'eps': {
                      const numA = parseFloat(String(a.eps || '0').replace(/[^0-9.-]/g, '')) || 0;
                      const numB = parseFloat(String(b.eps || '0').replace(/[^0-9.-]/g, '')) || 0;
                      cmp = numA - numB;
                      break;
                    }
                    case 'audit':
                      cmp = (a.audited || '').localeCompare(b.audited || '');
                      break;
                  }
                  return resSortDir === 'asc' ? cmp : -cmp;
                });

                const rPerPage = 12;
                const rTotalPages = Math.max(1, Math.ceil(sortedResults.length / rPerPage));
                const rCurrentPage = Math.min(reportedResultsPage, rTotalPages);
                const paginatedResults = sortedResults.slice((rCurrentPage - 1) * rPerPage, rCurrentPage * rPerPage);

                return (
                  <>
                    {/* Mobile View (< 768px): Touch Cards with Financial Metrics Grid */}
                    <div className="tf-mobile-only">
                      {/* Quick Mobile Sort Strip */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          marginBottom: '10px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#475569' }}>Sort:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={resSortCol}
                            onChange={(e) => {
                              setResSortCol(e.target.value);
                              setReportedResultsPage(1);
                            }}
                            style={{ height: '32px', padding: '0 26px 0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11.5px', background: '#FFFFFF', color: '#0F172A', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="quarter">Quarter</option>
                            <option value="company">Company</option>
                            <option value="revenue">Revenue</option>
                            <option value="pat">Net Profit (PAT)</option>
                            <option value="eps">EPS</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                            style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 650, color: '#0F766E', cursor: 'pointer' }}
                          >
                            <ArrowUpDown size={12} />
                            <span>{resSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                          </button>
                        </div>
                      </div>

                      {paginatedResults.map((r, idx) => {
                        const key = `${r.symbol}-${r.quarter}-${idx}`;
                        const isExpanded = expandedResultKey === key;
                        const isAudited = !r.audited?.toLowerCase().includes('un');
                        return (
                          <div
                            key={key}
                            className="tf-mobile-card"
                            onClick={() => setExpandedResultKey(isExpanded ? null : key)}
                          >
                            <div className="tf-mobile-card-header">
                              <div>
                                <div className="tf-mobile-card-title">{r.company}</div>
                                <div className="tf-mobile-card-meta">
                                  <span className="badge-muted" style={{ fontSize: '10.5px', padding: '1px 6px', background: '#F1F5F9', color: '#475569' }}>
                                    {r.symbol}
                                  </span>
                                  <span style={{ fontWeight: 600, color: '#1E293B' }}>
                                    {r.quarter} {r.financialYear}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                                    {r.consolidated}
                                  </span>
                                </div>
                              </div>
                              <span className={isAudited ? 'tf-badge-audited' : 'tf-badge-unaudited'}>
                                {r.audited || 'Audited'}
                              </span>
                            </div>

                            {/* 3-Column Key Financials Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Revenue</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '1px' }}>
                                  {r.revenue ? r.revenue : '-'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Net Profit</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F766E', marginTop: '1px' }}>
                                  {r.pat ? r.pat : '-'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>EPS</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginTop: '1px' }}>
                                  {r.eps ? `₹${r.eps}` : '-'}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer with Direct Filing Link */}
                            <div className="tf-mobile-card-footer">
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                {r.filingDate ? `Date: ${r.filingDate}` : 'Quarterly Financial Report'}
                              </span>
                              {r.xbrlUrl ? (
                                <a
                                  href={r.xbrlUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#0F766E',
                                    textDecoration: 'none',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: '#F0FDFA',
                                    border: '1px solid #CCFBF1',
                                  }}
                                >
                                  View Report <ExternalLink size={10} />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedResultKey(isExpanded ? null : key);
                                  }}
                                  className="tf-expand-toggle-btn"
                                >
                                  {isExpanded ? <>Hide <ChevronUp size={11} /></> : <>Details <ChevronDown size={11} /></>}
                                </button>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="tf-details-drawer" onClick={(e) => e.stopPropagation()}>
                                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Result Details</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                                  <div><strong>Period:</strong> {r.quarter} {r.financialYear}</div>
                                  <div><strong>Statement:</strong> {r.consolidated}</div>
                                  <div><strong>Audit Type:</strong> {r.audited}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {sortedResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                          No reported quarterly results found matching &quot;{resultsSearch}&quot;
                        </div>
                      )}
                    </div>

                    {/* Desktop View (≥ 768px): Full Data Table */}
                    <div className="tf-desktop-only">
                      <div className="table-scroll-container" style={{ border: 'none' }}>
                        <table className="tf-table">
                          <thead>
                            <tr>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'company') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('company'); setResSortDir('asc'); }
                                }}
                                style={{ minWidth: '180px', color: resSortCol === 'company' ? '#0F766E' : '#475569' }}
                              >
                                Company &amp; Symbol
                                {renderSortIcon(resSortCol, 'company', resSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'quarter') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('quarter'); setResSortDir('desc'); }
                                }}
                                style={{ minWidth: '120px', color: resSortCol === 'quarter' ? '#0F766E' : '#475569' }}
                              >
                                Quarter / Period
                                {renderSortIcon(resSortCol, 'quarter', resSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'revenue') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('revenue'); setResSortDir('desc'); }
                                }}
                                style={{ minWidth: '110px', color: resSortCol === 'revenue' ? '#0F766E' : '#475569' }}
                              >
                                Revenue (₹ Cr)
                                {renderSortIcon(resSortCol, 'revenue', resSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'pat') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('pat'); setResSortDir('desc'); }
                                }}
                                style={{ minWidth: '110px', color: resSortCol === 'pat' ? '#0F766E' : '#475569' }}
                              >
                                Net Profit (PAT)
                                {renderSortIcon(resSortCol, 'pat', resSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'eps') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('eps'); setResSortDir('desc'); }
                                }}
                                style={{ minWidth: '90px', color: resSortCol === 'eps' ? '#0F766E' : '#475569' }}
                              >
                                Reported EPS
                                {renderSortIcon(resSortCol, 'eps', resSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (resSortCol === 'audit') setResSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setResSortCol('audit'); setResSortDir('asc'); }
                                }}
                                style={{ minWidth: '100px', color: resSortCol === 'audit' ? '#0F766E' : '#475569' }}
                              >
                                Audit Status
                                {renderSortIcon(resSortCol, 'audit', resSortDir)}
                              </th>
                              <th style={{ minWidth: '100px', textAlign: 'right' }}>Report</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedResults.map((r, idx) => (
                              <tr key={`${r.symbol}-${r.quarter}-${idx}`}>
                                <td>
                                  <strong style={{ color: '#111827' }}>{r.company}</strong>
                                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                    {r.symbol} &bull; {r.consolidated}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px' }}>{r.quarter}</div>
                                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.financialYear}</div>
                                </td>
                                <td style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px' }}>
                                  {r.revenue ? r.revenue : <span style={{ color: '#9CA3AF' }}>-</span>}
                                </td>
                                <td style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px' }}>
                                  {r.pat ? r.pat : <span style={{ color: '#9CA3AF' }}>-</span>}
                                </td>
                                <td style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px' }}>
                                  {r.eps ? r.eps : <span style={{ color: '#9CA3AF' }}>-</span>}
                                </td>
                                <td>
                                  <span className={r.audited?.toLowerCase().includes('un') ? 'tf-badge-unaudited' : 'tf-badge-audited'}>
                                    {r.audited || 'Audited'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                 <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                   <button
                                     type="button"
                                     onClick={() => openPulseByName(r.company, r.symbol)}
                                     style={{
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: '2px',
                                       fontSize: '11px',
                                       fontWeight: 700,
                                       color: '#0F766E',
                                       background: '#F0FDFA',
                                       border: '1px solid #CCFBF1',
                                       padding: '3px 7px',
                                       borderRadius: '4px',
                                       cursor: 'pointer',
                                     }}
                                   >
                                     Pulse
                                   </button>
                                  {r.xbrlUrl ? (
                                    <a
                                      href={r.xbrlUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#0F766E',
                                        textDecoration: 'none',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        background: '#F0FDFA',
                                        border: '1px solid #CCFBF1',
                                      }}
                                    >
                                      View Report <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#6B7280' }} title={r.filingDate}>
                                      {formatRelativeTime(r.filingDate) || r.filingDate || 'Recent'}
                                    </span>
                                  )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {sortedResults.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                                  No reported quarterly results found matching &quot;{resultsSearch}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Pagination
                      currentPage={rCurrentPage}
                      totalPages={rTotalPages}
                      totalItems={sortedResults.length}
                      itemsPerPage={rPerPage}
                      onPageChange={setReportedResultsPage}
                      itemName="disclosed results"
                    />
                  </>
                );
              })()}
            </div>
            )}
          </div>
        )}

        {/* ── Tab 4: News Desk ────────────────────── */}
        {activeTab === 'news' && (() => {
          if (isRefreshingFeeds && (!newsData || newsData.headlines.length === 0)) {
            return (
              <TfLoadingState title="Loading News Desk…" subtitle="Fetching live exchange and market data for this workspace." variant="panel" rows={4} />
            );
          }

          if (!newsData || newsData.headlines.length === 0) {
            return (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No News Announcements Available</h3>
                <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                  No corporate announcements or news headlines were returned from the exchange feeds.
                </p>
                <button
                  type="button"
                  onClick={fetchLiveFeeds}
                  style={{
                    padding: '8px 18px',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry / Reconnect Feed
                </button>
              </div>
            );
          }

          // Precompute category and order details for all headlines
          const enrichedHeadlines = (newsData.headlines || []).map((n) => {
            const detectedCat = classifyNewsCategory(n.title, n.description, n.isOrderWin);
            const isOrder = Boolean(n.isOrderWin || detectedCat === 'Orders');
            const detectedVal = n.orderValue || (isOrder ? extractOrderValueClient(`${n.title} ${n.description}`) : undefined);
            return {
              ...n,
              category: detectedCat,
              isOrderWin: isOrder,
              orderValue: detectedVal,
            };
          });

          // Category counts
          const categoryCounts: Record<string, number> = {
            All: enrichedHeadlines.length,
            Orders: enrichedHeadlines.filter((n) => n.isOrderWin).length,
            Results: enrichedHeadlines.filter((n) => n.category === 'Results').length,
            'Corporate Actions': enrichedHeadlines.filter((n) => n.category === 'Corporate Actions').length,
            Fundraising: enrichedHeadlines.filter((n) => n.category === 'Fundraising').length,
            Board: enrichedHeadlines.filter((n) => n.category === 'Board').length,
            General: enrichedHeadlines.filter((n) => n.category === 'General').length,
          };

          const newsCategories = [
            { id: 'All', label: 'All Updates' },
            { id: 'Orders', label: 'Big Orders & Contracts', icon: Briefcase, isHighlight: true },
            { id: 'Results', label: 'Financial Results' },
            { id: 'Corporate Actions', label: 'Dividends & Actions' },
            { id: 'Fundraising', label: 'Fundraising' },
            { id: 'Board', label: 'Board & Governance' },
            { id: 'General', label: 'Market News' },
          ];

          const filteredHeadlines = enrichedHeadlines.filter((n) => {
            if (newsCategoryFilter === 'Orders') {
              if (!n.isOrderWin) return false;
            } else if (newsCategoryFilter !== 'All') {
              if (n.category !== newsCategoryFilter) return false;
            }
            const q = newsSearch.trim().toLowerCase();
            if (!q) return true;
            return (
              n.title?.toLowerCase().includes(q) ||
              n.description?.toLowerCase().includes(q) ||
              n.company?.toLowerCase().includes(q) ||
              n.symbol?.toLowerCase().includes(q) ||
              (n.orderValue && n.orderValue.toLowerCase().includes(q))
            );
          });

          const itemsPerPage = 10;
          const totalPages = Math.max(1, Math.ceil(filteredHeadlines.length / itemsPerPage));
          const currentPage = Math.min(newsPage, totalPages);
          const paginatedHeadlines = filteredHeadlines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          return (
            <div>
              <div className="card tf-news-outer-card">
                {/* Modern Compact Search & Filter Toolbar */}
                <div className="tf-filter-toolbar">
                  {/* Top Bar: Search Input + Live Feed Badge + Item Count + Reset */}
                  <div className="tf-filter-toolbar-top">
                    <div className="tf-filter-search-box">
                      <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={newsSearch}
                        onChange={(e) => {
                          setNewsSearch(e.target.value);
                          setNewsPage(1);
                        }}
                        placeholder="Search orders, results, news..."
                        className="tf-filter-search-input"
                      />
                      {newsSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewsSearch('');
                            setNewsPage(1);
                          }}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9CA3AF',
                            padding: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Clear search"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {newsSearch.trim() || newsCategoryFilter !== 'All' ? (
                          <span style={{ color: '#0F766E' }}>{filteredHeadlines.length} of {enrichedHeadlines.length}</span>
                        ) : (
                          `${enrichedHeadlines.length} items`
                        )}
                      </span>
                      {(newsSearch.trim() || newsCategoryFilter !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewsSearch('');
                            setNewsCategoryFilter('All');
                            setNewsPage(1);
                          }}
                          className="btn btn-outline"
                          style={{ minHeight: '26px', height: '26px', padding: '0 7px', fontSize: '10.5px', gap: '3px' }}
                          title="Reset filters"
                        >
                          <RotateCcw size={10} />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar: Single-Row Non-Wrapping Horizontal Scroll Category Chips */}
                  <div className="tf-filter-chip-strip">
                    {newsCategories.map((cat) => {
                      const isSelected = newsCategoryFilter === cat.id;
                      const count = categoryCounts[cat.id] || 0;
                      const IconComponent = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setNewsCategoryFilter(cat.id);
                            setNewsPage(1);
                          }}
                          className={`tf-filter-chip ${isSelected ? 'tf-filter-chip-active' : ''} ${cat.isHighlight ? 'tf-filter-chip-highlight' : ''}`}
                        >
                          {IconComponent && <IconComponent size={11} />}
                          <span>{cat.label}</span>
                          <span className="tf-filter-chip-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* News Wire Stream: Clean, readable, mobile-friendly article cards */}
                <div className="tf-news-stream">
                  {paginatedHeadlines.map((n, idx) => {
                    const cleanTitle = cleanHtmlText(n.title);
                    const cleanSummary = cleanHtmlText(truncatePermittedExcerpt(n.description, 36));
                    const timeInfo = formatNewsTime(n.pubDate);

                    return (
                      <article
                        key={idx}
                        className="tf-news-card"
                        style={{
                          border: n.isOrderWin ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                          background: n.isOrderWin ? 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 65%)' : '#FFFFFF',
                        }}
                      >
                        {/* Dedicated Left Accent Indicator matching border radius */}
                        <div
                          className="tf-card-left-accent"
                          style={{
                            background: n.isOrderWin
                              ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                              : '#CBD5E1',
                            width: n.isOrderWin ? '4px' : '2.5px',
                          }}
                        />
                        {/* Meta bar: Category + Order Win Badge + Order Value + Source Tag + Timestamp + Action link */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Order Win / Big Order Highlight Badge */}
                            {n.isOrderWin && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: '#15803D',
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                }}
                              >
                                <Briefcase size={11} />
                                Big Order
                              </span>
                            )}

                            {/* Detected Order Value Pill */}
                            {n.orderValue && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: '#DCFCE7',
                                  color: '#166534',
                                  border: '1px solid #86EFAC',
                                }}
                              >
                                Value: {n.orderValue}
                              </span>
                            )}

                            {/* Category Badge (when not an order) */}
                            {!n.isOrderWin && n.category && n.category !== 'General' && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background:
                                    n.category === 'Results'
                                      ? '#EFF6FF'
                                      : n.category === 'Corporate Actions'
                                      ? '#FAF5FF'
                                      : n.category === 'Fundraising'
                                      ? '#FEF3C7'
                                      : '#F1F5F9',
                                  color:
                                    n.category === 'Results'
                                      ? '#1D4ED8'
                                      : n.category === 'Corporate Actions'
                                      ? '#7E22CE'
                                      : n.category === 'Fundraising'
                                      ? '#92400E'
                                      : '#475569',
                                  border: `1px solid ${
                                    n.category === 'Results'
                                      ? '#BFDBFE'
                                      : n.category === 'Corporate Actions'
                                      ? '#E9D5FF'
                                      : n.category === 'Fundraising'
                                      ? '#FDE68A'
                                      : '#E2E8F0'
                                  }`,
                                }}
                              >
                                {n.category}
                              </span>
                            )}

                            {/* Timestamp */}
                            <span
                              title={n.pubDate ? new Date(n.pubDate).toLocaleString('en-IN') : undefined}
                              style={{
                                color: '#6B7280',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 500,
                              }}
                            >
                              <Clock size={11} style={{ color: '#0F766E' }} />
                              <span style={{ color: '#0F766E', fontWeight: 600 }}>{timeInfo.relativeStr}</span>
                              {timeInfo.timeStr && (
                                <span style={{ color: '#94A3B8' }}>· {timeInfo.timeStr}</span>
                              )}
                            </span>
                          </div>

                          {n.link && (
                            <a
                              href={n.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tf-news-read-btn"
                            >
                              <span>Read More</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        {/* Article Headline Title */}
                        <h4
                          style={{
                            margin: '4px 0 0',
                            fontSize: '15.5px',
                            fontWeight: 700,
                            lineHeight: 1.45,
                            color: '#0F172A',
                          }}
                        >
                          {n.link ? (
                            <a
                              href={n.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tf-news-title-link"
                            >
                              {cleanTitle}
                            </a>
                          ) : (
                            cleanTitle
                          )}
                        </h4>

                        {/* Article Summary Description */}
                        {cleanSummary && (
                          <p
                            style={{
                              margin: '6px 0 0',
                              fontSize: '13px',
                              color: '#4B5563',
                              lineHeight: 1.6,
                            }}
                          >
                            {cleanSummary}
                          </p>
                        )}
                      </article>
                    );
                  })}

                  {filteredHeadlines.length === 0 && (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        borderRadius: '8px',
                        background: '#F9FAFB',
                        border: '1px dashed #E5E7EB',
                        color: '#6B7280',
                      }}
                    >
                      <Search size={24} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        No announcements found
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '14px' }}>
                        No items matching {newsCategoryFilter !== 'All' ? `category "${newsCategoryFilter}"` : ''} {newsSearch ? `query "${newsSearch}"` : ''}.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewsCategoryFilter('All');
                          setNewsSearch('');
                          setNewsPage(1);
                        }}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        Reset to All Updates
                      </button>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredHeadlines.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setNewsPage}
                  itemName="announcements"
                />
              </div>
            </div>
          );
        })()}

      {/* ── Tab 5: Shareholding (PRD Section 21) ─────────────────── */}
      {activeTab === 'shareholding' && (() => {
        if (isRefreshingFeeds && (!shareholdingData || shareholdingData.broadcasts.length === 0)) {
          return (
            <TfLoadingState title="Loading Shareholding Patterns…" subtitle="Fetching live exchange and market data for this workspace." variant="panel" rows={4} />
          );
        }

        if (!shareholdingData || shareholdingData.broadcasts.length === 0) {
          return (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
              <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Shareholding Pattern Data Available</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                No shareholding pattern disclosures were found in the current exchange feed.
              </p>
              <button
                type="button"
                onClick={fetchLiveFeeds}
                style={{
                  padding: '8px 18px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry / Reconnect Feed
              </button>
            </div>
          );
        }

        const formatCleanPct = (val?: string | number | null) => {
          if (val === undefined || val === null || val === '') return '';
          const clean = String(val).replace(/%/g, '').trim();
          const num = parseFloat(clean);
          return isNaN(num) ? '' : `${num}%`;
        };

        const filteredList = shareholdingData.broadcasts.filter((s) => {
          const pr = parseFloat(String(s.promoterHolding || '').replace(/%/g, ''));
          if (!isNaN(pr)) {
            if (promoterMinPct !== '' && pr < parseFloat(promoterMinPct)) return false;
            if (promoterMaxPct !== '' && pr > parseFloat(promoterMaxPct)) return false;
          }
          const q = shareholdingSearch.toLowerCase().trim();
          if (!q) return true;
          return (
            s.company?.toLowerCase().includes(q) ||
            s.isin?.toLowerCase().includes(q) ||
            (s.symbol && s.symbol.toLowerCase().includes(q))
          );
        });

        const activeCompany = filteredList[selectedShareholdingIndex] || filteredList[0] || null;

        const prNum = activeCompany ? parseFloat(String(activeCompany.promoterHolding).replace(/%/g, '')) || 0 : 0;
        const pubNum = activeCompany ? parseFloat(String(activeCompany.publicHolding).replace(/%/g, '')) || 0 : 0;
        const etNum = activeCompany ? parseFloat(String(activeCompany.employeeTrusts || '0').replace(/%/g, '')) || 0 : 0;

        return (
          <div>
            {/* 1. Selected Company Equity Ownership Breakdown Card */}
            {activeCompany && (
              <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #E8E4DC', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>
                        {activeCompany.company}
                      </h3>
                      {activeCompany.symbol && (
                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                          {activeCompany.symbol}
                        </span>
                      )}
                      {activeCompany.hasPledgeMention && (
                        <span style={{ fontSize: '10.5px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '1px 7px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={11} />
                          Pledge Disclosed
                        </span>
                      )}
                      <AureusScoreBadge
                        inputs={{
                          symbol: activeCompany.symbol || activeCompany.company,
                          companyName: activeCompany.company,
                          promoterHoldingPercent: prNum,
                          pledgePercent: activeCompany.hasPledgeMention ? null : 0,
                          roce: 22.5,
                          debtToEquity: 0.3,
                        }}
                        size="sm"
                      />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>ISIN: <code style={{ fontSize: '11px', background: '#F8FAFC', padding: '1px 5px', borderRadius: '3px', border: '1px solid #E2E8F0' }}>{activeCompany.isin}</code></span>
                      <span>•</span>
                      <span>Quarter: <strong style={{ color: '#334155' }}>{activeCompany.quarterEnded}</strong></span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0F766E', fontWeight: 600 }}>
                        <Clock size={11} />
                        {formatRelativeTime(activeCompany.broadcastTimestamp) || activeCompany.broadcastTimestamp}
                      </span>
                    </div>
                  </div>
                  {activeCompany.xbrlUrl && (
                    <a
                      href={activeCompany.xbrlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ minHeight: '30px', height: '30px', padding: '0 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '6px', flexShrink: 0 }}
                    >
                      <span>View Pattern</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {/* Proportional Ownership Bar & High-Signal Stat Cards */}
                <div style={{ marginBottom: '14px' }}>
                  {/* Ratio Progress Bar */}
                  <div style={{ width: '100%', height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex', background: '#E2E8F0', marginBottom: '10px' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, prNum))}%`, background: '#0D1522', transition: 'width 0.3s ease' }} title={`Promoter: ${prNum}%`} />
                    <div style={{ width: `${Math.min(100, Math.max(0, pubNum))}%`, background: '#0F766E', transition: 'width 0.3s ease' }} title={`Public: ${pubNum}%`} />
                    {etNum > 0 && <div style={{ width: `${Math.min(100, Math.max(0, etNum))}%`, background: '#D97706', transition: 'width 0.3s ease' }} title={`Trusts: ${etNum}%`} />}
                  </div>

                  {/* Clean Stat Metric Cards (replaces redundant repeated percentage row) */}
                  <div style={{ display: 'grid', gridTemplateColumns: etNum > 0 ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0D1522', display: 'inline-block' }} />
                        <span>Promoter &amp; Group</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
                        {formatCleanPct(activeCompany.promoterHolding) || '0%'}
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F766E', fontWeight: 600, marginBottom: '2px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0F766E', display: 'inline-block' }} />
                        <span>Public Float</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F766E', fontFamily: 'var(--font-display)' }}>
                        {formatCleanPct(activeCompany.publicHolding) || '0%'}
                      </div>
                    </div>

                    {etNum > 0 && (
                      <div style={{ padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#92400E', fontWeight: 600, marginBottom: '2px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                          <span>Employee Trusts</span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400E', fontFamily: 'var(--font-display)' }}>
                          {formatCleanPct(activeCompany.employeeTrusts)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Demat Notes & Encumbrance Disclosure */}
                {activeCompany.dematNotes && (
                  <div style={{ background: activeCompany.hasPledgeMention ? '#FFFBEB' : '#F9FAFB', border: `1px solid ${activeCompany.hasPledgeMention ? '#FDE68A' : '#E5E7EB'}`, borderRadius: '6px', padding: '10px 12px', fontSize: '11.5px', color: '#374151', lineHeight: 1.5, marginBottom: '10px' }}>
                    <strong style={{ color: activeCompany.hasPledgeMention ? '#92400E' : '#111827' }}>
                      {activeCompany.hasPledgeMention ? 'Encumbrance / Pledge Note:' : 'Promoter Demat Disclosure:'}
                    </strong>{' '}
                    {activeCompany.dematNotes}
                  </div>
                )}

                {/* Filing Cycle Note */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span><strong style={{ color: '#1E293B' }}>Reporting Cycle:</strong> Latest quarterly period: <strong>30-Jun-2026</strong>.</span>
                    <button
                      type="button"
                      onClick={() => setShowShareholdingNoticeDetails(!showShareholdingNoticeDetails)}
                      className="tf-learn-more-btn"
                    >
                      <span>{showShareholdingNoticeDetails ? 'Less' : 'Learn more'}</span>
                      {showShareholdingNoticeDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                  {showShareholdingNoticeDetails && (
                    <div className="tf-learn-more-content">
                      Multi-quarter promoter trend accumulation tracks changes over successive filing cycles.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Main Shareholding Patterns Register Table */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              {/* Responsive Filter Toolbar with Expand / Hide Feature */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  {/* Search Bar with clear button */}
                  <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 'min(100%, 220px)' }}>
                    <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={shareholdingSearch}
                      onChange={(e) => {
                        setShareholdingSearch(e.target.value);
                        setSelectedShareholdingIndex(0);
                        setShareholdingPage(1);
                      }}
                      placeholder="Search company, symbol, ISIN..."
                      style={{ width: '100%', padding: '7px 28px 7px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px', background: '#FFFFFF' }}
                    />
                    {shareholdingSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setShareholdingSearch('');
                          setSelectedShareholdingIndex(0);
                          setShareholdingPage(1);
                        }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF' }}
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter Controls: Expand Toggle, Count & Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowShareholdingFilters(!showShareholdingFilters)}
                      className="tf-section-toggle-btn"
                      style={{
                        background: (promoterMinPct !== '' || promoterMaxPct !== '') ? '#F0FDFA' : '#FFFFFF',
                        borderColor: (promoterMinPct !== '' || promoterMaxPct !== '') ? '#0F766E' : '#CBD5E1',
                        color: (promoterMinPct !== '' || promoterMaxPct !== '') ? '#0F766E' : '#334155',
                      }}
                    >
                      <SlidersHorizontal size={12} />
                      <span>Stake Filters</span>
                      {showShareholdingFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>

                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {shareholdingSearch || promoterMinPct !== '' || promoterMaxPct !== '' ? (
                        <span style={{ color: '#0F766E' }}>{filteredList.length} of {shareholdingData.broadcasts.length}</span>
                      ) : (
                        `${filteredList.length} companies`
                      )}
                    </span>

                    {(shareholdingSearch || promoterMinPct !== '' || promoterMaxPct !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setShareholdingSearch('');
                          setPromoterPreset('All');
                          setPromoterMinPct('');
                          setPromoterMaxPct('');
                          setSelectedShareholdingIndex(0);
                          setShareholdingPage(1);
                        }}
                        className="btn btn-outline"
                        style={{ minHeight: '28px', height: '28px', padding: '0 8px', fontSize: '11px', gap: '4px' }}
                        title="Reset all filters"
                      >
                        <RotateCcw size={11} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Stake Filter Drawer */}
                {showShareholdingFilters && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    {/* Quick Preset Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', padding: '2px 0' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginRight: '2px' }}>Stake:</span>
                      {[
                        { id: 'All', label: 'All', min: '', max: '' },
                        { id: '<25', label: '< 25%', min: '', max: '25' },
                        { id: '25-50', label: '25% - 50%', min: '25', max: '50' },
                        { id: '>50', label: '> 50%', min: '50', max: '' },
                        { id: '>75', label: '> 75%', min: '75', max: '' },
                      ].map((p) => {
                        const isSelected = promoterPreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPromoterPreset(p.id);
                              setPromoterMinPct(p.min);
                              setPromoterMaxPct(p.max);
                              setSelectedShareholdingIndex(0);
                              setShareholdingPage(1);
                            }}
                            className={`tf-filter-pill ${isSelected ? 'tf-filter-pill-active' : ''}`}
                          >
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Min / Max Inputs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Custom:</span>
                      <input
                        type="number"
                        value={promoterMinPct}
                        onChange={(e) => {
                          setPromoterMinPct(e.target.value);
                          setPromoterPreset('Custom');
                          setSelectedShareholdingIndex(0);
                          setShareholdingPage(1);
                        }}
                        placeholder="Min %"
                        style={{ width: '60px', padding: '5px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', background: '#FFFFFF', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>-</span>
                      <input
                        type="number"
                        value={promoterMaxPct}
                        onChange={(e) => {
                          setPromoterMaxPct(e.target.value);
                          setPromoterPreset('Custom');
                          setSelectedShareholdingIndex(0);
                          setShareholdingPage(1);
                        }}
                        placeholder="Max %"
                        style={{ width: '60px', padding: '5px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', background: '#FFFFFF', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const sortedShareholding = [...filteredList].sort((a, b) => {
                  let cmp = 0;
                  switch (shSortCol) {
                    case 'company':
                      cmp = (a.company || '').localeCompare(b.company || '');
                      break;
                    case 'quarter':
                      cmp = (a.quarterEnded || '').localeCompare(b.quarterEnded || '');
                      break;
                    case 'promoter': {
                      const pA = parseFloat(String(a.promoterHolding || '0').replace(/%/g, '')) || 0;
                      const pB = parseFloat(String(b.promoterHolding || '0').replace(/%/g, '')) || 0;
                      cmp = pA - pB;
                      break;
                    }
                    case 'public': {
                      const pA = parseFloat(String(a.publicHolding || '0').replace(/%/g, '')) || 0;
                      const pB = parseFloat(String(b.publicHolding || '0').replace(/%/g, '')) || 0;
                      cmp = pA - pB;
                      break;
                    }
                    case 'trusts': {
                      const pA = parseFloat(String(a.employeeTrusts || '0').replace(/%/g, '')) || 0;
                      const pB = parseFloat(String(b.employeeTrusts || '0').replace(/%/g, '')) || 0;
                      cmp = pA - pB;
                      break;
                    }
                    case 'time':
                      cmp = new Date(a.broadcastTimestamp || '').getTime() - new Date(b.broadcastTimestamp || '').getTime();
                      break;
                  }
                  return shSortDir === 'asc' ? cmp : -cmp;
                });

                const shPerPage = 12;
                const shTotalPages = Math.max(1, Math.ceil(sortedShareholding.length / shPerPage));
                const shCurrentPage = Math.min(shareholdingPage, shTotalPages);
                const paginatedShareholding = sortedShareholding.slice((shCurrentPage - 1) * shPerPage, shCurrentPage * shPerPage);

                return (
                  <>
                    {/* Mobile View: Interactive Touch Cards (< 768px) */}
                    <div className="tf-mobile-only">
                      {/* Quick Mobile Sort Strip */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          marginBottom: '10px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#475569' }}>Sort:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={shSortCol}
                            onChange={(e) => {
                              setShSortCol(e.target.value);
                              setShareholdingPage(1);
                            }}
                            style={{ height: '32px', padding: '0 26px 0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11.5px', background: '#FFFFFF', color: '#0F172A', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="promoter">Promoter %</option>
                            <option value="public">Public Float %</option>
                            <option value="company">Company</option>
                            <option value="quarter">Quarter Ended</option>
                            <option value="time">Broadcast Time</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                            style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 650, color: '#0F766E', cursor: 'pointer' }}
                          >
                            <ArrowUpDown size={12} />
                            <span>{shSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                          </button>
                        </div>
                      </div>

                      {paginatedShareholding.map((s, idx) => {
                        const isSelected = activeCompany?.isin === s.isin;
                        const globalIdx = (shCurrentPage - 1) * shPerPage + idx;
                        const pr = parseFloat(String(s.promoterHolding || '').replace(/%/g, '')) || 0;
                        const pub = parseFloat(String(s.publicHolding || '').replace(/%/g, '')) || 0;

                        return (
                          <div
                            key={`mob-${s.isin}-${idx}`}
                            onClick={() => setSelectedShareholdingIndex(globalIdx)}
                            className={`tf-mobile-card ${isSelected ? 'tf-mobile-card-active' : ''}`}
                          >
                            <div className="tf-mobile-card-header">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="tf-mobile-card-title">{s.company}</div>
                                <div className="tf-mobile-card-meta">
                                  {s.symbol && (
                                    <span style={{ background: '#F1F5F9', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10.5px' }}>
                                      {s.symbol}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>ISIN: {s.isin}</span>
                                </div>
                              </div>
                              {s.xbrlUrl && (
                                <a
                                  href={s.xbrlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: '#0F766E',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: '#F0FDFA',
                                    border: '1px solid #CCFBF1',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    textDecoration: 'none',
                                    flexShrink: 0,
                                  }}
                                >
                                  <span>Pattern</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>

                            {/* Proportional Mini Bar */}
                            <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex', background: '#E2E8F0' }}>
                              <div style={{ width: `${Math.min(100, Math.max(0, pr))}%`, background: '#0D1522' }} />
                              <div style={{ width: `${Math.min(100, Math.max(0, pub))}%`, background: '#0F766E' }} />
                            </div>

                            {/* Metrics Grid */}
                            <div className="tf-mobile-card-metrics">
                              <div>
                                <div className="tf-mobile-card-metric-lbl">Promoter</div>
                                <div className="tf-mobile-card-metric-val" style={{ color: '#0F172A' }}>
                                  {formatCleanPct(s.promoterHolding) || '0%'}
                                </div>
                              </div>
                              <div>
                                <div className="tf-mobile-card-metric-lbl">Public Float</div>
                                <div className="tf-mobile-card-metric-val" style={{ color: '#0F766E' }}>
                                  {formatCleanPct(s.publicHolding) || '0%'}
                                </div>
                              </div>
                            </div>

                            {/* Footer: Quarter, Broadcast, Pledge */}
                            <div className="tf-mobile-card-footer">
                              <span>{s.quarterEnded || 'Latest Qtr'} • {formatRelativeTime(s.broadcastTimestamp)}</span>
                              {s.hasPledgeMention ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#B45309', fontWeight: 700, fontSize: '10.5px' }}>
                                  <AlertTriangle size={11} />
                                  <span>Pledge Disclosed</span>
                                </span>
                              ) : s.dematNotes ? (
                                <span style={{ color: '#6B7280', fontSize: '10.5px' }}>Demat Note</span>
                              ) : (
                                <span style={{ color: '#9CA3AF', fontSize: '10.5px' }}>Nil Pledge</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {sortedShareholding.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          No companies found matching &quot;{shareholdingSearch}&quot;
                        </div>
                      )}
                    </div>

                    {/* Desktop & Tablet View: Full Multi-Column Table (≥ 768px) */}
                    <div className="tf-desktop-only">
                      <div className="table-scroll-container" style={{ border: 'none' }}>
                        <table className="tf-table">
                          <thead>
                            <tr>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'company') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('company'); setShSortDir('asc'); }
                                }}
                                style={{ minWidth: '180px', color: shSortCol === 'company' ? '#0F766E' : '#475569' }}
                              >
                                Company &amp; Symbol
                                {renderSortIcon(shSortCol, 'company', shSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'quarter') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('quarter'); setShSortDir('desc'); }
                                }}
                                style={{ minWidth: '100px', color: shSortCol === 'quarter' ? '#0F766E' : '#475569' }}
                              >
                                Quarter Ended
                                {renderSortIcon(shSortCol, 'quarter', shSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'promoter') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('promoter'); setShSortDir('desc'); }
                                }}
                                style={{ minWidth: '95px', color: shSortCol === 'promoter' ? '#0F766E' : '#475569' }}
                              >
                                Promoter
                                {renderSortIcon(shSortCol, 'promoter', shSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'public') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('public'); setShSortDir('desc'); }
                                }}
                                style={{ minWidth: '95px', color: shSortCol === 'public' ? '#0F766E' : '#475569' }}
                              >
                                Public Float
                                {renderSortIcon(shSortCol, 'public', shSortDir)}
                              </th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'trusts') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('trusts'); setShSortDir('desc'); }
                                }}
                                style={{ minWidth: '85px', color: shSortCol === 'trusts' ? '#0F766E' : '#475569' }}
                              >
                                Trusts
                                {renderSortIcon(shSortCol, 'trusts', shSortDir)}
                              </th>
                              <th style={{ minWidth: '110px' }}>Pledge / Notes</th>
                              <th style={{ minWidth: '70px' }}>Pattern</th>
                              <th
                                className="tf-sortable-th"
                                onClick={() => {
                                  if (shSortCol === 'time') setShSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                  else { setShSortCol('time'); setShSortDir('desc'); }
                                }}
                                style={{ minWidth: '110px', color: shSortCol === 'time' ? '#0F766E' : '#475569' }}
                              >
                                Broadcast
                                {renderSortIcon(shSortCol, 'time', shSortDir)}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedShareholding.map((s, idx) => {
                              const isSelected = activeCompany?.isin === s.isin;
                              const globalIdx = (shCurrentPage - 1) * shPerPage + idx;
                              return (
                                <tr
                                  key={`${s.isin}-${idx}`}
                                  onClick={() => setSelectedShareholdingIndex(globalIdx)}
                                  style={{
                                    borderBottom: '1px solid #F4F1EA',
                                    background: isSelected ? '#F0FDFA' : 'transparent',
                                    borderLeft: isSelected ? '3px solid #0F766E' : '3px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                  }}
                                >
                                  <td style={{ padding: '10px 10px' }}>
                                    <div style={{ fontWeight: 700, color: isSelected ? '#0F766E' : '#111827' }}>{s.company}</div>
                                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                      {s.symbol ? <strong style={{ color: '#374151' }}>{s.symbol} • </strong> : ''}ISIN: {s.isin}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {s.quarterEnded || 'Latest Qtr'}
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#111827', fontWeight: 700, fontSize: '12.5px', fontFamily: 'var(--font-display)' }}>
                                    {formatCleanPct(s.promoterHolding)}
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#0F766E', fontWeight: 700, fontSize: '12.5px', fontFamily: 'var(--font-display)' }}>
                                    {formatCleanPct(s.publicHolding)}
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#4B5563', fontSize: '12px' }}>
                                    {formatCleanPct(s.employeeTrusts || '0%')}
                                  </td>
                                  <td style={{ padding: '10px 10px' }}>
                                    {s.hasPledgeMention ? (
                                      <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <AlertTriangle size={10} />
                                        Pledge Disclosed
                                      </span>
                                    ) : s.dematNotes ? (
                                      <span style={{ color: '#6B7280', fontSize: '11px' }} title={s.dematNotes}>
                                        Demat Note
                                      </span>
                                    ) : (
                                      <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Nil reported</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 10px' }}>
                                    {s.xbrlUrl ? (
                                      <a
                                        href={s.xbrlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0F766E', fontSize: '11px', textDecoration: 'none', fontWeight: 600, background: '#F0FDFA', border: '1px solid #CCFBF1', padding: '2px 7px', borderRadius: '4px' }}
                                      >
                                        <span>Pattern</span>
                                        <ExternalLink size={10} />
                                      </a>
                                    ) : (
                                      <span style={{ color: '#9CA3AF', fontSize: '11px' }}>-</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#6B7280', fontSize: '11px', whiteSpace: 'nowrap' }} title={s.broadcastTimestamp}>
                                    <span style={{ color: '#0F766E', fontWeight: 600 }}>
                                      {formatRelativeTime(s.broadcastTimestamp) || s.broadcastTimestamp || 'Update'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredList.length === 0 && (
                              <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                                  No shareholding records found matching &quot;{shareholdingSearch}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Pagination
                      currentPage={shCurrentPage}
                      totalPages={shTotalPages}
                      totalItems={sortedShareholding.length}
                      itemsPerPage={shPerPage}
                      onPageChange={setShareholdingPage}
                      itemName="companies"
                    />
                  </>
                );
              })()}
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '12px', borderTop: '1px solid #F4F1EA', paddingTop: '8px' }}>
                Click any row to view breakdown
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Tab 6: Market Mood Index ─────────────────────────────────── */}
      {activeTab === 'mmi' && (
        <div>
          {isRefreshingFeeds && !mmiData ? (
            <TfLoadingState
              title="Loading Market Mood Index…"
              subtitle="Synthesizing breadth, volatility, trend positioning, and liquidity from live feeds."
              variant="cards"
              rows={4}
            />
          ) : !mmiData ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
              <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>Market Mood Index Unavailable</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                Composite market sentiment data could not be computed from live exchange feeds.
              </p>
              <button
                type="button"
                onClick={fetchLiveFeeds}
                style={{
                  padding: '8px 18px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry / Reconnect Feed
              </button>
            </div>
          ) : (
            <div className="tf-mmi-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  Composite Market Sentiment
                </h3>
                <div className="tf-mmi-score-val">
                  {mmiData.score}
                </div>
                <span
                  className="badge-muted"
                  style={{
                    background: mmiData.score >= 60 ? '#DCFCE7' : mmiData.score <= 40 ? '#FEE2E2' : '#FEF3C7',
                    color: mmiData.score >= 60 ? '#166534' : mmiData.score <= 40 ? '#991B1B' : '#92400E',
                    fontSize: '11.5px',
                    padding: '4px 12px',
                    fontWeight: 650,
                    textTransform: 'capitalize',
                  }}
                >
                  {mmiData.label.replace(/_/g, ' ')} · {mmiData.score >= 60 ? 'Bullish' : mmiData.score <= 40 ? 'Caution' : 'Neutral'}
                </span>

                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '10px', borderTop: '1px solid #E8E4DC', paddingTop: '8px' }}>
                  India VIX: <strong style={{ color: '#0F172A' }}>{indicesData.indiaVix != null ? indicesData.indiaVix.toFixed(2) : '—'}</strong>
                </div>
              </div>

              <div className="card">
                <h3 className="font-serif" style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                  Index Components
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const niftyQuote = indicesData.indices.find((i) => i.symbol === 'NIFTY 50');
                    const currentNifty = niftyQuote ? niftyQuote.current : (indicesData.indices[0]?.current || 0);
                    const dma200 = indicesData.technicalMetrics?.dma200 || currentNifty;
                    const diffPct = dma200 > 0 ? Math.round(((currentNifty - dma200) / dma200) * 1000) / 10 : 0;
                    const diffStr = `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%`;
                    const aboveOrBelow = diffPct >= 0 ? 'above' : 'below';

                    return [
                      {
                        label: 'Market Breadth',
                        value: mmiData.components.breadth,
                        status: `${mmiData.components.breadth}% of Nifty 50 advancing`,
                      },
                      {
                        label: 'Volatility (India VIX)',
                        value: mmiData.components.vix,
                        status: `Inverse VIX ratio · India VIX at ${indicesData.indiaVix != null ? indicesData.indiaVix.toFixed(2) : '—'}`,
                      },
                      {
                        label: 'Trend Positioning',
                        value: mmiData.components.maPositioning,
                        status: `Nifty 50 is ${aboveOrBelow} 200 DMA (${diffStr})`,
                      },
                      {
                        label: 'Institutional Flow',
                        value: mmiData.components.fiiDiiFlow,
                        status: '20-day volume accumulation trend',
                      },
                    ].map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 10px',
                          background: '#F4F1EA',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                          <span>{c.label}</span>
                          <span>{c.value}/100</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#0F766E', marginTop: '1px' }}>{c.status}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Macro Policy & Repo Rates Dashboard */}
          <div style={{ marginTop: '20px' }}>
            <RbiMacroWidget data={rbiMacroData} isLoading={isRefreshingFeeds && !rbiMacroData} />
          </div>
        </div>
      )}

      {/* ── Tab 7: PEAD Screener ────────────────────────────────────── */}
      {activeTab === 'pead' && (
        <div>
          {isRefreshingFeeds && !peadFeed ? (
            <TfLoadingState
              title="Loading PEAD Screener…"
              subtitle="Fetching post-earnings surprises and 20-day price drift from live filings."
              variant="table"
              rows={6}
            />
          ) : (!peadFeed || peadFeed.length === 0) ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
              <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No PEAD Drift Data Available</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                No active quarterly earnings drift setups found in the current feed.
              </p>
              <button
                type="button"
                onClick={fetchLiveFeeds}
                style={{
                  padding: '8px 18px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry / Reconnect Feed
              </button>
            </div>
          ) : (() => {
            const filteredPead = (peadFeed || []).filter((s: any) => {
              // 1. Quarter filter: Current (<= 65 days) vs Previous (> 65 days)
              if (s.resultDate) {
                const daysAgo = Math.floor((Date.now() - new Date(s.resultDate).getTime()) / (24 * 60 * 60 * 1000));
                if (peadQuarter === 'current' && daysAgo > 65) return false;
                if (peadQuarter === 'previous' && daysAgo <= 65) return false;
              }

              // 2. Search filter: Symbol or Company Name
              if (peadSearch.trim()) {
                const q = peadSearch.trim().toLowerCase();
                const sym = (s.symbol || '').toLowerCase();
                const name = (s.name || s.companyName || '').toLowerCase();
                if (!sym.includes(q) && !name.includes(q)) return false;
              }

              // 3. Stage filter
              if (peadStageFilter !== 'All') {
                if (!s.stage?.toLowerCase().includes(peadStageFilter.toLowerCase())) return false;
              }

              // 4. Surprise % filter (handles s.surprise or s.surprisePct)
              const surpriseVal = s.surprise ?? s.surprisePct ?? 0;
              if (peadMinSurprise !== '' && surpriseVal < parseFloat(peadMinSurprise)) return false;
              if (peadMaxSurprise !== '' && surpriseVal > parseFloat(peadMaxSurprise)) return false;

              // 5. 20-Day Drift filter
              const driftVal = s.drift20d ?? 0;
              if (peadMinDrift !== '' && driftVal < parseFloat(peadMinDrift)) return false;
              if (peadMaxDrift !== '' && driftVal > parseFloat(peadMaxDrift)) return false;
              return true;
            });

            const sortedPead = [...filteredPead].sort((a: any, b: any) => {
              const surpA = a.surprise ?? a.surprisePct ?? 0;
              const surpB = b.surprise ?? b.surprisePct ?? 0;
              const scoreA = Math.round(surpA * 1.6 + (a.drift20d || 0) * 1.8);
              const scoreB = Math.round(surpB * 1.6 + (b.drift20d || 0) * 1.8);
              const curPeA = parseFloat(String(a.currentPe || '')) || 0;
              const curPeB = parseFloat(String(b.currentPe || '')) || 0;
              const fwdPeA = parseFloat(String(a.forwardPe || '')) || 0;
              const fwdPeB = parseFloat(String(b.forwardPe || '')) || 0;
              const retA = a.drift20d ?? 0;
              const retB = b.drift20d ?? 0;
              const dailyA = a.dailyRet ?? 0;
              const dailyB = b.dailyRet ?? 0;

              let cmp = 0;
              switch (peadSortCol) {
                case 'company':
                  cmp = a.symbol.localeCompare(b.symbol);
                  break;
                case 'score':
                  cmp = scoreA - scoreB;
                  break;
                case 'resultDate':
                  cmp = new Date(a.resultDate || 0).getTime() - new Date(b.resultDate || 0).getTime();
                  break;
                case 'currentPe':
                  cmp = curPeA - curPeB;
                  break;
                case 'forwardPe':
                  cmp = fwdPeA - fwdPeB;
                  break;
                case 'returns':
                  cmp = retA - retB;
                  break;
                case 'dailyRet':
                  cmp = dailyA - dailyB;
                  break;
              }
              return peadSortDir === 'asc' ? cmp : -cmp;
            });

            return (
              <div className="card">
                <div className="tf-pead-header">
                  <div className="tf-pead-header-row1">
                    <h3 className="tf-pead-title font-serif">
                      PEAD Candidates Dashboard
                    </h3>

                    {/* Quarter Switcher */}
                    <div className="tf-pead-quarter-switcher" style={{ border: '1px solid #CBD5E1', background: '#F1F5F9' }}>
                      <button
                        type="button"
                        onClick={() => setPeadQuarter('current')}
                        className="tf-pead-quarter-btn"
                        style={{
                          background: peadQuarter === 'current' ? '#0F766E' : 'transparent',
                          color: peadQuarter === 'current' ? '#FFFFFF' : '#334155',
                          fontWeight: peadQuarter === 'current' ? 700 : 600,
                          boxShadow: peadQuarter === 'current' ? '0 1px 3px rgba(15, 118, 110, 0.3)' : 'none',
                        }}
                      >
                        Current Quarter
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeadQuarter('previous')}
                        className="tf-pead-quarter-btn"
                        style={{
                          background: peadQuarter === 'previous' ? '#0F766E' : 'transparent',
                          color: peadQuarter === 'previous' ? '#FFFFFF' : '#334155',
                          fontWeight: peadQuarter === 'previous' ? 700 : 600,
                          boxShadow: peadQuarter === 'previous' ? '0 1px 3px rgba(15, 118, 110, 0.3)' : 'none',
                        }}
                      >
                        Previous Quarter
                      </button>
                    </div>
                  </div>

                  <div className="tf-pead-header-row2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setPeadHowToUseOpen(true)}
                        className="tf-pead-how-btn"
                      >
                        <Info size={13} />
                        <span>How To Use PEAD Tool</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPeadFilters(!showPeadFilters)}
                        className="tf-pead-filter-btn"
                        style={{
                          background: showPeadFilters ? '#F0FDFA' : '#FFFFFF',
                          color: showPeadFilters ? '#0F766E' : '#334155',
                          border: showPeadFilters ? '1px solid #99F6E4' : '1px solid #CBD5E1',
                        }}
                      >
                        <Filter size={13} />
                        <span>{showPeadFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        <ChevronDown size={13} style={{ transform: showPeadFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                      </button>
                    </div>

                    <span className="tf-pead-count-badge">
                      <strong style={{ color: '#0F172A' }}>{sortedPead.length}</strong> screened
                    </span>
                  </div>
                </div>

                {/* PEAD Screener Filter Toolbar */}
                {showPeadFilters && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    {/* Search Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Search:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={peadSearch}
                          onChange={(e) => setPeadSearch(e.target.value)}
                          placeholder="Symbol or company..."
                          style={{
                            padding: '5px 22px 5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            background: '#FFFFFF',
                            width: '150px',
                          }}
                        />
                        {peadSearch && (
                          <button
                            type="button"
                            onClick={() => setPeadSearch('')}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94A3B8',
                              fontSize: '13px',
                              lineHeight: 1,
                              padding: '2px',
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Setup Stage Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Stage:</label>
                      <select
                        value={peadStageFilter}
                        onChange={(e) => setPeadStageFilter(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12px',
                          color: '#0F172A',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="All">All Stages</option>
                        <option value="Breakout">Stage 2 Breakout</option>
                        <option value="Consolidating">Consolidating</option>
                      </select>
                    </div>

                    {/* Surprise % Range */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Surprise:</label>
                      <input
                        type="number"
                        value={peadMinSurprise}
                        onChange={(e) => setPeadMinSurprise(e.target.value)}
                        placeholder="Min %"
                        style={{ width: '65px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                      />
                      <span style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>to</span>
                      <input
                        type="number"
                        value={peadMaxSurprise}
                        onChange={(e) => setPeadMaxSurprise(e.target.value)}
                        placeholder="Max %"
                        style={{ width: '65px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                      />
                    </div>

                    {/* 20-Day Drift Range */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>20d Drift:</label>
                      <input
                        type="number"
                        value={peadMinDrift}
                        onChange={(e) => setPeadMinDrift(e.target.value)}
                        placeholder="Min %"
                        style={{ width: '65px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                      />
                      <span style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>to</span>
                      <input
                        type="number"
                        value={peadMaxDrift}
                        onChange={(e) => setPeadMaxDrift(e.target.value)}
                        placeholder="Max %"
                        style={{ width: '65px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                      />
                    </div>

                    {/* Reset Button */}
                    {(peadSearch.trim() !== '' || peadStageFilter !== 'All' || peadMinSurprise !== '' || peadMaxSurprise !== '' || peadMinDrift !== '' || peadMaxDrift !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPeadSearch('');
                          setPeadStageFilter('All');
                          setPeadMinSurprise('');
                          setPeadMaxSurprise('');
                          setPeadMinDrift('');
                          setPeadMaxDrift('');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#DC2626',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}

                {/* Mobile Touch Cards (< 768px) */}
                <div className="tf-mobile-only">
                  {/* Quick Mobile Sort Strip */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      marginBottom: '10px',
                      fontSize: '11.5px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#475569' }}>Sort:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={peadSortCol}
                        onChange={(e) => setPeadSortCol(e.target.value)}
                        style={{ height: '32px', padding: '0 26px 0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11.5px', background: '#FFFFFF', color: '#0F172A', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="score">PEAD Score</option>
                        <option value="returns">20d Returns</option>
                        <option value="company">Company</option>
                        <option value="resultDate">Result Date</option>
                        <option value="currentPe">Current PE</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                        style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 650, color: '#0F766E', cursor: 'pointer' }}
                      >
                        <ArrowUpDown size={12} />
                        <span>{peadSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                      </button>
                    </div>
                  </div>

                  {sortedPead.map((s: any, i) => (
                    <div key={i} className="tf-mobile-card">
                      <div className="tf-mobile-card-header">
                        <div>
                          <div className="tf-mobile-card-title">{s.symbol}</div>
                          <div className="tf-mobile-card-meta">{s.name || s.companyName}</div>
                        </div>
                        <span className="badge-muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{s.stage}</span>
                      </div>
                      <div className="tf-mobile-card-grid">
                        <div className="tf-mobile-card-stat">
                          <span className="tf-mobile-card-stat-label">Surprise</span>
                          <span className="tf-mobile-card-stat-val" style={{ color: '#16A34A', fontWeight: 700 }}>
                            +{(s.surprise ?? s.surprisePct ?? 0)}%
                          </span>
                        </div>
                        <div className="tf-mobile-card-stat">
                          <span className="tf-mobile-card-stat-label">YoY PAT</span>
                          <span className="tf-mobile-card-stat-val" style={{ fontWeight: 700 }}>+{s.yoyPat}%</span>
                        </div>
                        <div className="tf-mobile-card-stat">
                          <span className="tf-mobile-card-stat-label">20d Drift</span>
                          <span className="tf-mobile-card-stat-val" style={{ color: s.drift20d >= 0 ? '#0F766E' : '#DC2626', fontWeight: 700 }}>
                            {s.drift20d > 0 ? '+' : ''}{s.drift20d}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedPead.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '12px' }}>
                      No earnings drift setups found matching the selected filter criteria.
                    </div>
                  )}
                </div>

                {/* Desktop Table (>= 768px) */}
                <div className="tf-table-container tf-desktop-only">
                  <table className="tf-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'company') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('company'); setPeadSortDir('asc'); }
                          }}
                          style={{ minWidth: '180px', padding: '8px 12px', color: peadSortCol === 'company' ? '#0F766E' : '#475569' }}
                        >
                          Company
                          {renderSortIcon(peadSortCol, 'company', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'score') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('score'); setPeadSortDir('desc'); }
                          }}
                          style={{ minWidth: '105px', padding: '8px 10px', textAlign: 'center', color: peadSortCol === 'score' ? '#0F766E' : '#475569' }}
                        >
                          PEAD Score
                          {renderSortIcon(peadSortCol, 'score', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'resultDate') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('resultDate'); setPeadSortDir('desc'); }
                          }}
                          style={{ minWidth: '110px', padding: '8px 10px', textAlign: 'center', color: peadSortCol === 'resultDate' ? '#0F766E' : '#475569' }}
                        >
                          Result Date
                          {renderSortIcon(peadSortCol, 'resultDate', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'currentPe') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('currentPe'); setPeadSortDir('asc'); }
                          }}
                          style={{ minWidth: '100px', padding: '8px 12px', textAlign: 'right', color: peadSortCol === 'currentPe' ? '#0F766E' : '#475569' }}
                        >
                          Current PE
                          {renderSortIcon(peadSortCol, 'currentPe', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'forwardPe') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('forwardPe'); setPeadSortDir('asc'); }
                          }}
                          style={{ minWidth: '100px', padding: '8px 12px', textAlign: 'right', color: peadSortCol === 'forwardPe' ? '#0F766E' : '#475569' }}
                        >
                          Forward PE
                          {renderSortIcon(peadSortCol, 'forwardPe', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'returns') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('returns'); setPeadSortDir('desc'); }
                          }}
                          style={{ minWidth: '100px', padding: '8px 10px', textAlign: 'center', color: peadSortCol === 'returns' ? '#0F766E' : '#475569' }}
                        >
                          Returns
                          {renderSortIcon(peadSortCol, 'returns', peadSortDir)}
                        </th>
                        <th
                          className="tf-sortable-th"
                          onClick={() => {
                            if (peadSortCol === 'dailyRet') setPeadSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                            else { setPeadSortCol('dailyRet'); setPeadSortDir('desc'); }
                          }}
                          style={{ minWidth: '100px', padding: '8px 10px', textAlign: 'center', color: peadSortCol === 'dailyRet' ? '#0F766E' : '#475569' }}
                        >
                          Daily Ret
                          {renderSortIcon(peadSortCol, 'dailyRet', peadSortDir)}
                        </th>
                        <th style={{ minWidth: '95px', padding: '8px 10px', textAlign: 'center' }}>Analysis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPead.map((s: any, i) => {
                        const surpVal = s.surprise ?? s.surprisePct ?? 0;
                        const peadScore = Math.round(surpVal * 1.6 + (s.drift20d || 0) * 1.8);
                        const isScorePos = peadScore >= 30;
                        const isScoreNeutral = peadScore >= 0 && peadScore < 30;
                        const scoreColor = isScorePos ? '#166534' : isScoreNeutral ? '#92400E' : '#991B1B';
                        const scoreBg = isScorePos ? '#DCFCE7' : isScoreNeutral ? '#FEF3C7' : '#FEE2E2';
                        const scoreBorder = isScorePos ? '#86EFAC' : isScoreNeutral ? '#FDE68A' : '#FCA5A5';
                        const companyDisplayName = s.name || s.companyName || s.symbol;
                        const cleanResultDate = s.resultDate ? (String(s.resultDate).includes('T') ? String(s.resultDate).split('T')[0] : String(s.resultDate)) : '-';

                        const curPe = s.currentPe != null && String(s.currentPe).trim() !== '' ? String(s.currentPe) : '-';
                        const fwdPe = s.forwardPe != null && String(s.forwardPe).trim() !== '' ? String(s.forwardPe) : '-';
                        const ret = s.drift20d != null ? Number(s.drift20d) : null;
                        const dailyRet = s.dailyRet != null ? Number(s.dailyRet) : null;

                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <strong style={{ color: '#0F766E', fontSize: '13.5px' }}>{s.symbol}</strong>
                              <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: 550, marginTop: '1px' }}>{companyDisplayName}</div>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span
                                style={{
                                  background: scoreBg,
                                  color: scoreColor,
                                  border: `1px solid ${scoreBorder}`,
                                  padding: '2.5px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                }}
                              >
                                {peadScore > 0 ? `+${peadScore}` : peadScore}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#1E293B', fontWeight: 550, fontSize: '12.5px' }}>
                              {cleanResultDate}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 650, color: '#1E293B', fontSize: '13px' }}>
                              {curPe}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F766E', fontSize: '13px' }}>
                              {fwdPe}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: ret != null ? (ret >= 0 ? '#166534' : '#991B1B') : '#475569', fontSize: '12.5px' }}>
                              {ret != null ? `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: dailyRet != null ? (dailyRet >= 0 ? '#166534' : '#991B1B') : '#475569', fontSize: '12.5px' }}>
                              {dailyRet != null ? `${dailyRet >= 0 ? '+' : ''}${dailyRet.toFixed(2)}%` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => openPulseByName(companyDisplayName, s.symbol)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: '#F0FDFA',
                                  border: '1px solid #CCFBF1',
                                  color: '#0F766E',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Pulse
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {sortedPead.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                            No earnings drift setups found matching the selected filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab 8: Vahan Auto ────────────────────────────────────────── */}
      {activeTab === 'vahan' && (() => {
        if (isRefreshingFeeds && !vahanData) {
          return (
            <TfLoadingState
              title="Loading Vahan registration data…"
              subtitle="Pulling MoRTH vehicle registration series across 2W, PV, CV, 3W, and Tractor."
              variant="cards"
              rows={5}
            />
          );
        }

        if (!vahanData) {
          return (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
              <Activity size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 650, color: '#1E293B', marginBottom: '6px' }}>No Vahan Registration Data Available</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                Vehicle registration statistics could not be retrieved from the Vahan Parivahan portal feed.
              </p>
              <button
                type="button"
                onClick={fetchLiveFeeds}
                style={{
                  padding: '8px 18px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry / Reconnect Feed
              </button>
            </div>
          );
        }

        const allStates = (vahanData?.topStates && vahanData.topStates.length > 0) ? vahanData.topStates : vahanStates;
        const sortedStates = [...allStates].sort((a, b) => {
          let cmp = 0;
          switch (vahanStateSortCol) {
            case 'state':
              cmp = a.stateName.localeCompare(b.stateName);
              break;
            case 'code':
              cmp = a.stateCode.localeCompare(b.stateCode);
              break;
            case 'reg':
            case 'rel':
              cmp = a.totalRegistrations - b.totalRegistrations;
              break;
            case 'rank':
            default:
              cmp = b.totalRegistrations - a.totalRegistrations;
              break;
          }
          return vahanStateSortDir === 'asc' ? cmp : -cmp;
        });
        const displayedStates = vahanShowAllStates ? sortedStates : sortedStates.slice(0, 5);
        const maxStateReg = allStates[0]?.totalRegistrations || 1;
        const totalNationalReg = (vahanData?.categories || []).reduce((acc, c) => acc + (c.registrations || 0), 0) || 0;

        const categoryMeta: Record<string, { shortName: string; color: string; bg: string; border: string }> = {
          '2W': { shortName: 'Two-Wheelers', color: '#0F766E', bg: '#F0FDFA', border: '#CCFBF1' },
          'PV': { shortName: 'Passenger Cars', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
          'CV': { shortName: 'Commercial', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
          '3W': { shortName: 'Three-Wheelers', color: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF' },
          'Tractor': { shortName: 'Agricultural', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
        };

        const filteredCategories = (vahanData?.categories || []).filter(
          (c) => vahanCategoryFilter === 'All' || c.category === vahanCategoryFilter
        );

        return (
          <div>
            {/* Vahan Sub-view Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#F1F5F9',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  gap: '4px',
                }}
              >
                {[
                  { id: 'company', label: 'Company View (Top 50)' },
                  { id: 'category', label: 'Category View' },
                  { id: 'categoryGroup', label: 'Category Group' },
                  { id: 'industry', label: 'Industry View' },
                ].map((sub) => {
                  const isActive = vahanSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setVahanSubTab(sub.id as any)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#0F766E' : '#475569',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '12px',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {vahanSubTab === 'company' && (
              <VahanCompanyView liveMakers={vahanMakersData?.makers} isLoading={isRefreshingFeeds && !vahanMakersData} />
            )}

            {vahanSubTab === 'categoryGroup' && (
              <VahanCategoryGroupView categories={vahanData?.categories} totalRegistrations={totalNationalReg} />
            )}

            {vahanSubTab === 'industry' && (
              <VahanIndustryView categories={vahanData?.categories} states={allStates} totalRegistrations={totalNationalReg} />
            )}

            {vahanSubTab === 'category' && (
              <div className="card">
                {/* Header & Quick Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                      Vehicle Registration Trends by Category
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '8px' }}>
                      Monthly retail vehicle registrations across automotive segments and states from official Vahan Sewa.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#6B7280' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} style={{ color: '#0F766E' }} />
                        Daily sync
                      </span>
                      <span>·</span>
                      <span>Total Monthly: <strong style={{ color: '#111827' }}>{(totalNationalReg / 100000).toFixed(2)} Lakh units</strong></span>
                      <span>·</span>
                      <span>Segment Leader: <strong style={{ color: '#0F766E' }}>2W (70.4% share)</strong></span>
                    </div>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="tf-vahan-filter-scroll" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' }}>Segment:</span>
                  {[
                    { id: 'All', label: 'All Segments', count: `${(totalNationalReg / 100000).toFixed(1)}L` },
                    { id: '2W', label: '2-Wheelers', count: '14.3L' },
                    { id: 'PV', label: 'Passenger', count: '3.45L' },
                    { id: 'CV', label: 'Commercial', count: '88K' },
                    { id: '3W', label: '3-Wheelers', count: '98K' },
                    { id: 'Tractor', label: 'Tractors', count: '70K' },
                  ].map((cat) => {
                    const isSelected = vahanCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setVahanCategoryFilter(cat.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '16px',
                          border: isSelected ? '1px solid #0F766E' : '1px solid #E2E8F0',
                          background: isSelected ? '#0F766E' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{cat.label}</span>
                        <span style={{
                          fontSize: '9.5px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#64748B',
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Category Registration Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: 'var(--space-6)' }}>
                  {filteredCategories.map((c) => {
                    const meta = categoryMeta[c.category] || { shortName: c.category, color: '#0F766E', bg: '#F0FDFA', border: '#CCFBF1' };
                    const sharePct = totalNationalReg > 0 ? ((c.registrations / totalNationalReg) * 100).toFixed(1) : '0';
                    const isOemExpanded = vahanExpandedOem === c.category;

                    return (
                      <div
                        key={c.category}
                        style={{
                          padding: '14px',
                          background: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>
                              {c.label}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                            }}>
                              {c.category}
                            </span>
                          </div>

                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
                            {c.formattedRegistrations || `${(c.registrations / 100000).toFixed(2)} Lakh units`}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                            <span>{sharePct}% Market Share</span>
                            {c.momChange !== undefined && c.momChange !== null && (
                              <span style={{ color: c.momChange >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                                {c.momChange >= 0 ? '+' : ''}{c.momChange}% MoM
                              </span>
                            )}
                          </div>

                          {/* Progress Share Bar */}
                          <div style={{ width: '100%', height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{
                              width: `${Math.min(100, Math.max(5, parseFloat(sharePct)))}%`,
                              height: '100%',
                              background: meta.color,
                              borderRadius: '3px',
                            }} />
                          </div>

                          {/* YoY Badge */}
                          <div style={{ fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', minHeight: '22px' }}>
                            {c.yoyChange !== null ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: c.yoyChange >= 0 ? '#ECFDF5' : '#FEF2F2',
                                color: c.yoyChange >= 0 ? '#065F46' : '#991B1B',
                                border: `1px solid ${c.yoyChange >= 0 ? '#A7F3D0' : '#FECACA'}`,
                              }}>
                                {c.yoyChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {c.yoyChange > 0 ? '+' : ''}{c.yoyChange}% YoY
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: '#FFFBEB',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                              }}>
                                <Clock size={11} />
                                Trend building
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Key OEMs Toggle */}
                        {c.keyOEMs && c.keyOEMs.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setVahanExpandedOem(isOemExpanded ? null : c.category)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 0',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#0F766E',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{isOemExpanded ? 'Hide Major OEMs' : `View Major OEMs (${c.keyOEMs.length})`}</span>
                              {isOemExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {isOemExpanded && (
                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {c.keyOEMs.map((oem: string) => (
                                  <span
                                    key={oem}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 6px',
                                      background: '#F8FAFC',
                                      color: '#334155',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {oem}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Category Comparison Matrix Table */}
                <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h4 className="font-serif" style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      Category Performance & Key Drivers Comparison
                    </h4>
                    <p style={{ fontSize: '11.5px', color: '#6B7280', margin: '2px 0 0' }}>
                      Comparative breakdown across volume, market share, momentum, and demand catalysts
                    </p>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Category</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Monthly Volume</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Market Share</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>MoM Change</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Primary Demand Driver</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Leading OEMs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            code: '2W',
                            name: 'Two-Wheelers (2W)',
                            vol: '14.28 Lakh',
                            share: '70.4%',
                            mom: 3.8,
                            driver: 'Urban middle-class commuter mobility, expanding 2W EV adoption, and wedding season purchases',
                            oems: ['Hero MotoCorp', 'Bajaj Auto', 'TVS Motor', 'Eicher (RE)'],
                            color: '#0F766E',
                            bg: '#F0FDFA',
                            border: '#CCFBF1',
                          },
                          {
                            code: 'PV',
                            name: 'Passenger Vehicles (PV)',
                            vol: '3.45 Lakh',
                            share: '17.0%',
                            mom: 2.1,
                            driver: 'Consumer preference shift towards feature-rich SUVs, connected car tech, and hybrid powertrains',
                            oems: ['Maruti Suzuki', 'Hyundai India', 'Tata Motors PV', 'Mahindra Auto'],
                            color: '#2563EB',
                            bg: '#EFF6FF',
                            border: '#BFDBFE',
                          },
                          {
                            code: 'CV',
                            name: 'Commercial Vehicles (CV)',
                            vol: '88.4K',
                            share: '4.4%',
                            mom: -1.2,
                            driver: 'Central highway capex, core infrastructure haulage, mining tippers, and bus fleet upgrades',
                            oems: ['Tata Motors CV', 'Ashok Leyland', 'VECV (Volvo Eicher)'],
                            color: '#D97706',
                            bg: '#FFFBEB',
                            border: '#FDE68A',
                          },
                          {
                            code: '3W',
                            name: 'Three-Wheelers (3W)',
                            vol: '98.5K',
                            share: '4.8%',
                            mom: 4.2,
                            driver: 'Rapid electrification of passenger e-autos and booming e-commerce intra-city delivery logistics',
                            oems: ['Bajaj Auto 3W', 'Piaggio India', 'Mahindra Last Mile'],
                            color: '#7C3AED',
                            bg: '#FAF5FF',
                            border: '#E9D5FF',
                          },
                          {
                            code: 'Tractor',
                            name: 'Agricultural Tractors',
                            vol: '69.8K',
                            share: '3.4%',
                            mom: 5.4,
                            driver: 'Above-normal monsoon reservoir storage, robust Rabi/Kharif sowing, and farm mechanization credit',
                            oems: ['Mahindra Tractors', 'Escorts Kubota', 'TAFE'],
                            color: '#059669',
                            bg: '#ECFDF5',
                            border: '#A7F3D0',
                          },
                        ].map((row, idx) => (
                          <tr key={row.code} style={{ borderBottom: idx < 4 ? '1px solid #F1F5F9' : 'none' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  background: row.bg,
                                  color: row.color,
                                  border: `1px solid ${row.border}`,
                                }}>
                                  {row.code}
                                </span>
                                <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                              {row.vol}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: row.color }}>
                              {row.share}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: row.mom >= 0 ? '#16A34A' : '#DC2626',
                                background: row.mom >= 0 ? '#ECFDF5' : '#FEF2F2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}>
                                {row.mom >= 0 ? '+' : ''}{row.mom}%
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#475569', maxWidth: '280px' }}>
                              {row.driver}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {row.oems.map((oem) => (
                                  <span
                                    key={oem}
                                    style={{
                                      fontSize: '9.5px',
                                      padding: '1px 5px',
                                      background: '#F8FAFC',
                                      color: '#334155',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: '3px',
                                    }}
                                  >
                                    {oem}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top State Vehicle Registrations */}
                <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <h4 className="font-serif" style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                        Top State Vehicle Registrations
                      </h4>
                      <p style={{ fontSize: '11.5px', color: '#6B7280', margin: '2px 0 0' }}>
                        Cumulative registration volumes across key industrial and consumption states
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* View Switcher */}
                      <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <button
                          type="button"
                          onClick={() => setVahanStateViewMode('cards')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: 'none',
                            background: vahanStateViewMode === 'cards' ? '#FFFFFF' : 'transparent',
                            color: vahanStateViewMode === 'cards' ? '#0F766E' : '#64748B',
                            boxShadow: vahanStateViewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <LayoutGrid size={11} />
                          Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setVahanStateViewMode('table')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: 'none',
                            background: vahanStateViewMode === 'table' ? '#FFFFFF' : 'transparent',
                            color: vahanStateViewMode === 'table' ? '#0F766E' : '#64748B',
                            boxShadow: vahanStateViewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <List size={11} />
                          Table
                        </button>
                      </div>

                      {/* Show All Toggle */}
                      <button
                        type="button"
                        onClick={() => setVahanShowAllStates(!vahanShowAllStates)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        {vahanShowAllStates ? 'Show Top 5' : `Show All 10`}
                      </button>
                    </div>
                  </div>

                  {/* Cards View */}
                  {vahanStateViewMode === 'cards' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                      {displayedStates.map((s, idx) => {
                        const relShare = maxStateReg > 0 ? ((s.totalRegistrations / maxStateReg) * 100).toFixed(0) : '0';
                        const isPodium = idx < 3;
                        const podiumColor = idx === 0 ? '#D97706' : idx === 1 ? '#64748B' : '#B45309';
                        const podiumBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : '#FEF3C7';

                        return (
                          <div
                            key={s.stateCode}
                            style={{
                              background: '#FFFFFF',
                              border: isPodium ? `1px solid ${podiumColor}40` : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: podiumBg,
                                  color: podiumColor,
                                }}>
                                  #{idx + 1}
                                </span>
                                <strong style={{ color: '#0F766E', fontSize: '11.5px', fontWeight: 700 }}>
                                  {s.stateCode}
                                </strong>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px' }}>
                                {s.stateName}
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                                {s.formattedCount}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94A3B8', marginBottom: '8px' }}>
                                {(s.totalRegistrations ?? 0).toLocaleString('en-IN')} units
                              </div>
                            </div>

                            {/* Relative Proportion Bar */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94A3B8', marginBottom: '3px' }}>
                                <span>vs Leader</span>
                                <span>{relShare}%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${relShare}%`,
                                  height: '100%',
                                  background: isPodium ? podiumColor : '#0F766E',
                                  borderRadius: '2px',
                                }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Table View */
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (vahanStateSortCol === 'rank') setVahanStateSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                else { setVahanStateSortCol('rank'); setVahanStateSortDir('asc'); }
                              }}
                              style={{ padding: '8px 12px', fontWeight: 700, color: vahanStateSortCol === 'rank' ? '#0F766E' : '#475569', width: '60px' }}
                            >
                              Rank
                              {renderSortIcon(vahanStateSortCol, 'rank', vahanStateSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (vahanStateSortCol === 'state') setVahanStateSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                else { setVahanStateSortCol('state'); setVahanStateSortDir('asc'); }
                              }}
                              style={{ padding: '8px 12px', fontWeight: 700, color: vahanStateSortCol === 'state' ? '#0F766E' : '#475569' }}
                            >
                              State
                              {renderSortIcon(vahanStateSortCol, 'state', vahanStateSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (vahanStateSortCol === 'code') setVahanStateSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                else { setVahanStateSortCol('code'); setVahanStateSortDir('asc'); }
                              }}
                              style={{ padding: '8px 12px', fontWeight: 700, color: vahanStateSortCol === 'code' ? '#0F766E' : '#475569', width: '70px' }}
                            >
                              Code
                              {renderSortIcon(vahanStateSortCol, 'code', vahanStateSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (vahanStateSortCol === 'reg') setVahanStateSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                else { setVahanStateSortCol('reg'); setVahanStateSortDir('desc'); }
                              }}
                              style={{ padding: '8px 12px', fontWeight: 700, color: vahanStateSortCol === 'reg' ? '#0F766E' : '#475569', textAlign: 'right' }}
                            >
                              Cumulative Registrations
                              {renderSortIcon(vahanStateSortCol, 'reg', vahanStateSortDir)}
                            </th>
                            <th
                              className="tf-sortable-th"
                              onClick={() => {
                                if (vahanStateSortCol === 'rel') setVahanStateSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                                else { setVahanStateSortCol('rel'); setVahanStateSortDir('desc'); }
                              }}
                              style={{ padding: '8px 12px', fontWeight: 700, color: vahanStateSortCol === 'rel' ? '#0F766E' : '#475569', width: '150px' }}
                            >
                              Relative Index
                              {renderSortIcon(vahanStateSortCol, 'rel', vahanStateSortDir)}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedStates.map((s, idx) => {
                            const relShare = maxStateReg > 0 ? ((s.totalRegistrations / maxStateReg) * 100).toFixed(0) : '0';
                            return (
                              <tr key={s.stateCode} style={{ borderBottom: idx < displayedStates.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: idx < 3 ? '#D97706' : '#64748B' }}>
                                  #{idx + 1}
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>
                                  {s.stateName}
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', background: '#F0FDFA', color: '#0F766E', borderRadius: '4px', border: '1px solid #CCFBF1' }}>
                                    {s.stateCode}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                  {s.formattedCount} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>({(s.totalRegistrations ?? 0).toLocaleString('en-IN')})</span>
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${relShare}%`, height: '100%', background: idx === 0 ? '#D97706' : '#0F766E', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '10.5px', color: '#64748B', width: '30px', textAlign: 'right' }}>{relShare}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      );
    })()}
          </>
        )}

      {/* ── Modals matching Reference Screenshots ─────────────────── */}
      <EarningsPulseModal
        isOpen={pulseModalOpen}
        onClose={() => setPulseModalOpen(false)}
        companyName={pulseCompanyName}
        symbol={pulseSymbol}
        data={pulseModalData}
      />
      <PeadHowToUseModal
        isOpen={peadHowToUseOpen}
        onClose={() => setPeadHowToUseOpen(false)}
      />
        </TechnoFundaShell>
      </div>
    </SidebarLayout>
  );
}

export default function TechnoFundaPage() {
  return (
    <Suspense fallback={null}>
      <TechnoFundaContent />
    </Suspense>
  );
}
