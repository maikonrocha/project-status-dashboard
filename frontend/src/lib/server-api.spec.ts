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

beforeEach(() => {
    vi.clearAllMocks();
});

describe('serverApi', () => {
    it('redirects to /sign-in when auth_token cookie is missing', async () => {
        mockCookies.mockResolvedValue(makeCookieStore() as any);
        // redirect throws in Next.js internally; simulate that behavior
        mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

        await expect(serverApi.getProjects()).rejects.toThrow('NEXT_REDIRECT');
        expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
    });

    it('fetches /projects and returns data on success', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('valid-token') as any);
        const projects = [{ id: '1', name: 'Proj A' }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(projects),
        }));

        const result = await serverApi.getProjects();
        expect(result).toEqual(projects);
    });

    it('fetches /projects/:id and returns single project', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('valid-token') as any);
        const project = { id: '42', name: 'My Project' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(project),
        }));

        const result = await serverApi.getProject('42');
        expect(result).toEqual(project);
    });

    it('fetches /projects/:id/status', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('valid-token') as any);
        const status = { kpis: { total: 10 } };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(status),
        }));

        const result = await serverApi.getStatus('42');
        expect(result).toEqual(status);
    });

    it('fetches /auth/users', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('valid-token') as any);
        const users = [{ id: 'u1', email: 'a@b.com' }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(users),
        }));

        const result = await serverApi.getUsers();
        expect(result).toEqual(users);
    });

    it('redirects to /sign-in on 401 response', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('expired-token') as any);
        mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: () => Promise.resolve({}),
        }));

        await expect(serverApi.getProjects()).rejects.toThrow('NEXT_REDIRECT');
        expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
    });

    it('throws on non-401 API error', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('valid-token') as any);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
        }));

        await expect(serverApi.getProjects()).rejects.toThrow('API error 500');
    });

    it('sends Authorization header with Bearer token', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('my-jwt') as any);
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        vi.stubGlobal('fetch', mockFetch);

        await serverApi.getProjects();

        const [, opts] = mockFetch.mock.calls[0];
        expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer my-jwt');
    });

    it('sets cache: no-store on every request', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('token') as any);
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        vi.stubGlobal('fetch', mockFetch);

        await serverApi.getProjects();

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.cache).toBe('no-store');
    });
});