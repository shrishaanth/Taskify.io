.PHONY: dev build build:server build:client lint test clean setup

# ── Development ────────────────────────────────────────────────
dev:
	npm run dev

setup:
	npm install
	npm run build -w packages/shared

# ── Build ──────────────────────────────────────────────────────
build:
	npm run build

build:server:
	npm run build:server

build:client:
	npm run build:client

# ── Quality ────────────────────────────────────────────────────
lint:
	npm run lint

test:
	npm run test

# ── Docker ─────────────────────────────────────────────────────
docker:build:
	docker compose build

docker:up:
	docker compose up

docker:up:prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up

docker:down:
	docker compose down -v

# ── Utilities ──────────────────────────────────────────────────
clean:
	npm run clean

seed:
	npm run seed -w server

migrate:
	npm run migrate -w server
