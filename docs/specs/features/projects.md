# Feature: Projects & Status Dashboard

## Project CRUD

Projects are scoped to a company. Only OWNERs mutate them.

| Operation | Endpoint | Role |
|---|---|---|
| Create | `POST /api/projects` | OWNER |
| List (company-scoped) | `GET /api/projects` | any |
| Read | `GET /api/projects/:id` | any |
| Update | `PUT /api/projects/:id` | OWNER |
| Delete | `DELETE /api/projects/:id` | OWNER |

### Create/Update contract

Required fields:
- `epicId` (unique Jira Epic key, e.g. `MKT-1234`)
- `name`
- `squadName`
- `teamSize`
- `beginDate` — **must be a Monday**
- `jiraBacklogFilterId` — Jira saved filter id for scope
- `jiraThroughputFilterId` — Jira saved filter id for completed work

Optional:
- `statusConfig` — JSON mapping overriding defaults. See [../business-rules.md](../business-rules.md#status-mapping).

## Status Dashboard

`GET /api/projects/:id/status` returns the full dashboard payload, computed live (no cache). Response shape:

### KPI Cards
- Total tasks (current)
- Completed tasks
- Remaining tasks
- Current weekly throughput
- P50 / P85 / P95 predicted finish dates
- Weeks elapsed, weeks remaining (to P95)

### Burndown Chart
- Actual remaining line (per week)
- Linear baseline to P95 finish date
- Week labels on x-axis (Monday-aligned)

### Throughput Chart
- Completed tasks per week (Monday–Sunday bucket)
- Rolling average (optional)

### Tables
- **Remaining tasks** — key, summary, status, assignee
- **Weekly throughput** — week start date, completed count

## Related

- Rules: [../business-rules.md](../business-rules.md)
- Metrics: [metrics.md](metrics.md)
- Forecast: [monte-carlo.md](monte-carlo.md)
- Baseline: [baseline.md](baseline.md)
- Jira: [jira-integration.md](jira-integration.md)
- Implementation: [../../plans/architecture.md](../../plans/architecture.md), [../../plans/api-contracts.md](../../plans/api-contracts.md)
