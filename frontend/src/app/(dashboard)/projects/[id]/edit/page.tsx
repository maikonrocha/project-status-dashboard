'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProjectAction, updateProjectAction } from './actions';
import { ProjectForm } from '@/app/components/ProjectForm';
import type { Project } from '@/lib/api-client';

export default function EditProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjectAction(projectId)
            .then((result) => {
                if ('error' in result) {
                    router.push('/projects');
                } else {
                    setProject(result.project);
                }
            })
            .finally(() => setLoading(false));
    }, [projectId, router]);

    async function handleUpdate(data: Partial<Project>) {
        const result = await updateProjectAction(projectId, data);
        if (result?.error) throw new Error(result.error);
        router.push('/projects');
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-pulse text-blue-300/60">Loading project...</div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <main className="max-w-3xl mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Edit Project</h1>
                <p className="text-blue-300/50 text-sm mt-1">{project.name}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <ProjectForm
                    initial={project}
                    onSubmit={handleUpdate}
                    submitLabel="Save Changes"
                />
            </div>
        </main>
    );
}
