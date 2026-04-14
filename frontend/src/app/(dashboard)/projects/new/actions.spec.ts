import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({
  apiFetch: vi.fn(),
  getAuthToken: vi.fn(),
}));

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import { createProjectAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetAuthToken = vi.mocked(getAuthToken);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthToken.mockResolvedValue('token-123');
});

describe('createProjectAction', () => {
  it('posts to /projects with auth token', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 201, data: {} });
    const payload = { name: 'New Proj', epicId: 'EPIC-1' };

    await createProjectAction(payload);

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      'token-123',
      expect.any(Object),
    );
  });

  it('returns undefined on success', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 201, data: {} });

    const result = await createProjectAction({ name: 'P' });
    expect(result).toBeUndefined();
  });

  it('returns error object on failure', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 400,
      data: { message: 'Epic já existente.' },
    });

    const result = await createProjectAction({ name: 'P' });
    expect(result).toEqual({ error: 'Epic já existente.' });
  });

  it('uses fallback error message', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

    const result = await createProjectAction({});
    expect(result).toEqual({ error: 'Falha ao criar projeto.' });
  });
});
