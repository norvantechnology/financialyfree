# FinanciallyFree Platform

Goal-based mutual fund investing + Techno-Funda investing course platform.
AMFI-registered distributor equivalent (ARN-350272 / FutureZenith Insights LLP).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, React Hook Form, ECharts |
| Backend | NestJS, TypeScript, TypeORM, BullMQ, Passport/JWT |
| Database | PostgreSQL 16 + TimescaleDB, Redis 7 |
| Shared | `@ff/types` (DTOs), `@ff/calc` (calculation engine), `@ff/validators` (Zod) |
| Package Manager | pnpm workspaces |

## Quick Start (Local Dev)

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker + Docker Compose

### 1. Clone and install

```bash
git clone <repo>
cd financiallyfree
cp .env.example .env          # Edit .env with your values (mock adapters work without API keys)
pnpm install
```

### 2. Start the database stack

```bash
pnpm docker:up
# or: docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 3. Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed          # optional — loads sample data
```

### 4. Start dev servers

```bash
pnpm dev              # starts api (port 3001) + web (port 3000) concurrently
```

- **Web app**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **Swagger docs**: http://localhost:3001/api/docs

### 5. Run tests

```bash
pnpm test:calc        # unit tests for calculation engine (Section 43)
pnpm -F api test      # NestJS module tests
```

## Project Structure

```
financiallyfree/
├── apps/
│   ├── api/          NestJS backend (port 3001)
│   └── web/          Next.js 14 frontend (port 3000)
├── packages/
│   ├── types/        Shared TypeScript DTOs (used by both api and web)
│   ├── calc/         Central calculation engine (Section 43, 100% unit tested)
│   └── validators/   Zod schemas (shared FE form validation + BE pipe)
├── infra/
│   ├── docker-compose.yml
│   └── postgres/init.sql
└── docs/
    └── integrations/  Where real API keys and integration notes go
```

## Third-Party Integrations

All integrations are wired behind adapter interfaces and run with **mock implementations by default**.
Set `USE_MOCK_*=false` in `.env` and provide real credentials to activate.

| Provider | Purpose | Key Docs |
|---|---|---|
| BSE StAR MF | MF order routing | `docs/integrations/bse-star-mf.md` |
| CVL/CAMS KRA | KYC verification | `docs/integrations/kyc-kra.md` |
| Razorpay | Course/tools payment | `docs/integrations/razorpay.md` |
| Gupshup (WhatsApp BSP) | SIP reminders | `docs/integrations/whatsapp-bsp.md` |
| Amazon SES | Transactional email | `docs/integrations/ses.md` |
| Zoom | Live webinars | `docs/integrations/zoom.md` |
| Cloudflare Stream | Course video hosting | `docs/integrations/video-hosting.md` |
| TrueData (Track B) | Market data | `docs/integrations/truedata.md` |
| AMFI (public) | NAV data | No key needed — public URL |

## Feature Flags

Track B (research terminal) is scaffolded but hidden behind feature flags.

```bash
# In .env to enable Track B:
FEATURE_TRACK_B_ENABLED=true
NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED=true
```

## Build Tracks

- **Track A** (active): Goal engine → KYC → MF execution → LMS → Techno-Funda Tools → Webinars
- **Track B** (scaffolded, feature-flagged): Screener → Valuation → Special Situations → AI Research

## Compliance

This platform is designed for operation as an AMFI-registered Mutual Fund Distributor.
It provides education and goal-based distribution — **not** personalised investment advice.
See `.env.example` for regulatory notes. Re-verify all regulatory requirements at build time.

## Disclaimer

> Mutual Fund investments are subject to market risk. Read all scheme-related documents carefully before investing. AMFI-registered Mutual Fund Distributor ARN-350272. This platform does not provide personalised buy/sell recommendations.
