'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';

export async function inviteAction(
    data: { email: string },
): Promise<{ error: string } | { success: true }> {
    const token = await getAuthToken();
    const { ok, data: json } = await apiFetch('/auth/invite', {
        method: 'POST',
        body: JSON.stringify(data),
    }, token);

    if (!ok) return { error: json.message ?? 'Falha ao enviar convite.' };
    return { success: true };
}