# Known Issues & Limitations

## Baseline dates — timezone drift

Baseline dates in the "Burndown with Baseline" chart are rendered in GMT-3 and may appear one day off from the intended local date. Example: `2026-02-12 21:00:00` displays as `2026-02-12` when the intended value is `2026-02-13`.

**Workaround:** format all dates to `YYYY/MM/DD 00:00:00` before render; until fixed, readers should add one day for late-evening baselines.

## Email delivery is mocked

Verification codes are generated and logged to the backend console but **not delivered**. In development, read the code from the backend log. No SMTP integration exists yet.

## Jira auth is basic only

Only email + API token basic auth is supported. OAuth 2.0 is not implemented. Credentials live in `backend/.env`.

## `Snapshot` model is unused

The Prisma `Snapshot` model is defined but never written. All dashboard data is computed live from Jira on every request. See [../specs/business-rules.md](../specs/business-rules.md#live-computation).

## Production secrets must be rotated

`JWT_SECRET` and any API key defaults in `.env.example` are dev-only. **Change before deploying.** See [../steering/security.md](../steering/security.md).

## Jira 429 handling

No retry/backoff on Jira rate-limit responses. Large imports against rate-limited accounts may fail silently mid-pagination.
