'use server';

import { apiFetch } from '@/lib/server-fetch';

export async function completeSignUpAction(
    data: { email: string; name: string; password: string },
): Promise<{ error: string } | { success: true }> {
    const { ok, data: json } = await apiFetch('/auth/sign-up/complete', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!ok) return { error: json.message ?? 'Falha ao completar cadastro.' };
    return { success: true };
}