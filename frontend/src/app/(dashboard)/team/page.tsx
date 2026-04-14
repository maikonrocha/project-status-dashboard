import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import { TeamPageClient } from './TeamPageClient';
import type { AuthUser } from '@/lib/auth-context';

export default async function TeamPage() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('auth_user')?.value;
    const user: AuthUser | null = userCookie ? (JSON.parse(userCookie) as AuthUser) : null;

    if (user?.role !== 'OWNER') redirect('/');

    const members = await serverApi.getUsers();

    return <TeamPageClient initialMembers={members} companyName={user?.companyName ?? ''} />;
}
