# FinanciallyFree Platform: Unified Master Product Requirements, System Architecture & Technical Reference

> **The Single Authoritative Specification & Technical Reference**  
> **Platform Version**: 1.0.0 Enterprise Production Build  
> **AMFI Registration**: ARN-350272 (Entity: FutureZenith Insights LLP)  
> **Repository Workspace**: `/home/ig-008/Documents/MY/financiallyfree`  
> **Synthesis**: Consolidates and replaces `financial_research_platform_full_prd-2.md`, `PLATFORM_COMPREHENSIVE_REFERENCE.md`, `docs/INTEGRATION_LEDGER.md`, and active codebase implementations into **one unified source of truth**.

---

## Master Table of Contents

1. [Executive Summary & Verified Dual-Track Product Reality](#1-executive-summary--verified-dual-track-product-reality)
2. [Regulatory Posture, AMFI Compliance & DPDP Act Framework](#2-regulatory-posture-amfi-compliance--dpdp-act-framework)
3. [Global Information Architecture, Navigation & Design System](#3-global-information-architecture-navigation--design-system)
4. [Comprehensive User Interface & Application Modules Guide](#4-comprehensive-user-interface--application-modules-guide)
   - 4.1 Public Landing Page (`/`)
   - 4.2 Authentication Suite (`/auth/login`, `/auth/register`, `/auth/forgot-password`)
   - 4.3 Dashboard Overview (`/dashboard`)
   - 4.4 Goals & FIRE Planning Suite (`/dashboard/goals`)
   - 4.5 Portfolio Tracker & Analytics (`/dashboard/portfolio`)
   - 4.6 Mutual Fund Discovery & Execution (`/dashboard/invest`)
   - 4.7 Academy & Learning Management System (LMS) (`/courses`)
   - 4.8 Pricing & Subscription Checkout (`/pricing`, `/checkout/[planId]`)
   - 4.9 Digital Paperless KYC Onboarding (`/kyc`)
   - 4.10 Admin Control Center & Data Integrity Suite (`/admin`, `/admin/data-integrity`)
5. [Techno-Funda Research Suite: Exhaustive Breakdown of All 20 Tabs & Widgets](#5-techno-funda-research-suite-exhaustive-breakdown-of-all-20-tabs--widgets)
   - 5.1 Tab 1: Market Mood Index (MMI)
   - 5.2 Tab 2: Master Tracker (High-Conviction Compounders)
   - 5.3 Tab 3: Post-Earnings Announcement Drift (PEAD Screener)
   - 5.4 Tab 4: Order Tracker Dashboard (Contract Filings)
   - 5.5 Tab 5: Valuation Lab (All 9 Valuation Frameworks & Scenarios)
   - 5.6 Tab 6: Results Calendar & Corporate Board Meetings
   - 5.7 Tab 7: News Desk & Filings Stream
   - 5.8 Tab 8: Shareholding Patterns & Institutional Accumulation
   - 5.9 Tab 9: Vahan Auto Sector Macro Intelligence
   - 5.10 Tab 10: Bank & NBFC Spread & Liability Heatmaps
   - 5.11 Tab 11: Buybacks & Tender Offer Arbitrage
   - 5.12 Tab 12: Sectoral Index Performance Heatmap & Rotation (`sector-heatmap`)
   - 5.13 Tab 13: 52-Week High & Low Breakout Screener (`52w-screener`)
   - 5.14 Tab 14: High Delivery % Momentum Screener (`delivery-momentum`)
   - 5.15 Tab 15: NSE & BSE Bulk & Block Deals Tracker (`deals`)
   - 5.16 Tab 16: F&O Open Interest, Put-Call Ratio (PCR) & Max Pain (`fno`)
   - 5.17 Tab 17: SEBI PIT & SAST Insider Trading Disclosures (`insider`)
   - 5.18 Tab 18: Circuit Breakers Watch: Upper & Lower Limits (`circuits`)
   - 5.19 Tab 19: Mainboard & SME IPO Tracker & Listing Calendar (`ipo`)
   - 5.20 Tab 20: Standalone Dividend & Corporate Action Calendar (`dividends`)
   - 5.21 Embedded Widget: RBI Repo Rate & Monetary Policy Macro Calendar (`rbi-macro`)
6. [Third-Party Integrations & External Data Pipeline Specifications](#6-third-party-integrations--external-data-pipeline-specifications)
   - 6.1 BSE StAR MF (Mutual Fund Order Routing & SIP Engine)
   - 6.2 Digio & KRA (KYC Verification & Document Processing)
   - 6.3 Razorpay Payment Gateway & Subscriptions
   - 6.4 Yahoo Finance Market Data (Delayed Indices & Quotes)
   - 6.5 NSE India Live & Historical Feeds (Breadth, Calendar, Actions)
   - 6.6 BSE India Corporate Filings (Announcements & Order Tracker)
   - 6.7 Vahan MoRTH National Automobile Registration Registry
   - 6.8 Economic Times RSS Feed (News & Market Headlines)
   - 6.9 Screener.in & Exchange Disclosures (Audited Financials)
   - 6.10 Transactional Email Service (Nodemailer / SMTP)
7. [Backend Engineering Architecture, Modules & Database Schema](#7-backend-engineering-architecture-modules--database-schema)
   - 7.1 NestJS 10 Domain Architecture
   - 7.2 Database Schema, TimescaleDB & 11 TypeORM Migrations
   - 7.3 Caching, Rate Limiting & Proxy Architecture
8. [Subscription Access Gating, Entitlement Engine & Paywall Architecture](#8-subscription-access-gating-entitlement-engine--paywall-architecture)
9. [Master Mathematical & Financial Algorithms Catalog](#9-master-mathematical--financial-algorithms-catalog)
10. [Verification, Quality Assurance & Operational Runbooks](#10-verification-quality-assurance--operational-runbooks)

---

## 1. Executive Summary & Verified Dual-Track Product Reality

### 1.1 The Dual-Track Product Reality
FinanciallyFree is built as a hybrid wealth-management and equity-intelligence platform designed specifically for Indian savers, DIY retail investors, and compounder-focused researchers. It synthesizes two interconnected tracks:

```
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │                 FinanciallyFree Ecosystem                   │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                ┌────────────────────────────────┴────────────────────────────────┐
                                ▼                                                                 ▼
      ┌──────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────┐
      │     Track A: Wealth Distribution & Education      │      │       Track B: Techno-Funda Research Suite       │
      │              (AMFI MFD ARN-350272)               │      │            (DIY Decision Support Tools)          │
      ├──────────────────────────────────────────────────┤      ├──────────────────────────────────────────────────┤
      │ • Goal-Based SIP Planning & FIRE Engine          │      │ • Market Mood Index (4-Factor Composite Gauge)   │
      │ • Paperless KYC Verification (PAN, Aadhaar, KRA) │      │ • Master Tracker (High-Conviction Watchlist)     │
      │ • BSE StAR MF Mutual Fund Execution & Mandates   │      │ • PEAD Screener (Post-Earnings Price Drift)      │
      │ • LMS Course Library (Zero to Hero Curriculum)   │      │ • Order Tracker (BSE/NSE Contract Filings)       │
      │ • Exclusive Research Community & Masterclasses  │      │ • Valuation Lab (9 Methods + Scenario Forecasts) │
      │ • Automated Portfolio Allocation & Drift Alerts  │      │ • Vahan Auto Macro, Bank/NBFC, Buybacks Arbitrage│
      └──────────────────────────────────────────────────┘      └──────────────────────────────────────────────────┘
```

1. **Track A: Wealth Distribution & Education (AMFI MFD Model)**:
   - **Goal-Based Investing**: Converts investor life goals (Emergency Fund, Child Education, Retirement/FIRE, Wealth Creation) into precision monthly SIP requirements and target asset allocations.
   - **Compliant Execution**: AMFI-registered distributor relationship (ARN-350272, FutureZenith Insights LLP) routing orders to BSE StAR MF with automated mandate registration (e-NACH, UPI Autopay).
   - **Structured LMS Academy**: 24+ hours of modular video education with student progress tracking, quizzes, and certificates.
   - **Research Community**: Case studies analyzing quarterly results and economic trends.

2. **Track B: Techno-Funda DIY Research Terminal**:
   - **Proprietary Quantitative Tools**: 11 specialized dashboards designed to analyze Indian equities from fundamental, technical, and macro perspectives without providing individual stock tips.
   - **1-Year Access Subscription**: Sold as a premium tool suite (`tools_1yr`, `bundle_all`), protected by institutional paywalls, synchronous client evaluators, and NestJS entitlement guards.

---

## 2. Regulatory Posture, AMFI Compliance & DPDP Act Framework

### 2.1 AMFI Mutual Fund Distributor (MFD) Compliance
- **Registration**: Registered with the Association of Mutual Funds in India under **ARN-350272** in the name of **FutureZenith Insights LLP**.
- **Statutory Risk Disclosure**: Displayed across all public footers, investment discovery screens, and order placement dialogues:
  > *"Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing."*
- **Execution-Only Distinction**: Operates strictly as a distributor facilitating regular mutual fund plans; does not charge advisory fees on mutual fund allocations.

### 2.2 SEBI Non-Advisory / Educational Boundary
- In strict accordance with the **SEBI (Research Analysts) Regulations, 2014** and **SEBI (Investment Advisers) Regulations, 2013**:
  - The platform does **not** distribute personalized buy/sell calls, price targets, or guaranteed return promises.
  - All Techno-Funda tools function as **objective DIY decision-support calculators** where the user provides parameters or reviews publicly disclosed exchange filings.
  - Prominently displays: *"Educational and research decision-support only. Not an offer or recommendation to buy or sell securities."*

### 2.3 Section 58 Stock Exchange Delayed Quotes Notice
- To comply with NSE Data & Analytics Ltd and BSE Ltd data redistribution guidelines:
  - All real-time market quotes and index figures (NIFTY 50, SENSEX, NIFTY BANK, INDIA VIX) are displayed with a **15-minute statutory delay**.
  - Ticker ribbons and data tables explicitly cite: *"Delayed market quotes (15-min delay) provided solely for educational and research demonstration per PRD Section 58."*

### 2.4 Digital Personal Data Protection Act (DPDP Act, 2023) & Rules 2025
- Governing India's personal data processing notified by MeitY on **13 November 2025**:
  - **Data Minimization**: Collects only required KYC parameters (PAN, DOB, Bank Account for mutual fund folio creation).
  - **Consent Management**: Clear, purpose-specific consent checkboxes during registration and KYC submission.
  - **Data Localization**: All production databases, TimescaleDB nodes, and Redis instances are deployed in Indian cloud regions (`ap-south-1` Mumbai).
  - **Children's Data Protection**: Age verification prevents underage accounts without verifiable parental consent.

---

## 3. Global Information Architecture, Navigation & Design System

### 3.1 Aureus Institutional Design System
The visual language establishes authority, trust, and clarity:
- **Palette**:
  - Deep Institutional Navy background: `#0A0F1D` (Shell), `#0F172A` (Sidebar), `#1E293B` (Cards).
  - Pro / Entitlement Gold: `#F59E0B` (Primary Amber), `#D97706` (Border Gold), `#FEF3C7` (Badge Fill).
  - Positive Performance Green: `#10B981` (Gains, Breadth Advances, Low Cost of Funds).
  - Risk / Drawdown Red: `#EF4444` (Losses, Declines, High Pledged Shares).
- **Typography**:
  - Headings & Numbers: `Fraunces` editorial serif for numbers and high-level section titles.
  - Body & Tabular Data: `Inter` sans-serif with `tabular-nums` formatting for financial tables.
- **Progress Indicators**: Standardized on `.tf-linear-loader` slim horizontal progress bars; removed distracting circular spinning loaders.

### 3.2 Shell Layouts & Dynamic Navigation
- **Sidebar Layout (`apps/web/components/sidebar-layout.tsx`)**:
  - Responsive collapsible sidebar with dual navigation groups:
    1. **WORKSPACE**: Overview, Goals & FIRE, Portfolio, Invest, Academy, Pricing.
    2. **TECHNO-FUNDA RESEARCH**: Market Mood, Master Tracker, PEAD Screener, Order Tracker, Valuation Lab, Results Calendar, News Desk, Shareholding Patterns, Vahan Auto, Bank & NBFC, Buybacks & Arbitrage.
  - **Dynamic Gating Visualization**: When accessed by an unsubscribed user (`guest` or `authenticated` free), the `TECHNO-FUNDA RESEARCH` header displays a golden `PRO` badge, and each item displays a golden `<Lock size={12} />` icon.
  - User profile menu displays user tier (`GUEST`, `MEMBER`, `PRO`, `ADMIN`) with one-click sign in/sign out.
- **Techno-Funda Shell (`apps/web/components/techno-funda-shell.tsx`)**:
  - **Slim Indices Ribbon**: Displays NIFTY 50, SENSEX, NIFTY BANK, and INDIA VIX.
  - **Desktop vs. Mobile View**:
    - Desktop: Single-row horizontal ribbon with refresh trigger and feed latency badge.
    - Mobile ($\le 640\text{px}$): Responsive 2-column benchmark card grid showing 100% of NIFTY 50 and SENSEX at a glance with zero horizontal clipping.
  - **Auto-Centering Tab Bar**: Automatically scrolls the active tab to the visual center using `scrollTo({ behavior: 'smooth' })`.

### 3.3 Mobile-First Standards ($\le 640\text{px}$)
- **No Horizontal Scroll**: All containers enforce `max-width: 100vw; overflow-x: hidden; min-width: 0;`.
- **Auto-Zoom Prevention**: All input controls enforce `font-size: 16px !important;` to stop iOS Safari from auto-zooming.
- **Accessible Touch Targets**: Every button, tab trigger, and password toggle enforces minimum dimensions of `44x44px`.

---

## 4. Comprehensive User Interface & Application Modules Guide

```
Frontend Application Routes (apps/web/app)
├── / (Public Landing Page)
├── /auth/login, /auth/register, /auth/forgot-password (Auth Suite)
├── /dashboard (Command Center Overview)
├── /dashboard/goals (Goals & FIRE Engine)
├── /dashboard/portfolio (Holdings & Asset Allocation)
├── /dashboard/invest (Mutual Fund Discovery & BSE Execution)
├── /dashboard/billing (Subscriptions & GST Invoices)
├── /courses, /courses/[slug], /courses/[slug]/lesson/[lessonId] (LMS)
├── /pricing, /checkout/[planId] (Razorpay Checkout)
├── /kyc (Paperless KYC Onboarding)
├── /admin, /admin/data-integrity (Data Integrity Suite)
└── /techno-funda (Techno-Funda Research Suite - 11 Tabs)
```

### 4.1 Public Landing Page (`/`)
- **Purpose**: Brand introduction, compliance credibility, educational value proposition, and customer onboarding funnel.
- **What We Show**:
  - Top institutional banner with AMFI ARN-350272 disclosure.
  - Hero section with live delayed indices ribbon.
  - Interactive Goal SIP calculator preview allowing prospective savers to compute monthly investments before registering.
  - Track A (Mutual Fund execution + LMS) and Track B (Techno-Funda DIY tools) feature comparison cards.
  - Fee transparency matrix comparing regular distributor zero upfront fees vs direct advisory retainers.
  - Verified investor testimonials and interactive FAQ accordion.
- **Logic**: Client-side calculation preview powered by `@ff/calc/src/goal.calc.ts`.

### 4.2 Authentication Suite (`/auth/*`)
- **Login (`/auth/login`)**:
  - Email and password input with instant format validation.
  - "Keep me signed in" checkbox storing session preferences.
  - Redirect preservation: `?redirect=/techno-funda?tab=valuation` routes the user directly back to their intended tab post-login.
- **Register (`/auth/register`)**:
  - Full name, email, mobile phone number, and password.
  - **Real-Time Password Requirement Checklist**: 4 visual stages dynamically validated as the user types (8+ chars, 1 uppercase, 1 number, 1 special symbol) with color-coded strength bar (Weak / Fair / Good / Strong).
  - Sanitizes optional mobile phone strings so empty values do not cause false validation errors.
- **Forgot Password (`/auth/forgot-password`)**:
  - Dispatches time-limited (15-min) secure cryptographic password reset links via transactional SMTP email.

### 4.3 Dashboard Overview (`/dashboard`)
- **Purpose**: Consolidated investor command center.
- **What We Show**:
  - Metric Cards: Total Net Worth, Monthly Active SIP Inflow, Realized Portfolio XIRR %, Next SIP Debit Date.
  - Asset Allocation Pie Chart (Equities, Debt, Gold, Cash).
  - Goal Milestone Progress Bars (e.g. Retirement: 42% funded, Child Education: 68% funded).
  - Recent transaction activity and portfolio metrics log.
- **Logic**: Aggregates data from `GoalsService`, `PortfolioService`, and `MfExecutionService`.

### 4.4 Goals & FIRE Planning Suite (`/dashboard/goals`)
- **Purpose**: Comprehensive financial freedom modeling and goal-based investing.
- **Goal Categories Supported**:
  1. **Retirement / FIRE**: Financial Independence, Retire Early planning.
  2. **Child Higher Education**: Long-term compounding for domestic or overseas university costs.
  3. **Home Purchase**: Down payment accumulation with real estate inflation indexation.
  4. **Wealth Creation**: General multi-asset compounding goal.
  5. **Emergency Reserve**: 6 to 12 months of living expenses stored in liquid/arbitrage funds.
- **Mathematical Formulations Implemented (`@ff/calc/src/goal.calc.ts`)**:
  - **Future Target Corpus adjusted for Inflation**:
    $$FV = PV \times (1 + i)^n$$
  - **Monthly SIP Required**:
    $$\text{SIP} = \frac{FV \times r}{(1 + r) \times ((1 + r)^n - 1)}$$
  - **Step-Up SIP Escalation (e.g., 10% annual increase)**:
    $$FV = \text{SIP}_0 \times \sum_{y=1}^{n} \left[ (1 + s)^{y-1} \times \sum_{m=1}^{12} (1 + r)^{12(n-y) + (13-m)} \right]$$
  - **FIRE Tier Multipliers**:
    - **Lean FIRE**: $20\times$ annual living expenses (Frugal, essential costs only).
    - **Standard FIRE**: $25\times$ annual living expenses (Based on the classical 4% Safe Withdrawal Rate).
    - **Fat FIRE**: $35\times$ to $50\times$ annual living expenses (High discretionary spending).
    - **Coast FIRE**: Present corpus required today to compound to target FIRE corpus without further investments:
      $$\text{Coast FIRE} = \frac{\text{Target FIRE Corpus}}{(1 + r)^t}$$

### 4.5 Portfolio Tracker & Analytics (`/dashboard/portfolio`)
- **Purpose**: Real-time tracking and rebalancing analytics for mutual funds and equities.
- **What We Show**:
  - Current Portfolio Value, Invested Capital, Total Gain/Loss (₹ and %), Portfolio XIRR %.
  - Asset Allocation Drift Radar: Compares current asset class weights against investor target profile (e.g. Target Equity: 70%, Actual: 78% $\implies$ $+8\%$ Drift Trigger).
  - Scheme-level holding breakdown: Scheme Name, Category, Units, Average NAV, Current NAV, Current Value, Returns.
- **Logic**: Uses the Newton-Raphson numerical method to compute exact money-weighted Extended Internal Rate of Return (XIRR).

### 4.6 Mutual Fund Discovery & Execution (`/dashboard/invest`)
- **Purpose**: AMFI-compliant mutual fund research, comparison, and one-click execution.
- **What We Show**:
  - Multi-category screener: Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS Tax Saver, Hybrid, Debt, Liquid.
  - Performance metrics: 1Y, 3Y, 5Y CAGR, Alpha, Beta, Sharpe Ratio, Sortino Ratio, Standard Deviation, Expense Ratio (TER %), AUM (₹ Cr), Fund Manager experience.
  - Cart and Order Drawer: Select Lumpsum or Monthly SIP, choose debit date (1st to 28th), enter investment amount.
- **Execution Logic**: Renders order confirmation and routes payload to `MfExecutionService` which dispatches to BSE StAR MF SOAP/REST APIs.

### 4.7 Academy & Learning Management System (LMS) (`/courses`)
- **Purpose**: Video-based investor education and certification.
- **Curriculum Architecture**:
  - Course Library &rarr; Modules &rarr; Lessons &rarr; Video Player &rarr; Quizzes &rarr; Automated Certificate.
- **Features**:
  - Video player with auto-resuming playback position, playback speed controls (0.75x to 2x), and bilingual Hinglish subtitle tracks.
  - Server-side progress tracking (`user_lesson_progress` table) requiring 90% watch time before unlocking lesson completion.
  - Multiple-choice knowledge check quizzes.
  - Dynamic completion certificate generation upon 100% course completion.

### 4.8 Pricing & Subscription Checkout (`/pricing`, `/checkout/[planId]`)
- **Subscription Plans**:
  1. **Starter Plan (Free)**: Access to basic dashboard, goal calculators, introductory LMS lessons.
  2. **Tools Annual (₹9,999/yr)**: Full institutional access to all 11 Techno-Funda research tabs, valuation models, and screeners.
  3. **DIY Wealth Bundle (₹14,999/yr)**: Tools Annual + Full LMS Academy Course Library (Zero to Hero curriculum).
  4. **All-Access Mastermind (₹24,999/yr)**: Full Platform + Research Community + Direct Q&A access.
- **Checkout Flow**:
  - Renders order summary with 18% GST breakdown.
  - Triggers Razorpay Checkout modal supporting UPI, NetBanking, Debit/Credit cards, and EMI.
  - Verifies signature server-side and immediately assigns user entitlements.

### 4.10 Digital Paperless KYC Onboarding (`/kyc`)
- **Purpose**: SEBI-compliant digital onboarding required before mutual fund investment.
- **4-Step Multi-Stage Wizard**:
  1. **Identity & PAN Validation**: Real-time PAN lookup against Income Tax / KRA databases.
  2. **Aadhaar e-KYC**: Paperless UIDAI OTP verification or DigiLocker XML fetch.
  3. **Bank Account Verification**: Penny-drop IMPS validation verifying account number, IFSC code, and account holder name match.
  4. **Regulatory Declarations**: FATCA/CRS self-certification, PEP (Politically Exposed Person) declaration, nominee details, and risk profiling.

### 4.11 Admin Control Center & Data Integrity Suite (`/admin`, `/admin/data-integrity`)
- **Purpose**: Internal supervisory and system health monitoring dashboard.
- **Automated Health Audits (`DataIntegrityService`)**:
  - **Foreign Key Orphan Check**: Audits orphaned records in `subscriptions`, `mf_orders`, and `goals`.
  - **Subscription Entitlement Reconciliation**: Verifies that active paid subscriptions in Razorpay match user roles and entitlement arrays.
  - **Feed Latency & Stale Data Monitor**: Flags alerts if Yahoo Finance or NSE feed timestamp latency exceeds 15 minutes.
  - **BSE StAR MF Order Reconciliation**: Audits order placement statuses against nightly RTA settlement statement files.

---

## 5. Techno-Funda Research Suite: Exhaustive Breakdown of All 20 Tabs & Widgets

```
Techno-Funda Suite Navigation Bar (/techno-funda?tab=...)
├── Market Intelligence & Sentiment
│   ├── Tab 1: Market Mood (mmi) [+ Embedded RBI Macro Policy & Repo Widget]
│   ├── Tab 2: Sector Heatmap (sector-heatmap)
│   └── Tab 3: F&O Open Interest & PCR (fno)
├── High-Momentum & Technical Breakouts
│   ├── Tab 4: 52-Week High & Low Screener (52w-screener)
│   ├── Tab 5: Delivery % Momentum Screener (delivery-momentum)
│   └── Tab 6: Circuit Breakers Watch (circuits)
├── Smart Money & Corporate Governance
│   ├── Tab 7: Bulk & Block Deals Tracker (deals)
│   ├── Tab 8: Insider Trading Disclosures - SEBI PIT (insider)
│   ├── Tab 9: Shareholding Patterns (shareholding)
│   └── Tab 10: Order Tracker Dashboard (orders)
├── Pipeline & Corporate Actions
│   ├── Tab 11: IPO Tracker & Listing Calendar (ipo)
│   ├── Tab 12: Dividends & Corporate Actions (dividends)
│   ├── Tab 13: Results Calendar (results)
│   └── Tab 14: Buybacks & Tender Arbitrage (buybacks)
└── Fundamental Research & Sector Models
    ├── Tab 15: Valuation Lab (valuation - All 9 Models)
    ├── Tab 16: Master Tracker Compounders (master-tracker)
    ├── Tab 17: PEAD Screener (pead)
    ├── Tab 18: Vahan Auto Intelligence (vahan)
    ├── Tab 19: Bank & NBFC Dashboard (bank-nbfc)
    └── Tab 20: News Desk & Live Wire (news)
```

---

### 5.1 Tab 1: Market Mood Index (MMI)

- **What is the Use?**  
  A quantitative market sentiment barometer that measures extreme fear vs. extreme greed in the Indian equity market. It prevents retail investors from FOMO-buying at euphoric tops and provides objective, data-backed confidence to accumulate during market panic selloffs.

- **What We Are Showing:**
  - **Composite Sentiment Gauge (0 to 100)**: Large high-contrast sentiment score with color-coded regime pill:
    - `0 – 30`: **Extreme Fear** (Green contrarian buy zone)
    - `31 – 50`: **Fear / Neutral** (Selective accumulation)
    - `51 – 70`: **Greed** (Caution, tightening stop-losses)
    - `71 – 100`: **Extreme Greed** (High risk, profit taking)
  - **4 Underlying Sub-Factor Breakdown Cards**:
    1. **Market Breadth** (0–100 score, advances vs declines ratio).
    2. **Volatility Index** (India VIX level and inverted score).
    3. **Trend Positioning** (NIFTY 50 distance from 200-DMA).
    4. **Institutional Liquidity & Volume** (20-day vs 50-day volume accumulation ratio).
  - **Historical Sentiment Chart**: 30-day sentiment trajectory.

- **How We Are Showing It:**
  - Rendered using CSS conic-gradient circular meters and responsive metric cards.
  - Automatically adapts to single-column on mobile and dual-column grid on desktop.

- **How We Get Dynamic Data from Third Parties:**
  - `MarketIndexService` queries `https://query1.finance.yahoo.com/v8/finance/chart/^INDIAVIX` for India VIX.
  - Queries `https://www.nseindia.com/api/allIndices` with session cookies for live NIFTY 50 advances and declines.
  - Queries historical 1-year daily candles for `^NSEI` to calculate 200-day moving average and 20-day volume ratios.

- **Mathematical Formula & Logic:**
  $$\text{MMI} = 0.35 \times S_{\text{VIX}} + 0.25 \times S_{\text{Breadth}} + 0.25 \times S_{\text{Trend}} + 0.15 \times S_{\text{Volume}}$$
  - $S_{\text{VIX}} = \max(0, \min(100, 100 - (\text{India VIX} - 10) \times 4.5))$: Lower VIX indicates higher complacency/greed.
  - $S_{\text{Breadth}} = \left(\frac{\text{Advances}}{\text{Advances} + \text{Declines}}\right) \times 100$: Direct percentage of advancing stocks.
  - $S_{\text{Trend}} = \max(10, \min(95, 50 + \left(\frac{\text{CMP} - \text{DMA}_{200}}{\text{DMA}_{200}}\right) \times 350))$: Distance above or below 200-day moving average.
  - $S_{\text{Volume}} = \max(15, \min(95, \frac{\text{Vol}_{20\text{d}}}{\text{Vol}_{50\text{d}}} \times 52))$: Volume expansion factor.

---

### 5.2 Tab 2: Master Tracker (High-Conviction Compounders)

- **What is the Use?**  
  A centralized quality watchlist of curated compounders and market leaders. It monitors quarterly guidance vs. actual performance, moat durability, institutional holding changes, and technical moving average support levels.

- **What We Are Showing:**
  - Multi-column data grid listing curated stocks (e.g. Tata Motors, Dixon Tech, Kaynes, Trent, Polycab, Titan, BEL).
  - Real-time CMP, Day Change %, and 52-Week High/Low range slider.
  - Technical Moving Average status: Position relative to 20-DMA and 100-DMA (Bullish / Testing / Bearish).
  - **Guidance vs Actuals Matrix**: Target revenue/EBITDA growth communicated in analyst calls vs. actual reported quarterly numbers.
  - **Moat Rating**: High / Medium / Wide moat classifications.
  - **Earnings Pulse Trigger**: Button opening the detailed `EarningsPulseModal`.

- **How We Are Showing It:**
  - Interactive table with sticky headers, horizontal scrolling container on mobile, search filter, and sector category pills.

- **How We Get Dynamic Data from Third Parties:**
  - Prices are dynamically refreshed via `MarketIndexService.fetchQuote()` from Yahoo Finance delayed feeds.
  - Corporate announcements and guidance transcripts are extracted from BSE/NSE filings.

- **Logic:**
  - Highlights companies where actual quarterly PAT or Revenue growth beat management guidance by $\ge 5\%$.
  - Generates alert badges when CMP touches within $2\%$ of the 20-DMA or 100-DMA support levels.

---

### 5.3 Tab 3: Post-Earnings Announcement Drift (PEAD Screener)

- **What is the Use?**  
  Implements the Nobel-prize recognized quantitative anomaly: stocks reporting significant earnings surprises do not instantly adjust on Day 1; their stock price continues to drift in the direction of the surprise over a 2-day to 20-day window.

- **What We Are Showing:**
  - Earnings surprise table with company name, symbol, sector, and reporting date.
  - **Surprise %**: Actual PAT vs. consensus analyst estimated PAT.
  - **Day 1 Reaction %**: Initial market response on the day of announcement.
  - **Post-Earnings Drift (Day 2 to Day 20)**: Cumulative abnormal price drift.
  - **Volume Expansion Ratio**: Announcement day volume vs 30-day average volume (e.g. $3.4\times$).
  - **Verdict Badge**: Strong Beat & Upward Drift, Beat with Fade, or Miss & Breakdown.
  - **How To Use Modal**: Trigger opening `PeadHowToUseModal` explaining the quantitative entry/exit rules.

- **How We Are Showing It:**
  - Color-coded drift pills (Green for positive drift, Red for negative drift) with volume breakout indicators.

- **How We Get Dynamic Data from Third Parties:**
  - Quarterly financial results extracted from NSE event calendar and BSE financial results feeds.
  - Price series fetched from Yahoo Finance daily candles to compute post-announcement price return windows ($T+1$ through $T+20$).

- **Mathematical Formula & Logic:**
  $$\text{Earnings Surprise } (\%) = \left(\frac{\text{Reported PAT} - \text{Estimated PAT}}{|\text{Estimated PAT}|}\right) \times 100$$
  $$\text{PEAD Drift } (\%) = \left(\frac{P_{T+20} - P_{T+1}}{P_{T+1}}\right) \times 100$$
  - Filters for high-probability setups where Surprise $> +10\%$ and Volume $> 2.0\times$ 30-day average.

---

### 5.4 Tab 4: Order Tracker Dashboard

- **What is the Use?**  
  Tracks significant corporate order wins, EPC contracts, defense tenders, and export agreements announced by listed Indian companies. Computes the materiality of the order relative to the company's annual revenue.

- **What We Are Showing:**
  - Announcements stream listing company, symbol, client/counterparty, contract title, announcement date, and contract duration.
  - **Order Value**: Highlighted in ₹ Crores (or converted $ Millions).
  - **% of Annual Revenue**: Metric showing the order value as a percentage of the company's trailing 12-month (TTM) revenue.
  - **Direct Exchange Filing Link**: Direct link to the official signed BSE/NSE PDF disclosure.
  - **Search & Filter Controls**: Keyword search by customer (e.g. "Saudi Aramco", "Indian Army", "Railways") or company, and minimum contract value filter.

- **How We Are Showing It:**
  - Responsive card grid and structured table with order size distribution chips.

- **How We Get Dynamic Data from Third Parties:**
  - Backed by `TechnoFundaService.getOrderTracker()`.
  - Scrapes BSE Corporate Announcements feed (`AnnSubCategoryGetData/w`).
  - Regex pattern matching extracts numbers followed by "Cr", "Crore", "Lakh", or "$ Million".
  - Correlates order size with audited TTM revenues from platform financial data.

- **Mathematical Formula & Logic:**
  $$\text{Materiality Ratio } (\%) = \left(\frac{\text{Contract Value (₹ Cr)}}{\text{TTM Company Revenue (₹ Cr)}}\right) \times 100$$
  - Contracts exceeding $15\%$ of annual revenue are flagged with a gold "Mega Win" priority badge.

---

### 5.5 Tab 5: Valuation Lab (All 9 Valuation Methodologies)

- **What is the Use?**  
  An institutional multi-model valuation sandbox allowing investors to estimate the fair intrinsic value of a company across 9 independent financial valuation frameworks.

- **What We Are Showing:**
  - Company overview with audited financial metrics (Revenue, EBITDA, Net Profit, Debt, Cash, Shares).
  - **Method Selector Tabs**:
    1. **DCF (Discounted Cash Flow)**
    2. **Relative Valuation (Peer Multiples)**
    3. **Historical Multiple Range**
    4. **Reverse DCF**
    5. **Graham Number & NCAV**
    6. **Peter Lynch Fair Value**
    7. **Dividend Discount Model (DDM)**
    8. **Asset-Based / Liquidation Valuation**
    9. **Residual Income Model**
  - **Valuation Football Field Chart**: Horizontal bar visualization comparing fair value estimates across all 9 methods against the Current Market Price (CMP).
  - **Fair Value Summary Matrix**: Computes the weighted mean intrinsic value and upside/downside percentage.

- **How We Are Showing It:**
  - Interactive parameter input sliders and numeric fields (e.g. WACC %, Terminal Growth %, Exit Multiple, Haircuts) with real-time recalculation on every keystroke.

- **How We Get Dynamic Data from Third Parties:**
  - Baseline audited financials (Tata Motors) and peers fetched via `getValuationFinancials()` from exchange disclosures and Screener.in balance sheet data.
  - Current stock price dynamically refreshed from Yahoo Finance delayed feed.

- **Mathematical Formulas for All 9 Methods:**

#### Method 1: Discounted Cash Flow (DCF - 2-Stage Model)
$$\text{Enterprise Value (EV)} = \sum_{t=1}^{n} \frac{\text{FCFF}_t}{(1 + \text{WACC})^t} + \frac{\text{Terminal Value}}{(1 + \text{WACC})^n}$$
$$\text{Perpetual Growth Terminal Value} = \frac{\text{FCFF}_n \times (1 + g)}{\text{WACC} - g}$$
$$\text{Equity Value} = \text{EV} + \text{Cash} - \text{Total Debt} - \text{Minority Interest}$$
$$\text{Fair Value Per Share} = \frac{\text{Equity Value}}{\text{Shares Outstanding}}$$

#### Method 2: Relative Valuation (Peer Multiples)
$$\text{Implied Price}_{\text{P/E}} = \text{EPS} \times \text{Peer Median P/E Multiple}$$
$$\text{Implied EV}_{\text{EV/EBITDA}} = \text{EBITDA} \times \text{Peer Median EV/EBITDA} \implies \text{Price} = \frac{\text{EV} + \text{Cash} - \text{Debt}}{\text{Shares}}$$
$$\text{Implied Price}_{\text{P/B}} = \text{BVPS} \times \text{Peer Median P/B Multiple}$$

#### Method 3: Historical Multiple Range
- Computes 5-year historical distribution of P/E and EV/EBITDA: Minimum, 25th Percentile, Median, 75th Percentile, and Maximum.
- Calculates current valuation percentile rank:
  $$\text{Percentile Rank} = \frac{\text{Count of historical observations } < \text{Current Multiple}}{\text{Total Historical Observations}} \times 100$$

#### Method 4: Reverse DCF (Implied Growth Rate Solver)
- Inverts the DCF formula to solve for the exact 5-year Free Cash Flow compound annual growth rate ($g_{\text{implied}}$) currently priced into the stock:
  $$\text{Find } g \text{ such that } \text{DCF}(g, \text{WACC}, \text{Terminal Multiple}) = \text{Current Market Price}$$
- Compares implied growth vs. historical 5-year CAGR to evaluate market expectations.

#### Method 5: Graham Number & Net-Current-Asset-Value (NCAV)
$$\text{Graham Number} = \sqrt{22.5 \times \text{EPS} \times \text{Book Value Per Share}}$$
$$\text{NCAV Per Share} = \frac{\text{Current Assets} - \text{Total Liabilities} - \text{Preferred Stock}}{\text{Shares Outstanding}}$$

#### Method 6: Peter Lynch Fair Value
$$\text{Fair Value} = \text{Long-Term EPS Growth Rate } (\%) \times \text{EPS}$$
$$\text{PEG Ratio} = \frac{\text{P/E Ratio}}{\text{Earnings Growth Rate } (\%)}$$
- **Lynch Classification**:
  - $\text{PEG} < 0.75$: *Bargain / Undervalued*
  - $0.75 \le \text{PEG} \le 1.25$: *Fair Value*
  - $\text{PEG} > 1.25$: *Overvalued / High Growth Priced In*

#### Method 7: Dividend Discount Model (DDM / Gordon Growth)
$$P_0 = \frac{D_0 \times (1 + g)}{r_e - g} = \frac{D_1}{r_e - g}$$
- Where $D_0$ = current dividend per share, $g$ = dividend growth rate, $r_e$ = required return on equity (Cost of Equity).

#### Method 8: Asset-Based / Liquidation Valuation
- Applies conservative asset realization haircuts based on balance sheet liquidation liquidity:
  $$\text{Liquidation Value} = \sum (\text{Asset}_i \times (1 - \text{Haircut}_i)) - \text{Total Liabilities}$$
  - Cash & Equivalents: $0\%$ haircut
  - Trade Receivables: $20\%$ haircut
  - Inventories: $40\%$ haircut
  - Property, Plant & Equipment (PP&E): $50\%$ haircut

#### Method 9: Residual Income Model
$$\text{Intrinsic Value} = \text{BVPS}_0 + \sum_{t=1}^{T} \frac{\text{Residual Income}_t}{(1 + r_e)^t} + \frac{\text{Residual Income}_T \times (1 + g)}{(r_e - g)(1 + r_e)^T}$$
$$\text{Where } \text{Residual Income}_t = \text{Net Income}_t - (r_e \times \text{Equity}_{t-1}) = (\text{ROE}_t - r_e) \times \text{Equity}_{t-1}$$

---

### 5.6 Tab 6: Results Calendar & Corporate Board Meetings

- **What is the Use?**  
  Monitors statutory earnings release dates, corporate board meetings, dividend declaration meetings, and quarterly financial report releases across all listed NSE/BSE securities.

- **What We Are Showing:**
  - Chronological schedule of upcoming board meetings and recently announced quarterly results.
  - Columns: Company Name, Symbol, Meeting Date, Purpose (Financial Results, Dividend, Bonus Issue, Demerger), and XBRL Filing Link.
  - Filter chips: All, Nifty 50, Today, This Week, Results Only.
  - Direct trigger to `EarningsPulseModal`.

- **How We Are Showing It:**
  - Calendar date chips, responsive table, and live search bar.

- **How We Get Dynamic Data from Third Parties:**
  - Fetched dynamically from `https://www.nseindia.com/api/event-calendar` via session-bootstrapped HTTP calls.
  - Direct download links mapped to `https://nsearchives.nseindia.com/corporate/xbrl/`.

---

### 5.7 Tab 7: News Desk & Filings Stream

- **What is the Use?**  
  Real-time stock market news aggregator, filtering noise and categorizing corporate actions, regulatory filings, order wins, and earnings headlines into actionable intelligence.

- **What We Are Showing:**
  - News card feed with headline, publication timestamp, source badge, category pill, and sanitized article excerpt.
  - Category Filter Pills: All, Orders, Results, Corporate Actions, Fundraising, Board Meetings, General.
  - External link button opening the primary article source.

- **How We Are Showing It:**
  - High-density news feed layout with relative timestamps (`14 minutes ago`) and clean typography.

- **How We Get Dynamic Data from Third Parties:**
  - Ingests Economic Times RSS 2.0 feed (`https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms`).
  - Automated regex and keyword classification tags articles.
  - Strips HTML tags and decodes XML entities.

---

### 5.8 Tab 8: Shareholding Patterns & Institutional Trends

- **What is the Use?**  
  Tracks ownership changes across listed companies under SEBI (Listing Obligations and Disclosure Requirements) Regulation 31. Identifies promoter accumulation, promoter share pledging risks, and FII/DII institutional positioning.

- **What We Are Showing:**
  - Ownership breakdown bar chart and data table:
    - **Promoter & Promoter Group %**
    - **Pledged Promoter Shares %** (Crucial risk indicator)
    - **Foreign Institutional Investors (FII) %**
    - **Domestic Institutional Investors (DII / Mutual Funds) %**
    - **Public & Retail %**
  - Quarter-on-Quarter (QoQ) trend comparison showing institutional accumulation or dumping.

- **How We Are Showing It:**
  - Horizontal stacked percentage bars and trend comparison badges.

- **How We Get Dynamic Data from Third Parties:**
  - Parsed from quarterly SEBI Reg 31 XBRL filings uploaded to NSE/BSE corporate disclosure servers.

- **Logic:**
  - Flags high risk if Promoter Pledged Shares exceed $20\%$ of promoter holding.
  - Identifies smart money interest if combined FII + DII holding increased by $> 1.5\%$ in the latest quarter.

---

### 5.9 Tab 9: Vahan Auto Sector Macro Intelligence

- **What is the Use?**  
  Tracks nationwide automobile registration figures from the Government of India Ministry of Road Transport & Highways (MoRTH). Acts as an essential leading macro indicator for auto OEM performance, EV adoption, and rural vs. urban consumer demand.

- **What We Are Showing:**
  - **Sub-Views**:
    1. **Company View (`VahanCompanyView`)**: OEM-specific registration volumes and market share trajectories (Maruti Suzuki, Tata Motors, M&M, Bajaj Auto, Hero MotoCorp, TVS Motor, Ashok Leyland).
    2. **Category Group View (`VahanCategoryGroupView`)**: Vehicle segment breakdown across 2-Wheelers, 3-Wheelers, Passenger Cars (4W), Commercial Vehicles, and Agricultural Tractors.
    3. **Industry View (`VahanIndustryView`)**: Aggregate national auto registration trends, YoY growth percentages, and state-wise registration volume rankings (Maharashtra, Uttar Pradesh, Tamil Nadu, Gujarat, Karnataka).
  - **EV Transition Meter**: Electric vehicle registration count and EV penetration % by category.

- **How We Are Showing It:**
  - ECharts interactive bar/line charts, monthly registration trend matrices, and state heat tables.

- **How We Get Dynamic Data from Third Parties:**
  - Managed by `VahanEtlService`.
  - ETL engine aggregates and normalizes national vehicle registration records from the official MoRTH database.

---

### 5.10 Tab 10: Bank & NBFC Liability & Spread Heatmaps

- **What is the Use?**  
  Benchmarking engine for Indian commercial banks and NBFCs. Analyzes funding costs, margin resilience, asset quality, and liability profiles across varying interest rate cycles.

- **What We Are Showing:**
  - 12-Year Longitudinal Dataset across 12 major Indian banks:
    - HDFC Bank, ICICI Bank, State Bank of India (SBI), Axis Bank, Kotak Mahindra Bank, IndusInd Bank, Bank of Baroda, Punjab National Bank, Federal Bank, IDFC FIRST Bank, AU Small Finance Bank, Bandhan Bank.
  - **Key Banking Metrics**:
    - **Cost of Funds (CoF %)**: Interest expensed divided by average interest-bearing liabilities.
    - **Return on Assets (RoA %)**: Net profit generated per rupee of bank assets.
    - **Net Interest Margin (NIM %)**: Spread between interest earned and interest expensed.
    - **CASA Ratio %**: Low-cost Current Account & Savings Account deposit share.
    - **Asset Quality**: Gross Non-Performing Assets (GNPA %) and Net NPA %.
  - **Historical Cost of Funds Heatmap**: Color-coded matrix tracking cost of funds from FY14 to FY26.

- **How We Are Showing It:**
  - **Dynamic Mobile-First Top Banner**:
    - **Header & Segmented Control**: Responsive title layout with 100% mobile-width segmented pills (`All Lenders`, `Private Banks`, `PSU Banks`) with equal distribution and touch-friendly targets.
    - **Dynamic Fluid Search**: Full-width on mobile with instant debounce and clear button.
    - **Responsive Dropdowns**: 2-column grid layout on mobile devices (`Metric` and `Bank` selectors) ensuring zero horizontal clipping.
    - **Interactive Metric Isolation**: Dropdown dynamically toggles between showing all 3 heatmaps or focusing on an individual metric (Cost of Funds, ROA, or Total Deposits), eliminating excessive mobile scroll fatigue.
    - **Live Result Counter & 1-Tap Reset**: Real-time counter ("Showing X of Y Banks") with active filter badges and reset button.
    - **Horizontal Touch Scroll Hints**: Visual swipe indicators guiding users through 12-year longitudinal fiscal data on mobile screens.
  - Heatmap tables with conditional cell formatting (Green for low cost of funds/high RoA, Red for high funding cost/strained spreads).

- **How We Get Dynamic Data from Third Parties:**
  - Extracted from statutory annual reports, RBI supervisory returns, and quarterly investor presentations.

---

### 5.11 Tab 11: Buybacks & Tender Offer Arbitrage

- **What is the Use?**  
  Identifies cash-rich companies announcing share buybacks via the tender offer route. Evaluates arbitrage returns for retail investors leveraging SEBI's $15\%$ small shareholder reservation quota.

- **What We Are Showing:**
  - Active and upcoming buybacks table: Company Name, Symbol, Buyback Price (₹), Current Market Price (₹), Buyback Size (₹ Cr), Tender Route (Tender Offer vs Open Market), and Record Date.
  - **Buyback Premium %**: Spread between Buyback Price and CMP.
  - **Retail Quota Analysis**: Small shareholder eligibility limit ($\le ₹2,00,000$ market value on record date per SEBI Buyback Regulations 2018).
  - **Arbitrage Calculator**:
    - Parameter inputs: Total shares tendered, estimated acceptance ratio ($20\%$ to $100\%$), expected unaccepted share drop price.
    - Outputs: Gross profit, post-tax net profit, holding duration, and annualized return on investment (IRR %).

- **How We Are Showing It:**
  - Interactive calculator card with dynamic acceptance ratio sensitivity sliders.

- **How We Get Dynamic Data from Third Parties:**
  - Ingested from NSE Corporate Actions feed (`https://www.nseindia.com/api/corporates-corporateActions?index=equities`).

- **Mathematical Formula & Logic:**
  $$\text{Buyback Premium } (\%) = \left(\frac{\text{Buyback Price} - \text{CMP}}{\text{CMP}}\right) \times 100$$
  $$\text{Arbitrage Profit} = \left(\text{Shares Tendered} \times \text{Acceptance Ratio} \times (\text{Buyback Price} - \text{CMP})\right) - \left(\text{Shares Unaccepted} \times (\text{CMP} - P_{\text{exit}})\right)$$
  $$\text{Annualized Return (IRR } \%) = \left(\frac{\text{Net Arbitrage Profit}}{\text{Capital Deployed}}\right) \times \left(\frac{365}{\text{Holding Period in Days}}\right) \times 100$$

---

### 5.12 Tab 12: Sectoral Index Performance Heatmap & Rotation (`sector-heatmap`)

- **What is the Use?**  
  Empowers investors and swing traders to track money flow, capital rotation, and relative strength across 11 key NSE sectoral indices (NIFTY IT, Bank, Auto, Pharma, FMCG, Metal, Energy, Realty, Media, Infra, PSE). Helps identify sector leadership before broad index breakouts occur.

- **What We Are Showing:**
  - **Color-Coded Sector Performance Heatmap**: Real-time performance tiles colored across deep green (+3%+), soft green, neutral, soft red, and deep red (-3%-).
  - **Multi-Timeframe Return Matrix**: Toggleable between 1-Day, 1-Week, 1-Month, and 1-Year returns.
  - **Sector Market Breadth Meter**: Real-time advance vs. decline counts, advance percentage, and volume distribution for each sector.
  - **Sector Valuation Multiples**: Trailing P/E, P/B ratio, and dividend yields compared against their 5-year historical averages.
  - **Top Index Movers & Draggers**: Specific constituent stocks contributing the highest positive and negative points.

- **How We Are Showing It:**
  - Responsive CSS flex-wrap and auto-fill grid with mobile-first card tiles.
  - Smooth hover zoom transitions, progress meters for market breadth, and zero horizontal scrolling.

- **How We Get Dynamic Data from Third Parties:**
  - Calls `MarketIndexService.getSectorHeatmap()`.
  - Backend queries `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` for each sectoral index (`^CNXIT`, `^NSEBANK`, `^CNXAUTO`, `^CNXPHARMA`, `^CNXFMCG`, `^CNXMETAL`, `^CNXENERGY`, `^CNXREALTY`, `^CNXINFRA`, `^CNXPSE`, `^CNXMEDIA`).
  - Fallback cache provides calibrated baseline snapshots when markets are closed.

- **Mathematical Formula & Logic:**
  $$\text{Return}_{t} = \left(\frac{P_{t} - P_{0}}{P_{0}}\right) \times 100$$
  $$\text{Sector Breadth } (\%) = \left(\frac{\text{Constituents Advancing}}{\text{Total Constituents}}\right) \times 100$$
  $$\text{Relative Strength Index (vs NIFTY)} = \frac{\text{Sector Return}_{1\text{M}}}{\text{NIFTY Return}_{1\text{M}}}$$

---

### 5.13 Tab 13: 52-Week High & Low Breakout Screener (`52w-screener`)

- **What is the Use?**  
  Identifies momentum breakouts and cyclical turnaround candidates by monitoring NSE/BSE equities creating fresh 52-week highs or 52-week lows during market hours. Eliminates the need for expensive third-party charting terminals.

- **What We Are Showing:**
  - **Dual Breakout Feeds**: Stocks making fresh 52-week highs vs. stocks hitting fresh 52-week lows today.
  - **Proximity Filter Chips**:
    - `All Breakouts`
    - `Fresh 52W High Today` (Distance $\le 0.5\%$)
    - `Fresh 52W Low Today` (Distance $\le 0.5\%$)
    - `Within 3% of 52W High` (Pre-breakout setups)
    - `Within 5% of 52W Low` (Oversold value hunting)
  - **Breakout Margin & Volume Surge**: Percentage breakout above prior 52W resistance and relative volume multiple ($V / V_{\text{avg-20}}$).
  - **Sector & Market Cap Badges**: Instant categorization into Large Cap, Mid Cap, Small Cap, and industry sector.

- **How We Are Showing It:**
  - High-contrast responsive data table with sticky headers on desktop, and card-view transformation on mobile devices.
  - Interactive search input with instant debounced filtering across symbol, company name, and sector.

- **How We Get Dynamic Data from Third Parties:**
  - Backend `TechnoFundaService.get52WeekHighLow()` fetches from NSE live analysis feed: `https://www.nseindia.com/api/live-analysis-52-week-high-low?index=allstocks` using session headers.
  - Fallback engine delivers curated high/low equity baselines ensuring zero downtime.

- **Mathematical Formula & Logic:**
  $$\text{Proximity to 52W High } (\%) = \left(\frac{\text{52W High} - \text{CMP}}{\text{52W High}}\right) \times 100$$
  $$\text{Breakout Margin } (\%) = \left(\frac{\text{CMP} - \text{Prev 52W High}}{\text{Prev 52W High}}\right) \times 100$$
  $$\text{Volume Multiplier} = \frac{\text{Today's Volume}}{\text{20-Day Average Volume}}$$

---

### 5.14 Tab 14: High Delivery % Momentum Screener (`delivery-momentum`)

- **What is the Use?**  
  Filters out speculative intraday churn from genuine institutional accumulation. It screens for equities trading near their 52-week highs backed by high delivery percentages ($> 50\%$) and expanding volume, signaling that long-term "smart money" is taking shares into demat accounts.

- **What We Are Showing:**
  - **Institutional Delivery Ratio**: Exact percentage of traded volume marked for delivery vs. intraday square-off.
  - **52W High Proximity**: Stocks within $0\%$ to $10\%$ of their 52-week high.
  - **Delivery Spike Multiple**: Current day's delivery volume divided by 10-day average delivery volume.
  - **Conviction Score (0 to 100)**: Proprietary composite ranking incorporating proximity, delivery percentage, and volume expansion.
  - **Filter Presets**: "Ultra High Delivery (>70%)", "Near Breakout (<3% of 52W High)", "Large Cap Only", "Mid & Small Cap Momentum".

- **How We Are Showing It:**
  - Dual presentation: Interactive ranking table with horizontal mini delivery-progress bars and card grid for quick mobile inspection.
  - Color-coded badges: Emerald for $>65\%$ delivery, Amber for $50–65\%$.

- **How We Get Dynamic Data from Third Parties:**
  - Backend extracts security-wise price volume delivery position reports from NSE/BSE daily bhavcopy feeds.
  - Calculated daily post-market close and cached for 15 minutes during trading hours.

- **Mathematical Formula & Logic:**
  $$\text{Delivery } \% = \left(\frac{\text{Delivery Quantity}}{\text{Traded Quantity}}\right) \times 100$$
  $$\text{Conviction Score} = 0.40 \times \text{Delivery } \% + 0.35 \times \left(100 - 10 \times \text{Distance from 52WH } \%\right) + 0.25 \times \min\left(100, \frac{V_{\text{del}}}{V_{\text{avg10}}} \times 50\right)$$

---

### 5.15 Tab 15: NSE & BSE Bulk & Block Deals Tracker (`deals`)

- **What is the Use?**  
  Tracks large transactions by institutional investors (FIIs, DIIs, Mutual Funds, AIFs), promoters, and marquee super-investors (e.g., Ashish Kacholia, Vijay Kedia, Mukul Agrawal). Identifies accumulation patterns and sudden promoter exits.

- **What We Are Showing:**
  - **Transaction Classification**: Bulk Deals (transactions $>0.5\%$ of listed equity) vs. Block Deals (single trades $>₹10\text{ Cr}$ conducted during dedicated 15-minute exchange windows).
  - **Client & Institution Identification**: Full name of acquiring or disposing party with Marquee Investor badge highlights.
  - **Action Tag**: Distinct color-coded badges for **BUY** (Emerald) and **SELL** (Rose).
  - **Financial Metrics**: Quantity of shares, Trade Execution Price (₹), and Total Deal Value in ₹ Crores.
  - **Filter Controls**: Filter by Marquee Investors Only, Buy Deals Only, Block Deals Only, and Search by Symbol/Client.

- **How We Are Showing It:**
  - Clean, institutional table layout with sticky headers and responsive cards for smaller screens.
  - Instant client search with one-click filtering by prominent fund houses.

- **How We Get Dynamic Data from Third Parties:**
  - Ingested dynamically from NSE daily bulk/block deal disclosures (`https://www.nseindia.com/api/historical/bulk-block-deals`) and BSE bulk deal announcements.
  - Cached for 15 minutes with fallback seeded records for off-market hours.

- **Mathematical Formula & Logic:**
  $$\text{Deal Value (₹ Cr)} = \frac{\text{Quantity} \times \text{Trade Price}}{10,000,000}$$
  $$\text{Equity Stake Transacted } (\%) = \left(\frac{\text{Quantity}}{\text{Total Outstanding Shares}}\right) \times 100$$

---

### 5.16 Tab 16: F&O Open Interest, Put-Call Ratio (PCR) & Max Pain (`fno`)

- **What is the Use?**  
  Provides options market intelligence and derivatives positioning. Retail traders use PCR and Max Pain to gauge institutional hedging, identify expiry support/resistance pin levels, and avoid entering bullish positions into massive call-writing walls.

- **What We Are Showing:**
  - **Put-Call Ratio (PCR)**: Overall Volume PCR and Open Interest (OI) PCR for NIFTY 50, BANK NIFTY, and NIFTY FINANCIAL SERVICES.
  - **Max Pain Strike Price**: The exact strike price where option buyers collectively lose the maximum money upon expiry.
  - **Strike-by-Strike Open Interest Bar Chart**: Side-by-side comparison of Call OI (Red) vs. Put OI (Green) across the 10 nearest In-The-Money and Out-of-The-Money strikes.
  - **OI Change & Buildup Classification**: Real-time tags for Long Buildup, Short Buildup, Short Covering, and Long Unwinding.
  - **Expiry Rollover Percentage**: Month-end futures rollover percentage compared to 3-month averages.

- **How We Are Showing It:**
  - Visual strike bars with Call vs. Put bar comparisons rendered via pure responsive CSS.
  - Gauge cards for PCR and highlighted strike badges for Max Pain.

- **How We Get Dynamic Data from Third Parties:**
  - Backend queries NSE derivatives option-chain JSON feeds (`https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY`).
  - Aggregated and refreshed every 5 minutes during market hours.

- **Mathematical Formula & Logic:**
  $$\text{PCR}_{\text{OI}} = \frac{\sum \text{Total Put Open Interest}}{\sum \text{Total Call Open Interest}}$$
  $$\text{Max Pain} = \arg\min_{S} \sum_{i} \left( \max(0, S - K_i) \times \text{OI}_{\text{Call}, i} + \max(0, K_i - S) \times \text{OI}_{\text{Put}, i} \right)$$

---

### 5.17 Tab 17: SEBI PIT & SAST Insider Trading Disclosures (`insider`)

- **What is the Use?**  
  Monitors statutory disclosures submitted under SEBI (Prohibition of Insider Trading) Regulations, 2015 and SEBI SAST Regulations. Promoter buying with their own personal capital is universally considered one of the highest-conviction fundamental buy signals.

- **What We Are Showing:**
  - **Insider Category**: Promoter, Promoter Group, Director, Key Managerial Personnel (KMP), or Relative.
  - **Acquisition / Disposal Mode**: Open Market Purchase, Preferential Allotment, ESOP Exercise, Market Sale, or Pledge Invocation.
  - **Pre & Post Shareholding %**: Exact stake before the transaction and new post-transaction holding percentage.
  - **Transaction Value & Volume**: Total shares bought/sold and total financial consideration in ₹ Lakhs / ₹ Crores.
  - **Pledge Tracking**: Specific alerts when promoters pledge or release shares against borrowings.

- **How We Are Showing It:**
  - Tabular disclosure view with promoter buy/sell badges.
  - Fast filter pills: "Promoter Buys Only", "Open Market Buys", "Pledge Alerts", "High Value (>₹1 Cr)".

- **How We Get Dynamic Data from Third Parties:**
  - Ingests from NSE PIT disclosures API (`https://www.nseindia.com/api/corporates-pit`) and BSE XBRL regulatory filing feeds.
  - Cached for 15 minutes.

- **Mathematical Formula & Logic:**
  $$\text{Stake Change } (\%) = \text{Post Transaction } \% - \text{Pre Transaction } \%$$
  $$\text{Transaction Value (₹ Cr)} = \frac{\text{Securities Transacted} \times \text{Avg Price}}{10,000,000}$$

---

### 5.18 Tab 18: Circuit Breakers Watch: Upper & Lower Limits (`circuits`)

- **What is the Use?**  
  Real-time radar for equities hitting their exchange-mandated daily circuit limits (2%, 5%, 10%, 20%). Useful for identifying high-momentum breakout leaders (Upper Circuits) and dangerous liquidity traps where sellers are stuck with no buyers (Lower Circuits).

- **What We Are Showing:**
  - **Circuit Lock Categories**:
    - **Upper Circuit (UC)**: Stocks locked with only buyers and zero pending sell orders.
    - **Lower Circuit (LC)**: Stocks locked with only sellers and zero pending buy orders.
  - **Price Band Filter**: Filter by 2%, 5%, 10%, or 20% regulatory circuit bands.
  - **Consecutive Circuit Counter**: Badges highlighting how many consecutive sessions the stock has hit circuits (e.g., "3rd Straight UC").
  - **Pending Order Book Queue**: Approximate buy/sell quantity queued at the circuit limit price.

- **How We Are Showing It:**
  - Split grid with Upper Circuits (Green) and Lower Circuits (Red) tabs and quick toggle switches.
  - Alert badges warning about surveillance frameworks (ASM / ESM / GSM Stage I-IV).

- **How We Get Dynamic Data from Third Parties:**
  - Evaluates daily exchange price band updates from NSE and BSE bhavcopy.
  - Verified against live quote limits and cached for 5 minutes during trading sessions.

- **Mathematical Formula & Logic:**
  $$\text{Upper Circuit Price} = \text{Previous Close} \times \left(1 + \frac{\text{Band } \%}{100}\right)$$
  $$\text{Lower Circuit Price} = \text{Previous Close} \times \left(1 - \frac{\text{Band } \%}{100}\right)$$

---

### 5.19 Tab 19: Mainboard & SME IPO Tracker & Listing Calendar (`ipo`)

- **What is the Use?**  
  A single institutional dashboard tracking ongoing and upcoming Initial Public Offerings across both NSE Mainboard and NSE Emerge / BSE SME platforms. Tracks retail, HNI, and QIB subscription multiples, grey market premium (GMP) estimates, and listing day performance.

- **What We Are Showing:**
  - **IPO Status Pipeline**:
    - `Live Bidding`: Open today with real-time bidding counter.
    - `Upcoming`: Filing RHP/DRHP with scheduled issue dates.
    - `Recent Listings`: Listed in the past 30 days with listing gain % and current performance vs issue price.
  - **Subscription Breakdown**: Overall Subscription multiple, QIB multiple, NII/HNI multiple, and Retail multiple.
  - **Issue Details**: Issue Price Band (₹), Lot Size, Total Issue Size in ₹ Crores, and Fresh Issue vs. Offer for Sale (OFS) split.
  - **Estimated GMP & Expected Listing Gain**: Estimated grey market premium and calculated percentage listing profit.

- **How We Are Showing It:**
  - Interactive status tabs with animated active indicators.
  - Detailed card drawers revealing anchor investor commitments and subscription progress bars.

- **How We Get Dynamic Data from Third Parties:**
  - Ingests from NSE Public Issues feed (`https://www.nseindia.com/api/ipo-current-issue`) and BSE IPO bidding console data.
  - Cached for 30 minutes with fallback tracking for upcoming pipeline deals.

- **Mathematical Formula & Logic:**
  $$\text{Overall Subscription} = \frac{\text{Total Bids Received}}{\text{Total Shares Offered}}$$
  $$\text{Estimated Listing Gain } (\%) = \left(\frac{\text{GMP}}{\text{Upper Price Band}}\right) \times 100$$
  $$\text{Post-Listing Return } (\%) = \left(\frac{\text{CMP} - \text{Issue Price}}{\text{Issue Price}}\right) \times 100$$

---

### 5.20 Tab 20: Standalone Dividend & Corporate Action Calendar (`dividends`)

- **What is the Use?**  
  A specialized calendar for income investors and dividend yield compounders. Tracks upcoming Ex-Dividend dates, record dates, dividend amounts, dividend yield percentages, bonus share ratios, and stock splits.

- **What We Are Showing:**
  - **Action Classification**: Dividends, Bonus Issues, Stock Splits, and Rights Issues.
  - **Dividend Metrics**: Dividend Amount per share (₹), Dividend Yield % calculated on current market price, and Ex-Date countdown.
  - **Corporate Split & Bonus Ratios**: Clear representation of bonus ratios (e.g. 1:1, 2:1) and split ratios (e.g. ₹10 to ₹1 face value).
  - **High Yield Filter**: One-click filter to display only stocks with dividend yields $> 3.0\%$.
  - **Date Timeline Grouping**: Grouped into "Ex-Date This Week", "Next Week", and "Upcoming Month".

- **How We Are Showing It:**
  - Calendar table with calendar-icon ex-date badges, yield pills, and search by company name.
  - Fully responsive layout with mobile-optimized horizontal date chips.

- **How We Get Dynamic Data from Third Parties:**
  - Ingests from NSE Equities Corporate Actions feed (`https://www.nseindia.com/api/corporates-corporateActions?index=equities`).
  - Cached for 1 hour.

- **Mathematical Formula & Logic:**
  $$\text{Dividend Yield } (\%) = \left(\frac{\text{Total Dividend Per Share (Annual)}}{\text{CMP}}\right) \times 100$$
  $$\text{Adjusted Price Post-Split} = \frac{\text{Pre-Split CMP}}{\text{Split Ratio}}$$

---

### 5.21 Embedded Widget: RBI Repo Rate & Monetary Policy Macro Calendar (`rbi-macro`)

- **What is the Use?**  
  Embedded inside the Market Mood Index tab to contextualize equity market sentiment against macroeconomic interest rate cycles, inflation dynamics, and RBI Monetary Policy Committee (MPC) decisions.

- **What We Are Showing:**
  - **Current Policy Rates Grid**: Repo Rate (6.50%), SDF Rate (6.25%), MSF Rate (6.75%), Bank Rate (6.75%), CRR & SLR.
  - **Next MPC Meeting Countdown**: Scheduled meeting dates, expected policy action (Pause / Cut / Hike), and policy stance.
  - **Macroeconomic Dashboard**: CPI Inflation rate vs RBI tolerance band, India 10-Year Benchmark G-Sec Yield, and FY26 GDP growth projections.
  - **Historical Repo Rate Trajectory**: Step-by-step history of rate hikes and cuts across the recent tightening/easing cycle.

- **How We Are Showing It:**
  - Sleek card with RBI seal branding, color-coded rate badges, and MPC timeline card.
  - Displayed seamlessly beneath the MMI gauge on both mobile and desktop.

- **How We Get Dynamic Data from Third Parties:**
  - Sourced from RBI publications and press releases with fallback monetary policy baseline records.
  - Cached for 24 hours.

---

## 6. Third-Party Integrations & External Data Pipeline Specifications

| Provider / Entity | Protocol & Methods | Purpose in Platform | Cache TTL | Fallback Behavior |
|---|---|---|---|---|
| **BSE StAR MF** | SOAP / XML over HTTPS | UCC creation, purchase/redemption routing, e-NACH/UPI mandates | Real-time | `BseStarMfMockProvider` sandbox emulation |
| **Digio / KRA** | REST API + Webhooks | PAN validation, Aadhaar e-KYC, CVL/NDML KRA fetch | Real-time | `KycMockProvider` sandbox emulation |
| **Razorpay** | REST API + Webhooks | Plan order creation, HMAC-SHA256 signature verification | Real-time | Local subscription simulation via `ff_active_sub` |
| **Yahoo Finance** | HTTPS Chart API (v8) | NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX, 11 Sector Indices | 5 minutes | Platform reference close benchmarks with 15-min notice |
| **NSE India (Core & Breadth)** | Session / JSON API | Market Breadth (`allIndices`), Event calendar, XBRL filings | 5 minutes | Seeded quarterly earnings & board meeting baseline |
| **NSE India (52W High/Low)** | JSON API (`live-analysis-52-week-high-low`) | Daily 52-week high & low breakouts and proximity screener | 5 minutes | Calibrated baseline of momentum stocks |
| **NSE India (Bulk & Block Deals)** | JSON API (`historical/bulk-block-deals`) | Daily bulk & block transactions and marquee investor tracking | 15 minutes | Seeded institutional block trade history |
| **NSE India (Derivatives F&O)** | JSON API (`option-chain-indices`) | Open Interest distribution, Put-Call Ratio (PCR), and Max Pain | 5 minutes | Calibrated strikes and option chains for NIFTY & Bank NIFTY |
| **NSE India (Insider Trading)** | JSON API (`corporates-pit`) | SEBI PIT disclosures, promoter purchases, sales, and pledges | 15 minutes | Disclosed regulatory filings baseline |
| **NSE & BSE (IPO Pipeline)** | JSON API (`ipo-current-issue`) | Live bidding subscriptions, GMP estimates, upcoming issues | 30 minutes | Mainboard & SME issuance database |
| **NSE India (Corporate Actions)** | JSON API (`corporates-corporateActions`) | Dividend calendar, stock splits, bonus issues, and rights issues | 1 hour | Ex-date scheduled corporate action baseline |
| **BSE India** | JSON REST API | Corporate announcements (`AnnSubCategoryGetData/w`), PDFs | 10 minutes | Curated industrial and EPC contracts database |
| **Reserve Bank of India (RBI)** | HTTPS Regulatory Extraction | Monetary policy rates (Repo, MSF, SDF), MPC dates, CPI inflation | 24 hours | RBI MPC policy statement archive |
| **Vahan MoRTH** | HTTP Extraction & ETL | National vehicle registrations (2W, 3W, 4W, CV, EV, Tractors) | 24 hours | Historical MoRTH longitudinal dataset (2018–2026) |
| **Economic Times** | RSS 2.0 XML Stream | Live financial market headlines and corporate news | 5 minutes | Cached news archive with NLP category tagging |
| **Screener.in / Filings** | HTTPS Scraper | Balance sheets, P&L statements, Free Cash Flows, Debt | 1 hour | Tata Motors audited financial statements baseline |
| **SMTP / Nodemailer** | TLS Port 587/465 | Verification emails, password reset tokens, invoices | Real-time | Console logger fallback when SMTP credentials are unset |

---

## 7. Backend Engineering Architecture, Modules & Database Schema

### 7.1 NestJS 10 Domain Architecture
The backend application in `apps/api` follows domain-driven modularity:
- **`AppModule`**: Root module wiring TypeORM, BullMQ, CacheModule, and domain submodules.
- **`AdminModule`**: Houses `DataIntegrityService` (database health, orphaned record audits) and `AccountIntegrityService` (AML/KYC checks).
- **`AuthModule`**: Passport JWT authentication strategy, bcrypt password hashing, `AppThrottlerGuard` rate limiter, and `EntitlementGuard`.
- **`GoalsModule`**: Goal creation, target amount indexation, and SIP calculation APIs.
- **`KycModule`**: Orchestrates Digio and KRA verification workflows.
- **`LmsModule`**: Course catalog, module hierarchy, lesson progress, quizzes, and certificates.
- **`MfExecutionModule`**: BSE StAR MF client registration, order placement, and mandate tracking.
- **`MutualFundsModule`**: Scheme master database and TimescaleDB NAV analytics.
- **`NotificationsModule`**: In-app notifications and email dispatch.
- **`PaymentsModule` / `SubscriptionsModule`**: Razorpay webhook ingestion, order generation, and GST invoice numbering.
- **`TechnoFundaModule`**: Houses `TechnoFundaService`, `MarketIndexService`, and `VahanEtlService`. Exposes 20 institutional screener and research endpoints:
  - `GET /techno-funda/live-feeds` (Core feeds: MMI, Results, News, Filings)
  - `GET /techno-funda/sector-heatmap` (11 NSE Sector Indices Heatmap & Rotation)
  - `GET /techno-funda/52w-high-low` (52-Week High & Low Breakout Screener)
  - `GET /techno-funda/delivery-screener` (High Delivery % Momentum Screener)
  - `GET /techno-funda/bulk-block-deals` (NSE & BSE Bulk & Block Deals Tracker)
  - `GET /techno-funda/fno-oi` (F&O Open Interest, Put-Call Ratio & Max Pain)
  - `GET /techno-funda/insider-trading` (SEBI PIT & SAST Promoter Disclosures)
  - `GET /techno-funda/circuit-breakers` (Upper & Lower Circuit Limits Watch)
  - `GET /techno-funda/ipo-tracker` (Mainboard & SME IPO Pipeline & Bidding)
  - `GET /techno-funda/dividends` (Dividend & Corporate Action Calendar)
  - `GET /techno-funda/rbi-macro` (RBI Repo Rate, MPC Calendar & Policy Dashboard)
- **`UsersModule`**: User CRUD, preferences, and profile management.

### 7.2 Database Schema & 11 TypeORM Migrations
PostgreSQL 16 relational database extended with TimescaleDB hypertables:
1. `001-extensions.ts`: `uuid-ossp` and `timescaledb` extensions.
2. `002-users-auth.ts`: `users` table with roles (`admin`, `investor`, `user`, `member`), entitlements array, and phone.
3. `003-subscriptions.ts`: `subscriptions` table tracking plans, status (`ACTIVE`, `EXPIRED`), and Razorpay IDs.
4. `004-goals.ts`: `goals` table with inflation rate, horizon, monthly SIP, and target corpus.
5. `005-kyc.ts`: `kyc_records` storing PAN, Aadhaar reference, KRA status, and risk profiles.
6. `006-lms.ts`: `courses`, `modules`, `lessons`, `user_lesson_progress`, `quizzes`, `certificates`.
7. `007-mf-execution.ts`: `mf_orders`, `sip_registrations`, `mandates`, and `bse_clients` (UCC records).
8. `008-mutual-funds.ts`: `mf_schemes` and `mf_nav_history` (TimescaleDB hyper-table partitioned on time).
9. `009-notifications.ts`: `notifications` table storing in-app alerts and read status.
10. `011-invoices.ts`: `invoices` table with sequential GST invoice numbers, taxable amount, and receipts.

### 7.3 Caching, Rate Limiting & Proxy Architecture
- **In-Memory TTL + Redis 7**: Market indices cached for 5 minutes (`CACHE_TTL_MS = 300_000`); Vahan registration data cached for 24 hours.
- **Rate Limiting**: `AppThrottlerGuard` restricts unauthenticated requests to 60 requests/minute to prevent denial-of-service and unauthorized scraping.
- **Next.js Proxy Rewrite (`apps/web/next.config.js`)**: All client browser requests to `/api/v1/:path*` are transparently proxied to the backend server. This completely eliminates CORS issues, browser SSL handshake mismatches, and devtunnel connection drops.

---

## 8. Subscription Access Gating, Entitlement Engine & Paywall Architecture

### 8.1 Tier-Based Access Hierarchy

| Access Tier | Qualification Condition | Sidebar Visual State | Tab Bar Ribbon | Main Techno-Funda Content |
|---|---|---|---|---|
| **Guest** | Unauthenticated (No JWT token or user profile in storage) | Golden `PRO` badge & `Lock` icons | Golden `Lock` icons on all tabs | `TechnoFundaPaywallLock` with "Sign In to Access" & "View Plans" |
| **Authenticated (Free)** | Logged in on free/starter plan (No active paid SKU) | Golden `PRO` badge & `Lock` icons | Golden `Lock` icons on all tabs | `TechnoFundaPaywallLock` with "Upgrade to Tools Annual (₹9,999)" |
| **Entitled (Pro)** | Active sub (`ff_active_sub`) or SKU (`tools_1yr`, `bundle_all`) | Clean; no lock icons | Clean; no lock icons | Full unrestricted interactive tools and live calculation models |
| **Admin / Investor** | `role === 'admin'` or `role === 'investor'` | Full access | Full access | Full unrestricted interactive tools and live calculation models |

### 8.2 Client Synchronous Evaluator (`apps/web/lib/auth-client.ts`)
The `isUserSubscribed()` helper function synchronously inspects:
1. `getStoredAccessToken()` and `getStoredRefreshToken()`.
2. `getStoredUser()` profile and `role` property.
3. `localStorage.getItem('ff_active_sub')` parsed status.
4. User `entitlements` array containing any of: `['tools_1yr', 'bundle_all', 'bundle_diy', 'course_lifetime']`.

### 8.3 Zero-Reload Reactive Synchronization
Whenever authentication state changes (login, logout, plan checkout), the client dispatches:
```typescript
window.dispatchEvent(new Event('ff_auth_state_changed'));
window.dispatchEvent(new Event('storage'));
```
All active React views (`TechnoFundaContent`, `SidebarLayout`, `TechnoFundaShell`) subscribe to these events and instantly re-render without requiring a full page refresh.

---

## 9. Master Mathematical & Financial Algorithms Catalog

```
Financial Calculation Engines (@ff/calc)
├── DCF & Reverse DCF (financial.calc.ts)
├── Multiples & Graham & Lynch (financial.calc.ts)
├── Market Mood Index (market-mood.calc.ts)
└── Goals & FIRE Engine (goal.calc.ts)
```

### 9.1 Discounted Cash Flow (DCF - 2-Stage Model)
$$\text{Enterprise Value (EV)} = \sum_{t=1}^{n} \frac{\text{FCFF}_t}{(1 + \text{WACC})^t} + \frac{\text{FCFF}_n \times (1 + g)}{(\text{WACC} - g) \times (1 + \text{WACC})^n}$$
$$\text{Equity Value} = \text{EV} + \text{Cash} - \text{Total Debt} - \text{Minority Interest}$$
$$\text{Fair Value Per Share} = \frac{\text{Equity Value}}{\text{Shares Outstanding}}$$

### 9.2 Reverse DCF (Implied Growth Rate)
Solves for the cash flow growth rate ($g$) embedded in the current market price:
$$\text{Find } g \text{ such that } \text{DCF}(g, \text{WACC}, \text{Terminal Multiple}) = \text{Current Market Price}$$

### 9.3 Graham Number & Net-Current-Asset-Value (NCAV)
$$\text{Graham Number} = \sqrt{22.5 \times \text{EPS} \times \text{BVPS}}$$
$$\text{NCAV Per Share} = \frac{\text{Current Assets} - \text{Total Liabilities} - \text{Preferred Stock}}{\text{Shares Outstanding}}$$

### 9.4 Peter Lynch Fair Value & PEG Ratio
$$\text{Lynch Fair Value} = \text{EPS Growth Rate } (\%) \times \text{EPS}$$
$$\text{PEG Ratio} = \frac{\text{P/E Ratio}}{\text{EPS Growth Rate } (\%)}$$

### 9.5 Dividend Discount Model (DDM / Gordon Growth)
$$P_0 = \frac{D_0 \times (1 + g)}{r_e - g} = \frac{D_1}{r_e - g}$$

### 9.6 Residual Income Valuation Model
$$\text{Intrinsic Value} = \text{BVPS}_0 + \sum_{t=1}^{T} \frac{(\text{ROE}_t - r_e) \times \text{BV}_{t-1}}{(1 + r_e)^t} + \frac{\text{Residual Income}_T \times (1 + g)}{(r_e - g)(1 + r_e)^T}$$

### 9.7 Market Mood Index (MMI Composite Telemetry)
$$\text{MMI} = 0.35 \times S_{\text{VIX}} + 0.25 \times S_{\text{Breadth}} + 0.25 \times S_{\text{Trend}} + 0.15 \times S_{\text{Volume}}$$

### 9.8 Post-Earnings Announcement Drift (PEAD)
$$\text{Surprise } (\%) = \left(\frac{\text{Actual PAT} - \text{Estimated PAT}}{|\text{Estimated PAT}|}\right) \times 100$$
$$\text{PEAD Drift } (\%) = \left(\frac{P_{T+20} - P_{T+1}}{P_{T+1}}\right) \times 100$$

### 9.9 Buyback Arbitrage Return (Tender Offer)
$$\text{Arbitrage Profit} = \left(\text{Shares Tendered} \times \text{Acceptance Ratio} \times (\text{Buyback Price} - \text{CMP})\right) - \left(\text{Shares Unaccepted} \times (\text{CMP} - P_{\text{exit}})\right)$$
$$\text{Annualized IRR } (\%) = \left(\frac{\text{Net Arbitrage Profit}}{\text{Capital Deployed}}\right) \times \left(\frac{365}{\text{Holding Days}}\right) \times 100$$

### 9.10 Inflation-Adjusted Goal Corpus & Monthly SIP
$$FV = PV \times (1 + i)^n$$
$$\text{SIP} = \frac{FV \times r}{(1 + r) \times ((1 + r)^n - 1)}$$

### 9.11 Classical 4% Safe Withdrawal FIRE Corpus
$$\text{FIRE Target Corpus} = 25 \times \text{Annual Living Expenses}$$

---

## 10. Verification, Quality Assurance & Operational Runbooks

### 10.1 Automated Verification Commands
- **TypeScript Static Typecheck**:
  ```bash
  pnpm --filter @ff/web exec tsc --noEmit
  pnpm --filter @ff/api exec tsc --noEmit
  ```
- **Unit & Mathematical Calculation Tests**:
  ```bash
  pnpm --filter @ff/calc test
  pnpm --filter @ff/api test
  ```
- **Database Migration Execution**:
  ```bash
  pnpm db:migrate
  ```

### 10.2 Production Deployment Health Check
- **API Health Endpoint**:
  ```bash
  curl -s http://localhost:3001/api/v1/health | jq .
  ```
- **Techno-Funda Routes & Shell Status**:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/techno-funda
  # Output must be 200 OK
  ```
- **Data Integrity Audit**:
  Execute `DataIntegrityService.runFullAudit()` via the Admin Dashboard (`/admin/data-integrity`) to confirm zero orphaned database records, zero subscription entitlement drift, and sub-15-minute feed latencies.
