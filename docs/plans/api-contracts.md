# API Contracts

All endpoints are prefixed with `/api`. Authentication is JWT via `Authorization: Bearer <token>` except where noted.

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/sign-up` | public | Register owner + company |
| `POST` | `/auth/sign-up/complete` | public | Invited user completes account |
| `POST` | `/auth/sign-in` | public | Returns JWT |
| `POST` | `/auth/verify` | public | Verify 6-digit email code |
| `POST` | `/auth/resend-code` | public | Resend verification code |
| `POST` | `/auth/invite` | OWNER | Invite user |
| `GET` | `/auth/me` | any | Current user |
| `GET` | `/auth/users` | OWNER | List company users |

See [../specs/features/authentication.md](../specs/features/authentication.md).

## Projects

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/projects` | OWNER | Create project |
| `GET` | `/projects` | any | List company projects |
| `GET` | `/projects/:id` | any | Project details |
| `PUT` | `/projects/:id` | OWNER | Update project |
| `DELETE` | `/projects/:id` | OWNER | Delete project |
| `GET` | `/projects/:id/status` | any | Full dashboard (live computation) |
| `POST` | `/projects/:id/simulations` | any | Trigger Monte Carlo |
| `POST` | `/projects/:id/import/jira` | OWNER | Pull issues from Jira via filter ids |
| `POST` | `/projects/:id/import/excel` | OWNER | Upload legacy Excel (`.xlsx`, ≤10 MB) |

See [../specs/features/projects.md](../specs/features/projects.md).

## DTOs

### CreateProjectDto

```json
{
  "epicId": "MKT-1234",
  "name": "Marketing Redesign",
  "squadName": "Marketing Team",
  "teamSize": 5,
  "beginDate": "2025-10-27T00:00:00.000Z",
  "jiraBacklogFilterId": "12345",
  "jiraThroughputFilterId": "67890"
}
```

> `beginDate` **must be a Monday**. The API rejects any other weekday.

## Guards

| Guard | Applied |
|---|---|
| `JwtAuthGuard` | Globally, with public decorator for auth endpoints |
| `RolesGuard` + `@Roles(Role.OWNER)` | Mutating project endpoints, invite endpoint |
| `ThrottlerGuard` | Globally: 30 req / 60 s |

## Response Validation

Every response is validated with a **Zod** schema at the boundary. Invalid responses fail the request in development (hard error) and are logged in production. See [../steering/conventions.md](../steering/conventions.md).

## Swagger

Live at `http://localhost:3005/api/docs`.
