'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, type Project, type StatusDashboard } from '@/lib/api-client';
import StatusDashboardClient from './StatusDashboardClient';

export default function StatusPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [data, setData] = useState<StatusDashboard | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        Promise.all([
            projectsApi.getStatus(projectId),
            projectsApi.getAll(),
        ])
            .then(([statusRes, projectsRes]) => {
                setData(statusRes.data);
                setProjects(projectsRes.data);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
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
