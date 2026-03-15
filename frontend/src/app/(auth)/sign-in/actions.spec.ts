import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn() }));

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/server-fetch';
import { signInAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockCookies = vi.mocked(cookies);

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue(mockCookieStore as any);
});

describe('signInAction', () => {
    it('returns error when API call fails', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 401, data: { message: 'Credenciais inválidas' } });

        const result = await signInAction({ email: 'a@b.com', password: 'wrong' });
        expect(result).toEqual({ error: 'Credenciais inválidas' });
    });

    it('uses fallback error message when API provides no message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 400, data: {} });

        const result = await signInAction({ email: 'a@b.com', password: 'x' });
        expect(result).toEqual({ error: 'Falha ao entrar.' });
    });

    it('returns requiresVerification when API signals it', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: { requiresVerification: true } });

        const result = await signInAction({ email: 'a@b.com', password: 'pass' });
        expect(result).toEqual({ requiresVerification: true });
    });

    it('sets auth_token cookie as httpOnly on success', async () => {
        mockApiFetch.mockResolvedValue({
            ok: true, status: 200,
            data: { accessToken: 'jwt-abc', user: { id: '1', email: 'a@b.com' } },
        });

        await signInAction({ email: 'a@b.com', password: 'correct' });

        expect(mockCookieStore.set).toHaveBeenCalledWith(
            'auth_token', 'jwt-abc', expect.objectContaining({ httpOnly: true }),
        );
    });

    it('sets auth_user cookie with serialized user on success', async () => {
        const user = { id: '1', email: 'a@b.com', name: 'Alice' };
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: { accessToken: 'tok', user } });

        await signInAction({ email: 'a@b.com', password: 'correct' });

        expect(mockCookieStore.set).toHaveBeenCalledWith(
            'auth_user', JSON.stringify(user), expect.objectContaining({ path: '/' }),
        );
    });

    it('returns { success: true } on successful sign-in', async () => {
        mockApiFetch.mockResolvedValue({
            ok: true, status: 200,
            data: { accessToken: 'tok', user: { id: '1' } },
        });

        const result = await signInAction({ email: 'a@b.com', password: 'ok' });
        expect(result).toEqual({ success: true });
    });
});