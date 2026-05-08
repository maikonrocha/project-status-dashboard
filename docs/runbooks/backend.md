# Backend Runbook

NestJS 11 API. Port **3005**. Prefix `/api`.

## Commands (`cd backend`)

| Command | Description |
|---|---|
| `pnpm start:dev` | **Hot-reload** dev server |
| `pnpm start:debug` | Hot-reload + Node inspector on port `9229` |
| `pnpm start` | Start without watch |
| `pnpm start:prod` | Run compiled `dist/main.js` |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm test` | Unit tests (Jest) |
| `pnpm test:watch` | Watch mode |
| `pnpm test:cov` | Coverage report → `backend/coverage/` |
| `pnpm test:debug` | Tests with `--inspect-brk` |
| `pnpm test:e2e` | End-to-end tests |
| `pnpm format` | Prettier |
| `pnpm lint` | ESLint with auto-fix |

## Prisma

| Command | Description |
|---|---|
| `npx prisma studio` | Open database GUI in browser |
| `npx prisma migrate dev --name <name>` | Create and apply a migration |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma db push` | Push schema directly (dev only) |
| `npx prisma db seed` | Run seed script |

## Debugging

Start with `pnpm start:debug`, then attach VS Code with this launch config in `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

For tests: `pnpm test:debug` pauses on the first line; attach the same way.

## Architecture

See [../plans/architecture.md](../plans/architecture.md).

## Environment

See [environment.md](environment.md).

## Testing Guide

See [../steering/testing.md](../steering/testing.md).
