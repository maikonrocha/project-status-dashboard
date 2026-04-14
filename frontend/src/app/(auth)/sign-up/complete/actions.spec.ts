import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '@/lib/server-fetch';
import { completeSignUpAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('completeSignUpAction', () => {
  it('returns error on API failure', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 400,
      data: { message: 'Token inválido.' },
    });

    const result = await completeSignUpAction({
      email: 'a@b.com',
      name: 'A',
      password: 'p',
    });
    expect(result).toEqual({ error: 'Token inválido.' });
  });

  it('uses fallback error message when none provided', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

    const result = await completeSignUpAction({
      email: 'a@b.com',
      name: 'A',
      password: 'p',
    });
    expect(result).toEqual({ error: 'Falha ao completar cadastro.' });
  });

  it('returns { success: true } on success', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

    const result = await completeSignUpAction({
      email: 'a@b.com',
      name: 'Alice',
      password: 'pass',
    });
    expect(result).toEqual({ success: true });
  });

  it('posts to /auth/sign-up/complete', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });

    await completeSignUpAction({ email: 'x@y.com', name: 'X', password: 'pw' });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/auth/sign-up/complete',
      expect.objectContaining({ method: 'POST' }),
      undefined,
      expect.any(Object),
    );
  });
});
