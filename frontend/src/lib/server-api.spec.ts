import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverApi } from './server-api';

const mockCookies = vi.mocked(cookies);
const mockRedirect = vi.mocked(redirect);

function makeCookieStore(token?: string) {
  return {
    get: vi.fn((name: string) =>
      name === 'auth_token' && token ? { value: token } : undefined,
    ),
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_FIXTURE = {
  id: '1',
  epicId: 'TST-1',
  name: 'Proj A',
  squadName: 'Squad A',
  teamSize: 5,
  beginDate: '2025-01-06',
  jiraBacklogFilterId: '10001',
  jiraThroughputFilterId: '10002',
  statusConfig: { concluded: ['Done'], inProgress: ['In Progress'] },
  companyId: 'company-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const STATUS_FIXTURE = {
  project: {
    id: '1',
    name: 'Proj A',
    epicId: 'TST-1',
    squadName: 'Squad A',
    beginDate: '2025-01-06',
    teamSize: 5,
  },
  kpis: {
    totalTasks: 10,
    completed: 3,
    remaining: 7,
    completionPercentage: 30,
    avgWeeklyThroughput: 1.5,
    currentWeekThroughput: 2,
    predictedFinish: '2025-06-01',
  },
  chartData: {
    burndown: [{ week: '2025-01-06', remaining: 10 }],
    baseline: [{ week: '2025-01-06', value: 10 }],
    confidenceBand: [{ week: '2025-01-06', p50: 10, p85: 12 }],
  },
  tables: {
    remainingTasks: [
      {
        key: 'TST-2',
        summary: 'Task',
        status: 'To Do',
        assignee: null,
        createdDate: '2025-01-01',
      },
    ],
    recentCompleted: [
      {
        key: 'TST-1',
        summary: 'Done task',
        resolutionDate: '2025-01-10',
      },
    ],
    weeklyThroughput: [
      {
        weekEnding: '2025-01-12',
        throughput: 2,
        cumulative: 2,
        remaining: 8,
      },
    ],
  },
};

const TEAM_MEMBER_FIXTURE = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Alice',
  role: 'USER',
  isVerified: true,
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('serverApi', () => {
  it('redirects to /sign-in when auth_token cookie is missing', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore() as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(serverApi.getProjects()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
  });

  it('fetches /projects and returns data on success', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('valid-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([PROJECT_FIXTURE]),
      }),
    );

    const result = await serverApi.getProjects();
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Proj A');
  });

  it('fetches /projects/:id and returns single project', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('valid-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(PROJECT_FIXTURE),
      }),
    );

    const result = await serverApi.getProject('1');
    expect(result.id).toBe('1');
  });

  it('fetches /projects/:id/status', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('valid-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(STATUS_FIXTURE),
      }),
    );

    const result = await serverApi.getStatus('1');
    expect(result.kpis.totalTasks).toBe(10);
  });

  it('fetches /auth/users', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('valid-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([TEAM_MEMBER_FIXTURE]),
      }),
    );

    const result = await serverApi.getUsers();
    expect(result[0].id).toBe('u1');
  });

  it('redirects to /sign-in on 401 response', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('expired-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(serverApi.getProjects()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
  });

  it('throws on non-401 API error', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('valid-token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(serverApi.getProjects()).rejects.toThrow('API error 500');
  });

  it('sends Authorization header with Bearer token', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('my-jwt') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([PROJECT_FIXTURE]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await serverApi.getProjects();

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer my-jwt',
    );
  });

  it('sets cache: no-store on every request', async () => {
    mockCookies.mockResolvedValue(
      makeCookieStore('token') as ReturnType<typeof makeCookieStore> &
        Awaited<ReturnType<typeof cookies>>,
    );
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([PROJECT_FIXTURE]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await serverApi.getProjects();

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.cache).toBe('no-store');
  });
});
