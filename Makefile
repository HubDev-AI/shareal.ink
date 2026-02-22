.PHONY: up down build rebuild logs clean dev worker test test-e2e migrate generate

# ── Docker ──────────────────────────────────────────────

up:              ## Start all services (rebuilds if code changed)
	docker compose up --build

up-d:            ## Start all services in background
	docker compose up --build -d

down:            ## Stop all services
	docker compose down

build:           ## Build Docker images without starting
	docker compose build

rebuild:         ## Full rebuild (stop, remove, build, start)
	docker compose down
	docker compose build --no-cache
	docker compose up -d

logs:            ## Tail logs from all services
	docker compose logs -f

logs-app:        ## Tail logs from app only
	docker compose logs -f app

logs-worker:     ## Tail logs from worker only
	docker compose logs -f worker

clean:           ## Stop services and remove volumes (resets DB)
	docker compose down -v

# ── Docker + Analytics ──────────────────────────────────

up-analytics:    ## Start all services + Plausible analytics
	docker compose --profile analytics up --build

# ── Local Development ───────────────────────────────────

dev:             ## Start Next.js dev server (local, needs DB + Redis running)
	bun run dev

worker-dev:      ## Start BullMQ worker (local)
	bun run worker

install:         ## Install dependencies
	bun install

generate:        ## Regenerate Prisma client
	bunx prisma generate

migrate:         ## Create and apply a new migration (usage: make migrate name=add_users)
	bunx prisma migrate dev --name $(name)

migrate-deploy:  ## Apply pending migrations (CI/production)
	bunx prisma migrate deploy

# ── Testing ─────────────────────────────────────────────

test:            ## Run unit tests
	bun run test

test-e2e:        ## Run E2E tests (needs running dev server + DB)
	bunx playwright test

# ── Build ───────────────────────────────────────────────

build-local:     ## Production build (local, no Docker)
	bun run build

# ── Help ────────────────────────────────────────────────

help:            ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
