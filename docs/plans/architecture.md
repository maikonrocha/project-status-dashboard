# Architecture

Implementation plan for the specifications in [../specs/](../specs/).

## Monorepo Layout

```
project-status-dashboard/
├── backend/                  # NestJS API — port 3005
│   ├── src/
│   │   ├── main.ts                        # Bootstrap (CORS, /api prefix, throttling)
│   │   ├── app.module.ts                  # Root module (ConfigModule global)
│   │   ├── auth/                          # JWT auth, invite flow, email verification
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   └── guards/                    # JWT guard, roles guard
│   │   ├── jira/                          # Paginated Jira Cloud client
│   │   │   └── jira-client.service.ts
│   │   ├── projects/
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts        # Orchestration: import → metrics → sim → baseline
│   │   │   ├── dto/
│   │   │   ├── metrics/                   # Weekly metrics computation
│   │   │   ├── monte-carlo/               # 10,000 sims, seedable RNG
│   │   │   ├── baseline/                  # Linear burn to P95
│   │   │   ├── jira-import/               # Pulls issues from Jira into DB
│   │   │   └── excel-parser/              # Legacy — not actively used
│   │   ├── prisma/                        # PrismaService (global module)
│   │   └── common/guards/                 # Shared guards + decorators
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── frontend/                 # Next.js app — port 3002
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                   # Home — project selector
│       │   ├── (auth)/                    # Route group: sign-in, sign-up, verify
│       │   └── (dashboard)/               # Route group: protected pages
│       │       └── projects/[id]/
│       │           ├── status/            # Dashboard (KPIs, burndown, throughput)
│       │           └── team/
│       └── lib/
│           ├── server-api.ts              # Server-side API client (SSR)
│           ├── api-client.ts              # Axios instance + shared types
│           ├── auth-context.tsx
│           └── utils.ts
├── docker-compose.yml        # PostgreSQL 16 container
├── pnpm-workspace.yaml
└── package.json              # Root scripts, husky, lint-staged
```

## Key Decisions

### No caching

All metrics (burndown, Monte Carlo, throughput, baseline) are computed **live** on every `GET /projects/:id/status` request. The `Snapshot` model exists in `schema.prisma` but is never written. This is deliberate: data is always fresh and there is no cache-invalidation problem.

### Server-Side Rendering only

The frontend **must never** call the API directly from the browser. All data fetches happen in server components via `lib/server-api.ts`, which reads the JWT from HTTP-only cookies and attaches the `Authorization` header server-side.

### Route groups

Next.js `(auth)` and `(dashboard)` groups share layouts. `(dashboard)` pages check JWT via `useAuth()` hook on hydration and redirect on failure; the first render is still SSR.

### Monte Carlo determinism

`MonteCarloService.runSimulation()` accepts an optional `seed`. Production omits it; tests always supply one. See [../steering/testing.md](../steering/testing.md).

### Jira pagination

Cursor-based via `POST /rest/api/3/search/jql`. The client walks pages until `isLast: true`. No caching between page fetches.

### Rate limiting

`@nestjs/throttler` applies 30 requests / 60 seconds globally.

### Validation

All API responses are validated with **Zod** schemas at the boundary. Input DTOs use `class-validator` (NestJS default).

## Related

- Tech stack: [tech-stack.md](tech-stack.md)
- Database: [database.md](database.md)
- API: [api-contracts.md](api-contracts.md)
- Conventions: [../steering/conventions.md](../steering/conventions.md)
