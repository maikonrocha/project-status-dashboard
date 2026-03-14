'use client';

import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api-client';
import { ProjectForm } from '@/app/components/ProjectForm';

export default function NewProjectPage() {
    const router = useRouter();

    async function handleCreate(data: Parameters<typeof projectsApi.create>[0]) {
        await projectsApi.create(data);
        router.push('/projects');
    }

    return (
        <main className="max-w-3xl mx-auto px-6 py-10">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">New Project</h1>
                <p className="text-blue-300/50 text-sm mt-1">
                    Create a new project to track with Jira and Monte Carlo forecasting.
                </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <ProjectForm
                    onSubmit={handleCreate}
                    submitLabel="Create Project"
                />
            </div>
        </main>
    );
}
