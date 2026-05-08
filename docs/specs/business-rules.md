# Business Rules

Authoritative rules that govern how the dashboard interprets Jira data. These rules are technology-agnostic; their implementation lives in [../plans/architecture.md](../plans/architecture.md).

## Week Boundaries

- **Weeks start on Monday.** Throughput periods are Monday 00:00 through Sunday 23:59 (local time).
- **Project `beginDate` must be a Monday.** The API rejects any other day.
- All date math uses local midnight (`new Date(year, month - 1, day)`), never UTC-parsed strings. See [../steering/testing.md](../steering/testing.md) for the timezone gotcha.

## Status Mapping

Each project has a configurable `statusConfig` (JSON) that maps Jira statuses into three buckets. Defaults are bilingual (Portuguese + English):

**Concluded** (task is done):
`Concluído`, `Concluded`, `Done`, `Pendente de publicação`, `Pendente publicação`, `Pending Publication`, `Pending Publication PRD`

**In Progress** (actively worked on):
`Em Andamento`, `In Progress`, `Pendente teste`, `Pending Test`, `TEST PENDING`, `Em Teste`, `TEST`, `Acompanhamento`, `Liberado para Homologação`, `AGUARDANDO CODEREVIEW`, `Aguardando MR`

**Remaining**: anything not in the two sets above.

## Dynamic Scope

- **Total tasks = completed + remaining**, recomputed on every dashboard request.
- Added backlog increases total in real time; removed backlog decreases it.
- Historical weekly points are preserved so that the burndown line reflects reality rather than a frozen plan.

## Baseline

- The baseline is a **linear burn** from the original total to zero, ending on the **P95 predicted finish date** produced by the Monte Carlo simulation.
- Recomputed whenever the P95 date changes.
- See [features/baseline.md](features/baseline.md).

## Forecasting

- **10,000 Monte Carlo simulations** per dashboard request.
- Output: P50, P85, P95 finish dates plus the full distribution.
- RNG is seedable for deterministic tests; production uses `Math.random`.
- See [features/monte-carlo.md](features/monte-carlo.md).

## Live Computation

No snapshots. Every `GET /projects/:id/status` request re-fetches from Jira and recomputes metrics, Monte Carlo, and baseline. The `Snapshot` model exists in the schema but is not populated. See [../plans/architecture.md](../plans/architecture.md#no-caching).
