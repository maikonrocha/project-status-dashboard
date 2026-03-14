import { cookies } from 'next/headers';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

export async function apiFetch(
    path: string,
    options: RequestInit,
    token?: string,
) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> ?? {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

export async function getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}
