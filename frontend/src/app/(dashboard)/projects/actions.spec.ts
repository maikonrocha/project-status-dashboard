import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({
  apiFetch: vi.fn(),
  getAuthToken: vi.fn(),
}));

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import { deleteProjectAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetAuthToken = vi.mocked(getAuthToken);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthToken.mockResolvedValue('bearer-token');
});

describe('deleteProjectAction', () => {
  it('calls DELETE /projects/:id with auth token', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

    await deleteProjectAction('proj-1');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/projects/proj-1',
      expect.objectContaining({ method: 'DELETE' }),
      'bearer-token',
      expect.any(Object),
    );
  });

  it('returns { success: true } on success', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

    const result = await deleteProjectAction('proj-1');
    expect(result).toEqual({ success: true });
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: 'Sem permissão.' },
    });

    const result = await deleteProjectAction('proj-1');
    expect(result).toEqual({ error: 'Sem permissão.' });
  });

  it('uses fallback error message when none provided', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

    const result = await deleteProjectAction('proj-1');
    expect(result).toEqual({ error: 'Falha ao excluir projeto.' });
  });
});
