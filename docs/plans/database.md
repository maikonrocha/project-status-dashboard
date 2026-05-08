# Database Plan

Authoritative schema lives in `backend/prisma/schema.prisma`. This document explains the rationale; for entity definitions see [../specs/domain-model.md](../specs/domain-model.md).

## Engine

- **PostgreSQL 16** via `postgres:16-alpine` Docker image.
- Local container: `dashboard_postgres`, port `5432`, database `dashboard_v3`, user/password `postgres`/`postgres`, volume `postgres_data`.
- Connection string: `DATABASE_URL` env var.

## ORM

**Prisma 7**. Client regenerated on every schema change (`npx prisma generate`).

## Models

| Model | Role | Populated? |
|---|---|---|
| `Company` | Tenant | Yes |
| `User` | Owner or member | Yes |
| `VerificationCode` | Email verification | Yes |
| `Project` | Jira Epic binding | Yes |
| `JiraIssue` | Imported task cache | Yes (by `jira-import`) |
| `Snapshot` | Import event metadata | **No — defined but unused** (see [../specs/business-rules.md](../specs/business-rules.md#live-computation)) |
| `WeeklyMetric` | Pre-computed weekly aggregate | Yes |
| `SimulationRun` | Monte Carlo result history | Yes |

## Migrations Policy

- Use `npx prisma migrate dev --name <desc>` for schema changes.
- **Never edit existing migration files** — create a new migration.
- Migrations are committed to git.
- `npx prisma db push` is allowed only in ephemeral dev scenarios, never for shared environments.

## Seeding

Default admin user (`admin@dashboard.dev` / `admin123`) is created by a seed script. Run via `npx prisma db seed`.

## Related

- Prisma schema: [../../backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)
- Domain: [../specs/domain-model.md](../specs/domain-model.md)
- Env: [../runbooks/environment.md](../runbooks/environment.md)
