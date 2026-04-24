# Frontend Runbook

Next.js App Router app. Port **3002**.

## Commands (`cd frontend`)

| Command | Description |
|---|---|
| `pnpm dev` | Hot-reload dev server (Fast Refresh) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier |

## Pages

| Route | Description |
|---|---|
| `/` | Project selector. Shows all projects as cards. |
| `/sign-in`, `/sign-up`, `/verify` | Auth route group `(auth)` |
| `/projects/[id]/status` | Full dashboard: KPI cards, burndown chart, throughput chart, remaining tasks table, weekly throughput table. Header includes a project switcher. |
| `/projects/[id]/team` | Team view |

## Debugging

### Browser

`pnpm dev` then Chrome/Edge DevTools → Sources. Source maps are enabled by default.

### VS Code — server-side

```json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js Debug",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "cwd": "${workspaceFolder}/frontend",
  "env": { "NODE_OPTIONS": "--inspect" },
  "skipFiles": ["<node_internals>/**"]
}
```

### VS Code — client-side

```json
{
  "type": "msedge",
  "request": "launch",
  "name": "Next.js Client",
  "url": "http://localhost:3002",
  "webRoot": "${workspaceFolder}/frontend"
}
```

## SSR Rule

All API calls **must** be Server-Side Rendered via `lib/server-api.ts`. No browser-side requests to the backend. See [../steering/conventions.md](../steering/conventions.md).

## Environment

See [environment.md](environment.md).

## Architecture

See [../plans/architecture.md](../plans/architecture.md).
