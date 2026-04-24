# Feature: Weekly Metrics

Weekly aggregation of Jira issues for a project. Computed live; see [../business-rules.md](../business-rules.md#live-computation).

## Week Definition

- **Start:** Monday 00:00 local time.
- **End:** Sunday 23:59 local time.
- First week begins at `Project.beginDate` (which must be a Monday).
- Last week is the week containing the current date.

## Per-Week Outputs

For each week between `beginDate` and today:

| Field | Definition |
|---|---|
| `weekStart` | Monday date (local midnight) |
| `completed` | Count of issues whose resolution/transition date falls in this week AND whose final status is in the **concluded** set |
| `remaining` | Total current tasks minus cumulative completed through this week |
| `cumulativeCompleted` | Running sum of `completed` |

## Total Scope

`totalTasks = completed + remaining` — recomputed from the current Jira backlog filter on every request. Scope is dynamic: newly added backlog bumps the total immediately.

## Throughput

`throughput(week) = completed(week)`.

The Monte Carlo simulation samples from the historical throughput series; see [monte-carlo.md](monte-carlo.md).

## Implementation Pointer

`MetricsService` is a pure class with no external dependencies. Test it by instantiating directly. See [../../steering/testing.md](../../steering/testing.md#pure-services).
