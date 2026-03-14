'use server';

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/server-fetch';

export async function signInAction(
    credentials: { email: string; password: string },
): Promise<{ error: string } | { requiresVerification: true } | { success: true }> {
    const { ok, data } = await apiFetch('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });

    if (!ok) return { error: data.message ?? 'Falha ao entrar.' };
    if (data.requiresVerification) return { requiresVerification: true };

    const cookieStore = await cookies();
    const opts = { path: '/', maxAge: 60 * 60 * 24, sameSite: 'strict' as const };
    cookieStore.set('auth_token', data.accessToken, { ...opts, httpOnly: true });
    cookieStore.set('auth_user', JSON.stringify(data.user), opts);

    return { success: true };
}
