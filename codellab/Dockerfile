FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
# Note: We need the schema to generate the client
RUN mkdir -p /tmp/codellab-execution \
    && chmod -R 777 /tmp/codellab-execution

RUN npx prisma generate

# Build Next.js
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install docker-cli for sibling container execution
RUN apk add --no-cache docker-cli

# Create a group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# -----------------------------------------------------------------------------
# Setup for Next.js Web App (in /app/web)
# -----------------------------------------------------------------------------
WORKDIR /app/web

# Copy public assets
COPY --from=builder /app/public ./public

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# -----------------------------------------------------------------------------
# Final Permissions and Config
# -----------------------------------------------------------------------------

# Give permission to the non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose ports
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command (overridden in docker-compose)
CMD ["npm", "run", "start:prod"]
