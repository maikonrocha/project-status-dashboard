'use server';

import { cookies } from 'next/headers';

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('auth_user');
}