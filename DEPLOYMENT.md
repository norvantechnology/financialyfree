# FinanciallyFree — Deployment Guide

## Backend API on Render (NestJS)

Live API: **https://financialyfree.onrender.com**

- Health: `GET /health` → `{ "ok": true }`
- Swagger: `/api/docs`
- API base: `/api/v1`

This repo’s [`render.yaml`](./render.yaml) deploys **backend only** (`@ff/api`).

### Required Render env vars
| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Supabase **Session pooler** URI (IPv4). Do not use `db.*.supabase.co` on Render free. |
| `REDIS_HOST` / `REDIS_URL` | Optional; placeholder disables BullMQ and uses in-process fallback |
| `FRONTEND_URL` | Your Vercel origin (CORS), e.g. `https://your-app.vercel.app` |
| `API_URL` | `https://financialyfree.onrender.com` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Long random secrets |

### Manual Web Service
- **Build**: `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile && pnpm --filter @ff/types build && pnpm --filter @ff/calc build && pnpm --filter @ff/validators build && pnpm --filter @ff/api build`
- **Start**: `pnpm --filter @ff/api start`
- **Health check path**: `/health`
- **Env**: `NODE_VERSION=20.19.0`, `PORT=10000`

---

## Frontend on Vercel (Next.js)

**Do not** set Root Directory to `apps/api` — that is the Nest API (deployed on Render). Vercel hosts only the Next.js app.

### Build & Deployment settings (fix the “No Next.js version detected” error)

| Setting | Value |
|---------|--------|
| Framework Preset | `Next.js` |
| Root Directory | `apps/web` |
| Include files outside the root directory | **ON** |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm --filter @ff/types build && pnpm --filter @ff/calc build && pnpm --filter @ff/validators build && pnpm --filter @ff/web build` |
| Output Directory | leave as Next.js default (empty / not overridden) |
| Node.js Version | `20.x` (not 24.x) |

Config file used when Root Directory is `apps/web`: [`apps/web/vercel.json`](./apps/web/vercel.json).

### Vercel Environment Variables (Project Settings → Environment Variables)

Set these for **Production** (and Preview if needed):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://financialyfree.onrender.com` |
| `API_URL` | `https://financialyfree.onrender.com` |
| `INTERNAL_API_URL` | `https://financialyfree.onrender.com` |
| `NEXTAUTH_URL` | Your real frontend URL, e.g. `https://your-app.vercel.app` |
| `FRONTEND_URL` | Same as `NEXTAUTH_URL` |
| `NEXTAUTH_SECRET` | Long random secret (32+ chars) |
| `NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED` | `true` (optional) |

`vercel.json` already defaults the three API URL vars. **You must still set `NEXTAUTH_URL` / `FRONTEND_URL` / `NEXTAUTH_SECRET` in the Vercel dashboard** to your real domain.

### Also update Render CORS
On the Render service, set:

```text
FRONTEND_URL=https://YOUR-APP.vercel.app
API_URL=https://financialyfree.onrender.com
```

Redeploy / restart both after changing env vars.
