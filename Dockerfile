FROM oven/bun:1.2 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bunx prisma generate

# Copy source
COPY . .

# --- Next.js app ---
FROM base AS app
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]

# --- BullMQ worker ---
FROM base AS worker
CMD ["bun", "run", "worker"]
