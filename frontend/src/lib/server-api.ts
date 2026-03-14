import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Project, StatusDashboard, TeamMember } from './api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

async function serverFetch<T>(path: string): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) redirect('/sign-in');

    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (res.status === 401) redirect('/sign-in');
    if (!res.ok) throw new Error(`API error ${res.status}`);

    return res.json();
}

export const serverApi = {
    getProjects: () => serverFetch<Project[]>('/projects'),
    getProject: (id: string) => serverFetch<Project>(`/projects/${id}`),
    getStatus: (id: string) => serverFetch<StatusDashboard>(`/projects/${id}/status`),
    getUsers: () => serverFetch<TeamMember[]>('/auth/users'),
};
