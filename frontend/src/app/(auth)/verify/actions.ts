'use server';

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/server-fetch';

export async function verifyAction(
    data: { email: string; code: string },
): Promise<{ error: string } | { success: true }> {
    const { ok, data: json } = await apiFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!ok) return { error: json.message ?? 'Código inválido ou expirado.' };

    const cookieStore = await cookies();
    const opts = { path: '/', maxAge: 60 * 60 * 24, sameSite: 'strict' as const };
    cookieStore.set('auth_token', json.accessToken, { ...opts, httpOnly: true });
    cookieStore.set('auth_user', JSON.stringify(json.user), opts);

    return { success: true };
}

export async function resendCodeAction(
    data: { email: string },
): Promise<{ error: string } | { success: true }> {
    const { ok, data: json } = await apiFetch('/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!ok) return { error: json.message ?? 'Falha ao reenviar código.' };
    return { success: true };
}