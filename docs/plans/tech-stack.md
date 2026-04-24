# Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | 15/16 |
| UI library | React | 19 |
| Styling | Tailwind CSS | 4 |
| Charts | ECharts + echarts-for-react | latest |
| UI primitives | @radix-ui/* | latest |
| Icons | lucide-react | latest |
| HTTP client | axios | latest |
| Backend framework | NestJS | 11 |
| Language | TypeScript | 5.7 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 16 |
| Auth | Passport.js + JWT + bcrypt | — |
| Validation | Zod | latest |
| Package manager | pnpm (workspaces) | 8+ |
| Runtime | Node.js | 22+ |
| Test runner | Jest + ts-jest | — |
| Container | Docker (postgres only) | — |

## Rationale Highlights

- **Prisma 7** — chosen over TypeORM for type safety and migration DX.
- **Zod for all API responses** — runtime validation at the boundary; see [../steering/conventions.md](../steering/conventions.md).
- **pnpm workspaces** — monorepo without a dedicated build tool. Never use npm or yarn.
- **No caching layer** — see [architecture.md](architecture.md#no-caching).
