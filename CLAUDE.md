# Project Status Dashboard — CLAUDE.md

## Overview

A full-stack project status dashboard that integrates with Jira to visualize burndown charts, Monte Carlo forecasting, and throughput metrics. Built as a pnpm monorepo with a NestJS backend and Next.js frontend.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4, ECharts 6 |
| Backend | NestJS 11, TypeScript 5.7, Prisma 7 (PostgreSQL adapter) |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT (Passport.js), bcrypt, role-based access (OWNER / USER) |
| Package Manager | pnpm 8+ (workspaces monorepo) |

---

## Project Structure

```
project-status-dashboard/
├── backend/                  # NestJS API (port 3005)
│   ├── src/
│   │   ├── auth/             # JWT auth, roles, invite flow, email verification
│   │   ├── projects/
│   │   │   ├── metrics/      # Weekly metrics computation
│   │   │   ├── monte-carlo/  # Stochastic forecasting (10,000 simulations)
│   │   │   ├── baseline/     # Linear burn baseline calculation
│   │   │   └── excel-parser/ # Excel parser (exists, not actively used)
│   │   ├── jira/             # Jira Cloud REST API client (basic auth)
│   │   └── prisma/           # Prisma module + service
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── frontend/                 # Next.js app (port 3002)
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # sign-in, sign-up, verify pages
│       │   └── (dashboard)/  # Protected pages: projects, status, team
│       └── lib/
│           ├── api-client.ts # Axios instance + API wrappers
│           └── auth-context.tsx
├── docker-compose.yml        # PostgreSQL only
├── pnpm-workspace.yaml
└── package.json              # Root monorepo scripts
```

---

## Local Development

### Prerequisites
- Node.js 22+, pnpm 8+, Docker

### Setup

```bash
pnpm install
cp .env.example backend/.env   # then fill in values
docker-compose up -d           # start PostgreSQL
cd backend && npx prisma migrate dev
pnpm dev                       # starts both frontend and backend in parallel
```

### Access Points

| Service | URL |
|---|---|
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:3005/api |
| Swagger docs | http://localhost:3005/api/docs |
| Default login | `admin@dashboard.dev` / `admin123` |

---

## Environment Variables

All variables live in `backend/.env`. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (change in production) |
| `FRONTEND_URL` | CORS origin (`http://localhost:3002`) |
| `JIRA_EMAIL` | Jira Cloud account email |
| `JIRA_API_TOKEN` | Jira Cloud API token |
| `JIRA_CLOUD_INSTANCE_URL` | Jira instance URL (`https://company.atlassian.net`) |
| `PORT` | Backend port (default: 3005) |

---

## Scripts

```bash
pnpm dev          # run frontend + backend in parallel (root)
pnpm build        # build all packages
pnpm test         # run all tests
pnpm lint         # lint all packages

# Backend only
cd backend
pnpm start:dev    # hot-reload watch mode
pnpm test:e2e     # end-to-end tests
npx prisma studio # database GUI
npx prisma migrate dev --name <name>

# Frontend only
cd frontend
pnpm dev          # Next.js dev server (port 3002)
```

---

## Key Architecture Decisions

- **No caching / snapshots:** All metrics (burndown, Monte Carlo, throughput) are computed live from Jira on each request. The `Snapshot` model exists in the schema but is not populated.
- **Monorepo:** pnpm workspaces. Run commands from the root or per-package. Never use npm or yarn.
- **Route groups:** Next.js uses `(auth)` and `(dashboard)` groups for layout sharing. Protected routes check JWT via `useAuth()` hook.
- **Jira pagination:** Uses cursor-based pagination (Jira API v3) to handle large datasets.
- **Week boundaries:** Weeks start on Monday. Throughput periods are Monday–Saturday (UTC).
- **Project begin date:** Always expected to be a Friday.
- **Status mapping:** Configurable per project (JSON field `statusConfig`). Supports bilingual statuses (Portuguese + English).
- **Rate limiting:** 30 requests / 60 seconds globally via `@nestjs/throttler`.

---

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /sign-up` — Register owner + company
- `POST /sign-up/complete` — Invited user completes account
- `POST /sign-in` — Login, returns JWT
- `POST /verify` — Verify email code
- `POST /resend-code` — Resend verification code
- `POST /invite` — Invite user (OWNER only)
- `GET /me` — Current user
- `GET /users` — List company users (OWNER only)

### Projects (`/api/projects`)
- `POST /` — Create (OWNER only)
- `GET /` — List company projects
- `GET /:id` — Project details
- `PUT /:id` — Update (OWNER only)
- `DELETE /:id` — Delete (OWNER only)
- `GET /:id/status` — Full dashboard data (live computation)

---

## Database Models

```
Company → User[] + Project[]
User: role (OWNER | USER), isVerified, isActive, companyId
VerificationCode: email, code (6-digit), expiresAt (10 min), one-time use
Project: epicId (unique), jiraBacklogFilterId, jiraThroughputFilterId, statusConfig (JSON)
Snapshot: tied to Project (exists in schema, not yet populated)
```

---

## Known Limitations / TODOs

- Email service is mocked — no real emails are sent in development
- Excel parser exists (`excel-parser/`) but is not integrated into the main flow
- Jira OAuth is not implemented; only basic auth (email + API token) is used
- `Snapshot` model is defined but not written to (all data is fetched live)
- Production secrets (`JWT_SECRET`, `API_KEY`) must be changed before deployment

---

## Security Notes

- The `backend/.env` file may contain real Jira credentials — **do not commit it**
- `SECURITY_REPORT.md` in the root contains a security analysis of the project
- bcrypt cost factor is 12 for password hashing
- JWT tokens expire after 24 hours
