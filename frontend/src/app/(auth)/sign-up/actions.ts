'use server';

import { apiFetch } from '@/lib/server-fetch';

export async function signUpAction(
    data: { name: string; email: string; password: string; companyName: string },
): Promise<{ error: string } | { success: true }> {
    const { ok, data: json } = await apiFetch('/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!ok) return { error: json.message ?? 'Falha ao criar conta.' };
    return { success: true };
}