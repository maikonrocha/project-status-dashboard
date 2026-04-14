import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import { StatusDashboardClient } from './StatusDashboardClient';

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const result = await Promise.all([
    serverApi.getStatus(projectId),
    serverApi.getProjects(),
  ]).catch(() => null);

  if (!result) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            Falha ao carregar dados do painel.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors inline-block"
          >
            &larr; Voltar para Projetos
          </Link>
        </div>
      </div>
    );
  }

  const [data, projects] = result;

  return (
    <StatusDashboardClient
      projectId={projectId}
      data={data}
      projects={projects}
    />
  );
}
