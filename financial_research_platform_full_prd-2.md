# Financial Research Platform --- Full Product Requirements Document

## 0. Document purpose

This document is a production-oriented blueprint for building an Indian
wealth-management platform with functionality comparable to, and in
research/data depth exceeding, the publicly advertised FinanciallyFree.in
product.

**Revision note (verified September 2026):** This revision was produced
by re-checking the live FinanciallyFree.in site, its course page, and
current third-party API/vendor documentation. The original draft of
this PRD assumed FinanciallyFree.in was primarily a stock-screener /
special-situations research terminal (Big Orders, Demergers, Buybacks,
FIRE Tracker, "Value Any Company", multibagger screeners as core,
always-on product surfaces). **That assumption does not match the
live product** and has been corrected below (see Section 0.1). Every
third-party API/vendor reference in this document has also been
re-verified; names, pricing signals and regulatory facts that were
stale, generic, or unconfirmed have been replaced with currently
documented providers and figures, each flagged with a verification date.

Important: - This is a **functional-equivalent specification**, not a
copy of proprietary source code, private dashboards, copyrighted course
content, branding, proprietary formulas, or private datasets. - Some
authenticated/internal screens are not publicly exposed, so exact
hidden UI fields cannot be verified; where necessary this document
defines a production-grade equivalent UX. - Figures such as API prices,
fee percentages, and regulatory deadlines change; treat every number in
this document as "true as of the stated verification date" and revalidate
before committing to a vendor contract.

------------------------------------------------------------------------

## 0.1 Verified product reality: what FinanciallyFree.in actually is (Sept 2026)

Direct inspection of `financiallyfree.in` and `financiallyfree.in/site/education.html`
shows the live product is **not** a Bloomberg-style stock terminal. It is
a two-sided wealth business:

1. **"Done with you" — goal-based mutual fund investing.** A
   distribution funnel (`/site/chart-version.html`) that maps a user's
   money goals — Emergency Fund, Retirement, Child Education, Wealth
   Creation — to a monthly SIP amount, then routes the user into an
   AMFI-registered Mutual Fund Distribution relationship. The site
   explicitly discloses: **AMFI-registered Mutual Fund Distributor,
   ARN‑350272, operated by FutureZenith Insights LLP**, with a standard
   "mutual fund investments are subject to market risk, read all
   scheme-related documents" disclaimer.
2. **"Do it yourself" — the Zero to Hero investment course** (paid,
   listed at ₹75,000 with a discounted price of ₹14,999 at verification
   time), which bundles three things sold as one program:
   - **Course Library** — 24+ hours of lifetime-access video content
     teaching "Techno-Funda" investing (a blend of technical + fundamental
     analysis), taught in Hinglish, from a named instructor
     (Shubham Sethi).
   - **Techno-Funda Tools** — a *premium, 1‑year-access* dashboard suite,
     not a permanent free product surface. Publicly named tools are:
     **Market Mood** (a bull/bear sentiment gauge), **Master Tracker**
     ("centralized data for winning companies" — i.e. a curated
     watchlist/quality-screen, not a full universal screener), **PEAD
     Tool** (Post-Earnings-Announcement-Drift analytics), and **Vahan
     Dashboard** (vehicle-registration/production alternative data,
     named after the Government of India's VAHAN registration database).
   - **Weekly Live Business Case Studies** — 1-year access to live Zoom
     sessions where real companies/quarterly results are analysed
     together with students (e.g. "Q2 FY24 — Result analysis").
3. **Compliance posture actually disclosed on-site:** the course is
   explicitly marketed as *educational, not investment advice* — "We do
   not provide buy/sell recommendations or guarantee returns" — which is
   the standard, required disclaimer distinguishing an AMFI distributor
   / education business from a SEBI-registered Investment Adviser (IA)
   or Research Analyst (RA), who alone may give personalised buy/sell
   recommendations for a fee. **Big Orders, Demergers, Buybacks, and a
   generic FIRE Tracker are not advertised on the current live site** —
   they were present in the original draft as an assumption about what
   an "equivalent" platform *could* contain, not as a confirmed feature
   of FinanciallyFree.in. This document keeps them as **optional,
   clearly-labelled superset features** (Section 1.1) for a team that
   wants to build a broader research product than the real
   FinanciallyFree.in, while Section 1.0 below defines the MVP that
   actually matches the live product.

### Implication for scope

Two build tracks are defined, and a team should pick one explicitly
rather than silently blending them:

- **Track A — Faithful equivalent (recommended first target).**
  Goal-based SIP funnel → mutual-fund distribution execution → paid
  course/LMS → Techno-Funda Tools (Market Mood, Master Tracker, PEAD,
  Vahan Dashboard) → weekly live webinars. Regulatory posture: AMFI
  Mutual Fund Distributor (ARN), not an Investment Adviser.
- **Track B — Extended research terminal (superset, optional).**
  Everything in Track A, plus the full stock-research/screener/
  special-situations terminal described in the rest of this document
  (screener, Big Orders, Demergers, Buybacks, company financials,
  valuation tools, FIRE tracker as a generic calculator). Track B is a
  materially larger, SEBI-Research-Analyst-adjacent product and should
  be treated as a Phase 3+ expansion, not MVP.

Sections 1 through 68 below retain the full Track B blueprint (kept
because it is still a valid, well-specified superset architecture), with
corrections applied throughout. New Sections 69–75 define Track A's
missing pieces (goal engine, MF execution, LMS, webinars, MFD
compliance) and updated, re-verified third-party API/vendor and
architecture guidance.

------------------------------------------------------------------------

# 1. Product vision

## 1.0 Track A vision (matches the verified live product)

Build a platform that lets an Indian saver:

1. Answer a short goal questionnaire (Emergency Fund, Retirement, Child
   Education, Wealth Creation, custom) and get a recommended monthly SIP.
2. Invest in mutual funds through a compliant AMFI-distributor execution
   flow (KYC, CAN/folio creation, SIP mandate, order routing).
3. Track goal progress against the corpus needed, with inflation and
   return assumptions editable.
4. Buy and consume a structured investing course (video library +
   quizzes + certificates) at their own pace.
5. Subscribe to premium markets/company dashboards (bull-bear sentiment,
   curated quality watchlist, post-earnings-drift screen, alternative
   vehicle-registration data) for a fixed-term (e.g. 1 year) license.
6. Attend scheduled live webinars analysing real companies/results, with
   replay access.
7. Get WhatsApp/email nudges for SIP due dates, webinar reminders, and
   course progress — never framed as personalised buy/sell advice.

## 1.1 Track B vision (extended research-terminal superset, optional)

Everything in Track A, plus a full self-serve research terminal that
lets an Indian investor:

1.  Search any listed company.
2.  Understand business and financial performance.
3.  Analyze price and technical trends.
4.  Screen thousands of stocks using fundamental and technical filters.
5.  Estimate company value using transparent valuation models.
6.  Track large order wins.
7.  Track demergers and other special situations.
8.  Track buybacks.
9.  Track corporate actions.
10. Track shareholding changes.
11. Track quarterly/annual results.
12. Track a personal portfolio and watchlist.
13. Calculate FIRE/financial-independence goals.
14. Receive event and price alerts.
15. Research source documents and announcements.
16. Eventually use an AI research assistant with source citations.

------------------------------------------------------------------------

# 2. Product principles

## 2.1 Data principles

-   Every externally sourced number must have a source and source
    timestamp.
-   Never silently mix standalone and consolidated financials.
-   Store raw source data separately from normalized data.
-   Preserve original filing/document references.
-   Store fiscal period, filing date, announcement date and effective
    date separately.
-   Do not overwrite historical values; create versioned records.
-   Show "last updated" on user-facing pages.
-   Mark estimates separately from reported values.
-   Never represent delayed/free data as real-time data.
-   Never claim that a metric is "accurate" without defining its source
    and update cadence.

## 2.2 Compliance principles

-   Publicly viewable does not automatically mean commercially
    redistributable.
-   Exchange data may have licensing and redistribution restrictions.
-   Use licensed feeds for commercial real-time/market-data
    redistribution where required.
-   Respect robots.txt, terms of use, rate limits, authentication and
    data licensing.
-   Prefer official APIs, feeds, downloadable files and licensed vendors
    over scraping.
-   Keep a source/license registry for every dataset.
-   Store the permitted usage scope for each source.

------------------------------------------------------------------------

# 3. Information architecture

## 3.1 Global application shell

### Header

-   Logo
-   Global stock/company search
-   Search recent companies
-   Market status
-   Notifications
-   Watchlist shortcut
-   Portfolio shortcut
-   User profile
-   Help
-   Subscription/billing

### Left navigation

1.  Dashboard
2.  Markets
3.  Stocks
4.  Screener
5.  Valuation
6.  Big Orders
7.  Demergers
8.  Buybacks
9.  Corporate Actions
10. Results
11. Shareholding
12. News
13. Filings
14. Portfolio
15. Watchlist
16. FIRE Tracker
17. Alerts
18. Research / AI
19. Data quality
20. Settings

### Mobile navigation

Bottom navigation: - Home - Search - Screener - Portfolio - More

------------------------------------------------------------------------

# 4. Pages and tabs

## 4.1 Login / registration

### Pages

-   Sign up
-   Login
-   Forgot password
-   Reset password
-   Email verification
-   Phone verification if required
-   OAuth login if enabled
-   Subscription selection
-   Checkout
-   Payment success
-   Payment failure

### Authentication features

-   Email/password
-   Google OAuth
-   Session management
-   Refresh token rotation
-   Device/session list
-   Logout all sessions
-   Optional 2FA

------------------------------------------------------------------------

# 5. Main dashboard

## 5.1 Dashboard sections

### Market overview

Cards: - NIFTY 50 - SENSEX - NIFTY Bank - NIFTY Midcap - NIFTY
Smallcap - Market breadth

Columns: - Current - Change - Change % - Day high - Day low - Last
update

### Opportunity cards

-   New Big Orders
-   Buybacks
-   Demergers
-   Result surprises
-   New 52-week highs
-   Volume breakouts
-   Fundamental candidates
-   Valuation opportunities

### Portfolio summary

-   Current value
-   Invested value
-   Day P&L
-   Total P&L
-   XIRR
-   Allocation
-   Top gainers
-   Top losers

### Watchlist

Columns: - Symbol - Company - Price - Change - Market cap - P/E - ROCE -
Revenue growth - Profit growth - Score

### Alerts

-   Price alerts
-   Result alerts
-   Order alerts
-   Buyback alerts
-   Demerger alerts
-   Shareholding alerts

------------------------------------------------------------------------

# 6. Global company search

Search by: - Company name - NSE symbol - BSE code - ISIN - Sector -
Industry

Search result card: - Company - Symbol - Exchange - Price - Change -
Market cap - Sector - Watchlist button

------------------------------------------------------------------------

# 7. Company detail page

URL pattern:

`/stocks/:exchange/:symbol`

## Tabs

1.  Overview
2.  Price
3.  Fundamentals
4.  Financials
5.  Valuation
6.  Technical
7.  Shareholding
8.  Results
9.  Corporate Actions
10. Big Orders
11. News
12. Filings
13. Investor Presentation
14. Conference Calls
15. Special Situations
16. AI Research

------------------------------------------------------------------------

# 8. Company Overview

## Header

-   Company name
-   Symbol
-   ISIN
-   Exchange
-   Sector
-   Industry
-   Current price
-   Daily change
-   Market cap
-   52-week high/low
-   Volume
-   Watchlist
-   Alert
-   Add to portfolio

## Summary cards

-   Revenue
-   EBITDA
-   PAT
-   EPS
-   ROE
-   ROCE
-   Debt/Equity
-   P/E
-   P/B
-   EV/EBITDA
-   Dividend yield

## Business description

-   Business summary
-   Segments
-   Geography
-   Key products
-   Subsidiaries
-   Competitive information

------------------------------------------------------------------------

# 9. Price page

## Chart

Timeframes: - 1D - 1W - 1M - 3M - 6M - 1Y - 3Y - 5Y - 10Y - Max

Chart modes: - Candlestick - Line - Area

Indicators: - SMA - EMA - RSI - MACD - Bollinger Bands - Volume - VWAP
where supported

Price statistics: - Open - High - Low - Close - Volume - Average
volume - 52W high - 52W low - Beta - Volatility

------------------------------------------------------------------------

# 10. Fundamental dashboard

## Fundamental cards

-   Revenue
-   Revenue growth
-   EBITDA
-   EBITDA margin
-   EBIT
-   EBIT margin
-   PAT
-   PAT margin
-   EPS
-   EPS growth
-   CFO
-   FCF
-   ROE
-   ROCE
-   ROA
-   Debt/Equity
-   Interest coverage
-   Asset turnover

## Period selector

-   Quarterly
-   TTM
-   FY
-   3Y
-   5Y
-   10Y

## Charts

-   Revenue trend
-   EBITDA trend
-   PAT trend
-   EPS trend
-   Margin trend
-   ROE/ROCE trend
-   Debt trend
-   FCF trend

------------------------------------------------------------------------

# 11. Financial statements

## Income statement

Columns: - FY/Quarter - Revenue - Other income - Total income -
Expenses - EBITDA - Depreciation - EBIT - Interest - PBT - Tax - PAT -
EPS

## Balance sheet

-   Equity
-   Reserves
-   Borrowings
-   Lease liabilities
-   Other liabilities
-   Fixed assets
-   Investments
-   Inventory
-   Receivables
-   Cash
-   Other current assets
-   Total assets

## Cash flow

-   CFO
-   CFI
-   CFF
-   Capex
-   FCF

Support: - Standalone - Consolidated - Reported - Restated/versioned
data

------------------------------------------------------------------------

# 12. Ratio dashboard

Ratios: - P/E - Forward P/E if licensed estimates exist - P/B -
EV/Sales - EV/EBITDA - EV/EBIT - PEG - ROE - ROCE - ROA - Debt/Equity -
Net debt/EBITDA - Current ratio - Quick ratio - Interest coverage -
Asset turnover - CFO/PAT - FCF yield - Dividend yield - Payout ratio

Each metric must show: - Formula - Value - Period - Source inputs - Last
updated

------------------------------------------------------------------------

# 13. Screener

## Screener page

### Tabs

1.  All Stocks
2.  Fundamental
3.  Technical
4.  Growth
5.  Quality
6.  Value
7.  Momentum
8.  Dividend
9.  Special Situations
10. Custom Screeners
11. Saved Screeners

## Filters

### Company

-   Market cap
-   Sector
-   Industry
-   Exchange
-   Index

### Growth

-   Revenue growth
-   EBITDA growth
-   PAT growth
-   EPS growth
-   CAGR 3Y/5Y/10Y

### Quality

-   ROE
-   ROCE
-   ROA
-   FCF
-   CFO/PAT
-   Debt/Equity
-   Interest coverage

### Valuation

-   P/E
-   P/B
-   EV/EBITDA
-   EV/Sales
-   PEG
-   FCF yield
-   Dividend yield

### Technical

-   Price above SMA
-   RSI
-   MACD
-   Volume
-   52W high
-   52W low
-   Breakout
-   Momentum

### Ownership

-   Promoter holding
-   Promoter pledge
-   FII holding
-   DII holding
-   MF holding

### Special situations

-   New order
-   Buyback
-   Demerger
-   Dividend
-   Bonus
-   Split
-   Rights
-   Insider transaction

## Filter builder

Support:

`AND`, `OR`, nested groups.

Example:

`Market Cap > 1000 Cr AND ROCE > 15% AND Debt/Equity < 0.5`

## Table

Columns configurable by user.

Features: - Sort - Filter - Search - Pin columns - Hide columns - Save
view - Export CSV - Pagination - Infinite scroll - Compare selected
stocks

------------------------------------------------------------------------

# 14. Value Any Company / valuation module

## Inputs

-   Revenue
-   EBITDA
-   EBIT
-   PAT
-   EPS
-   FCF
-   Growth
-   Terminal growth
-   WACC
-   Debt
-   Cash
-   Shares outstanding
-   Current price

## Models

1.  DCF
2.  Reverse DCF
3.  P/E multiple
4.  EV/EBITDA
5.  EV/Sales
6.  P/B
7.  PEG
8.  Historical multiple
9.  Scenario valuation

## Output

-   Current market price
-   Estimated fair value
-   Upside %
-   Downside %
-   Bull case
-   Base case
-   Bear case
-   Sensitivity matrix

## Auditability

Every output must show: - Formula - Inputs - Source - Date - User
assumptions

Do not reproduce a proprietary valuation formula unless it is
independently developed.

------------------------------------------------------------------------

# 15. FIRE Tracker

## Inputs

-   Current age
-   Desired retirement age
-   Current investments
-   Current savings
-   Monthly investment
-   Annual step-up
-   Current expenses
-   Expected return
-   Inflation
-   Safe withdrawal rate
-   Other income
-   Retirement expenses

## Outputs

-   FIRE number
-   Current corpus
-   Progress %
-   Monthly SIP required
-   Projected corpus
-   FIRE year
-   Years remaining
-   Inflation-adjusted expenses
-   Withdrawal projection

## Charts

-   Corpus growth
-   Contribution vs growth
-   FIRE target line
-   Progress timeline
-   Scenario comparison

## Scenarios

-   Conservative
-   Base
-   Aggressive

All assumptions must be editable.

------------------------------------------------------------------------

# 16. Big Orders module

## Tabs

1.  Latest Orders
2.  High Value Orders
3.  Order/Revenue
4.  Sector
5.  Company
6.  Order Book
7.  Alerts
8.  Source Documents

## Table

-   Company
-   Order date
-   Order value
-   Customer
-   Sector
-   Order category
-   Execution period
-   Order/revenue %
-   Order book
-   Source
-   Source date

## Filters

-   Minimum order value
-   Order/revenue %
-   Sector
-   Company
-   Date
-   Customer type
-   Domestic/export
-   Government/private

## Extraction pipeline

Source document -\> PDF/text extraction -\> classification -\> entity
extraction -\> validation -\> human/data-quality review -\> publish.

------------------------------------------------------------------------

# 17. Demerger module

## Tabs

1.  Upcoming
2.  Announced
3.  Approved
4.  Effective
5.  Listed
6.  Completed
7.  Watchlist

## Table

-   Parent company
-   Resulting company
-   Announcement date
-   Record date
-   Effective date
-   Ratio
-   Business segment
-   NCLT status
-   Exchange status
-   Source

## Detail page

Timeline: - Board approval - Announcement - Scheme - NCLT - Shareholder
approval - Record date - Effective date - Listing - Completion

------------------------------------------------------------------------

# 18. Buyback module

## Tabs

1.  Open
2.  Upcoming
3.  Announced
4.  Closed
5.  Completed
6.  Historical

## Table

-   Company
-   Current price
-   Buyback price
-   Premium %
-   Buyback size
-   Shares
-   Record date
-   Opening date
-   Closing date
-   Method
-   Promoter participation
-   Acceptance ratio where available

## Calculator

Inputs: - Investment - Current price - Buyback price - Shares - Expected
acceptance

Outputs: - Eligible shares - Expected accepted shares - Expected
proceeds - Expected profit - Return %

------------------------------------------------------------------------

# 19. Corporate actions

Types: - Dividend - Bonus - Split - Rights - Buyback - Merger -
Demerger - Delisting - Preferential issue - QIP - Fund raise

Filters: - Company - Type - Ex-date - Record date - Announcement date -
Sector

------------------------------------------------------------------------

# 20. Results module

## Tabs

-   Latest Results
-   Quarterly
-   Annual
-   Result Calendar
-   Revenue Beat
-   Profit Beat
-   Margin Expansion
-   Result History

## Table

-   Company
-   Period
-   Revenue
-   Revenue YoY
-   EBITDA
-   EBITDA YoY
-   PAT
-   PAT YoY
-   EPS
-   Margin
-   Result date
-   Source

If analyst estimates are licensed: - Estimate - Actual - Surprise % -
Beat/Miss

------------------------------------------------------------------------

# 21. Shareholding module

## Tabs

-   Latest
-   History
-   Promoter
-   FII
-   DII
-   Mutual Funds
-   Public
-   Pledge

## Charts

-   Promoter trend
-   FII trend
-   DII trend
-   Institutional ownership
-   Pledge trend

------------------------------------------------------------------------

# 22. News module

## Features

-   Company news
-   Sector news
-   Market news
-   Corporate events
-   Search
-   Date filter
-   Source filter

Each item: - Headline - Source - Published time - Company - Category -
Short summary - Original source - Related filing

Do not reproduce full copyrighted articles. Store metadata and short
permitted excerpts/summaries.

------------------------------------------------------------------------

# 23. Filings module

## Tabs

-   All
-   Financial Results
-   Annual Reports
-   Corporate Announcements
-   Investor Presentations
-   Earnings Call
-   Shareholding
-   Board Meetings
-   M&A
-   Buyback
-   Demerger

Each filing: - Company - Filing type - Announcement date - Period -
Source exchange - Document link - Parsed text if licensed/permitted -
Extraction status

------------------------------------------------------------------------

# 24. Portfolio

## Features

-   Add transaction
-   Buy
-   Sell
-   Dividend
-   Bonus
-   Split
-   Rights
-   Fees
-   Taxes
-   Corporate actions adjustment

## Metrics

-   Invested amount
-   Current value
-   Realized P&L
-   Unrealized P&L
-   Total return
-   XIRR
-   CAGR
-   Dividend income
-   Allocation

## Charts

-   Portfolio value
-   P&L
-   Sector allocation
-   Market-cap allocation
-   Stock allocation
-   Realized/unrealized

------------------------------------------------------------------------

# 25. Watchlist

Features: - Create watchlist - Add/remove stock - Custom columns -
Sort/filter - Notes - Target price - Stop/alert - Event alerts

------------------------------------------------------------------------

# 26. Alerts

Types: - Price - % change - 52W high/low - Volume - RSI - Result - Big
order - Buyback - Demerger - Dividend - Shareholding change - Filing -
News

Channels: - In-app - Email - Push - WhatsApp/SMS only if a compliant
third-party provider and consent model is used

------------------------------------------------------------------------

# 27. AI research assistant

## User queries

-   Analyze company
-   Explain financials
-   Compare two companies
-   Find companies matching criteria
-   Explain valuation
-   Summarize latest filings
-   Summarize recent orders
-   Explain shareholding change

## Required architecture

User -\> API -\> retrieval/search -\> source documents -\> calculation
tools -\> LLM -\> answer with citations.

The LLM must not invent financial values.

Every factual answer should link to: - Filing - Exchange announcement -
Company report - Licensed data source

------------------------------------------------------------------------

# 28. Admin dashboard

## Admin sections

1.  Users
2.  Subscriptions
3.  Payments
4.  Stocks
5.  Companies
6.  Data sources
7.  Data ingestion jobs
8.  Failed jobs
9.  Data quality
10. Manual corrections
11. Orders
12. Demergers
13. Buybacks
14. Corporate actions
15. News
16. Alerts
17. Audit logs
18. API usage
19. System health

## Data-quality UI

Show: - Source - Last sync - Record count - Missing values - Duplicate
count - Validation failures - Parsing failures - Stale records -
Conflict between sources

------------------------------------------------------------------------

# 29. Backend architecture

## Recommended stack

### Frontend

-   Angular
-   TypeScript
-   Angular Material/CDK or a high-quality design system
-   ECharts/Highcharts or another properly licensed chart library
-   RxJS
-   TanStack Query equivalent if useful
-   SCSS/Tailwind depending on team preference
-   Playwright

### Backend

-   Node.js
-   NestJS
-   TypeScript
-   REST API
-   WebSocket/SSE for permitted live updates
-   OpenAPI/Swagger
-   Zod/class-validator
-   BullMQ

### Database

-   PostgreSQL
-   TimescaleDB if time-series volume justifies it
-   Redis
-   Object storage: S3-compatible storage

### Search

-   OpenSearch or Elasticsearch
-   PostgreSQL full-text for MVP

### Queue

-   Redis + BullMQ
-   Kafka only after scale requires it

### Documents

-   S3
-   PDF parser
-   OCR for scanned documents
-   Apache Tika/PyMuPDF or equivalent
-   Structured extraction service

### Infrastructure

-   Docker
-   Kubernetes/ECS only when required
-   CloudFront/CDN
-   WAF
-   Secrets Manager
-   Managed PostgreSQL
-   Managed Redis
-   CI/CD

------------------------------------------------------------------------

# 30. Recommended backend services

Start as a modular monolith rather than immediately using dozens of
microservices.

Modules:

``` text
Auth
Users
Companies
Securities
MarketData
Fundamentals
FinancialStatements
Ratios
TechnicalAnalysis
Valuation
Screeners
Orders
Demerger
Buyback
CorporateActions
Shareholding
Results
News
Filings
Portfolio
FIRE
Watchlist
Alerts
Subscriptions
Payments
Search
AIResearch
DataQuality
Admin
```

Later extract high-load services: - Market data - Search - Data
ingestion - Notification - AI

------------------------------------------------------------------------

# 31. Backend API design

## Authentication

``` text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
```

## Stocks

``` text
GET /stocks
GET /stocks/:id
GET /stocks/:id/price
GET /stocks/:id/fundamentals
GET /stocks/:id/financials
GET /stocks/:id/ratios
GET /stocks/:id/shareholding
GET /stocks/:id/results
GET /stocks/:id/actions
GET /stocks/:id/orders
GET /stocks/:id/news
GET /stocks/:id/filings
```

## Screener

``` text
POST /screeners/run
POST /screeners
GET /screeners
GET /screeners/:id
DELETE /screeners/:id
```

## Valuation

``` text
POST /valuation/dcf
POST /valuation/pe
POST /valuation/ev-ebitda
POST /valuation/reverse-dcf
```

## FIRE

``` text
POST /fire/calculate
GET /fire/profile
PUT /fire/profile
```

## Big orders

``` text
GET /orders
GET /orders/:id
GET /orders/companies/:companyId
```

## Demergers

``` text
GET /demergers
GET /demergers/:id
```

## Buybacks

``` text
GET /buybacks
GET /buybacks/:id
POST /buybacks/calculate
```

------------------------------------------------------------------------

# 32. Database design

## Core

``` text
users
user_sessions
subscriptions
plans
payments

companies
securities
exchanges
sectors
industries

prices_daily
prices_intraday
market_snapshots

income_statements
balance_sheets
cash_flows
financial_periods
financial_metrics

ratios
technical_indicators

shareholding_periods
shareholding_holders

results
corporate_actions
announcements
filings
documents

orders
order_customers
order_sources

demergers
demerger_events

buybacks
buyback_events

news
news_companies

portfolios
portfolio_transactions
portfolio_positions

watchlists
watchlist_items

fire_profiles
fire_scenarios

alerts
alert_events
notifications

screeners
screener_runs
screener_filters

valuations
valuation_inputs
valuation_results

data_sources
data_source_runs
data_quality_issues
audit_logs
```

------------------------------------------------------------------------

# 33. Data model requirements

Every financial datapoint should support:

``` text
id
company_id
period_start
period_end
period_type
value
unit
currency
statement_type
standalone_or_consolidated
source_id
source_document_id
source_date
reported_date
retrieved_at
version
is_estimate
quality_status
```

------------------------------------------------------------------------

# 34. Data-source architecture

Create a source registry:

``` text
data_sources
```

Fields: - Provider name - Provider type - Dataset - API/feed URL -
Authentication type - License type - Commercial usage allowed -
Redistribution allowed - Rate limit - Update frequency - Cost - Contract
expiry - Contact - Terms URL - Notes

------------------------------------------------------------------------

# 35. Data acquisition strategy

## Tier A --- Official/public sources

Use wherever possible:

-   NSE
-   BSE
-   SEBI
-   Company investor-relations websites
-   Official company filings
-   Government/regulatory sources
-   MCA where access and use rights permit

SEBI's corporate-filings page directs users to NSE/BSE filing resources
for listed-company disclosures.

## Tier B --- Licensed market data (re-verified September 2026)

For commercial production, evaluate, in this order:

- **NSE Data & Analytics Ltd** (formerly DotEx International) — the
  official NSE data arm. Publishes a formal, versioned non-confidential
  price list (e.g. `NSE_Pricing_file_-_Domestic_clients_*.pdf` on
  nseindia.com) covering Capital Market, F&O, Currency Derivatives and
  Wholesale Debt segments, at Level 1 (best bid/ask), Level 2 (5-depth),
  Level 3 (20-depth) and tick-by-tick granularity, delivered by leased
  line or through an **authorized data vendor**. Any redistribution to
  your own end users requires a **separate written license/agreement**
  with NSE Data & Analytics — do not assume a vendor subscription alone
  grants redistribution rights.
- **Authorized NSE/BSE/MCX data vendors** — e.g. **TrueData** and
  **Global Data Feeds (GDFL)**, both publicly documented as *Authorised
  Data Vendors*. These offer REST/WebSocket market-data APIs (real-time
  L1 tick, 1-second snapshot, historical tick/minute/day/week/month,
  option-chain, corporate-announcement and corporate-data feeds) at a
  fraction of a direct NSE leased-line agreement's cost, and are the
  pragmatic default for a v1 production system. Confirm current plan
  tiers directly on each vendor's pricing page before committing, since
  these change frequently.
- **Broker APIs, for account-linked/personal use only** (not
  redistribution): **Zerodha Kite Connect** (paid, historically ₹2,000/
  month for the Connect plan, well-documented REST + WebSocket, largest
  third-party ecosystem), **Angel One SmartAPI**, **Upstox API**,
  **DhanHQ**, **Fyers API**, **Alice Blue ANT API**, and **Shoonya
  (Finvasia)** — several of these are documented as free of a monthly
  fee (brokerage-funded), but their terms restrict use to the
  authenticated account holder's own data/trading, not third-party
  redistribution. Do not architect a multi-tenant public product around
  a personal broker API without confirming this in writing with the
  broker.
- **LSEG (Refinitiv)** — offers NSE India market data as part of its
  global data platform for institutional-grade use cases; evaluate only
  if the product needs enterprise-grade cross-asset/global data
  alongside Indian equities.

## Tier C --- General financial-data APIs (secondary/cross-check only)

Use only as a convenience/secondary source for company profiles, global
comparables, or cross-checking — never as the source of truth for
Indian exchange prices or filings: **Financial Modeling Prep, Twelve
Data, Alpha Vantage, Polygon.io, EOD Historical Data (EODHD), Finnhub**.
Indian-market coverage and redistribution rights vary a great deal
across these vendors and change without notice — re-verify current plan
terms and Indian-symbol coverage directly with the vendor before
depending on any of them. Do not assume a "free tier" or "hobby plan"
permits commercial redistribution to your own paying users; this is the
single most common licensing mistake in this space.

## Tier D --- Trade/shipping and alternative data

Evaluate licensed providers for import/export shipment-level data (HS
codes, exporter/importer, quantity, value, destination, shipment dates)
— e.g. **Zauba/Seair/Volza**-style customs-data vendors; treat as a
paid-data module and check redistribution terms explicitly.

**Alternative data worth adding as its own tier**, because it is what
FinanciallyFree.in's real "Vahan Dashboard" tool is built on: the
**Government of India VAHAN dashboard** (`vahan.parivahan.gov.in`),
which publishes vehicle-registration counts by category, state, RTO and
manufacturer. It is public dashboard data (not a documented open API),
so production use typically requires a scheduled scraper/ETL against
the public dashboard or a licensed reseller, with the same
robots.txt/ToS diligence applied to any other scraped source.

## Tier E --- News

Evaluate licensed news APIs, company press releases, exchange
announcements, and RSS feeds where permitted. Confirm commercial
redistribution rights explicitly; most general news APIs license
headlines/metadata only, not full-article redistribution.

## Tier F --- Mutual fund data & transaction rails (needed for Track A)

- **AMFI NAV data** — daily NAV files published by AMFI
  (`amfiindia.com`) are the standard free public source for mutual fund
  NAVs; treat as Tier A (official/public).
- **BSE StAR MF** — India's highest-volume mutual-fund order-routing
  platform for distributors (BSE reports **over 6 crore orders/month
  in FY26**), using a documented **SOAP/XML web-services API**
  (order entry, SIP/STP/SWP/switch, redemption). This is the default
  transaction backbone for an AMFI-registered distributor building its
  own app.
  Do not confuse "BSE StAR MF" with the exchange's regular equity
  trading — it is a separate mutual-fund order-routing system.
- **NSE NMF II** — the NSE-run alternative to BSE StAR MF, offering a
  more modern REST-style API; a smaller share of distributors use it,
  but it is worth evaluating for a greenfield build.
- **MF Utilities (MFU)** — a CAMS/KFintech/AMC-backed utility offering
  the **Common Account Number (CAN)** concept, letting one investor
  transact across AMCs through a single account; useful if the product
  wants to minimize per-AMC folio sprawl for the user.
- **RTA data** — CAMS and KFintech (KFin Technologies) are the two
  Registrar & Transfer Agents covering effectively the entire Indian MF
  industry; their statement/CAS (Consolidated Account Statement) feeds
  and reconciliation files are the source of truth for confirmed
  holdings and are required for accurate portfolio reconciliation
  beyond what StAR MF/NMF II order acks provide.

------------------------------------------------------------------------

# 36. Scraping/extraction requirements

## What should NOT be treated as a scraping target by default

-   Exchange real-time market feeds
-   Licensed datasets
-   Websites that prohibit automated extraction
-   Copyrighted news articles
-   Private/authenticated content
-   Paid dashboards
-   Proprietary FinanciallyFree tools/content

## Suitable extraction candidates, subject to terms/licensing

-   Public company PDFs
-   Public investor presentations
-   Public exchange announcements
-   Public corporate filings
-   Public regulatory documents

## Pipeline

``` text
Source discovery
    ↓
Fetcher
    ↓
Raw file store
    ↓
Hash/deduplication
    ↓
PDF/text extraction
    ↓
OCR if needed
    ↓
Document classification
    ↓
Entity extraction
    ↓
Financial/event parser
    ↓
Validation
    ↓
Human review for low confidence
    ↓
Normalized database
    ↓
API
```

------------------------------------------------------------------------

# 37. Big Orders extraction logic

## Classification keywords/examples

Potential signals: - order received - order win - work order - letter of
intent - purchase order - contract - EPC order - award - work awarded

## Extract fields

-   Company
-   Order value
-   Currency
-   Customer
-   Customer type
-   Product/service
-   Geography
-   Execution period
-   Order date
-   Announcement date
-   Source

## Validation

-   Match company identity.
-   Validate currency.
-   Normalize crore/lakh/million/billion.
-   Compare extracted value with source text.
-   Detect duplicate announcements.
-   Store source document hash.
-   Confidence score.

------------------------------------------------------------------------

# 38. Demerger extraction logic

Detect: - Scheme of arrangement - Demerger - Resulting company -
Transferor company - Transferee company - Share entitlement ratio -
Record date - Effective date - NCLT approval - Listing approval

Create event state machine:

``` text
ANNOUNCED
→ BOARD_APPROVED
→ SHAREHOLDER_APPROVED
→ NCLT_APPROVED
→ EFFECTIVE
→ RECORD_DATE
→ LISTING_PENDING
→ LISTED
→ COMPLETED
```

------------------------------------------------------------------------

# 39. Buyback extraction logic

Extract: - Buyback type - Price - Number of shares - Total amount -
Record date - Opening/closing dates - Tender/open-market method -
Promoter participation - Acceptance information

Validation: - Cross-check filing. - Cross-check exchange corporate
action. - Detect amendments. - Version records.

------------------------------------------------------------------------

# 40. Fundamental data ingestion

Preferred order:

1.  Official filing.
2.  Company annual report/result.
3.  Exchange structured data.
4.  Licensed provider.
5.  Secondary API only for cross-checking.

Never let a secondary API silently overwrite official reported data.

------------------------------------------------------------------------

# 41. Data normalization

Normalize:

### Units

-   ₹
-   ₹ lakh
-   ₹ crore
-   ₹ million
-   ₹ billion

Store canonical value in: - INR absolute value

### Percentages

Store: - decimal canonical form - display percentage

### Periods

Support: - FY - Q1/Q2/Q3/Q4 - TTM - Half-year

### Currency

-   INR
-   USD
-   EUR etc.

Keep original currency and converted value separately.

------------------------------------------------------------------------

# 42. Data quality engine

Checks:

1.  Revenue cannot unexpectedly become negative unless source allows it.
2.  Balance-sheet accounting equation.
3.  PAT vs EPS consistency.
4.  Shares outstanding consistency.
5.  Duplicate filing detection.
6.  Missing periods.
7.  Unit mismatch.
8.  Standalone/consolidated mismatch.
9.  Restatement/version detection.
10. Source conflict detection.

Every issue: - Severity - Source - Record - Error - Status - Reviewer -
Resolution

------------------------------------------------------------------------

# 43. Calculation engine

Create one central calculation library.

Examples:

``` text
calculatePE()
calculatePB()
calculateROE()
calculateROCE()
calculateROA()
calculateDebtEquity()
calculateNetDebtEBITDA()
calculateFCF()
calculateCAGR()
calculatePEG()
calculateEV()
calculateDCF()
calculateReverseDCF()
calculateBuybackReturn()
calculateFIRENumber()
calculateSIPRequired()
```

All calculations must be: - Unit-tested - Versioned - Auditable -
Reproducible

------------------------------------------------------------------------

# 44. Screener engine

Do not calculate every metric repeatedly for every request.

Use:

``` text
raw financial data
        ↓
metric calculation
        ↓
materialized metric tables
        ↓
indexes
        ↓
screener query
```

For frequently used screens, maintain materialized views.

------------------------------------------------------------------------

# 45. Scheduled jobs

### Daily

-   Market EOD
-   Corporate actions
-   Announcements
-   Prices
-   News metadata
-   Order extraction
-   Data-quality checks

### Quarterly

-   Results ingestion
-   Financial statement updates
-   Shareholding updates
-   Ratio recalculation

### Event driven

-   Filing detected
-   Buyback detected
-   Demerger detected
-   Order detected
-   Dividend detected

------------------------------------------------------------------------

# 46. Caching

Redis keys:

``` text
stock:{symbol}:quote
stock:{symbol}:fundamentals
stock:{symbol}:ratios
stock:{symbol}:technical
screener:{hash}
market:indices
orders:latest
buybacks:latest
demergers:latest
```

TTL depends on data type.

------------------------------------------------------------------------

# 47. Security

-   HTTPS
-   JWT/access token + refresh token
-   Secure cookies where appropriate
-   Password hashing with Argon2/bcrypt
-   Rate limiting
-   WAF
-   Input validation
-   SQL injection protection
-   XSS protection
-   CSRF protection where applicable
-   RBAC
-   Audit logs
-   Secrets manager
-   Encryption at rest
-   Encryption in transit
-   Database backups
-   Disaster recovery

------------------------------------------------------------------------

# 48. Observability

Use: - OpenTelemetry - Prometheus - Grafana - Centralized logs - Error
tracking

Track: - API latency - ingestion failures - queue depth - parser
failures - stale datasets - DB load - cache hit rate - user errors -
alert delivery

------------------------------------------------------------------------

# 49. Testing

## Frontend

-   Unit tests
-   Component tests
-   Playwright E2E
-   Accessibility tests
-   Responsive tests

## Backend

-   Unit
-   Integration
-   API contract
-   Data pipeline
-   Calculation
-   Security

## Financial calculations

Create fixed test cases for: - CAGR - P/E - ROE - ROCE - DCF - FCF -
FIRE - Buyback - Corporate action adjustments

Financial calculation changes require regression tests.

------------------------------------------------------------------------

# 50. Deployment architecture

``` text
Cloudflare
    ↓
CDN/WAF
    ↓
Load Balancer
    ↓
Angular application
    ↓
NestJS API
    ↓
Redis
    ↓
PostgreSQL/TimescaleDB
    ↓
S3 object storage

Data ingestion workers
    ↓
Queues
    ↓
Raw documents
    ↓
Parsers
    ↓
Normalized DB
```

------------------------------------------------------------------------

# 51. CI/CD

GitHub/GitLab pipeline:

``` text
Pull Request
↓
Lint
↓
Type Check
↓
Unit Tests
↓
Security Scan
↓
Build
↓
Integration Tests
↓
Deploy Staging
↓
E2E
↓
Approval
↓
Production
```

------------------------------------------------------------------------

# 52. Environments

-   Local
-   Development
-   Staging
-   Production

Separate: - Databases - Secrets - API keys - Storage - Queues

------------------------------------------------------------------------

# 53. Phase-wise development

## Phase 0 --- Discovery / legal / data audit

Deliverables: - Feature matrix - Data-source matrix - Licensing matrix -
UX specification - Database schema - API specification - Architecture -
Cost model

Do not start large-scale scraping before source rights are reviewed.

------------------------------------------------------------------------

## Phase 1 --- MVP

Build:

1.  Authentication
2.  Company search
3.  Company profile
4.  Price chart
5.  Fundamentals
6.  Financial statements
7.  Ratios
8.  Technical indicators
9.  Screener
10. Basic valuation
11. Watchlist
12. Corporate actions
13. Portfolio
14. FIRE Tracker

Data strategy: - Public/official where permitted - Licensed/low-cost API
for market prices - Own calculation engine

------------------------------------------------------------------------

## Phase 2 --- Special situations

Build:

15. Big Orders
16. Demergers
17. Buybacks
18. Order book
19. Shareholding history
20. Results
21. Filing search
22. Event alerts

Add: - Document ingestion - PDF parsing - NLP extraction - Validation -
Source citations

------------------------------------------------------------------------

## Phase 3 --- Advanced data

Build:

23. Advanced historical market data
24. Real-time data
25. Advanced institutional data
26. Analyst estimates
27. Professional news
28. Shipping/import/export

Use licensed data vendors.

------------------------------------------------------------------------

## Phase 4 --- AI

Build:

29. AI company analysis
30. Filing summarization
31. Compare companies
32. Natural-language screener
33. AI valuation explanation
34. Research workspace

------------------------------------------------------------------------

# 54. Data-source matrix

  ---------------------------------------------------------------------------------------
  Dataset         Preferred source            Free/public    Paid/license      Extraction
                                              possibility     possibility 
  --------------- ----------------------- --------------- --------------- ---------------
  Company master  NSE/BSE/official                    Yes             Yes             Low

  Daily prices    Exchange/licensed               Limited             Yes              No
                  vendor                                                  

  Real-time       NSE/vendor                       No for             Yes              No
  prices                                       commercial                 
                                               production                 

  Historical EOD  NSE/vendor                      Limited             Yes              No

  Fundamentals    Official filings             Yes/public             Yes          Medium
                                                   access                 

  Financial       Company/exchange             Yes/public             Yes          Medium
  statements      filings                          access                 

  Shareholding    Exchange/company             Yes/public             Yes          Medium
                  filings                          access                 

  Corporate       Exchange/company             Yes/public             Yes             Low
  actions                                          access                 

  Results         Exchange/company             Yes/public             Yes          Medium
                                                   access                 

  Annual reports  Company                  Usually public       No/varies          Medium

  Investor        Company                  Usually public       No/varies          Medium
  presentations                                                           

  Big orders      Exchange/company         Public filings  Licensed feeds            High
                  announcements                                  optional 

  Demergers       Exchange/company/NCLT    Public sources   Licensed data            High
                  docs                                           optional 

  Buybacks        Exchange/company         Public sources   Licensed data          Medium
                  filings                                        optional 

  News            Company/allowed feeds           Limited             Yes           Avoid
                                                                             unauthorized
                                                                                  copying

  Analyst         Licensed providers           Usually no             Yes              No
  estimates                                                               

  Shipping data   Trade-data providers            Limited     Usually yes      Usually no

  Technical       Own calculation                     Yes              No              No
  indicators                                                              

  Valuation       Own calculation                     Yes              No              No

  FIRE            User input + own                    Yes              No              No
                  calculation                                             
  ---------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 55. Recommended third-party categories

Do not lock the architecture to one provider.

Create adapters:

``` text
MarketDataProvider
FundamentalDataProvider
CorporateActionsProvider
NewsProvider
TradeDataProvider
DocumentProvider
```

Then implementations:

``` text
NSEProvider
BSEProvider
ProviderA
ProviderB
ProviderC
```

This makes it possible to change providers without rewriting the
application.

------------------------------------------------------------------------

# 56. Provider evaluation checklist

For every provider ask:

1.  Indian exchange coverage?
2.  NSE?
3.  BSE?
4.  Real-time?
5.  EOD?
6.  Historical depth?
7.  Corporate actions?
8.  Fundamentals?
9.  Shareholding?
10. Financial statements?
11. Commercial use allowed?
12. Redistribution allowed?
13. Website display allowed?
14. API rate limit?
15. SLA?
16. Data correction policy?
17. Historical revisions?
18. Cost?
19. Support?
20. Contract/licensing restrictions?

------------------------------------------------------------------------

# 57. Cost-control strategy

## Start free/public

Use: - Official filings - Company documents - Your own calculations -
Low-cost API where legally suitable

## Pay only for

-   Real-time market data
-   Deep historical data
-   Data redistribution rights
-   Analyst estimates
-   Premium news
-   Shipping/trade data

## Do not pay for

Metrics you can calculate from licensed/raw data: - P/E - P/B - ROE -
ROCE - CAGR - FCF - RSI - MACD - SMA - DCF - FIRE calculations

------------------------------------------------------------------------

# 58. Important NSE licensing reality (re-verified September 2026)

NSE Data & Analytics Ltd publishes a versioned, dated non-confidential
domestic pricing document (found under nseindia.com's market-data
section) listing separate paid products for: real-time data (L1/L2/L3
and tick-by-tick), EOD/historical data, corporate/master data, analytical
products, and non-display (internal) use. Redistribution to a vendor's
own downstream clients requires **explicit written consent and a prior
license/agreement with NSE Data & Analytics** — this is stated directly
in NSE's own pricing documentation, not an inference.

Therefore: **Do not design the production system around the assumption
that scraping an exchange website, or reselling a broker/personal API
feed, gives unlimited free commercial redistribution rights.** Budget
for either (a) an authorized-vendor (TrueData/GDFL-style) subscription
with redistribution terms confirmed in writing, or (b) a direct NSE
Data & Analytics agreement once volume justifies the cost.

# 58.1 Mutual-fund distribution regulatory reality (new, verified September 2026)

If Track A (goal-based investing + distribution) is built, these facts
must drive the compliance design, not just the data design:

- **SEBI (Mutual Funds) Regulations, 2026** replaced the 1996 framework
  as the governing regulation for the industry — confirm the current
  consolidated text and any transition provisions before finalizing
  onboarding/KYC flows, since older documentation referencing the 1996
  regulations by name is now outdated.
- **ARN registration** (the individual/entity mutual-fund-distributor
  license from AMFI) requires clearing the **NISM Series V-A** exam;
  individual registration cost was **₹3,000 (excluding GST), effective
  October 2024** — re-verify the current fee on AMFI's site before
  quoting it to users/partners.
- A platform operating **under someone else's ARN** (a "National
  Distributor" model) still requires every individual advisor/relationship
  manager interacting with clients to hold and tag **their own ARN** for
  commission attribution — plan the user/roles data model around this
  from day one (an `arn_holder` entity distinct from `platform_account`).
- **Back-office/analytics software is legally distinct from advisory.**
  A distributor's own dashboards (fund comparison, portfolio X-ray,
  goal projections) must stay within "informational/educational"
  framing. Personalised "you should buy/sell/switch fund X" output
  crosses into Investment Adviser (SEBI IA) or Research Analyst (SEBI
  RA) territory, which needs a **separate SEBI registration** the
  entity may not hold. Keep this distinction enforced in the product's
  copy, disclaimers, and even in how AI-research-assistant output
  (Section 27) is worded for the MF-goal flows.
- **Trail-commission-based revenue is the default MFD monetization
  model**; AUM-linked trail commissions are the primary economics behind
  the "Done with you" funnel, distinct from the flat-fee course/tools
  sales in the "Do it yourself" funnel. Model both revenue lines
  separately in the finance/analytics schema (Section 65 below adds the
  fields).

------------------------------------------------------------------------

# 59. Source-of-truth strategy

For each metric:

### Price

Primary: Licensed exchange/vendor feed.

### Financial statement

Primary: Official company filing.

### Corporate event

Primary: Exchange/company filing.

### Order

Primary: Company announcement/exchange filing.

### Demerger

Primary: Scheme/company/exchange/NCLT source.

### Buyback

Primary: Company/exchange filing.

### Technical indicator

Primary: Your calculation engine from licensed price data.

### Valuation

Primary: Your calculation engine.

------------------------------------------------------------------------

# 60. UI data-state requirements

Every table/page should support:

-   Loading
-   Empty
-   Error
-   Stale
-   Partial data
-   Last updated
-   Source
-   Retry
-   Pagination
-   Sorting
-   Filtering

For financial data: - Reported - Estimated - Restated - Consolidated -
Standalone

must be visually distinguishable.

------------------------------------------------------------------------

# 61. Accessibility

-   WCAG 2.2 AA target
-   Keyboard navigation
-   Screen-reader labels
-   Focus states
-   Table semantics
-   Color should not be the only signal
-   Responsive layout
-   Minimum touch target sizes

------------------------------------------------------------------------

# 62. Performance targets

Target:

-   Initial page load \< 2.5 sec on good connection
-   API p95 \< 300 ms for cached reads
-   Screener p95 \< 1 sec for common queries
-   Company page cached response \< 500 ms
-   Search response \< 300 ms
-   Large tables use server-side pagination/virtualization

Do not load thousands of rows into Angular at once.

------------------------------------------------------------------------

# 63. SEO

Public pages:

-   Company pages
-   Sector pages
-   Industry pages
-   Screener landing pages
-   Educational pages
-   Corporate event pages where appropriate

Use: - SSR/Angular SSR - Metadata - Canonical URLs - Structured data
where appropriate - Sitemap - robots.txt - Internal linking

------------------------------------------------------------------------

# 64. Monetization architecture (updated to match verified revenue model)

## Track A monetization (matches the live FinanciallyFree.in model)

### Mutual-fund distribution ("Done with you")

-   Free for the end user — revenue is **AUM-linked trail commission**
    paid by AMCs to the AMFI-registered distributor entity, not a
    user-facing subscription.
-   Model this as its own ledger: `arn_holder`, `folio`, `aum_snapshot`,
    `trail_commission_accrual`, reconciled monthly against RTA
    (CAMS/KFintech) statements.

### Course + Techno-Funda Tools + live case studies ("Do it yourself")

-   Sold as one bundled paid program (verified list price ₹75,000,
    discounted price ₹14,999 at time of writing — re-check current
    pricing before quoting) that grants:
    -   Course Library: **lifetime** access.
    -   Techno-Funda Tools (Market Mood, Master Tracker, PEAD Tool,
        Vahan Dashboard): **1-year term** access — must expire and be
        renewable, not perpetual.
    -   Weekly Live Business Case Studies: **1-year term** access to
        scheduled Zoom sessions + replay library.
-   Optional upsell: standalone renewal of Techno-Funda Tools / live
    sessions after year one, priced independently of the course.

## Track B monetization (only if the extended research terminal is built)

### Free

-   Basic company data, delayed/basic market information, limited
    screener, limited watchlists.

### Pro

-   Advanced screener, advanced valuation, special situations, alerts,
    portfolio tracking.

### Premium

-   Advanced/real-time data, AI research, advanced screeners, historical
    analysis.

Actual plan limits depend on data licenses; keep Track A's MFD/course
revenue lines and Track B's SaaS-subscription lines in separate P&L
buckets since their regulatory treatment (trail commission vs. GST-able
service fee) differs.

------------------------------------------------------------------------

# 65. What should be built first

## Highest priority

1.  Data model
2.  Company master
3.  Financial data pipeline
4.  Price data
5.  Company page
6.  Fundamental dashboard
7.  Screener
8.  Calculation engine
9.  Valuation
10. Corporate actions
11. Watchlist
12. Portfolio
13. FIRE

Then:

14. Big Orders
15. Demerger
16. Buyback
17. Filing parser
18. Alerts

Then:

19. Paid real-time
20. Shipping
21. Analyst estimates
22. AI

------------------------------------------------------------------------

# 66. Final acceptance criteria

The product is MVP-ready when:

-   User can search an Indian listed company.
-   Company page loads all available data.
-   Financial statements are traceable to sources.
-   Ratios calculate consistently.
-   Screener can combine 20+ filters.
-   Valuation is reproducible.
-   Technical indicators are calculated correctly.
-   Corporate actions adjust portfolio correctly.
-   User can create watchlists.
-   User can add transactions.
-   FIRE calculations are reproducible.
-   Every special-situation record has a source.
-   Data ingestion is monitored.
-   Failed jobs are visible to admins.
-   Data-source licenses are documented.
-   No unauthorized proprietary content is used.
-   Automated tests cover financial calculations.
-   Production observability is enabled.

------------------------------------------------------------------------

# 67. Final recommended architecture

``` text
                           USERS
                             |
                        Cloudflare
                             |
                         Angular SSR
                             |
                        API Gateway
                             |
                       NestJS Backend
                             |
        ┌────────────────────┼────────────────────┐
        |                    |                    |
     REST API             WebSocket/SSE        Search API
        |                    |                    |
        └────────────────────┼────────────────────┘
                             |
                     Calculation Engine
                             |
          ┌──────────────────┼──────────────────┐
          |                  |                  |
      PostgreSQL          Redis             OpenSearch
          |
      TimescaleDB
          |
      Object Storage
          |
     Data Ingestion
          |
   ┌──────┼────────┬───────────┬──────────────┐
   |      |        |           |              |
  NSE    BSE     SEBI      Company IR    Licensed APIs
   |      |        |           |              |
   └──────┴────────┴───────────┴──────────────┘
                         |
                  Document Pipeline
                         |
                  PDF/OCR/NLP Parser
                         |
                   Validation Engine
                         |
                    Data Warehouse
```

------------------------------------------------------------------------

# 69. Track A feature specifications (the parts the original draft was missing)

## 69.1 Goal-based investing engine ("Done with you")

### Onboarding flow

1.  Landing page with four goal tiles: Emergency Fund, Retirement,
    Child Education, Wealth Creation (matches the live site's chart
    tool) — plus a fifth "Custom goal" tile.
2.  Per-goal questionnaire: target amount or target outcome (e.g.
    "retire at 55"), time horizon, current savings toward this goal,
    risk comfort (conservative/balanced/growth).
3.  Output: **recommended monthly SIP amount**, with the formula and
    assumptions (expected return, inflation) shown, not hidden.
4.  "Every rupee gets a purpose" allocation view — when a user has
    multiple goals, show how a single monthly investable surplus is
    split across goals, editable by drag or by amount.
5.  Hand-off to KYC + fund selection + mandate setup once the user
    confirms a plan.

### Data model additions

``` text
goals
goal_types (enum: emergency_fund, retirement, child_education, wealth_creation, custom)
goal_plans
goal_plan_allocations
sip_recommendations
kyc_records
can_folio_links
```

### Fund-selection logic

-   Map goal type + horizon + risk band to a **fund category** (e.g.
    liquid/overnight fund for Emergency Fund; hybrid/equity for
    long-horizon Wealth Creation) using a documented, versioned rule
    table — never a black-box "AI picks your fund" flow, since that
    risks crossing into unregistered investment advice.
-   Within a category, present AMC-agnostic comparison (expense ratio,
    trailing returns net of a standard benchmark, fund manager tenure,
    exit load) sourced from RTA/AMC factsheets and licensed MF data
    feeds, not opinion.

## 69.2 Mutual-fund KYC & transaction execution

1.  **KYC**: PAN + Aadhaar-based e-KYC through a **KYC Registration
    Agency (KRA)** — e.g. CVL KRA, CAMS KRA, KFin KRA, NDML — is
    mandatory before any folio can be opened; integrate with one KRA
    as primary and support KYC-status lookup across all registered
    KRAs (an investor may already be KYC-verified via a different KRA).
2.  **CAN/folio creation**: route through **BSE StAR MF** (primary,
    highest transaction volume industry-wide) with **NSE NMF II** as a
    secondary/failover rail if dual-connectivity is justified by scale.
3.  **Transaction types to support end-to-end**: lump sum, SIP
    registration/pause/cancel, STP, SWP, switch, redemption — mirroring
    the transaction types BSE StAR MF documents natively.
4.  **Settlement & reconciliation**: nightly reconciliation job against
    RTA (CAMS/KFintech) statement files; never treat an order-placement
    acknowledgement as confirmed settlement.
5.  **Consolidated Account Statement (CAS)** ingestion for portfolio
    view accuracy, since a user's historical folios may pre-date the
    platform.

## 69.3 Techno-Funda Tools module (the real premium dashboard suite)

Build as four distinct, separately-licensable widgets under one
"Techno-Funda Tools" subscription, each with its own refresh cadence and
data dependency:

### Market Mood (bull/bear sentiment gauge)

-   Inputs: index breadth (advance/decline), volatility index (India
    VIX), moving-average positioning of benchmark indices, FII/DII
    net flows.
-   Output: a single composite gauge (e.g. 0–100, Extreme Fear → Extreme
    Greed framing) plus the component breakdown, with methodology shown.
-   This is a **derived, house-built index** — do not present it as an
    official index, and version the formula so historical gauge values
    stay reproducible after formula changes.

### Master Tracker (curated quality watchlist, not a universal screener)

-   A maintained, editorially-curated list of companies meeting a fixed
    quality rule set (e.g. consistent ROCE, revenue growth, low
    leverage) refreshed on a schedule (e.g. post-results, quarterly).
-   Distinct from Track B's "Screener" (which is a user-driven,
    arbitrary-filter tool): Master Tracker is opinionated and
    editorial, so its methodology and last-review-date must be shown
    on every view.

### PEAD Tool (Post-Earnings-Announcement Drift)

-   Detect earnings-surprise events (actual vs. consensus/expected,
    or vs. a rule-based YoY/QoQ threshold if licensed consensus
    estimates aren't available) and track the subsequent price drift
    window (commonly 20–60 trading days in PEAD literature).
-   Show the historical hit-rate/backtest methodology transparently;
    PEAD is a well-documented academic anomaly, not a proprietary
    signal, so cite the standard methodology rather than imply
    exclusivity.

### Vahan Dashboard (vehicle-registration alternative data)

-   Source: Government of India's public VAHAN dashboard
    (parivahan.gov.in) — vehicle registrations by category (2W/3W/PV/
    CV/tractor), state, RTO, and manufacturer.
-   Build a scheduled ETL against the public dashboard (respecting its
    terms of use/rate limits) rather than assuming an open API exists;
    re-verify current access terms before production ingestion, since
    government portals change access mechanisms without notice.
-   Present as a leading-indicator proxy for auto/auto-ancillary
    company performance, explicitly labelled as **third-party
    government data, not company-reported data**.

## 69.4 LMS (course) module

-   Video hosting: a purpose-built video platform (see Section 70.3)
    with DRM/watermarking for paid-course protection, progress
    tracking, and resumable playback.
-   Structured curriculum: modules → lessons → quizzes → completion
    certificate.
-   Access control: lifetime for "Course Library", term-limited (auto-
    expiring) for "Techno-Funda Tools" and "Live Case Studies", enforced
    server-side via an `entitlements` table keyed by SKU and expiry.
-   Language: build for Hinglish/bilingual content from the start
    (subtitle tracks, bilingual UI strings) — this is a stated feature
    of the real product, not an afterthought.

## 69.5 Live webinar module

-   Scheduled recurring sessions (e.g. weekly) via a video-conferencing
    API (Section 70.3), with calendar invites, reminder notifications,
    attendance tracking, and automatic replay publishing to entitled
    users after the session ends.
-   Session metadata: topic (e.g. "Q2 FY26 — Result analysis"),
    instructor, linked company/filing references discussed, so replay
    content is searchable later.

------------------------------------------------------------------------

# 70. Re-verified third-party infrastructure (payments, messaging, video) — September 2026

## 70.1 Payments & subscription billing (India)

Do not build custom PCI-scope card handling; use a licensed Indian
payment aggregator. As of mid-2026, the three commonly evaluated are:

-   **Razorpay** — broadest India-specific feature set: UPI AutoPay for
    recurring mandates, hosted subscription/dunning management,
    domestic card rate commonly cited around 2% (confirm current rate),
    and the largest ecosystem/documentation base. Reasonable default for
    a domestic-first product with both the one-time course purchase and
    the recurring Techno-Funda Tools renewal.
-   **Cashfree** — typically the lowest quoted domestic fees and strong
    payout/vendor-disbursement tooling (relevant if the platform ever
    pays out commissions to sub-distributors); subscription tooling has
    become competitive with Razorpay.
-   **PayU** — a reasonable third option, notably for EMI/BNPL checkout
    options; developer experience and docs are generally reported as
    behind Razorpay/Cashfree.
-   Whichever is chosen, treat published fee percentages as indicative
    only — actual negotiated rates depend on volume and change; get a
    current quote before finalizing unit economics. A common resilience
    pattern is running one gateway as primary and a second as failover.
-   Mutual-fund transaction money movement (SIP debits) is a **separate
    rail from course/subscription billing** — it flows through the
    AMC/RTA/exchange settlement system (via BSE StAR MF/NMF II and
    NACH/UPI Autopay mandates registered with the AMC), not through a
    generic payment gateway. Do not conflate the two payment flows in
    the architecture.

## 70.2 Messaging & notifications

-   **WhatsApp Business Platform (Meta) via a Business Solution
    Provider (BSP)** — e.g. Gupshup, Interakt, AiSensy, or Twilio's
    WhatsApp API — for SIP-due reminders, webinar reminders, and course-
    progress nudges. Requires pre-approved message templates for
    anything outside a live customer-service session window, and
    explicit opt-in; do not use WhatsApp for anything resembling
    unsolicited investment tips (this both breaches WhatsApp commerce
    policy and risks regulatory characterization as unlicensed advice).
-   **Email** — a transactional email provider (e.g. Amazon SES,
    Postmark, SendGrid) for statements, KYC status, and receipts.
-   **Push** — standard FCM/APNs for the mobile app once one exists.
-   **SMS** — via a DLT-registered (TRAI Distributed Ledger Technology)
    sender ID, mandatory for any commercial SMS to Indian numbers since
    2019's TRAI regulations; budget onboarding time for DLT template
    registration.

## 70.3 Video hosting & conferencing

-   **Course video hosting**: a platform offering DRM/token-based
    playback protection and adaptive bitrate streaming — e.g. Cloudflare
    Stream, Mux, or Vimeo's paid tiers — rather than self-hosting raw
    files, to protect the ₹14,999+ course from casual redistribution.
-   **Live webinars**: **Zoom's Meeting/Webinar SDK/API** or an
    equivalent (e.g. Google Meet via Calendar API integration) for the
    weekly live case-study sessions, with server-side recording pulled
    into the LMS's replay library via webhook once each session ends.

------------------------------------------------------------------------

# 71. Data protection & compliance update (re-verified September 2026)

India's **Digital Personal Data Protection Act, 2023 (DPDP Act)** and
the **Digital Personal Data Protection Rules, 2025**, notified by MeitY
on **13 November 2025**, govern this product, since it processes PAN,
Aadhaar-linked KYC, financial holdings, and contact data of Indian
residents. Current, verified implementation status:

-   Only **Stage 1** was legally in force as of mid-2026: establishment
    of the Data Protection Board of India (DPBI) and related rule-making
    machinery. The Board's Chairperson/Member posts were still being
    filled (MeitY invited applications in May 2026) — do **not**
    describe the DPBI as a fully staffed adjudicatory body yet.
-   Full compliance (consent-manager registration, breach-notification
    machinery, data-principal rights operationalisation) is on a
    **phased, roughly 18-month timeline**, with the **outer enforcement
    deadline commonly cited as 13 May 2027**. Treat every specific
    obligation as a future date, not a live requirement, unless
    re-confirmed against MeitY's latest notification at build time.
-   Penalties are steep once enforced — up to **₹250 crore** for
    failing to implement reasonable security safeguards leading to a
    breach — so design consent capture, data minimisation, breach
    logging, and children's-data safeguards (verifiable parental
    consent) into the schema now rather than retrofitting later, even
    though the enforcement clock hasn't fully started.
-   Because this product also touches AMFI/SEBI-regulated data (KYC,
    holdings), it separately sits inside **SEBI's existing cyber-
    security and data-localisation circulars for regulated
    intermediaries**, which are independent of, and already in force
    ahead of, DPDP — confirm current SEBI circulars for the specific
    intermediary category (MFD vs. IA vs. RA) the entity is registered
    as.

------------------------------------------------------------------------

# 72. UI/UX best practices (expanded)

## 72.1 Principles specific to this product's real user base

-   The verified product targets **retail Indian savers/investors in
    Hinglish**, not institutional analysts — this should visibly shape
    UI copy, tooltips, and onboarding tone (plain language, rupee-unit
    formatting in lakh/crore by default, not just absolute INR or
    Western thousands-separators).
-   **Goal-first navigation** for Track A: the primary nav metaphor
    should be "your goals" and "your course/tools", not a generic
    stock-terminal sidebar; reserve the Track B terminal-style sidebar
    (Section 3.1) for a clearly separated "Research" area so casual
    goal-based users are never dropped into a 20-tab professional
    screener by accident.
-   **Never let opinionated content (Market Mood gauge, Master Tracker
    picks) look identical in weight/prominence to neutral, sourced data
    (official financials).** Use a consistent visual language (e.g. a
    distinct accent color and an "our view" badge) so users can tell
    editorial/derived content apart from reported facts at a glance —
    this is both good UX and a compliance safeguard against the
    advice-vs-education line in Section 58.1.
-   **Progressive disclosure for a first-time saver**: the goal
    questionnaire and SIP output should be completable in under two
    minutes on mobile, with "why this number" expandable rather than
    front-loaded, since the verified funnel is optimized for quick
    goal-to-SIP conversion.

## 72.2 Design system & accessibility

-   Establish one design system (tokens for color, spacing, type scale)
    shared across the marketing site, goal funnel, LMS, and (if built)
    Track B terminal, so a user doesn't experience three different
    products.
-   Support **dark mode** and **Hindi/English toggle** at minimum, given
    the stated Hinglish-first audience.
-   Meet WCAG 2.2 AA (Section 61) — particularly color-independent
    signalling for gain/loss (many Indian users are on low-end Android
    devices with poor color reproduction outdoors).
-   Design mobile-first: the verified funnel and course are consumed
    predominantly on phones; treat desktop as the expanded/secondary
    layout, not the primary one, which is a reversal from a typical
    "Track B terminal" assumption.

------------------------------------------------------------------------

# 73. Optimized backend & scalable architecture (expanded)

## 73.1 Scaling targets

Design explicitly for these tiers rather than one fixed number, since
Track A (mass-market funnel + course) and Track B (research terminal)
have very different load shapes:

-   **Track A read path** (marketing site, goal funnel, course
    playback): bursty, spiky around promotions/webinars — put this
    behind a CDN (Cloudflare/CloudFront) with aggressive static-asset
    caching and edge rendering for the funnel's mostly-static screens.
-   **Track A write path** (KYC submission, SIP mandate creation,
    course purchase): low absolute volume, high correctness requirement
    — favor strong consistency (PostgreSQL transactions) over
    throughput optimisation here; this path should never be the
    scaling bottleneck.
-   **Track B read path** (screener queries, company pages): the
    highest-QPS, most latency-sensitive path if built — this is where
    materialized views, Redis caching, and read replicas matter most
    (Sections 44/46 already specify this).
-   **Live-webinar spikes**: hundreds to thousands of concurrent
    viewers at a fixed weekly time — offload entirely to the video-
    conferencing/streaming vendor (Section 70.3) rather than
    self-hosting media servers; the app backend only needs to handle
    auth-gated join-link issuance and post-session webhook ingestion.

## 73.2 Horizontal scaling pattern

-   Stateless API layer (NestJS) behind a load balancer, autoscaled on
    CPU/queue-depth, so Track A promotional spikes and Track B screener
    load can scale independently if split into separate deployable
    services once traffic justifies it.
-   PostgreSQL: start single-primary with read replicas for the
    Track B research/read-heavy path; only consider sharding once a
    single primary's write throughput is the demonstrated bottleneck —
    don't pre-shard speculatively.
-   Redis: separate logical caches for Track A (entitlements, goal
    calculations) and Track B (screener/materialized metrics) so a
    Track B cache-invalidation storm can't degrade Track A checkout.
-   Queues (BullMQ/Redis, migrating to Kafka only if event volume
    demands it — Section 30/45): isolate the KYC/transaction-execution
    queue from the document-ingestion/screener-refresh queue, since the
    former needs strict ordering/at-least-once delivery guarantees and
    the latter is throughput-oriented and can tolerate reordering.
-   Multi-region: not required at MVP for an India-only product (data-
    localisation and latency both favor a single Indian AWS/GCP/Azure
    region, e.g. ap-south-1); revisit only if/when NRI user volume or
    DR requirements justify a second region.

## 73.3 Cost and reliability guardrails

-   Track every third-party API call's cost per unit against actual
    usage (Section 57) — the biggest avoidable cost in this specific
    product is over-provisioning real-time market data for a Track A
    audience that mostly needs daily NAVs and goal projections, not
    tick data.
-   Define SLOs per path: goal-funnel completion should feel instant
    (sub-second) since it drives conversion; screener/company-page SLOs
    can be more relaxed (Section 62's existing targets are reasonable
    for Track B).
-   Chaos-test the KYC/transaction path specifically for **partial
    failure** (e.g. BSE StAR MF acknowledges an order but the
    reconciliation file arrives inconsistent) — this is the single
    highest-consequence failure mode in Track A and needs explicit
    reconciliation/alerting design, not just generic retry logic.

------------------------------------------------------------------------

# 74. Updated acceptance criteria (Track A, additive to Section 66)

The Track A product is MVP-ready when, in addition to any Track B
criteria that apply:

-   A user can complete the goal questionnaire and receive a SIP
    recommendation with visible assumptions, in under two minutes on a
    mid-range Android phone.
-   KYC status can be checked/created against at least one KRA, with
    graceful handling of "already KYC-verified elsewhere".
-   A SIP mandate can be created and routed through BSE StAR MF (or
    NSE NMF II), with nightly RTA reconciliation confirming settlement.
-   Course purchase grants correctly-scoped entitlements (lifetime vs.
    1-year term) enforced server-side, not just client-side.
-   Techno-Funda Tools widgets (Market Mood, Master Tracker, PEAD,
    Vahan Dashboard) each show their data source, last-updated
    timestamp, and methodology summary.
-   Live webinar join links are entitlement-gated and replays publish
    automatically post-session.
-   WhatsApp/email reminders respect opt-in and use pre-approved
    templates.
-   All disclaimers (AMFI ARN disclosure, "not investment advice",
    mutual-fund risk disclosure) render on every relevant screen, not
    only the marketing homepage.
-   DPDP-readiness groundwork (consent capture, data minimisation,
    breach logging) is in place even though full enforcement is not
    yet live, per Section 71.

------------------------------------------------------------------------

# 75. Bottom line

The best implementation is **not** "scrape FinanciallyFree and copy it."
It is also not "assume FinanciallyFree is a stock-screener terminal and
build that instead" — the September 2026 verification shows the real
product is a **goal-based mutual-fund distribution funnel bundled with
a paid Techno-Funda investing course, premium 1-year tool subscriptions,
and live webinars**, sitting on top of an **AMFI-registered distributor**
compliance model, not a SEBI Research Analyst or Investment Adviser
model.

The recommended build order is therefore:

1.  **Track A first** (Section 69–74): goal engine → KYC/KRA → BSE StAR
    MF execution → RTA reconciliation → LMS/course → Techno-Funda Tools
    (Market Mood, Master Tracker, PEAD, Vahan Dashboard) → live webinars
    → compliant messaging/billing. This is the faithful, revenue-
    validated equivalent of the live product.
2.  **Track B as a later, explicitly-scoped expansion** (Sections 1–68):
    **official/licensed data → normalized data platform → calculation
    engine → screener → special-situation extraction → research
    dashboard → alerts → AI research**, if and when the business decides
    to become a broader research terminal rather than a distribution +
    education business.

This ordering gives the same or broader feature set than the real
product while keeping each track maintainable, auditable, scalable, and
aligned with the correct regulatory model for what it actually is.

## Primary references checked (re-verified, with access method and date)

-   `financiallyfree.in` homepage — fetched directly, September 2026:
    confirmed "Done with you" (goal-based SIP investing, AMFI ARN-350272,
    FutureZenith Insights LLP) and "Do it yourself" (Zero to Hero course)
    as the two live product tracks; no Big Orders/Demergers/Buybacks/FIRE
    Tracker/screener surfaces found on the live site.
-   `financiallyfree.in/site/education.html` — fetched directly,
    September 2026: confirmed Course Library, Techno-Funda Tools
    (Market Mood, Master Tracker, PEAD Tool, Vahan Dashboard, 1-year
    access), Weekly Live Business Case Studies (1-year access), pricing
    (₹75,000 list / ₹14,999 shown), and the "educational, not investment
    advice" disclaimer.
-   NSE Data & Analytics non-confidential domestic pricing document
    (nseindia.com, dated March 2026) and NSE's paid real-time-data page —
    web-searched/fetched, September 2026.
-   TrueData and Global Data Feeds public API/pricing pages — web-
    searched, September 2026.
-   Broker API documentation/comparisons for Zerodha Kite Connect, Angel
    One SmartAPI, Upstox, DhanHQ, Fyers, Alice Blue, Shoonya — web-
    searched, September 2026.
-   BSE StAR MF API/web-services documentation, MFD-platform comparison
    articles (BSE StAR MF vs. NSE NMF II vs. MF Utilities transaction
    volumes, ARN registration fee, SEBI Mutual Funds Regulations 2026) —
    web-searched, September 2026.
-   MeitY/DPDP Act & Rules status trackers and legal-compliance guides
    (Rules notified 13 November 2025; Stage 1 only in force; ₹250 crore
    maximum penalty; ~13 May 2027 outer compliance deadline) — web-
    searched, September 2026.
-   Razorpay/Cashfree/PayU comparison and pricing articles for Indian
    subscription billing — web-searched, September 2026.

**Re-verify every figure above before contractual commitment** — API
pricing, regulatory deadlines, and even FinanciallyFree.in's own public
pricing/feature set can change after this document's verification date.
