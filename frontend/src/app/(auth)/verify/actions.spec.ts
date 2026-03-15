import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn() }));

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/server-fetch';
import { verifyAction, resendCodeAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockCookies = vi.mocked(cookies);
const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue(mockCookieStore as any);
});

describe('verifyAction', () => {
    it('returns error on API failure', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 400, data: { message: 'Código expirado.' } });

        const result = await verifyAction({ email: 'a@b.com', code: '000000' });
        expect(result).toEqual({ error: 'Código expirado.' });
    });

    it('uses fallback error message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 400, data: {} });

        const result = await verifyAction({ email: 'a@b.com', code: '000000' });
        expect(result).toEqual({ error: 'Código inválido ou expirado.' });
    });

    it('sets auth_token and auth_user cookies on success', async () => {
        const user = { id: '1', email: 'a@b.com' };
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: { accessToken: 'tok', user } });

        await verifyAction({ email: 'a@b.com', code: '123456' });

        expect(mockCookieStore.set).toHaveBeenCalledWith('auth_token', 'tok', expect.objectContaining({ httpOnly: true }));
        expect(mockCookieStore.set).toHaveBeenCalledWith('auth_user', JSON.stringify(user), expect.any(Object));
    });

    it('returns { success: true } on success', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: { accessToken: 'tok', user: {} } });

        const result = await verifyAction({ email: 'a@b.com', code: '123456' });
        expect(result).toEqual({ success: true });
    });
});

describe('resendCodeAction', () => {
    it('returns error on failure', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 429, data: { message: 'Muitas tentativas.' } });

        const result = await resendCodeAction({ email: 'a@b.com' });
        expect(result).toEqual({ error: 'Muitas tentativas.' });
    });

    it('uses fallback error message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

        const result = await resendCodeAction({ email: 'a@b.com' });
        expect(result).toEqual({ error: 'Falha ao reenviar código.' });
    });

    it('returns { success: true } on success', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        const result = await resendCodeAction({ email: 'a@b.com' });
        expect(result).toEqual({ success: true });
    });

    it('posts to /auth/resend-code', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        await resendCodeAction({ email: 'test@test.com' });

        expect(mockApiFetch).toHaveBeenCalledWith('/auth/resend-code', expect.objectContaining({ method: 'POST' }));
    });
});