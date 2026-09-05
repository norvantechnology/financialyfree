# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable

# ── Dependencies ──────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/calc/package.json ./packages/calc/
COPY packages/validators/package.json ./packages/validators/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/calc/node_modules ./packages/calc/node_modules
COPY --from=deps /app/packages/validators/node_modules ./packages/validators/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY tsconfig.base.json .
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @ff/types build
RUN pnpm --filter @ff/calc build
RUN pnpm --filter @ff/validators build
RUN pnpm --filter api build

# ── Runner ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user 'node' (UID 1000)
USER node

COPY --chown=node:node --from=builder /app/apps/api/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/subscriptions/plans || exit 1

CMD ["node", "dist/main"]
