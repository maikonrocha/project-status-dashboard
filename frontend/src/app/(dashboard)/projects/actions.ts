'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';

export async function deleteProjectAction(
    id: string,
): Promise<{ error: string } | { success: true }> {
    const token = await getAuthToken();
    const { ok, data: json } = await apiFetch(`/projects/${id}`, {
        method: 'DELETE',
    }, token);

    if (!ok) return { error: json.message ?? 'Falha ao excluir projeto.' };
    return { success: true };
}