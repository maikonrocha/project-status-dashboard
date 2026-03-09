'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi, type Project } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import ProjectListClient from './ProjectListClient';

export default function ProjectsPage() {
    const { isOwner, isAuthenticated } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;
        projectsApi.getAll()
            .then((res) => setProjects(res.data))
            .catch((e) => console.error('Failed to load projects:', e))
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-6 py-10">
            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-blue-300/50 text-sm mt-1">Manage your Jira-tracked projects</p>
                </div>
                {isOwner && (
                    <Link
                        href="/projects/new"
                        id="new-project-btn"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80
                                   border border-blue-400/40 rounded-lg text-sm font-medium text-white
                                   transition-all duration-150 shadow-lg shadow-blue-900/30"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </Link>
                )}
            </div>

            <ProjectListClient initialProjects={projects} />
        </main>
    );
}
