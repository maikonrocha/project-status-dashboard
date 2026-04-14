'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import type { Project } from '@/lib/api-client';
import { ProjectSchema, SimpleResponseSchema } from '@/lib/schemas';

export async function getProjectAction(
  id: string,
): Promise<{ error: string } | { project: Project }> {
  const token = await getAuthToken();
  const { ok, data } = await apiFetch(
    `/projects/${id}`,
    {},
    token,
    ProjectSchema,
  );

  if (!ok) return { error: data.message ?? 'Projeto não encontrado.' };
  return { project: data as Project };
}

export async function updateProjectAction(
  id: string,
  data: Partial<Project>,
): Promise<{ error: string } | undefined> {
  const token = await getAuthToken();
  const { ok, data: json } = await apiFetch(
    `/projects/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    token,
    SimpleResponseSchema,
  );

  if (!ok) return { error: json.message ?? 'Falha ao atualizar projeto.' };
}
