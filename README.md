# FinanciallyFree Platform

> **AMFI-Registered Mutual Fund Distributor Platform** (ARN-350272 / FutureZenith Insights LLP)  
> Combining Goal-Based Mutual Fund Execution, Systematic Asset Allocation, LMS Education, and Techno-Funda Decision Support.

📘 **Comprehensive Master Documentation**: See [PLATFORM_COMPREHENSIVE_REFERENCE.md](file:///home/ig-008/Documents/MY/financiallyfree/PLATFORM_COMPREHENSIVE_REFERENCE.md) for full architectural documentation covering all UI features, backend modules, third-party integrations (BSE StAR MF, Digio, Razorpay, Yahoo Finance, NSE/BSE, Vahan, ET RSS), and detailed tab-by-tab mathematical logic.

---

## Architecture & Technology Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | Next.js 14 App Router (React 18) | Aureus Design System, Fraunces/Inter typography, React Hook Form, Apache ECharts |
| **Backend** | NestJS 10, Express, TypeORM | Modular architecture, BullMQ job queues, Passport JWT authentication, Helmet, Throttler |
| **Database** | PostgreSQL 16 + TimescaleDB | Relational records + time-series analytics (NAV, index feeds) |
| **Cache & Queue** | Redis 7 | Session store, rate-limit buckets, and BullMQ asynchronous workers |
| **Monorepo Shared** | pnpm Workspaces | `@ff/types` (DTOs), `@ff/calc` (mathematical engines), `@ff/validators` (Zod schemas) |

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: $\ge 20.0.0$ (Node 20 or 22 LTS recommended)
- **pnpm**: $\ge 9.0.0$ (`corepack enable` or `npm install -g pnpm@9`)
- **Docker & Docker Compose**: For local PostgreSQL and Redis

### 2. Installation & Environment Setup
```bash
git clone https://github.com/your-org/financiallyfree.git
cd financiallyfree

# Copy default development environment file
cp .env.example .env

# Install all monorepo dependencies
pnpm install
```

### 3. Spin Up Local Infrastructure
```bash
# Starts PostgreSQL 16 and Redis 7
pnpm docker:up
# Or manually: docker compose -f infra/docker-compose.yml up -d
```

### 4. Apply Database Migrations & Seeds
```bash
# Run all 8 TypeORM migrations against the local PostgreSQL instance
pnpm db:migrate

# (Optional) Seed demo courses and test admin users
pnpm db:seed
```

### 5. Launch Development Servers
```bash
# Starts NestJS API (port 3001) and Next.js Web (port 3000) concurrently
pnpm dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Swagger Documentation**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### 6. Validation & Test Suites
```bash
# Run typechecking across all 5 workspace packages
pnpm -r typecheck

# Run unit tests (LMS, MF Execution, Subscriptions, Techno-Funda, FIRE Calculators)
pnpm test

# Run calculation engine tests specifically
pnpm test:calc
```

---

## Production Deployment Runbook

The project is packaged for zero-downtime, containerized deployment using multi-stage non-root Alpine Docker images and strict environment variable injection.

### 1. Production Docker Compose
The `docker-compose.prod.yml` file contains production-ready definitions with health checks, log rotation, and non-root execution:

```bash
# Deploy entire production stack (PostgreSQL, Redis, NestJS API, Next.js Web)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 2. Standalone Container Builds
You can also build and tag each service individually:

```bash
# Build Backend API (Runs as non-root user `node` UID 1000)
docker build -t financiallyfree-api:latest -f apps/api/Dockerfile .

# Build Web Frontend (Runs as non-root user `nextjs` UID 1001 with standalone output)
docker build -t financiallyfree-web:latest -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="https://api.financiallyfree.in" \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..." .
```

### 3. Production Migration Pipeline
Always run database migrations before cutting over application traffic:
```bash
pnpm db:migrate
```

---

## Comprehensive Environment Variable Reference Table

The application is structured to run 100% locally out of the box using mock adapters (`USE_MOCK_*=true`). When going live, provide real provider credentials and flip the corresponding mock flags to `false`.

| Variable Name | Description / Service | Local Dev / Mock Default | Production Requirement | Scope |
|---|---|---|---|---|
| `NODE_ENV` | Application runtime environment | `development` | `production` | Backend / Frontend |
| `PORT` | NestJS API listening port | `3001` | `3001` (or container port) | Backend |
| `DATABASE_URL` | Full PostgreSQL connection URI | `postgres://ff_user:ff_pass@localhost:5432/financiallyfree` | Managed DB URI (AWS RDS / Supabase) | Backend Secret |
| `DATABASE_HOST` | Database host (if using discrete vars) | `localhost` / `postgres` | e.g. `db.example.com` | Backend |
| `DATABASE_PORT` | Database port | `5432` | `5432` | Backend |
| `DATABASE_USER` | Database username | `ff_user` | Strong DB role | Backend Secret |
| `DATABASE_PASSWORD` | Database password | `ff_pass` | Strong generated secret | Backend Secret |
| `DATABASE_NAME` | Database catalog name | `financiallyfree` | Production DB name | Backend |
| `REDIS_HOST` | Redis host | `localhost` / `redis` | Redis cluster hostname | Backend |
| `REDIS_PORT` | Redis port | `6379` | `6379` | Backend |
| `REDIS_PASSWORD` | Redis authentication password | *empty* | Secure auth token | Backend Secret |
| `JWT_SECRET` | Primary JWT token signing secret | `CHANGE_THIS_IN_PRODUCTION_32_CHARS_MIN` | Minimum 32-character random string | Backend Secret |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` | `15m` | Backend |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `CHANGE_THIS_REFRESH_SECRET_32_CHARS` | Minimum 32-character random string | Backend Secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` | `7d` | Backend |
| `COOKIE_SECRET` | Cookie signing secret | `prod_secure_cookie_secret_001` | High-entropy secret | Backend Secret |
| `NEXTAUTH_SECRET` | NextAuth session encryption secret | `default_prod_nextauth_secret_ff` | High-entropy secret | Frontend Secret |
| `NEXTAUTH_URL` | Public canonical frontend URL | `http://localhost:3000` | `https://financiallyfree.in` | Frontend |
| `NEXT_PUBLIC_API_URL` | API endpoint accessed by browser | `http://localhost:3001` | `https://api.financiallyfree.in` | Frontend Public |
| **`USE_MOCK_PAYMENTS`** | Razorpay mock vs real switch | `true` | `false` when Razorpay live | Backend |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | *empty* | `rzp_live_...` | Backend Secret |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | *empty* | Production Key Secret | Backend Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook HMAC secret | *empty* | Webhook secret from dashboard | Backend Secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client-side Razorpay Key ID | *empty* | `rzp_live_...` | Frontend Public |
| **`USE_MOCK_MF_EXECUTION`** | BSE StAR MF mock vs real switch | `true` | `false` when BSE live | Backend |
| `BSE_STAR_MF_BASE_URL` | BSE StAR MF SOAP Gateway URL | `https://bsestarmf.in/` | `https://bsestarmf.in/` | Backend |
| `BSE_STAR_MF_USER` | BSE StAR MF Member User ID | *empty* | Production BSE User ID | Backend Secret |
| `BSE_STAR_MF_PASSWORD` | BSE StAR MF Member Password | *empty* | Production BSE Password | Backend Secret |
| `BSE_STAR_MF_MEMBER_CODE` | BSE StAR MF Member Code | *empty* | 5/6 digit Member Code | Backend |
| `BSE_STAR_MF_PASSKEY` | BSE StAR MF RSA Signature Passkey | *empty* | Production Passkey | Backend Secret |
| **`USE_MOCK_KYC`** | KRA (CVL/CAMS) mock vs real switch | `true` | `false` when KRA live | Backend |
| `KYC_KRA_PROVIDER` | Active KRA provider identifier | `cvl` | `cvl` \| `cams` \| `kfin` \| `ndml` | Backend |
| `KYC_KRA_API_KEY` | KRA gateway API key | *empty* | Production KRA API key | Backend Secret |
| `KYC_KRA_BASE_URL` | KRA gateway API endpoint | `https://www.cvlkra.com/` | Production KRA endpoint | Backend |
| `KYC_PAN_ENCRYPTION_KEY` | AES-256 key for encrypted PAN storage | *generated in dev* | 32-byte hexadecimal key | Backend Secret |
| **`USE_MOCK_VIDEO`** | Cloudflare Stream mock vs real switch | `true` | `false` when Stream live | Backend |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | *empty* | Cloudflare dashboard account ID | Backend Secret |
| `CLOUDFLARE_STREAM_API_TOKEN` | Cloudflare Stream API Token | *empty* | Token with `Stream:Edit` scope | Backend Secret |
| `CLOUDFLARE_STREAM_KEY_ID` | Stream Signing Key ID | *empty* | Generated Key ID | Backend |
| `CLOUDFLARE_STREAM_KEY_JWK` | Stream Signing Key Private JWK | *empty* | Base64-encoded private JWK | Backend Secret |
| `CLOUDFLARE_STREAM_DOMAIN` | Stream Customer Subdomain | *empty* | `customer-<id>.cloudflarestream.com`| Backend / Public |
| **`USE_MOCK_MESSAGING`** | WhatsApp & Email mock vs real switch | `true` | `false` when providers live | Backend |
| `WHATSAPP_BSP_PROVIDER` | WhatsApp Business Provider | `gupshup` | `gupshup` \| `interakt` \| `aisensy` | Backend |
| `WHATSAPP_BSP_API_KEY` | WhatsApp BSP API key | *empty* | Production BSP API key | Backend Secret |
| `WHATSAPP_BSP_APP_NAME` | Registered WhatsApp App name | *empty* | Approved Gupshup app name | Backend |
| `WHATSAPP_FROM_NUMBER` | Approved WhatsApp sending number | *empty* | e.g. `919876543210` | Backend |
| `AWS_REGION` | AWS Region for SES | `ap-south-1` | `ap-south-1` (Mumbai) | Backend |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for SES | *empty* | Production IAM Access Key | Backend Secret |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key for SES | *empty* | Production IAM Secret Key | Backend Secret |
| `SES_FROM_EMAIL` | Verified sender email address | `noreply@yourdomain.com` | `noreply@financiallyfree.in` | Backend |
| **`USE_MOCK_MARKET_DATA`** | TrueData feed mock vs real switch | `true` | `false` when feed live | Backend |
| `TRUEDATA_API_KEY` | TrueData API credentials | *empty* | Production TrueData key | Backend Secret |
| `AMFI_NAV_URL` | Public AMFI NAV text feed | `https://www.amfiindia.com/spages/NAVAll.txt` | *Unchanged (Public)* | Backend |
| `FEATURE_TRACK_B_ENABLED` | Toggle Track B research terminal | `false` | `false` (MVP) / `true` (Post-MVP) | Backend |
| `NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED` | Client toggle for Track B UI | `false` | `false` (MVP) / `true` (Post-MVP) | Frontend Public |

---

## How to Flip Each `USE_MOCK_*` Flag to Production

When live integration credentials are received from providers, transition each subsystem to production by following the step-by-step instructions below:

### 1. Payments: `USE_MOCK_PAYMENTS=false`
1. Complete merchant onboarding at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate Live API Keys (`rzp_live_...`) under **Settings &rarr; API Keys**.
3. Create a Webhook endpoint pointing to `https://api.financiallyfree.in/api/v1/subscriptions/webhook` subscribing to `payment.captured`, `payment.failed`, and `order.paid`.
4. In production environment configuration, populate:
   - `RAZORPAY_KEY_ID=rzp_live_...`
   - `RAZORPAY_KEY_SECRET=...`
   - `RAZORPAY_WEBHOOK_SECRET=...`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`
5. Set `USE_MOCK_PAYMENTS=false`.
6. Refer to the complete checklist in [`docs/integrations/razorpay.md`](docs/integrations/razorpay.md).

### 2. Mutual Fund Execution: `USE_MOCK_MF_EXECUTION=false`
1. Ensure your AMFI ARN (ARN-350272) and EUIN are active.
2. Register as a distributor on [bsestarmf.in](https://bsestarmf.in) and complete UAT certification.
3. Submit backend outbound IP addresses to BSE StAR MF support for firewall whitelisting.
4. Set credentials in production secrets:
   - `BSE_STAR_MF_MEMBER_CODE=...`
   - `BSE_STAR_MF_USER=...`
   - `BSE_STAR_MF_PASSWORD=...`
   - `BSE_STAR_MF_PASSKEY=...`
5. Set `USE_MOCK_MF_EXECUTION=false`.
6. Refer to the complete checklist in [`docs/integrations/bse-star-mf.md`](docs/integrations/bse-star-mf.md).

### 3. Investor KYC / KRA: `USE_MOCK_KYC=false`
1. Execute agency agreement with CVL KRA ([cvlkra.com](https://www.cvlkra.com)) or CAMS KRA.
2. Obtain KRA API Key and register production egress IPs.
3. Configure `KYC_PAN_ENCRYPTION_KEY` with a securely generated 256-bit AES key.
4. In production environment configuration, populate:
   - `KYC_KRA_PROVIDER=cvl`
   - `KYC_KRA_API_KEY=...`
   - `KYC_KRA_BASE_URL=https://www.cvlkra.com/`
5. Set `USE_MOCK_KYC=false`.
6. Refer to the complete checklist in [`docs/integrations/kyc-kra.md`](docs/integrations/kyc-kra.md).

### 4. Video LMS Hosting: `USE_MOCK_VIDEO=false`
1. Subscribe to Cloudflare Stream on [dash.cloudflare.com](https://dash.cloudflare.com).
2. Generate an API token with `Stream:Edit` privileges.
3. Generate a video signing key pair under **Stream &rarr; Signing Keys**.
4. In production environment configuration, populate:
   - `CLOUDFLARE_ACCOUNT_ID=...`
   - `CLOUDFLARE_STREAM_API_TOKEN=...`
   - `CLOUDFLARE_STREAM_KEY_ID=...`
   - `CLOUDFLARE_STREAM_KEY_JWK=...`
   - `CLOUDFLARE_STREAM_DOMAIN=customer-<id>.cloudflarestream.com`
5. Set `USE_MOCK_VIDEO=false`.
6. Refer to the complete checklist in [`docs/integrations/cloudflare-stream.md`](docs/integrations/cloudflare-stream.md).

### 5. Transactional Messaging: `USE_MOCK_MESSAGING=false`
1. Complete WhatsApp Business Account (WABA) verification via Gupshup / Meta.
2. Create and pre-approve SIP installment reminder and KYC completion templates.
3. Verify domain in Amazon SES (DKIM + SPF + DMARC) in `ap-south-1`.
4. In production environment configuration, populate:
   - `WHATSAPP_BSP_API_KEY=...`
   - `WHATSAPP_BSP_APP_NAME=...`
   - `WHATSAPP_FROM_NUMBER=...`
   - `AWS_ACCESS_KEY_ID=...`
   - `AWS_SECRET_ACCESS_KEY=...`
   - `SES_FROM_EMAIL=noreply@financiallyfree.in`
5. Set `USE_MOCK_MESSAGING=false`.

---

## Continuous Integration & Quality Gate

The CI pipeline defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executes on every push and pull request to `main`/`master`:
1. **Lint**: Enforces code style across TypeScript codebase.
2. **Typecheck**: `tsc --noEmit` across all workspace packages (`@ff/types`, `@ff/calc`, `@ff/validators`, `api`, `web`).
3. **Unit Tests**: Full Jest test suite with zero tolerance for broken calculations or mock failures.
4. **Production Build**: Compiles standalone Next.js bundle and NestJS distribution.

---

## Regulatory Compliance Disclosures

- **AMFI Registration**: AMFI-Registered Mutual Fund Distributor ARN-350272 (FutureZenith Insights LLP).
- **Distributor Scope**: Execution-only platform and financial education. The platform does not provide personalized investment advisory or discretionary portfolio management services.
- **DPDP Act 2023**: Explicit consent capture, masked PAN presentation, zero plaintext storage of Aadhaar credentials, and IP/timestamped consent audit logs.
- **Statutory Risk Disclosure**: Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future returns.
