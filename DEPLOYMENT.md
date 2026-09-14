# FinanciallyFree — Deployment Guide

## Backend API on Render (NestJS)

This repo’s [`render.yaml`](./render.yaml) deploys **backend only** (`@ff/api`).

### Blueprint deploy
1. Open [Render → New → Blueprint](https://dashboard.render.com/).
2. Connect [norvantechnology/financialyfree](https://github.com/norvantechnology/financialyfree).
3. Confirm service `financiallyfree-api`.
4. Fill required env vars (see below), then deploy.

### Required environment variables
| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Postgres connection string (Render Postgres or external) |
| `REDIS_URL` | Redis for BullMQ/cache (Render Redis or external) |
| `FRONTEND_URL` | Your frontend origin (CORS), e.g. `https://your-app.vercel.app` |
| `API_URL` | Public API URL after deploy, e.g. `https://financiallyfree-api.onrender.com` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auto-generated in blueprint, or set manually |

Optional: Razorpay / KYC / BSE keys when turning mocks off.

### Health check
`GET /health` → `{ "ok": true }`

Swagger: `/api/docs`  
API base: `/api/v1`

### Manual Web Service (if not using Blueprint)
- **Runtime**: Node
- **Build**: `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile && pnpm --filter @ff/types build && pnpm --filter @ff/calc build && pnpm --filter @ff/validators build && pnpm --filter @ff/api build`
- **Start**: `pnpm --filter @ff/api start`
- **Health check path**: `/health`
- **Env**: set `NODE_VERSION=20.19.0` (avoid Node 26)

Do **not** use `corepack enable` — Render’s filesystem is read-only and that command fails with `EROFS`.

---

## Frontend (separate)

Deploy `apps/web` on Vercel (see `vercel.json`). Point `NEXT_PUBLIC_API_URL` / `API_URL` at your Render API URL.
