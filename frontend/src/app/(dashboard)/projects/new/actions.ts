'use server';

import { apiFetch, getAuthToken } from '@/lib/server-fetch';
import type { Project } from '@/lib/api-client';
import { SimpleResponseSchema } from '@/lib/schemas';

export async function createProjectAction(
  data: Partial<Project>,
): Promise<{ error: string } | undefined> {
  const token = await getAuthToken();
  const { ok, data: json } = await apiFetch(
    '/projects',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
    SimpleResponseSchema,
  );

  if (!ok) return { error: json.message ?? 'Falha ao criar projeto.' };
}
