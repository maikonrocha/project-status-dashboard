import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn(), getAuthToken: vi.fn() }));

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import { getProjectAction, updateProjectAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetAuthToken = vi.mocked(getAuthToken);

beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthToken.mockResolvedValue('tok');
});

describe('getProjectAction', () => {
    it('returns project on success', async () => {
        const project = { id: '1', name: 'Alpha' };
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: project });

        const result = await getProjectAction('1');
        expect(result).toEqual({ project });
    });

    it('returns error on failure', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 404, data: { message: 'Projeto não encontrado.' } });

        const result = await getProjectAction('99');
        expect(result).toEqual({ error: 'Projeto não encontrado.' });
    });

    it('uses fallback error message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

        const result = await getProjectAction('x');
        expect(result).toEqual({ error: 'Projeto não encontrado.' });
    });

    it('calls GET /projects/:id with token', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        await getProjectAction('abc');

        expect(mockApiFetch).toHaveBeenCalledWith('/projects/abc', {}, 'tok');
    });
});

describe('updateProjectAction', () => {
    it('returns undefined on success', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

        const result = await updateProjectAction('1', { name: 'Updated' });
        expect(result).toBeUndefined();
    });

    it('returns error on failure', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 400, data: { message: 'Dados inválidos.' } });

        const result = await updateProjectAction('1', { name: '' });
        expect(result).toEqual({ error: 'Dados inválidos.' });
    });

    it('uses fallback error message', async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

        const result = await updateProjectAction('1', {});
        expect(result).toEqual({ error: 'Falha ao atualizar projeto.' });
    });

    it('calls PUT /projects/:id with body and token', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });
        const payload = { name: 'New Name' };

        await updateProjectAction('42', payload);

        expect(mockApiFetch).toHaveBeenCalledWith(
            '/projects/42',
            expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) }),
            'tok',
        );
    });
});