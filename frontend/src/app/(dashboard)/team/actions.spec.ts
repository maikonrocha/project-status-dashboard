import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn(), getAuthToken: vi.fn() }));

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import { inviteAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetAuthToken = vi.mocked(getAuthToken);

beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthToken.mockResolvedValue('owner-token');
});

describe('inviteAction', () => {
    it('posts to /auth/invite with auth token', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        await inviteAction({ email: 'new@user.com' });

        expect(mockApiFetch).toHaveBeenCalledWith(
            '/auth/invite',
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'new@user.com' }) }),
            'owner-token',
        );
    });

    it('returns { success: true } on success', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        const result = await inviteAction({ email: 'a@b.com' });
        expect(result).toEqual({ success: true });
    });

    it('returns error on failure', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 409, data: { message: 'Email já convidado.' } });

        const result = await inviteAction({ email: 'a@b.com' });
        expect(result).toEqual({ error: 'Email já convidado.' });
    });

    it('uses fallback error message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

        const result = await inviteAction({ email: 'a@b.com' });
        expect(result).toEqual({ error: 'Falha ao enviar convite.' });
    });
});
