'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import type { Project } from '@/lib/api-client';

export async function getProjectAction(
    id: string,
): Promise<{ error: string } | { project: Project }> {
    const token = await getAuthToken();
    const { ok, data } = await apiFetch(`/projects/${id}`, {}, token);

    if (!ok) return { error: data.message ?? 'Projeto não encontrado.' };
    return { project: data };
}

export async function updateProjectAction(
    id: string,
    data: Partial<Project>,
): Promise<{ error: string } | undefined> {
    const token = await getAuthToken();
    const { ok, data: json } = await apiFetch(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, token);

    if (!ok) return { error: json.message ?? 'Falha ao atualizar projeto.' };
}