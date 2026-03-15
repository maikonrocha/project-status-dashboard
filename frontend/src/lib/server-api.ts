import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

async function serverFetch<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/sign-in');

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/sign-in');
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data: unknown = await res.json();
  return schema.parse(data);
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const ProjectSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  name: z.string(),
  squadName: z.string(),
  teamSize: z.number(),
  beginDate: z.string(),
  jiraBacklogFilterId: z.string(),
  jiraThroughputFilterId: z.string(),
  statusConfig: z.record(z.string(), z.unknown()),
  companyId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const StatusDashboardSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    epicId: z.string(),
    squadName: z.string(),
    beginDate: z.string(),
    teamSize: z.number(),
  }),
  kpis: z.object({
    totalTasks: z.number(),
    completed: z.number(),
    remaining: z.number(),
    completionPercentage: z.number(),
    avgWeeklyThroughput: z.number(),
    currentWeekThroughput: z.number(),
    predictedFinish: z.string().nullable(),
  }),
  chartData: z.object({
    burndown: z.array(z.object({ week: z.string(), remaining: z.number() })),
    baseline: z.array(z.object({ week: z.string(), value: z.number() })),
    confidenceBand: z.array(
      z.object({ week: z.string(), p50: z.number(), p85: z.number() }),
    ),
  }),
  tables: z.object({
    remainingTasks: z.array(
      z.object({
        key: z.string(),
        summary: z.string(),
        status: z.string(),
        assignee: z.string().nullable(),
        createdDate: z.string().nullable(),
      }),
    ),
    recentCompleted: z.array(
      z.object({
        key: z.string(),
        summary: z.string(),
        resolutionDate: z.string(),
      }),
    ),
    weeklyThroughput: z.array(
      z.object({
        weekEnding: z.string(),
        throughput: z.number(),
        cumulative: z.number(),
        remaining: z.number(),
      }),
    ),
  }),
});

const TeamMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

// ─── API surface ─────────────────────────────────────────────────────────────

export const serverApi = {
  getProjects: () => serverFetch('/projects', z.array(ProjectSchema)),
  getProject: (id: string) => serverFetch(`/projects/${id}`, ProjectSchema),
  getStatus: (id: string) =>
    serverFetch(`/projects/${id}/status`, StatusDashboardSchema),
  getUsers: () => serverFetch('/auth/users', z.array(TeamMemberSchema)),
};

// ─── Inferred types (re-exported for consumers) ───────────────────────────────

export type ProjectResponse = z.infer<typeof ProjectSchema>;
export type StatusDashboardResponse = z.infer<typeof StatusDashboardSchema>;
export type TeamMemberResponse = z.infer<typeof TeamMemberSchema>;
