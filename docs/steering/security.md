# Security Policy

## Passwords

- **bcrypt** with cost factor **12**.
- Minimum **8 characters**, enforced server-side.
- Never logged, never returned in API responses.

## JWT

- Algorithm **HS256**, secret from `JWT_SECRET` env var.
- Lifetime **24 hours**.
- Transported via `Authorization: Bearer <token>` header, stored client-side in HTTP-only cookies.
- **`JWT_SECRET` must be changed before deployment** — do not ship with the default empty or dev value.

## Rate Limiting

- Global throttling: **30 requests / 60 seconds** via `@nestjs/throttler`.

## Secrets Management

- The `backend/.env` file may contain real Jira credentials (`JIRA_EMAIL`, `JIRA_API_TOKEN`).
- **Do not commit `backend/.env`** — it is gitignored; verify before any push.
- `.env.example` is the canonical template. See [../runbooks/environment.md](../runbooks/environment.md).
- Production secrets (`JWT_SECRET`, `API_KEY`, database credentials) must be rotated before deployment.

## Transport

- HTTPS required in production for all password and token traffic.

## CORS

- Backend allows a single origin: `FRONTEND_URL` env var. No wildcards.

## Input Validation

- All request bodies validated with `class-validator` DTOs.
- All responses validated with **Zod** at the boundary — invalid shapes fail fast.

## Dependency Hygiene

- Never install new dependencies without explicit approval.
- `husky` + `lint-staged` run lint + typecheck on staged files. CI runs full lint and typecheck jobs.

## Related

- Auth flow: [../specs/features/authentication.md](../specs/features/authentication.md)
- Conventions: [conventions.md](conventions.md)
