# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/calc/package.json ./packages/calc/
COPY packages/validators/package.json ./packages/validators/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY tsconfig.base.json .
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED=false
RUN pnpm --filter @ff/types build
RUN pnpm --filter @ff/calc build
RUN pnpm --filter @ff/validators build
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Create non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs --from=builder /app/apps/web/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --chown=nextjs:nodejs --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
