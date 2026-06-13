# syntax=docker/dockerfile:1
# Multi-stage build for the Aurora media house, using Next.js standalone output.
# Works on any Node host: Railway, Render, Fly.io, Google Cloud Run, etc.

FROM node:22-alpine AS base

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next/font fetches Geist from Google Fonts at build time — the build host needs
# outbound network access (available on the platforms above).
RUN npm run build

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# ANTHROPIC_API_KEY is provided at runtime by the platform (not baked into the image).

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
