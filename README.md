# Project Dashboard v3

Production-grade dashboard for Jira project tracking with Monte Carlo forecasting and burndown charts.

## About

Replaces a manual Excel-based "Status Report" workflow. Each project is tied to a Jira Epic and uses **two saved Jira filters**: one for the backlog (scope) and one for team throughput. The system computes weekly metrics, runs **10,000 Monte Carlo simulations** to predict finish dates (P50/P85/P95), and renders a burndown chart with a P95 baseline.

### Key Business Rules

- **Weeks start on Monday**. Project begin date is always expected to be a Monday.
- **Concluded statuses**: `Concluído`, `Concluded`, `Done`, `Pendente de publicação`, `Pendente publicação`, `Pending Publication`, `Pending Publication PRD` — configurable per project.
- **In-progress statuses**: `Em Andamento`, `In Progress`, `Pendente teste`, `Pending Test`, `TEST PENDING`, `Em Teste`, `TEST`, `Acompanhamento`, `Liberado para Homologação`, `AGUARDANDO CODEREVIEW`, `Aguardando MR`.
- **Dynamic scope**: total tasks = completed + remaining, recalculated weekly.
- **Baseline**: linear burn from total tasks to zero, ending at the P95 predicted date.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + ECharts
- **Backend**: NestJS 11 + TypeScript + Prisma ORM 7
- **Database**: PostgreSQL 16
- **Package Manager**: pnpm (monorepo workspaces)
- **Auth**: JWT (Passport.js), bcrypt, role-based access (OWNER / USER)

## Prerequisites

- Node.js 22+
- pnpm 8+
- PostgreSQL 14+ (or Docker)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` as needed (see [Environment Variables](#environment-variables) below).

### 3. Start database

**Docker** (recommended):

```bash
docker-compose up -d
```

**Local PostgreSQL**: create a database named `dashboard_v3` and update `DATABASE_URL` in `backend/.env`.

### 4. Run migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start development

```bash
# Both frontend + backend in parallel (from root)
pnpm dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3002         |
| Backend  | http://localhost:3005/api     |
| Swagger docs | http://localhost:3005/api/docs |
| Default login | `admin@dashboard.dev` / `admin123` |

---

## Environment Variables

All variables live in `backend/.env`. Copy from `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/dashboard_v3` | PostgreSQL connection string |
| `PORT` | `3005` | Backend HTTP port |
| `FRONTEND_URL` | `http://localhost:3002` | Allowed CORS origin (frontend URL) |
| `JWT_SECRET` | _(empty)_ | Secret key for JWT signing (change in production) |
| `JIRA_CLOUD_INSTANCE_URL` | `https://yourcompany.atlassian.net` | Jira Cloud base URL |
| `JIRA_EMAIL` | _(empty)_ | Jira account email (basic auth) |
| `JIRA_API_TOKEN` | _(empty)_ | Jira API token (basic auth) |

### Docker Compose Constants

Defined in `docker-compose.yml`:

| Constant | Value |
|----------|-------|
| PostgreSQL image | `postgres:16-alpine` |
| Container name | `dashboard_postgres` |
| `POSTGRES_DB` | `dashboard_v3` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| Host port | `5432` |
| Volume | `postgres_data` |

---

## Commands

### Root (monorepo)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend in parallel (hot-reload) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | **Hot-reload** dev server (watches file changes) |
| `pnpm start:debug` | Hot-reload + **Node.js debugger** on port 9229 |
| `pnpm start` | Start without watch |
| `pnpm start:prod` | Run compiled `dist/main.js` |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm test` | Run unit tests (Jest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:cov` | Run tests with coverage report |
| `pnpm test:debug` | Debug tests with `--inspect-brk` |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm format` | Format code with Prettier |
| `pnpm lint` | Lint + auto-fix with ESLint |
| `npx prisma studio` | Open Prisma database GUI (browser) |
| `npx prisma migrate dev` | Create/apply migrations |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Push schema without migration files |

### Frontend (`cd frontend`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | **Hot-reload** dev server (Next.js Fast Refresh) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Lint + auto-fix with ESLint |
| `pnpm format` | Format code with Prettier |

---

## Debugging

### Backend (VS Code)

`pnpm start:debug` starts the NestJS server with `--debug --watch`, which opens a Node.js inspector on **port 9229**.

Attach VS Code debugger with this launch config (`.vscode/launch.json`):

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

### Backend Tests

```bash
pnpm test:debug
```

Uses `--inspect-brk` so the debugger pauses on the first line. Attach the same way.

### Frontend

Next.js supports Chrome DevTools and VS Code debugging out of the box. Start `pnpm dev` and use the browser's developer tools. For VS Code, use:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach Next.js",
  "port": 9230,
  "skipFiles": ["<node_internals>/**"]
}
```

Or start with `NODE_OPTIONS='--inspect' pnpm dev`.

---

## Project Structure

```
project-dashboard-v3/
├── frontend/                # Next.js 16 application
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Home — project selector
│       │   ├── (auth)/                     # Auth route group (layout shared)
│       │   │   ├── sign-in/
│       │   │   ├── sign-up/
│       │   │   └── verify/
│       │   └── (dashboard)/                # Protected route group (layout shared)
│       │       └── projects/
│       │           └── [id]/
│       │               ├── status/
│       │               │   ├── page.tsx    # Dashboard
│       │               │   └── StatusDashboardClient.tsx
│       │               └── team/
│       ├── lib/
│       │   ├── server-api.ts               # Server-side API client (SSR)
│       │   ├── auth-context.tsx            # Auth context + useAuth hook
│       │   ├── api-client.ts               # Axios instance + types
│       │   └── utils.ts                    # Utility functions
│       └── globals.css
├── backend/                 # NestJS 11 API
│   ├── src/
│   │   ├── main.ts                         # Entry point (CORS, throttling, /api prefix)
│   │   ├── app.module.ts                   # Root module
│   │   ├── auth/                           # Authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── dto/                        # sign-up, sign-in, DTOs
│   │   │   └── guards/                     # JWT guard, roles guard
│   │   ├── jira/                           # Jira Cloud API client
│   │   │   ├── jira.service.ts
│   │   │   └── dto/
│   │   ├── projects/
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── dto/
│   │   │   ├── metrics/                    # Weekly metrics computation
│   │   │   ├── monte-carlo/                # Monte Carlo simulation (10K simulations)
│   │   │   ├── baseline/                   # Linear burn baseline
│   │   │   └── excel-parser/               # Excel parser (legacy)
│   │   ├── prisma/                         # PrismaService (global)
│   │   └── common/
│   │       └── guards/                     # Shared guards, decorators
│   ├── prisma/
│   │   ├── schema.prisma                   # Database models
│   │   └── migrations/
│   └── test/
│       ├── *.spec.ts                       # Unit tests (beside source)
│       └── jest-e2e.json
├── docker-compose.yml                      # PostgreSQL 16 container
├── .env.example                            # Environment template
├── CLAUDE.md                               # Project documentation
├── pnpm-workspace.yaml                     # pnpm monorepo config
└── package.json                            # Root scripts + husky + lint-staged
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/sign-up` | Register owner + company |
| `POST` | `/api/auth/sign-up/complete` | Invited user completes account setup |
| `POST` | `/api/auth/sign-in` | Login, returns JWT |
| `POST` | `/api/auth/verify` | Verify email verification code |
| `POST` | `/api/auth/resend-code` | Resend email verification code |
| `POST` | `/api/auth/invite` | Invite user to company (OWNER only) |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/auth/users` | List company users (OWNER only) |

### Projects (`/api/projects`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/projects` | Create project (OWNER only) |
| `GET` | `/api/projects` | List company projects |
| `GET` | `/api/projects/:id` | Get project details |
| `PUT` | `/api/projects/:id` | Update project (OWNER only) |
| `DELETE` | `/api/projects/:id` | Delete project (OWNER only) |
| `GET` | `/api/projects/:id/status` | Full dashboard data (live computation) |

## Authentication

The system uses JWT (JSON Web Tokens) with two user roles:

- **OWNER**: Full access (create/update/delete projects, invite users)
- **USER**: Read-only access (view projects, dashboards, team)

### Sign-up & Invite Flow

1. **Owner Registration**: `POST /api/auth/sign-up` creates a new company + owner account
2. **User Invitation**: Owner invites users via `POST /api/auth/invite` (sends email with link)
3. **User Completion**: Invited user visits link, `POST /api/auth/sign-up/complete` to finish setup
4. **Email Verification**: Both owner and invited users receive a 6-digit code, verified via `POST /api/auth/verify`

### JWT Tokens

- Issued on `/api/auth/sign-in` and sign-up completion
- Stored in HTTP-only cookies (frontend sets `Authorization: Bearer <token>` header)
- Expire after 24 hours
- Required for all protected endpoints (all except `/auth/sign-up`, `/auth/verify`, `/auth/resend-code`)

### Password Security

- Passwords hashed with bcrypt (cost factor 12)
- Minimum 8 characters enforced server-side
- All passwords sent over HTTPS in production

---

## License

Proprietary
