FROM oven/bun:1.2
WORKDIR /app

# Prisma needs OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN bun install --frozen-lockfile

# Generate Prisma client (dummy URL — generate only creates client code, no DB connection)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate

# Copy source
COPY . .

# Build Next.js (needs dummy DATABASE_URL so Prisma client doesn't error at import time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
