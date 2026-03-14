'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import type { Project } from '@/lib/api-client';

export async function createProjectAction(
    data: Partial<Project>,
): Promise<{ error: string } | undefined> {
    const token = await getAuthToken();
    const { ok, data: json } = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    }, token);

    if (!ok) return { error: json.message ?? 'Falha ao criar projeto.' };
}