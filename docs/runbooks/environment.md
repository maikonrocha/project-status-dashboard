# Environment Variables

Single source of truth for all env vars. Backend vars live in `backend/.env` (copy from `.env.example`). Frontend vars are read from the shell at build time.

## Backend (`backend/.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/dashboard_v3` | yes | PostgreSQL connection string |
| `PORT` | `3005` | no | Backend HTTP port |
| `FRONTEND_URL` | `http://localhost:3002` | no | Allowed CORS origin |
| `JWT_SECRET` | _(empty)_ | **yes in prod** | JWT signing secret — change before deploying |
| `JIRA_CLOUD_INSTANCE_URL` | `https://yourcompany.atlassian.net` | for Jira | Jira Cloud base URL |
| `JIRA_EMAIL` | _(empty)_ | for Jira | Jira account email (basic auth) |
| `JIRA_API_TOKEN` | _(empty)_ | for Jira | Jira API token |

## Frontend

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3005/api` | Backend API URL (inlined at build time) |

`NEXT_PUBLIC_*` variables are baked into the bundle during `pnpm build`. To change them in production, rebuild.

## Docker Compose Constants

Defined in `docker-compose.yml` — generally no reason to change:

| Constant | Value |
|---|---|
| PostgreSQL image | `postgres:16-alpine` |
| Container name | `dashboard_postgres` |
| `POSTGRES_DB` | `dashboard_v3` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| Host port | `5432` |
| Volume | `postgres_data` |

## Security

- **Do not commit `backend/.env`.** It may contain real Jira credentials.
- Rotate `JWT_SECRET` before any production deployment.
- See [../steering/security.md](../steering/security.md).
