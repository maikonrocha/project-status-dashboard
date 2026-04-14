import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server-fetch', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '@/lib/server-fetch';
import { signUpAction } from './actions';

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signUpAction', () => {
  it('returns error when API fails', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'Email já cadastrado.' },
    });

    const result = await signUpAction({
      name: 'A',
      email: 'a@b.com',
      password: 'p',
      companyName: 'Co',
    });
    expect(result).toEqual({ error: 'Email já cadastrado.' });
  });

  it('uses fallback error when no message', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 500, data: {} });

    const result = await signUpAction({
      name: 'A',
      email: 'a@b.com',
      password: 'p',
      companyName: 'Co',
    });
    expect(result).toEqual({ error: 'Falha ao criar conta.' });
  });

  it('returns { success: true } on success', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 201, data: {} });

    const result = await signUpAction({
      name: 'Alice',
      email: 'a@b.com',
      password: 'pass',
      companyName: 'Acme',
    });
    expect(result).toEqual({ success: true });
  });

  it('posts to /auth/sign-up with the provided data', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 201, data: {} });
    const payload = {
      name: 'Bob',
      email: 'b@c.com',
      password: '123',
      companyName: 'Corp',
    };

    await signUpAction(payload);

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/auth/sign-up',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      undefined,
      expect.any(Object),
    );
  });
});
