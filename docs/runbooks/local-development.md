# Local Development

## Prerequisites

- Node.js **22+**
- pnpm **8+**
- Docker Desktop (for PostgreSQL) — or a local PostgreSQL 14+

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env — see environment.md

# 3. Start PostgreSQL (Docker)
docker-compose up -d

# 4. Run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..

# 5. Start dev servers (root)
pnpm dev
```

## Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:3005/api |
| Swagger docs | http://localhost:3005/api/docs |
| Default login | `admin@dashboard.dev` / `admin123` |

## Root Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start frontend + backend in parallel (hot reload) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |

## Per-package

- Backend: [backend.md](backend.md)
- Frontend: [frontend.md](frontend.md)

## Environment Variables

See [environment.md](environment.md).

## Known Issues

See [known-issues.md](known-issues.md).
