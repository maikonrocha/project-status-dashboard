import { cookies } from 'next/headers';
import type { ZodSchema } from 'zod';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

type ErrorData = { message?: string };

export async function apiFetch<T = ErrorData>(
  path: string,
  options: RequestInit,
  token?: string,
  schema?: ZodSchema<T>,
): Promise<
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: ErrorData }
> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const raw: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, data: raw as ErrorData };
  }
  if (schema) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid API response from ${path}: ${parsed.error.message}`,
      );
    }
    return { ok: true, status: res.status, data: parsed.data };
  }
  return { ok: true, status: res.status, data: raw as T };
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}
