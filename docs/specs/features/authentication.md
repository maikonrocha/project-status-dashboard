# Feature: Authentication

JWT-based auth with email verification and an invite flow. Role-based access: OWNER vs USER.

## Flows

### Owner Sign-up
1. `POST /api/auth/sign-up` — creates a new company + OWNER user.
2. A 6-digit verification code is generated (expires in 10 minutes).
3. User submits code to `POST /api/auth/verify` to activate.
4. On successful verify, a JWT is issued.

### User Invite
1. OWNER calls `POST /api/auth/invite` with the invitee's email.
2. System creates an unverified user record tied to the company.
3. Invitee visits the invite link and calls `POST /api/auth/sign-up/complete` with their password.
4. A 6-digit verification code is sent; invitee verifies via `POST /api/auth/verify`.
5. JWT is issued.

### Sign-in
- `POST /api/auth/sign-in` with email + password.
- Returns `{ token, user }` where `user` includes `isVerified` and `isActive`.
- Rejected if `!isActive` or `!isVerified`.

## JWT Contract

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Secret | `JWT_SECRET` env var |
| Lifetime | 24 hours |
| Claims | `sub` (userId), `email`, `role`, `companyId` |
| Transport | `Authorization: Bearer <token>` |

The frontend stores the token in an HTTP-only cookie; server components read it and attach the header on SSR calls.

## Roles

| Endpoint | OWNER | USER |
|---|---|---|
| Create/update/delete project | ✓ | ✗ |
| Invite user | ✓ | ✗ |
| List company users | ✓ | ✗ |
| View projects and dashboards | ✓ | ✓ |

## Password Security

- bcrypt with cost factor **12**.
- Minimum **8 characters**, enforced server-side.
- Never logged, never returned in API responses.

## Verification Codes

- 6 digits, numeric.
- Expire in **10 minutes**.
- Single use — consumed on successful verification.
- Delivery is mocked in development — codes are logged to the backend console. See [../../runbooks/known-issues.md](../../runbooks/known-issues.md).

## Public Endpoints (no JWT required)

- `POST /api/auth/sign-up`
- `POST /api/auth/sign-up/complete`
- `POST /api/auth/sign-in`
- `POST /api/auth/verify`
- `POST /api/auth/resend-code`

All other endpoints require a valid JWT.

## Related

- Implementation: [../../plans/api-contracts.md](../../plans/api-contracts.md)
- Security policy: [../../steering/security.md](../../steering/security.md)
