# Product Specification

## Vision

Project Status Dashboard replaces a manual Excel-based "Status Report" workflow with a live, Jira-integrated dashboard that forecasts project completion using Monte Carlo simulation.

## Users

| Role | Capabilities |
|---|---|
| **OWNER** | Full access: create/update/delete projects, invite users, view all dashboards. One owner per company (created at sign-up). |
| **USER** | Read-only: view projects, dashboards, team. Joins a company via invite. |

Roles are enforced by JWT claims; see [authentication spec](features/authentication.md).

## Business Goals

- **Eliminate manual reporting.** Status reports are generated live from Jira instead of maintained by hand in spreadsheets.
- **Forecast finish dates probabilistically.** Each dashboard exposes P50/P85/P95 predictions so stakeholders can plan against risk instead of optimistic single-point estimates.
- **Make scope drift visible.** Dynamic scope recomputes weekly so that added backlog is reflected in the burndown immediately.
- **Single source of truth per project.** Each project ties to one Jira Epic and two saved filters (backlog, throughput).

## Out of Scope

- Manual data entry of tasks (all tasks come from Jira).
- Jira OAuth — only basic auth (email + API token) is supported today. See [known issues](../runbooks/known-issues.md).
- Email delivery — verification codes are logged, not sent, in the current build.

## Related

- Domain: [domain-model.md](domain-model.md)
- Rules: [business-rules.md](business-rules.md)
- Features: [features/](features/)
- Implementation: [../plans/architecture.md](../plans/architecture.md)
