# Project Status Dashboard

Live Jira-integrated project dashboard with Monte Carlo forecasting, burndown charts, and role-based access. Replaces manual Excel status reports.

## Quickstart

```bash
pnpm install
cp .env.example backend/.env
docker-compose up -d
cd backend && npx prisma migrate dev --name init && npx prisma generate && cd ..
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3002 |
| Backend | http://localhost:3005/api |
| Swagger | http://localhost:3005/api/docs |
| Default login | `admin@dashboard.dev` / `admin123` |

Full setup: [docs/runbooks/local-development.md](docs/runbooks/local-development.md).

## Documentation

This project follows a **Spec-Driven Development** layout. Start with the specs to understand _what_ the system does, then drop into plans and runbooks for _how_.

### Specifications — WHAT (technology-agnostic)

- [Product](docs/specs/product.md) — vision, users, goals
- [Business rules](docs/specs/business-rules.md) — week boundaries, status mapping, dynamic scope
- [Domain model](docs/specs/domain-model.md) — entities and relationships
- [Features](docs/specs/features/) — [authentication](docs/specs/features/authentication.md), [projects](docs/specs/features/projects.md), [metrics](docs/specs/features/metrics.md), [monte-carlo](docs/specs/features/monte-carlo.md), [baseline](docs/specs/features/baseline.md), [jira-integration](docs/specs/features/jira-integration.md)

### Plans — HOW (technology-specific)

- [Tech stack](docs/plans/tech-stack.md)
- [Architecture](docs/plans/architecture.md)
- [Database](docs/plans/database.md)
- [API contracts](docs/plans/api-contracts.md)

### Steering — rules for humans and AI agents

- [Conventions](docs/steering/conventions.md)
- [Testing](docs/steering/testing.md)
- [Security](docs/steering/security.md)
- [Workflows](docs/steering/workflows.md)

### Runbooks — operational

- [Local development](docs/runbooks/local-development.md)
- [Environment variables](docs/runbooks/environment.md)
- [Backend](docs/runbooks/backend.md)
- [Frontend](docs/runbooks/frontend.md)
- [Known issues](docs/runbooks/known-issues.md)

## License

Proprietary
