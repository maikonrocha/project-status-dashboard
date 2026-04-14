'use server';

import { apiFetch } from '@/lib/server-fetch';
import { SimpleResponseSchema } from '@/lib/schemas';

export async function completeSignUpAction(data: {
  email: string;
  name: string;
  password: string;
}): Promise<{ error: string } | { success: true }> {
  const { ok, data: json } = await apiFetch(
    '/auth/sign-up/complete',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    undefined,
    SimpleResponseSchema,
  );

  if (!ok) return { error: json.message ?? 'Falha ao completar cadastro.' };
  return { success: true };
}
