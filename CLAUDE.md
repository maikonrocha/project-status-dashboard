# CLAUDE.md — Agent Contract

Read this file first. Then read the linked steering documents before editing code.

## Required reading (every session)

- [docs/steering/conventions.md](docs/steering/conventions.md) — code style, naming, SSR rule, no `any`
- [docs/steering/testing.md](docs/steering/testing.md) — mocking patterns, timezone gotcha, seeded RNG
- [docs/steering/security.md](docs/steering/security.md) — secrets, JWT, bcrypt, rate limiting
- [docs/steering/workflows.md](docs/steering/workflows.md) — how to start the stack

## Where things live

| Question | Look in |
|---|---|
| _What_ should the system do? | [docs/specs/](docs/specs/) |
| _How_ is it built? | [docs/plans/](docs/plans/) |
| _Rules_ for humans and agents | [docs/steering/](docs/steering/) |
| Setup, commands, env vars | [docs/runbooks/](docs/runbooks/) |
| Known bugs and limitations | [docs/runbooks/known-issues.md](docs/runbooks/known-issues.md) |

## Hard constraints

- **No `any`** in TypeScript.
- **No browser-side API calls** — all frontend data fetches are Server-Side Rendered via `lib/server-api.ts`.
- **All API responses validated with Zod** at the boundary.
- **pnpm only** — never npm or yarn.
- **Never install new dependencies without asking.**
- **Never edit existing Prisma migrations** — create a new one.
- **Never `jest.spyOn` on native bindings** (bcrypt, pg) — use `jest.mock()` at module level.
- **Never `new Date('YYYY-MM-DD')`** in tests — use `new Date(y, m-1, d)` (timezone bug).

## Quickstart

See [README.md](README.md#quickstart).
