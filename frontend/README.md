# Project Dashboard v3 — Frontend

Next.js 15 application with the project status dashboard, ECharts visualizations, and project selector.

## Architecture

```
src/
├── app/
│   ├── layout.tsx                   # Root layout (Inter font, Tailwind)
│   ├── globals.css                  # Tailwind base + CSS variables
│   ├── page.tsx                     # Home — project selector cards
│   └── projects/
│       └── [id]/
│           └── status/
│               └── page.tsx         # Dashboard (KPIs, burndown, throughput, tables)
└── lib/
    ├── api-client.ts                # Axios client + TypeScript interfaces
    └── utils.ts                     # formatDate(), formatPercentage()
```

## Environment Variables

| Variable | Default | Where | Description |
|----------|---------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3005/api` | `backend/.env` or shell | Backend API URL (used client-side) |

> `NEXT_PUBLIC_*` variables are inlined at **build time** by Next.js. Change them before `pnpm build` for production.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | **Hot-reload** dev server with Fast Refresh (port `3002`) |
| `pnpm build` | Production build (optimized, static analysis) |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |

## Debugging

### Browser DevTools

Start `pnpm dev` and open Chrome DevTools → Sources tab. Next.js source maps are enabled by default.

### VS Code (server-side)

Add to `.vscode/launch.json`:

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

Press F5 to start. Breakpoints work in Server Components and API routes.

### VS Code (client-side)

Use the **Edge** or **Chrome** debug configuration:

```json
{
  "type": "msedge",
  "request": "launch",
  "name": "Next.js Client",
  "url": "http://localhost:3002",
  "webRoot": "${workspaceFolder}/frontend"
}
```

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | Framework (App Router) |
| `react` | 19.2.3 | UI library |
| `tailwindcss` | 4.x | Styling |
| `echarts` + `echarts-for-react` | latest | Burndown + throughput charts |
| `axios` | latest | HTTP client for `/api` calls |
| `lucide-react` | latest | Icons |
| `@radix-ui/*` | latest | Accessible primitives (dialog, select, dropdown) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Project selector. Shows all projects as cards. No data until a project is selected. |
| `/projects/[id]/status` | Full dashboard: KPI cards, burndown chart, throughput bar chart, remaining tasks table, weekly throughput table. Includes a project switcher dropdown in the header. |
