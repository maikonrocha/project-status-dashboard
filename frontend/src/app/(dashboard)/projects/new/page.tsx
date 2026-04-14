'use client';

import { useRouter } from 'next/navigation';
import { createProjectAction } from './actions';
import { ProjectForm } from '@/app/components/ProjectForm';
import type { Project } from '@/lib/api-client';

export default function NewProjectPage() {
  const router = useRouter();

  async function handleCreate(data: Partial<Project>) {
    const result = await createProjectAction(data);
    if (result?.error) throw new Error(result.error);
    router.push('/projects');
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novo Projeto</h1>
        <p className="text-blue-300/50 text-sm mt-1">
          Crie um novo projeto para rastrear com Jira e previsões Monte Carlo.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <ProjectForm onSubmit={handleCreate} submitLabel="Criar Projeto" />
      </div>
    </main>
  );
}
