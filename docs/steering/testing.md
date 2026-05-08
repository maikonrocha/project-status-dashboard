# Testing Guide

**Coverage target:** >80% overall (currently ~88% lines, 86% branches).

## Stack

| Tool | Role |
|---|---|
| `jest` + `ts-jest` | Test runner & TS transpilation |
| `@nestjs/testing` | `Test.createTestingModule()` for controller/service DI |
| `supertest` | HTTP-level controller integration tests |

Spec files live **next to the source**: `foo.service.spec.ts` beside `foo.service.ts`.

## Commands

```bash
cd backend
pnpm test                                               # all unit tests
pnpm test:watch                                         # watch mode
pnpm test:cov                                           # with coverage → backend/coverage/
pnpm test:debug                                         # --inspect-brk, attach on 9229
pnpm exec jest src/path/to/file.spec.ts                 # single file
pnpm exec jest --testNamePattern="describe block name"  # filter by name
pnpm test:e2e                                           # e2e
```

## Mocking Patterns

### Prisma

Plain object with `jest.fn()` per method — no library needed:

```ts
const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  company: { create: jest.fn() },
} as unknown as jest.Mocked<PrismaService>;
```

### bcrypt

Native binding — `jest.spyOn` does **not** work. Use module-level mock:

```ts
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$mocked-hash'),
  compare: jest.fn().mockResolvedValue(true),
}));
import * as bcrypt from 'bcrypt';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
```

### Axios

Intercept `axios.create` so the service constructor receives a mock client:

```ts
const mockPost = jest.fn();
jest.mock('axios', () => ({ create: jest.fn(() => ({ post: mockPost })) }));
```

### Passport / passport-jwt

Mock at module level **before** importing `JwtStrategy`:

```ts
jest.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: jest.fn(() => () => null) },
  Strategy: class { constructor(_: unknown) {} },
}));
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Base: any) => class extends Base {},
}));
```

## Timezone Gotcha

Always use `new Date(year, month - 1, day)` (local midnight) in fixtures. **Never** `new Date('YYYY-MM-DD')` (UTC midnight) when passing dates to `date-fns` functions (`startOfWeek`, `addWeeks`, etc.) — the UTC vs local offset produces wrong week boundaries on non-UTC machines.

```ts
// correct
const MON = new Date(2025, 0, 6); // Jan 6 2025, local midnight

// breaks on UTC±N machines
const MON = new Date('2025-01-06T00:00:00.000Z');
```

## Pure Services

`MetricsService`, `MonteCarloService`, `BaselineService` have zero external dependencies — instantiate directly with `new ServiceClass()`. No DI container required.

## Seeded RNG

Monte Carlo tests must pass `seed: number` to `runSimulation()` for reproducible output. Omitting `seed` uses `Math.random` — acceptable only for non-assertive smoke tests.

## Rules

- Reset mocks with `jest.clearAllMocks()` in `beforeEach`.
- Mock the minimum — only stub methods the code under test actually calls.
- Never `jest.spyOn` on native-binding modules (bcrypt, pg).
