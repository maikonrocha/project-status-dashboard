---
description: Start all applications (database, backend, frontend)
---

# Start All Applications

// turbo-all

Complete step-by-step sequence to start the Project Dashboard v3 stack.

## Prerequisites

- **Docker Desktop** must be running (for PostgreSQL)
- **Node.js 18+** installed
- **pnpm 8+** installed
- `backend/.env` exists (if not, copy from root: `cp .env.example backend/.env`)

---

## Step 1 — Install dependencies (if needed)

Run from the project root:

```bash
pnpm install
```

## Step 2 — Start PostgreSQL (Docker)

```bash
docker-compose up -d
```

Wait for the container to become healthy (~10 s). Verify with:

```bash
docker ps --filter name=dashboard_postgres --format "table {{.Names}}\t{{.Status}}"
```

## Step 3 — Run Prisma migrations and generate client

```bash
cd backend && npx prisma migrate dev --name init && npx prisma generate
```

> Skip this step if migrations are already applied and the Prisma client is up to date.

## Step 4 — Start backend + frontend (parallel)

From the project root:

```bash
pnpm dev
```

This runs `pnpm --parallel -r dev`, which starts:

| Service  | URL                        | Port |
|----------|----------------------------|------|
| Frontend | http://localhost:3002       | 3002 |
| Backend  | http://localhost:3005/api   | 3005 |

### Or start each service individually

**Backend only:**

```bash
cd backend && pnpm start:dev
```

**Frontend only:**

```bash
cd frontend && pnpm dev
```

---

## Verification

1. Backend health: open http://localhost:3005/api/projects — should return `[]` or a project list.
2. Frontend: open http://localhost:3002 — the project selector page should load.

---

## Stop everything

```bash
# Stop frontend + backend (Ctrl+C in the terminal running pnpm dev)

# Stop PostgreSQL
docker-compose down
```
