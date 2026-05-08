# Feature: Baseline

A reference line on the burndown chart representing the "ideal" linear burn needed to hit the P95 predicted finish date.

## Definition

Given:
- `beginDate` — project start (Monday)
- `totalTasks` — current total (see [metrics.md](metrics.md))
- `p95FinishDate` — output of [monte-carlo.md](monte-carlo.md)

The baseline is a straight line from `(beginDate, totalTasks)` to `(p95FinishDate, 0)`.

## Per-Week Values

For each week between `beginDate` and `p95FinishDate`:

```
baseline(week) = totalTasks * (1 - weeksElapsed / totalWeeks)
```

where `totalWeeks = (p95FinishDate - beginDate) / 7 days`.

The last point equals zero on `p95FinishDate`.

## Recomputation

The baseline is recomputed whenever the P95 date changes — which happens on every dashboard request because Monte Carlo runs live.

## Known Quirk

Baseline dates are currently timezone-sensitive and may appear off by one day near midnight GMT-3. See [../../runbooks/known-issues.md](../../runbooks/known-issues.md).

## Implementation Pointer

`BaselineService` is a pure class.
