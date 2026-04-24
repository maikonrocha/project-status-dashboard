# Feature: Jira Integration

The dashboard pulls issues from Jira Cloud on every status request. No snapshots are stored.

## Authentication

- **Basic auth** — email + API token.
- Credentials come from backend env vars: `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_CLOUD_INSTANCE_URL`. See [../../runbooks/environment.md](../../runbooks/environment.md).
- OAuth is **not implemented** — see [../../runbooks/known-issues.md](../../runbooks/known-issues.md).

## Saved Filters per Project

Each project references **two saved Jira filters**:

| Filter | Purpose |
|---|---|
| `jiraBacklogFilterId` | Defines project scope — all tasks in or out of the project |
| `jiraThroughputFilterId` | Defines completed work — tasks with resolution dates used for weekly throughput |

Using saved filters (rather than raw JQL) means the project owner can change scope without touching the dashboard config.

## API Usage

- Endpoint: `POST /rest/api/3/search/jql` (Jira Cloud API v3).
- **Cursor-based pagination** — required because Jira caps page size; the client walks pages until `isLast` is true.
- No batch or bulk endpoints are used.

## Status Mapping

Returned issues are bucketed using `Project.statusConfig`; see [../business-rules.md](../business-rules.md#status-mapping).

## Rate Limiting

The backend applies a global 30 req / 60 s limit via `@nestjs/throttler`. Jira-side limits are handled by retrying with backoff on 429 responses (client responsibility; not yet implemented — see known issues).

## Related

- Implementation: [../../plans/architecture.md](../../plans/architecture.md)
- Security: [../../steering/security.md](../../steering/security.md)
