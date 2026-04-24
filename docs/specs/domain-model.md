# Domain Model

Entities and their relationships, independent of the Prisma schema. For the implementation schema see [../plans/database.md](../plans/database.md).

## Entities

### Company
A tenant. Created at owner sign-up. Owns users and projects.

### User
A member of a company.
- `role`: `OWNER` or `USER`
- `isVerified`: email verification complete
- `isActive`: can sign in

### VerificationCode
A one-time 6-digit code tied to an email, valid for 10 minutes. Consumed on successful verification.

### Project
A tracked deliverable.
- `epicId` (unique) — the Jira Epic this project represents
- `jiraBacklogFilterId` — Jira saved filter id for the scope (backlog)
- `jiraThroughputFilterId` — Jira saved filter id for completed work (throughput)
- `beginDate` — must be a Monday
- `statusConfig` — JSON mapping of status strings to `concluded` / `inProgress` / `remaining`
- `squadName`, `teamSize`

### JiraIssue
An individual task pulled from Jira. Key, status, dates, assignee.

### Snapshot
An import event (source: `EXCEL` or `JIRA_API`). **Defined but not populated** — see [business-rules.md](business-rules.md#live-computation).

### WeeklyMetric
Pre-computed weekly aggregate: throughput, baseline, remaining.

### SimulationRun
Monte Carlo result: P50/P85/P95 finish dates and the underlying distribution.

## Relationships

```
Company ──┬── User[]           (1..n, one OWNER per company)
          └── Project[]         (0..n)

Project ──┬── JiraIssue[]       (pulled from Jira)
          ├── Snapshot[]        (unused)
          ├── WeeklyMetric[]    (computed)
          └── SimulationRun[]   (computed)

User ──── VerificationCode      (by email, not FK)
```

## Invariants

- A company has exactly one `OWNER` user (created at sign-up).
- `Project.epicId` is globally unique.
- `Project.beginDate` is always a Monday (enforced by the API).
- Each project references exactly two Jira saved filters.
