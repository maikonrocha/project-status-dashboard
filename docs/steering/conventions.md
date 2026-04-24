# Conventions

Rules that guide both humans and AI agents working in this repo.

## Code

- **Named exports only** — never use default exports.
- **No `any`** — use `unknown` + narrowing or a real type. Enforced by ESLint.
- **English for code**, **Portuguese for UI text**.
- Always write unit tests for new utilities.
- Spec files live next to the source: `foo.service.spec.ts` beside `foo.service.ts`.

## API

- **All API responses must be validated with Zod** at the boundary.
- **All frontend API calls must be Server-Side Rendered.** No requests to the API from the browser — use `lib/server-api.ts`.
- Input DTOs use `class-validator` (NestJS default).

## Testing

- Use `jest.mock()` at module level for native bindings (bcrypt, pg). **Never `jest.spyOn` on native modules.**
- Mock the minimum — only stub methods the code under test actually calls.
- Reset mocks with `jest.clearAllMocks()` in `beforeEach`.
- Use `new Date(year, month - 1, day)` for date fixtures. **Never `new Date('YYYY-MM-DD')`** (timezone bug). See [testing.md](testing.md#timezone-gotcha).
- See the full testing guide: [testing.md](testing.md).

## Monorepo

- pnpm only — **never npm or yarn**.
- Run commands from the repo root or per package; never globally.
- Never install new dependencies without asking first.

## Database

- **Never modify existing migration files** — create a new migration with `npx prisma migrate dev`.

## Do Not

- Do not install new dependencies without asking.
- Do not modify migration files directly.
- Do not use `any` in TypeScript.
- Do not call the API from the browser.
- Do not use `jest.spyOn` on native modules.
- Do not use `new Date('YYYY-MM-DD')` in tests.

## Related

- Testing: [testing.md](testing.md)
- Security: [security.md](security.md)
- Workflows: [workflows.md](workflows.md)
