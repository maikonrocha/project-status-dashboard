import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers before importing the module under test
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { apiFetch, getAuthToken } from './server-fetch';

const mockCookies = vi.mocked(cookies);

function makeCookieStore(tokenValue?: string) {
    return {
        get: vi.fn((name: string) =>
            name === 'auth_token' && tokenValue ? { value: tokenValue } : undefined,
        ),
        set: vi.fn(),
        delete: vi.fn(),
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('apiFetch', () => {
    it('calls fetch with the correct URL and Content-Type header', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: 'ok' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        await apiFetch('/test-path', { method: 'GET' });

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toMatch('/test-path');
        expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    it('includes Authorization header when token is provided', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
        });
        vi.stubGlobal('fetch', mockFetch);

        await apiFetch('/secure', { method: 'GET' }, 'my-jwt');

        const [, opts] = mockFetch.mock.calls[0];
        expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer my-jwt');
    });

    it('does not include Authorization header when no token', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
        });
        vi.stubGlobal('fetch', mockFetch);

        await apiFetch('/public', { method: 'GET' });

        const [, opts] = mockFetch.mock.calls[0];
        expect((opts.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });

    it('returns ok=true and parsed data on success', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 1 }),
        }));

        const result = await apiFetch('/items', { method: 'GET' });
        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
        expect(result.data).toEqual({ id: 1 });
    });

    it('returns ok=false and error data on failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Unauthorized' }),
        }));

        const result = await apiFetch('/protected', { method: 'GET' });
        expect(result.ok).toBe(false);
        expect(result.status).toBe(401);
        expect(result.data).toEqual({ message: 'Unauthorized' });
    });

    it('returns empty object when response JSON is malformed', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.reject(new Error('Invalid JSON')),
        }));

        const result = await apiFetch('/bad-json', { method: 'GET' });
        expect(result.data).toEqual({});
    });

    it('merges caller-provided headers with defaults', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
        });
        vi.stubGlobal('fetch', mockFetch);

        await apiFetch('/custom', { method: 'POST', headers: { 'X-Custom': 'value' } });

        const [, opts] = mockFetch.mock.calls[0];
        const headers = opts.headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['X-Custom']).toBe('value');
    });
});

describe('getAuthToken', () => {
    it('returns the auth_token cookie value when present', async () => {
        mockCookies.mockResolvedValue(makeCookieStore('abc123') as any);

        const token = await getAuthToken();
        expect(token).toBe('abc123');
    });

    it('returns undefined when auth_token cookie is absent', async () => {
        mockCookies.mockResolvedValue(makeCookieStore() as any);

        const token = await getAuthToken();
        expect(token).toBeUndefined();
    });
});