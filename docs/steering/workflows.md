# Workflows

Operational sequences for common tasks.

## Start All Applications

Complete stack startup: database → backend → frontend.

### Prerequisites

- **Docker Desktop** running
- **Node.js 22+** installed
- **pnpm 8+** installed
- `backend/.env` exists (if not: `cp .env.example backend/.env`)

### Steps

**1. Install dependencies** (if needed)

```bash
pnpm install
```

**2. Start PostgreSQL**

```bash
docker-compose up -d
```

Verify:

```bash
docker ps --filter name=dashboard_postgres --format "table {{.Names}}\t{{.Status}}"
```

**3. Run migrations and generate Prisma client**

```bash
cd backend && npx prisma migrate dev --name init && npx prisma generate
```

Skip if migrations are already applied.

**4. Start backend + frontend**

From the project root:

```bash
pnpm dev
```

| Service | URL | Port |
|---|---|---|
| Frontend | http://localhost:3002 | 3002 |
| Backend | http://localhost:3005/api | 3005 |
| Swagger | http://localhost:3005/api/docs | 3005 |

Default login: `admin@dashboard.dev` / `admin123`.

### Start services individually

```bash
# Backend
cd backend && pnpm start:dev

# Frontend
cd frontend && pnpm dev
```

### Verification

1. `curl http://localhost:3005/api/projects` — returns `[]` or a project list.
2. Open `http://localhost:3002` — the project selector page loads.

### Stop

```bash
# Ctrl+C in the pnpm dev terminal
docker-compose down
```

## Related

- Local dev: [../runbooks/local-development.md](../runbooks/local-development.md)
- Env: [../runbooks/environment.md](../runbooks/environment.md)
- Backend: [../runbooks/backend.md](../runbooks/backend.md)
- Frontend: [../runbooks/frontend.md](../runbooks/frontend.md)
