# Feature: Monte Carlo Forecasting

Probabilistic finish-date prediction based on historical weekly throughput.

## Inputs

| Input | Source |
|---|---|
| Historical throughput series | [metrics.md](metrics.md) |
| Remaining tasks | Current Jira backlog |
| `seed` (optional) | Test fixtures only — omitted in production |

## Algorithm

1. Run **10,000** simulations.
2. Each simulation:
   - Start with `remaining` tasks.
   - Each iteration, sample one week's throughput uniformly at random from the historical series.
   - Subtract sampled throughput from remaining.
   - Increment a week counter.
   - Stop when remaining ≤ 0.
3. Record the number of weeks taken.
4. After all simulations, sort the weeks-to-finish distribution and read percentiles.

## Outputs

| Field | Definition |
|---|---|
| `p50` | 50th percentile finish date (median) |
| `p85` | 85th percentile finish date |
| `p95` | 95th percentile finish date |
| `distribution` | Full sorted array (used by the baseline) |

Dates are computed as `beginDate + weeksToFinish * 7 days`, aligned to Monday.

## Determinism

- When `seed` is supplied, a seeded RNG replaces `Math.random` so tests are reproducible.
- Without `seed`, results vary run-to-run — acceptable in production, unacceptable in unit tests.
- See [../../steering/testing.md](../../steering/testing.md#seeded-rng).

## Edge Cases

- **Empty history** — if no weekly throughput data exists (project just started), the simulation cannot run; dashboard returns `null` for P50/P85/P95 and hides the forecast UI.
- **Zero throughput weeks** — kept in the sample pool; they model realistic stalls.
- **Remaining = 0** — project is already done; returns 0 weeks.

## Implementation Pointer

`MonteCarloService` is a pure class. See [../../plans/architecture.md](../../plans/architecture.md).
