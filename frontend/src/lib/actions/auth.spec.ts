import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

import { cookies } from 'next/headers';
import { logoutAction } from './auth';

const mockCookies = vi.mocked(cookies);

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue(
    mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
  );
});

describe('logoutAction', () => {
  it('deletes auth_token cookie', async () => {
    await logoutAction();
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
  });

  it('deletes auth_user cookie', async () => {
    await logoutAction();
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_user');
  });

  it('deletes exactly two cookies', async () => {
    await logoutAction();
    expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
  });
});
