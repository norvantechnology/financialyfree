'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Target,
  ShieldCheck,
  Landmark,
  GraduationCap,
  BarChart3,
  LineChart,
  Newspaper,
  PieChart,
  Activity,
  Rocket,
  Calculator,
  TrendingUp,
  Layers,
  Scale,
  FileText,
  Flame,
  Zap,
  Users,
  RefreshCw,
  Coins,
  Building2,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export type FeatureItem = {
  id: string;
  category: 'track-a' | 'valuation' | 'screeners' | 'market-data' | 'alt-data' | 'academy';
  categoryLabel: string;
  categoryColor: string;
  track: 'Track A (Free)' | 'Track B (Research)' | 'Academy';
  title: string;
  simpleName: string;
  plainEnglish: string;
  benefits: string[];
  tags: string[];
  icon: string;
  href: string;
  ctaText: string;
};

export const ALL_FEATURES: FeatureItem[] = [
  // ─── TRACK A: WEALTH PLANNING (6 TOOLS) ──────────────────────────
  {
    id: 'goal-planner',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'Goal Planner & Monthly SIP Engine',
    simpleName: 'Goal-Based SIP Calculator',
    plainEnglish: 'Tells you exactly how much money to invest each month to hit your life milestones with real inflation factored in.',
    benefits: [
      'Tailored plans for Retirement/FIRE, Kids Education, Home, or Emergency Fund',
      'Automatic inflation adjustment so you never fall short of your future target',
    ],
    tags: ['Inflation-adjusted', 'Retirement / FIRE', 'Free Forever'],
    icon: 'target',
    href: '/dashboard/goals',
    ctaText: 'Plan Your Goal Free',
  },
  {
    id: 'paperless-kyc',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'Paperless Digital KYC',
    simpleName: '3-Minute Account Activation',
    plainEnglish: 'Complete your official investment verification in 3 minutes from your phone using Aadhaar and PAN - no physical forms or branch visits.',
    benefits: [
      '100% digital verification with instant identity confirmation',
      'Bank-grade encrypted pipeline with zero paper documents required',
    ],
    tags: ['Aadhaar e-KYC', 'PAN Verified', 'Instant'],
    icon: 'shield',
    href: '/kyc',
    ctaText: 'Complete Quick KYC',
  },
  {
    id: 'sip-autopay',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'Automated SIP Execution',
    simpleName: 'Hands-off Monthly Investing',
    plainEnglish: 'Set your monthly SIP once using UPI Autopay or e-NACH, and your investments happen automatically on your chosen date.',
    benefits: [
      'Direct exchange settlement via BSE StAR MF straight to the mutual fund house',
      'Zero manual fund transfers every month - set it, forget it, and let compounding work',
    ],
    tags: ['UPI Autopay', 'e-NACH Mandate', 'Direct AMC'],
    icon: 'landmark',
    href: '/dashboard/invest',
    ctaText: 'Set Up an Auto-SIP',
  },
  {
    id: 'portfolio-tracker',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'Goal-Linked Portfolio Dashboard',
    simpleName: 'All-in-One Wealth Tracker',
    plainEnglish: 'View all your equity, debt, hybrid, and index mutual funds in one unified view with instant alerts if your asset mix shifts.',
    benefits: [
      'Live XIRR performance tracking across all your active and past investments',
      'Rebalancing alerts when your equity-to-debt ratio drifts from your ideal safety target',
    ],
    tags: ['Live XIRR', 'Asset Allocation', 'Rebalance Alerts'],
    icon: 'refresh',
    href: '/dashboard',
    ctaText: 'Open Dashboard',
  },
  {
    id: 'swp-stp-planner',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'SWP & STP Withdrawal Planner',
    simpleName: 'Retirement Monthly Income & Transfer',
    plainEnglish: 'Generate a reliable monthly pension from your mutual funds (SWP) or systematically transfer money between equity and debt funds (STP).',
    benefits: [
      'Plan sustainable monthly payouts without depleting your retirement capital',
      'Tax-efficient withdrawal strategy compared to traditional fixed deposits',
    ],
    tags: ['Monthly Pension', 'Capital Safety', 'Systematic Transfers'],
    icon: 'coins',
    href: '/dashboard/goals',
    ctaText: 'Calculate SWP Payouts',
  },
  {
    id: 'family-goals',
    category: 'track-a',
    categoryLabel: 'Wealth & SIPs',
    categoryColor: '#10b981',
    track: 'Track A (Free)',
    title: 'Household & Family Goals',
    simpleName: 'Multi-Member Goal Management',
    plainEnglish: 'Create and track separate goals for yourself, your spouse, and your children - all organized neatly under one household dashboard.',
    benefits: [
      'Individual progress bars for each family member’s college, vacation, or retirement fund',
      'Helps whole families stay aligned on long-term financial security',
    ],
    tags: ['Family View', 'Individual Goals', 'Unified Overview'],
    icon: 'users',
    href: '/dashboard/goals',
    ctaText: 'Manage Family Goals',
  },

  // ─── TRACK B: VALUATION LAB (9 MODELS) ──────────────────────────
  {
    id: 'dcf-model',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Discounted Cash Flow (DCF) Model',
    simpleName: 'Intrinsic Fair Value Calculator',
    plainEnglish: 'Calculates the true fundamental worth of a stock based on how much cash the business will generate over the next 10 years.',
    benefits: [
      'Know if a stock is currently 20% undervalued or dangerously overpriced before you buy',
      'Adjustable growth rates, discount rates (WACC), and terminal multiples',
    ],
    tags: ['Intrinsic Value', 'Free Cash Flow', 'Pro Grade'],
    icon: 'calculator',
    href: '/techno-funda',
    ctaText: 'Run DCF Model',
  },
  {
    id: 'reverse-dcf',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Reverse DCF (Expectation Checker)',
    simpleName: 'Market Hype Detector',
    plainEnglish: 'Works backwards from today’s stock price to reveal what growth rate the market expects. Tells you if the hype is unrealistic.',
    benefits: [
      'Immediately spots when a stock price requires impossible 40% growth to make sense',
      'Helps you avoid buying stocks near speculative market tops',
    ],
    tags: ['Hype Checker', 'Implied Growth', 'Reality Check'],
    icon: 'scale',
    href: '/techno-funda',
    ctaText: 'Check Expectations',
  },
  {
    id: 'graham-formula',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Benjamin Graham Fair Value Formula',
    simpleName: 'Margin-of-Safety Bargain Finder',
    plainEnglish: 'The classic formula used by the father of value investing (Warren Buffett’s teacher) to identify deeply undervalued companies with safety cushions.',
    benefits: [
      'Evaluates EPS, conservative growth estimates, and current AAA bond yields',
      'Filters out high-risk speculative plays in favor of fundamentally sound bargains',
    ],
    tags: ['Value Investing', 'Margin of Safety', 'Defensive'],
    icon: 'book',
    href: '/techno-funda',
    ctaText: 'Try Graham Model',
  },
  {
    id: 'peter-lynch-peg',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Peter Lynch Fair Value & PEG Ratio',
    simpleName: 'Growth at a Reasonable Price (GARP)',
    plainEnglish: 'Compares a company’s P/E multiple directly to its earnings growth rate to find fast-growing businesses trading at sensible prices.',
    benefits: [
      'PEG < 1.0 flags companies growing faster than their valuation multiple suggests',
      'Visual chart plotting actual stock price against Lynch Fair Value line',
    ],
    tags: ['Growth Stocks', 'PEG Ratio', 'Lynch Line'],
    icon: 'trending',
    href: '/techno-funda',
    ctaText: 'Analyze Growth Price',
  },
  {
    id: 'dividend-discount',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Dividend Discount Model (DDM)',
    simpleName: 'High-Dividend Stock Valuer',
    plainEnglish: 'Calculates the fair price of steady dividend-paying stocks based on dividend yield, historical payout ratios, and dividend growth.',
    benefits: [
      'Ideal for blue chips, PSUs, utilities, and high-yield dividend portfolio building',
      'Multi-stage Gordon Growth models with conservative dividend terminal values',
    ],
    tags: ['Dividend Yield', 'Passive Income', 'PSU & Bluechips'],
    icon: 'coins',
    href: '/techno-funda',
    ctaText: 'Value Dividend Stocks',
  },
  {
    id: 'ev-ebitda-multiples',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'EV/EBITDA & Peer Multiples',
    simpleName: 'Sector Competitor Comparison',
    plainEnglish: 'Compares enterprise value multiples across direct industry competitors to reveal which peer offers the best relative bargain.',
    benefits: [
      'Neutralizes differences in debt structure and tax rates across competing companies',
      'Interactive radar chart comparing revenue growth, margins, and multiples',
    ],
    tags: ['Peer Comparison', 'Enterprise Value', 'Relative Valuation'],
    icon: 'layers',
    href: '/techno-funda',
    ctaText: 'Compare Peer Multiples',
  },
  {
    id: 'pb-valuation',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Price-to-Book (P/B) ROE Matrix',
    simpleName: 'Bank & Financial Stock Evaluator',
    plainEnglish: 'Evaluates balance sheet net worth vs return on equity (ROE) - the gold standard method for valuing private and public sector banks.',
    benefits: [
      'Essential for financial stocks where traditional P/E ratios are unreliable',
      'RoE vs P/B scatter plot showing which banks are generating high returns at low multiples',
    ],
    tags: ['Banking & NBFCs', 'Book Value', 'ROE Matrix'],
    icon: 'barchart',
    href: '/techno-funda',
    ctaText: 'Evaluate Financials',
  },
  {
    id: 'historical-pe-bands',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Historical P/E Valuation Bands',
    simpleName: '5-Year Valuation Channel',
    plainEnglish: 'Visually shows whether a stock is currently trading near the bottom, middle, or top of its historical 5-year valuation corridor.',
    benefits: [
      'See instantly if a stock is cheap compared to its own historical standards',
      'Mean, +1 standard deviation, and -1 standard deviation valuation channels',
    ],
    tags: ['Historical Bands', 'Channel Analysis', 'Mean Reversion'],
    icon: 'linechart',
    href: '/techno-funda',
    ctaText: 'View P/E Bands',
  },
  {
    id: 'sensitivity-matrix',
    category: 'valuation',
    categoryLabel: 'Valuation Lab',
    categoryColor: '#6366f1',
    track: 'Track B (Research)',
    title: 'Valuation Sensitivity Matrix',
    simpleName: 'Scenario & Stress Testing Grid',
    plainEnglish: 'A 2D matrix that calculates the stock value under 25 different combinations of growth rates and interest rates, so you know the best and worst cases.',
    benefits: [
      'Eliminates single-point estimates - understand your downside risk in a recession',
      'Color-coded risk heat map highlighting margin of safety ranges',
    ],
    tags: ['Stress Testing', 'Scenario Analysis', 'Downside Risk'],
    icon: 'piechart',
    href: '/techno-funda',
    ctaText: 'Run Sensitivity Grid',
  },

  // ─── TRACK B: SMART SCREENERS (6 TOOLS) ──────────────────────────
  {
    id: 'pead-screener',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: 'Earnings Surprise Screener',
    simpleName: 'Post-Results Momentum Scanner',
    plainEnglish: 'Finds companies that just beat quarterly profit estimates - so you can watch the post-results move with clearer context.',
    benefits: [
      'Highlights earnings beats with surprise %, revenue growth, and volume context',
      'Useful starting point for homework - not a buy tip',
    ],
    tags: ['Quarterly Results', 'Earnings Beats', 'Surprise Momentum'],
    icon: 'barchart',
    href: '/techno-funda',
    ctaText: 'Scan Earnings Beats',
  },
  {
    id: 'order-tracker',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: 'Corporate Order Win Tracker',
    simpleName: 'Contract & Tender Scanner',
    plainEnglish: 'Automatically monitors exchange filings to detect companies winning major government, railway, defense, and corporate contracts (₹100 Cr+).',
    benefits: [
      'Calculates order value as a percentage of annual company revenue for instant impact sizing',
      'Filter by sector: Defense, Infrastructure, Solar & Green Energy, Capital Goods',
    ],
    tags: ['Contract Wins', 'Order Book Growth', 'SEBI Filings'],
    icon: 'newspaper',
    href: '/techno-funda',
    ctaText: 'View Latest Orders',
  },
  {
    id: '52w-breakout',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: '52-Week High Breakout Scanner',
    simpleName: 'All-Time High Volume Radar',
    plainEnglish: 'Scans 2,200+ NSE stocks to flag companies hitting fresh 52-week highs backed by 2x to 5x higher than normal institutional volume.',
    benefits: [
      'Filters out false breakouts by requiring strong trading volume confirmation',
      'Tracks breakout consolidation bases and immediate support/resistance levels',
    ],
    tags: ['52-Week Highs', 'Volume Surge', 'Price Breakouts'],
    icon: 'zap',
    href: '/techno-funda',
    ctaText: 'Explore Breakouts',
  },
  {
    id: 'delivery-momentum',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: 'Delivery Volume Accumulation',
    simpleName: 'Smart Money Buying vs Day Traders',
    plainEnglish: 'Filters out day-trading noise to reveal where big institutional investors are actually taking multi-day delivery and holding shares in their demat.',
    benefits: [
      'Flags sustained 3-day and 5-day delivery percentage spikes above historical averages',
      'Distinguishes real institutional accumulation from speculative intraday churn',
    ],
    tags: ['Delivery %', 'Institutional Buying', 'Holding Trends'],
    icon: 'flame',
    href: '/techno-funda',
    ctaText: 'Track Delivery Spikes',
  },
  {
    id: 'buyback-radar',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: 'Share Buyback & Tender Tracker',
    simpleName: 'Corporate Share Repurchase Radar',
    plainEnglish: 'Tracks companies buying back their own shares from the market - a strong signal that management believes the stock is undervalued.',
    benefits: [
      'Calculates buyback premium over current market price and estimated acceptance ratios',
      'Alerts you to tender offer opening and closing dates so you never miss an arbitrage window',
    ],
    tags: ['Share Repurchase', 'Buyback Premium', 'Management Confidence'],
    icon: 'sparkles',
    href: '/techno-funda',
    ctaText: 'Check Buyback Offers',
  },
  {
    id: 'circuit-freeze',
    category: 'screeners',
    categoryLabel: 'Smart Screeners',
    categoryColor: '#f59e0b',
    track: 'Track B (Research)',
    title: 'Upper/Lower Circuit Scanner',
    simpleName: 'Price Limit & Liquidity Monitor',
    plainEnglish: 'Monitors stocks locked at their daily price limits (upper or lower circuit) with real-time pending order queue imbalances and explanations.',
    benefits: [
      'See total buyers vs sellers waiting in the order book at circuit limit prices',
      'Highlights ASM/GSM surveillance stage flags to protect you from illiquid traps',
    ],
    tags: ['Circuit Breakers', 'Order Queue Depth', 'Surveillance Alerts'],
    icon: 'activity',
    href: '/techno-funda',
    ctaText: 'Scan Circuit Locks',
  },

  // ─── TRACK B: MARKET DATA & SENTIMENT (6 TOOLS) ──────────────────
  {
    id: 'market-mood-index',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'Market Mood Index (MMI)',
    simpleName: 'Fear & Greed Compass',
    plainEnglish: 'Combines 6 market indicators into one easy 0-100 score: Extreme Fear means great time to buy; Extreme Greed warns you to be careful.',
    benefits: [
      'Tracks FII flows, India VIX volatility, market breadth, and 200-day moving averages',
      'Stops emotional panic selling during market dips and FOMO chasing at peaks',
    ],
    tags: ['Sentiment Score', 'Fear & Greed', 'Timing Discipline'],
    icon: 'activity',
    href: '/techno-funda',
    ctaText: 'Check Live Market Mood',
  },
  {
    id: 'sector-heatmap',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'NSE Sector Rotation Heatmap',
    simpleName: 'Institutional Money Flow Tracker',
    plainEnglish: 'Compares all 14 NSE sector indices against Nifty 50 to show you which sectors are quietly attracting money before the broader market notices.',
    benefits: [
      'Relative Strength charts showing sector leadership vs lagging sectors over 1W, 1M, 1Y',
      'Helps you rotate capital into expanding sectors (e.g. Pharma, Auto, IT, Capital Goods)',
    ],
    tags: ['Sector Rotation', 'Relative Strength', 'NSE Indices'],
    icon: 'linechart',
    href: '/techno-funda',
    ctaText: 'View Sector Heatmap',
  },
  {
    id: 'fo-sentiment-pcr',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'F&O Open Interest & Put-Call Ratio (PCR)',
    simpleName: 'Derivatives Market Sentiment',
    plainEnglish: 'Decodes what institutional derivatives traders are betting on by analyzing strikes with highest call/put accumulation and Max Pain levels.',
    benefits: [
      'Put-Call Ratio (PCR) indicator provides contrarian reversal signals near market extremes',
      'Max Pain price calculation gives a data-backed target for weekly and monthly expiry',
    ],
    tags: ['Put-Call Ratio', 'Max Pain Level', 'Open Interest'],
    icon: 'filetext',
    href: '/techno-funda',
    ctaText: 'Analyze F&O Sentiment',
  },
  {
    id: 'insider-trading',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'Insider Trading & Promoter Pledge Radar',
    simpleName: 'Promoter Skin-in-the-Game Tracker',
    plainEnglish: 'Monitors mandatory SEBI disclosures to alert you whenever company founders and directors buy shares with their own money or increase pledged shares.',
    benefits: [
      'Promoter buying in the open market is one of the strongest bullish signals in the market',
      'Early warning notifications when promoter debt pledge ratios approach danger thresholds',
    ],
    tags: ['Promoter Buying', 'Pledge Alerts', 'SEBI Disclosures'],
    icon: 'shield',
    href: '/techno-funda',
    ctaText: 'Track Insider Buys',
  },
  {
    id: 'bulk-block-deals',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'Bulk & Block Deal Institutional Feed',
    simpleName: 'Big Whale Transaction Log',
    plainEnglish: 'Live exchange log showing high-value transactions (>0.5% of total equity) executed by foreign institutional investors, domestic mutual funds, and HNIs.',
    benefits: [
      'Discover who bought or sold large stakes, at what exact price, and the total rupee value',
      'Historical deal tracking to identify which marquee funds are backing a stock',
    ],
    tags: ['FII Transactions', 'Block Deals', 'Institutional Buying'],
    icon: 'rocket',
    href: '/techno-funda',
    ctaText: 'Check Big Deals',
  },
  {
    id: 'corporate-actions',
    category: 'market-data',
    categoryLabel: 'Market Data',
    categoryColor: '#0f766e',
    track: 'Track B (Research)',
    title: 'Corporate Actions & Earnings Calendar',
    simpleName: 'Dividends, Bonus & Splits Diary',
    plainEnglish: 'A clean calendar of upcoming dividend ex-dates, bonus share distributions, stock splits, rights issues, and board meeting dates.',
    benefits: [
      'Never miss a dividend record date or confuse an ex-bonus price adjustment',
      'Sync announcements directly with your personal stock watchlist',
    ],
    tags: ['Dividends', 'Stock Splits', 'Bonus Shares'],
    icon: 'coins',
    href: '/techno-funda',
    ctaText: 'View Action Calendar',
  },

  // ─── TRACK B: ALTERNATIVE DATA (4 TOOLS) ─────────────────────────
  {
    id: 'shareholding-radar',
    category: 'alt-data',
    categoryLabel: 'Alternative Data',
    categoryColor: '#8b5cf6',
    track: 'Track B (Research)',
    title: '8-Quarter Shareholding Pattern Radar',
    simpleName: 'Institutional Ownership History',
    plainEnglish: 'Tracks 8 quarters of ownership history across 2,200+ NSE companies. See whether foreign investors and domestic mutual funds are steadily increasing their stake.',
    benefits: [
      'Clear breakdown: Promoters, FIIs, DIIs/Mutual Funds, and Retail public shareholders',
      'Shows institutional accumulation trends before major price rallies',
    ],
    tags: ['8-Quarter History', 'FII Holding', 'DII Mutual Funds'],
    icon: 'users',
    href: '/techno-funda',
    ctaText: 'Analyze Ownership',
  },
  {
    id: 'ipo-tracker',
    category: 'alt-data',
    categoryLabel: 'Alternative Data',
    categoryColor: '#8b5cf6',
    track: 'Track B (Research)',
    title: 'IPO Tracker & Grey Market Premium (GMP)',
    simpleName: 'New Stock Listing Dashboard',
    plainEnglish: 'Complete tracker for upcoming and ongoing IPOs with live subscription numbers across Retail, QIB, and HNI categories plus grey market sentiment.',
    benefits: [
      'Anchor investor list breakdown and fund quality ratings',
      'Valuation comparisons with existing listed peers to avoid overpriced IPOs',
    ],
    tags: ['Live Subscription', 'GMP Premium', 'Anchor Investors'],
    icon: 'rocket',
    href: '/techno-funda',
    ctaText: 'Track Live IPOs',
  },
  {
    id: 'vahan-auto-data',
    category: 'alt-data',
    categoryLabel: 'Alternative Data',
    categoryColor: '#8b5cf6',
    track: 'Track B (Research)',
    title: 'Vahan Vehicle Registration Monitor',
    simpleName: 'Real-Time Auto Demand Gauge',
    plainEnglish: 'Monitors official government Vahan vehicle registration data to give you an early read on two-wheeler, passenger car, and EV demand before automakers report.',
    benefits: [
      'Real ground-level consumer demand data 2 to 3 weeks ahead of corporate press releases',
      'Sub-segment trends for electric vehicles, commercial vehicles, and rural tractors',
    ],
    tags: ['Government Data', 'Auto Industry', 'Early Demand Signal'],
    icon: 'trending',
    href: '/techno-funda',
    ctaText: 'Explore Auto Data',
  },
  {
    id: 'bank-credit-growth',
    category: 'alt-data',
    categoryLabel: 'Alternative Data',
    categoryColor: '#8b5cf6',
    track: 'Track B (Research)',
    title: 'RBI Bank Credit & Deposit Growth',
    simpleName: 'Macro Economic Fuel Gauge',
    plainEnglish: 'Monitors RBI fortnightly data on overall banking system credit and deposit expansion - the key metric that leads national GDP growth.',
    benefits: [
      'Broad economic health gauge to identify expansionary vs contractionary cycles',
      'Credit-to-deposit ratio trends to evaluate liquidity conditions across Indian banks',
    ],
    tags: ['RBI Data', 'Credit Growth', 'Macro Economic'],
    icon: 'building',
    href: '/techno-funda',
    ctaText: 'View Macro Indicators',
  },

  // ─── INVESTING ACADEMY (3 LEVELS) ────────────────────────────────
  {
    id: 'academy-beginner',
    category: 'academy',
    categoryLabel: 'Academy',
    categoryColor: '#f97316',
    track: 'Academy',
    title: 'Foundations of Long-Term Wealth',
    simpleName: 'Level 1: Beginner Masterclass',
    plainEnglish: 'Starts from zero with no financial jargon. Understand inflation, compound interest, index funds, SIPs, and how to build your first ₹10 Lakh portfolio.',
    benefits: [
      'Interactive compounding calculators and practical step-by-step video lessons',
      'Teaches you how to automate your savings without feeling lifestyle sacrifice',
    ],
    tags: ['Zero Jargon', 'Compounding', 'First ₹10 Lakh'],
    icon: 'graduation',
    href: '/courses',
    ctaText: 'Start Level 1 Free',
  },
  {
    id: 'academy-intermediate',
    category: 'academy',
    categoryLabel: 'Academy',
    categoryColor: '#f97316',
    track: 'Academy',
    title: 'Selecting Top Mutual Funds & Asset Mix',
    simpleName: 'Level 2: Fund Selection Framework',
    plainEnglish: 'Learn how to compare funds beyond simple past returns - master rolling returns, expense ratio drag, portfolio overlap, and risk-adjusted Sharpe ratios.',
    benefits: [
      'Stop blindly buying 5-star funds that underperform the next year',
      'Framework to construct a resilient 3-fund core portfolio that beats 80% of active funds',
    ],
    tags: ['Rolling Returns', 'Expense Drag', 'Sharpe Ratio'],
    icon: 'search',
    href: '/courses',
    ctaText: 'Explore Level 2',
  },
  {
    id: 'academy-advanced',
    category: 'academy',
    categoryLabel: 'Academy',
    categoryColor: '#f97316',
    track: 'Academy',
    title: 'Fundamental Equity & Valuation Mastery',
    simpleName: 'Level 3: Pro Equity Analysis',
    plainEnglish: 'Learn how to read balance sheets, evaluate cash flow quality, build your own DCF valuation models, and spot red flags before investing in individual stocks.',
    benefits: [
      'Real case studies dissecting actual Indian corporate annual reports and concall transcripts',
      'Hands-on spreadsheet modeling alongside GoalCompass live research tools',
    ],
    tags: ['Financial Statements', 'DCF Modeling', 'Forensic Checks'],
    icon: 'barchart',
    href: '/courses',
    ctaText: 'Explore Level 3',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools', count: ALL_FEATURES.length, icon: Sparkles },
  { id: 'track-a', label: 'Wealth & SIPs (Track A)', count: 6, icon: Target },
  { id: 'valuation', label: 'Valuation Lab (9)', count: 9, icon: Calculator },
  { id: 'screeners', label: 'Stock Screeners (6)', count: 6, icon: Zap },
  { id: 'market-data', label: 'Market Sentiment (6)', count: 6, icon: Activity },
  { id: 'alt-data', label: 'Alternative Data (4)', count: 4, icon: Layers },
  { id: 'academy', label: 'Academy (3)', count: 3, icon: GraduationCap },
] as const;

const GUIDED_PROMPTS = [
  { label: '🎯 Plan a goal & start an auto-SIP', cat: 'track-a' },
  { label: '💰 Check if a stock is fairly priced', cat: 'valuation' },
  { label: '⚡ Spot breakout & high-momentum stocks', cat: 'screeners' },
  { label: '🛡️ Check if the market is fearful or greedy', cat: 'market-data' },
  { label: '🎓 Learn investing step-by-step from zero', cat: 'academy' },
];

function renderIcon(name: string) {
  const props = { size: 20 };
  switch (name) {
    case 'target': return <Target {...props} />;
    case 'shield': return <ShieldCheck {...props} />;
    case 'landmark': return <Landmark {...props} />;
    case 'refresh': return <RefreshCw {...props} />;
    case 'coins': return <Coins {...props} />;
    case 'users': return <Users {...props} />;
    case 'calculator': return <Calculator {...props} />;
    case 'scale': return <Scale {...props} />;
    case 'book': return <BookOpen {...props} />;
    case 'trending': return <TrendingUp {...props} />;
    case 'layers': return <Layers {...props} />;
    case 'barchart': return <BarChart3 {...props} />;
    case 'linechart': return <LineChart {...props} />;
    case 'piechart': return <PieChart {...props} />;
    case 'newspaper': return <Newspaper {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'flame': return <Flame {...props} />;
    case 'sparkles': return <Sparkles {...props} />;
    case 'activity': return <Activity {...props} />;
    case 'filetext': return <FileText {...props} />;
    case 'rocket': return <Rocket {...props} />;
    case 'building': return <Building2 {...props} />;
    case 'graduation': return <GraduationCap {...props} />;
    case 'search': return <Search {...props} />;
    default: return <Sparkles {...props} />;
  }
}

export function FeaturesExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_FEATURES.filter((f) => {
      // Category match
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }
      // Search query match
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.simpleName.toLowerCase().includes(q) ||
        f.plainEnglish.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q)) ||
        f.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="fe-wrapper" id="feature-explorer">
      {/* ── Guided Quick Prompts for New Visitors ── */}
      <div className="fe-guide-box">
        <div className="fe-guide-title">
          <HelpCircle size={17} style={{ color: 'var(--mkt-gold)' }} />
          <span>New visitor? Click what you want to achieve:</span>
        </div>
        <div className="fe-guide-pills">
          {GUIDED_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              className={`fe-guide-pill ${selectedCategory === prompt.cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(prompt.cat);
                setSearchQuery('');
              }}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search Bar & Filter Controls ── */}
      <div className="fe-controls">
        <div className="fe-search-bar">
          <Search size={18} className="fe-search-icon" />
          <input
            type="text"
            className="fe-search-input"
            placeholder="Search all 34 tools (e.g. DCF, SIP, PEAD, Breakout, KYC, Dividends...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tools"
          />
          {searchQuery && (
            <button
              type="button"
              className="fe-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Category Tabs (Horizontal Scrollable on Mobile) ── */}
        <div className="fe-categories-scroll" role="tablist" aria-label="Feature categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`fe-cat-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                <span className="fe-cat-badge">{cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Results Header ── */}
      <div className="fe-results-header">
        <span className="fe-results-count">
          Showing <strong>{filteredFeatures.length}</strong> of {ALL_FEATURES.length} capabilities
        </span>
        {(selectedCategory !== 'all' || searchQuery) && (
          <button
            type="button"
            className="fe-reset-btn"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          >
            Show All Tools
          </button>
        )}
      </div>

      {/* ── Feature Cards Grid ── */}
      {filteredFeatures.length === 0 ? (
        <div className="fe-empty-state">
          <Search size={36} style={{ color: 'var(--mkt-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
          <h3>No matching tools found</h3>
          <p>We couldn&apos;t find any tool matching &ldquo;{searchQuery}&rdquo;. Try another term like SIP, DCF, Breakout, or Reset.</p>
          <button
            type="button"
            className="mkt-btn mkt-btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          >
            Reset Filters &amp; View All
          </button>
        </div>
      ) : (
        <div className="fe-grid">
          {filteredFeatures.map((item) => (
            <div key={item.id} className="fe-card" id={item.id}>
              {/* Card Top: Badges & Track */}
              <div className="fe-card-top">
                <div
                  className="fe-cat-chip"
                  style={{
                    color: item.categoryColor,
                    backgroundColor: `${item.categoryColor}15`,
                    borderColor: `${item.categoryColor}30`,
                  }}
                >
                  <span className="fe-chip-dot" style={{ backgroundColor: item.categoryColor }} />
                  {item.categoryLabel}
                </div>
                <span className="fe-track-pill">{item.track}</span>
              </div>

              {/* Card Title & Icon */}
              <div className="fe-card-header">
                <div
                  className="fe-card-icon"
                  style={{
                    color: item.categoryColor,
                    backgroundColor: `${item.categoryColor}12`,
                  }}
                >
                  {renderIcon(item.icon)}
                </div>
                <div>
                  <h3 className="fe-card-title">{item.title}</h3>
                  <div className="fe-card-subtitle">{item.simpleName}</div>
                </div>
              </div>

              {/* "In Plain English" Highlight Box */}
              <div className="fe-card-callout">
                <div className="fe-callout-label">
                  <Sparkles size={13} style={{ color: 'var(--mkt-gold)' }} />
                  <span>In Plain English:</span>
                </div>
                <p className="fe-callout-text">{item.plainEnglish}</p>
              </div>

              {/* Benefits Checklist */}
              <div className="fe-card-benefits">
                {item.benefits.map((b, idx) => (
                  <div key={idx} className="fe-benefit-item">
                    <CheckCircle2 size={15} className="fe-benefit-check" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Tags / Pills */}
              <div className="fe-card-tags">
                {item.tags.map((t) => (
                  <span key={t} className="fe-tag">
                    {t}
                  </span>
                ))}
              </div>

              {/* Footer CTA Button */}
              <div className="fe-card-footer">
                <Link href={item.href} className="fe-card-cta">
                  <span>{item.ctaText}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
