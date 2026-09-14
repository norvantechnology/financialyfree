# Platform Integration & Data Dependency Ledger

This document tracks all external data dependencies across the FinanciallyFree platform, establishing provenance, current execution mode, and verification procedures.

> **Verification Rule**: The column `My Verification Result` is intentionally left blank for manual verification by the platform auditor.

---

## Data Dependencies Ledger

| Source | Claimed Status | My Verification Method | My Verification Result | Last Checked Date | Notes |
|---|---|---|---|---|---|
| **AMFI NAV** (`amfi_nav`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/amfi_nav/refresh`; check if timestamp advances and scheme NAVs update in `mf_schemes`. | | 2026-09-05 | Ingests daily NAV file from `https://portal.amfiindia.com/spages/NAVAll.txt`. Upserts master schemes and records snapshots in `mf_nav_history`. |
| **NSE/BSE Index Snapshot** (`index_snapshots`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/index_snapshots/refresh`; observe duration (~200ms) and live quotes for NIFTY 50, Sensex, Nifty Bank. | | 2026-09-05 | Delayed quotes (15-min) via Yahoo Finance API (`^NSEI`, `^BSESN`, `^NSEBANK`) per PRD Section 58. Commercial redistribution requires exchange license. |
| **India VIX** (`india_vix`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/india_vix/refresh`; verify volatility index value and timestamp update. | | 2026-09-05 | Fetches current NSE volatility index from Yahoo Finance (`^INDIAVIX`). |
| **Market Mood Index** (`market_mood_index`) | `COMPUTED_FROM_LIVE` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/market_mood_index/refresh`; verify composite score, mood label, and 4-factor breakdown. | | 2026-09-05 | Dynamically computed in real-time via `@ff/calc` (`calculateMarketMoodIndex`) using live India VIX and Nifty 50 Advance/Decline breadth. |
| **Vahan ETL** (`vahan_etl`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/vahan_etl/refresh`; verify top state registration figures and category distribution. | | 2026-09-05 | Automated scheduled ETL scraping MoRTH public portal (`https://vahan.parivahan.gov.in/vahan4dashboard/`) with Java Faces session and ViewState handling. |
| **PEAD Source Data** (`pead_source`) | `STATIC_SEED` | Click "Force refresh now" at `/admin/data-integrity` or inspect `/techno-funda?tab=pead`; check the 5 institutional earnings surprise events. | | 2026-09-05 | Curated historical corporate filings (TRENT, DIXON, KAYNES, POLYCAB, HAL) based on SEBI LODR quarterly filings. No paid TrueData/Refinitiv feed currently active. |
| **Valuation Lab Financials** (`valuation_financials`) | `STATIC_SEED` | Click "Force refresh now" at `/admin/data-integrity` or inspect DCF inputs on `/techno-funda?tab=valuation`; verify Revenue, EBITDA, and Net Debt match FY25 statements. | | 2026-09-05 | Audited standalone/consolidated statements for Tata Motors (BSE Scrip 500570, FY25). Baseline parameters used for institutional DCF modeling. |
| **Buybacks** (`buybacks`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/buybacks/refresh`; observe real-time NSE corporate actions, demergers, and tender offer events. | | 2026-09-05 | Ingests live statutory corporate actions and capital reorganizations directly from NSE public register (`https://www.nseindia.com/api/corporates-corporateActions?index=equities`). |
| **Results Calendar** (`results_calendar`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/results_calendar/refresh`; verify real-time corporate board meetings and earnings schedule. | | 2026-09-05 | Ingests live statutory board and earnings release notices directly from NSE public calendar (`https://www.nseindia.com/api/event-calendar`). |
| **Shareholding** (`shareholding`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/shareholding/refresh`; verify real-time SEBI Reg 31 institutional and promoter holdings. | | 2026-09-05 | Ingests live statutory quarterly shareholding filings across 2,200+ listed equities directly from NSE public master (`https://www.nseindia.com/api/corporate-share-holdings-master?index=equities`). |
| **News** (`news`) | `LIVE_FETCH` | Click "Force refresh now" at `/admin/data-integrity` or `POST /api/v1/admin/data-integrity/news/refresh`; verify real headlines parsed from upstream RSS feed and timestamp update. | | 2026-09-05 | Ingests live Indian markets & corporate announcements feed from `https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms`. |
| **Razorpay Payments** (`razorpay_gateway`) | `MOCK_PROVIDER` | Complete checkout simulation at `/checkout/diy-masterclass`; verify order creation, signature verification, and entitlement unlock. | | 2026-09-05 | Sandboxed mock provider (`RazorpayMockProvider`) active until live Razorpay API key and secret are provided. |
| **BSE StAR MF Order Routing** (`bse_star_mf`) | `MOCK_PROVIDER` | Initiate SIP at `/dashboard/invest`; verify simulated UCC generation, BSE SIP registration number (`BSE_SIP_*`), and folio balance creation. | | 2026-09-05 | Sandboxed mock provider (`BseStarMfMockProvider`) active until live member credentials and password/cert are provided. |
| **KRA / DigiLocker KYC** (`kra_kyc`) | `MOCK_PROVIDER` | Complete KYC submission at `/kyc`; verify PAN validation, DigiLocker Aadhaar masking, and simulated Penny Drop verification. | | 2026-09-05 | Sandboxed mock provider (`KycMockProvider`) active until CVL/CAMS KRA or DigiLocker API credentials are provided. |

---

## Direct Inspection Endpoints

- **Live UI Diagnostics Console**: [http://localhost:3000/admin/data-integrity](http://localhost:3000/admin/data-integrity)
- **API Registry Endpoint**: `GET http://localhost:3001/api/v1/admin/data-integrity`
- **PostgreSQL Direct Query**:
  ```bash
  docker exec ncp-postgres psql -U ff_user -d financiallyfree -c \
    "SELECT \"sourceKey\", mode, status, \"durationMs\", \"lastFetchedAt\" FROM data_source_health ORDER BY \"lastFetchedAt\" DESC;"
  ```
