import Link from 'next/link';
import { projectsApi, type Project } from '@/lib/api-client';
import StatusDashboardClient from './StatusDashboardClient';

export default async function StatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    let data = null;
    let projects: Project[] = [];

    try {
        const [statusRes, projectsRes] = await Promise.all([
            projectsApi.getStatus(projectId),
            projectsApi.getAll(),
        ]);
        data = statusRes.data;
        projects = projectsRes.data;
    } catch (error) {
        console.error('Failed to load status:', error);
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">Failed to load dashboard data.</p>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors inline-block"
                    >
                        &larr; Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return <StatusDashboardClient projectId={projectId} data={data} projects={projects} />;
}
