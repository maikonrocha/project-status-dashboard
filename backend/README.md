# Project Dashboard v3 — Backend

NestJS API that powers the Project Dashboard. Handles project CRUD, Excel import, weekly metrics computation, Monte Carlo simulations, and baseline calculation.

## Architecture

```
src/
├── main.ts                          # Bootstrap (CORS, /api prefix, port 3005)
├── app.module.ts                    # Root module (ConfigModule global)
├── prisma/
│   ├── prisma.module.ts             # Global database module
│   └── prisma.service.ts            # Prisma client lifecycle
├── jira/
│   ├── jira.module.ts               # Exported JiraClientService
│   └── jira-client.service.ts       # Paginated Jira API client (POST /rest/api/3/search/jql)
└── projects/
    ├── projects.module.ts           # Feature module
    ├── projects.controller.ts       # REST endpoints
    ├── projects.service.ts          # Orchestration (import → metrics → sim → baseline)
    ├── dto/
    │   ├── project.dto.ts           # CreateProjectDto, UpdateProjectDto
    │   └── status.dto.ts            # StatusDashboardDto (KPIs, charts, tables)
    ├── excel-parser/
    │   └── excel-parser.service.ts  # Parses "Dados Jira" sheet from .xlsx
    ├── jira-import/
    │   └── jira-import.service.ts   # Imports issues from Jira API into the database
    ├── metrics/
    │   └── metrics.service.ts       # Weekly throughput, Monday-aligned boundaries
    ├── monte-carlo/
    │   └── monte-carlo.service.ts   # 10,000 simulations, P50/P85/P95, seedable RNG
    └── baseline/
        └── baseline.service.ts      # Linear burn to P95 finish date
```

## Environment Variables

Stored in `backend/.env` (see root `.env.example`):

| Variable | Default | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/dashboard_v3` | Yes |
| `PORT` | `3005` | No |
| `FRONTEND_URL` | `http://localhost:3002` | No — CORS allowed origin |
| `JIRA_CLOUD_INSTANCE_URL` | `https://yourcompany.atlassian.net` | For Jira import |
| `JIRA_EMAIL` | _(empty)_ | For Jira import |
| `JIRA_API_TOKEN` | _(empty)_ | For Jira import |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | **Hot-reload** dev server (file watcher) |
| `pnpm start:debug` | Hot-reload + **debugger** on port `9229` |
| `pnpm start` | Start without watch |
| `pnpm start:prod` | Run production build (`dist/main.js`) |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm test` | Unit tests (Jest) |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:cov` | Tests with coverage |
| `pnpm test:debug` | Tests with `--inspect-brk` (attach debugger) |
| `pnpm format` | Prettier (auto-format `src/`) |
| `pnpm lint` | ESLint with auto-fix |

### Prisma

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma studio` | Open database GUI in browser |
| `npx prisma db push` | Push schema directly (no migration file) |
| `npx prisma db seed` | Run seed script |

## Debugging

### Attach VS Code to running server

1. Start: `pnpm start:debug`
2. Add to `.vscode/launch.json`:

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

3. Press F5 in VS Code to attach. Breakpoints will work in `.ts` files.

### Debug unit tests

```bash
pnpm test:debug
```

Pauses on first line. Attach debugger the same way (port `9229`).

## API Reference

All endpoints are prefixed with `/api`.

| Method | Path | Body / Query | Description |
|--------|------|-------------|-------------|
| `POST` | `/projects` | `CreateProjectDto` | Create project |
| `GET` | `/projects` | — | List all projects |
| `GET` | `/projects/:id` | — | Get project |
| `PUT` | `/projects/:id` | `UpdateProjectDto` | Update project |
| `DELETE` | `/projects/:id` | — | Delete project |
| `GET` | `/projects/:id/status` | — | Dashboard data (KPIs + charts + tables) |
| `POST` | `/projects/:id/import/excel` | `multipart/form-data` field `file` | Upload Excel (max 10 MB, `.xlsx`) |
| `POST` | `/projects/:id/simulations` | — | Trigger Monte Carlo simulation |
| `POST` | `/projects/:id/import/jira` | — | Pull issues from Jira API using project's filter IDs |

### CreateProjectDto

```json
{
  "epicId": "MKT-1234",
  "name": "Marketing Redesign",
  "squadName": "Marketing Team",
  "teamSize": 5,
  "beginDate": "2025-10-24T00:00:00.000Z",
  "jiraBacklogFilterId": "12345",
  "jiraThroughputFilterId": "67890"
}
```

> `beginDate` must be a **Friday**.

## Database Models

Defined in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `Project` | Epic metadata, two filter IDs, configurable status mappings |
| `JiraIssue` | Individual tasks (key, status, dates, assignee) |
| `Snapshot` | Import event (source: EXCEL or JIRA_API) |
| `WeeklyMetric` | Pre-computed weekly aggregates (throughput, baseline, remaining) |
| `SimulationRun` | Monte Carlo results (P50/P85/P95 finish dates, distribution) |
