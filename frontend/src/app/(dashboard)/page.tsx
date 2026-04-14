import Link from 'next/link';
import { cookies } from 'next/headers';
import { serverApi } from '@/lib/server-api';
import { formatDate } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth-context';

export default async function HomePage() {
  const [projects, cookieStore] = await Promise.all([
    serverApi.getProjects(),
    cookies(),
  ]);

  const userCookie = cookieStore.get('auth_user')?.value;
  const user: AuthUser | null = userCookie
    ? (JSON.parse(userCookie) as AuthUser)
    : null;
  const isOwner = user?.role === 'OWNER';

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
          Selecione um Projeto
        </h2>
        <p className="text-blue-300/50 max-w-md mx-auto">
          Escolha um projeto para ver o painel de status, gráfico de burndown e
          previsões Monte Carlo.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-5 mt-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-300/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-blue-300/40 text-lg">Nenhum projeto ainda</p>
          {isOwner && (
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/80 hover:bg-blue-500/80
                                       border border-blue-400/40 rounded-lg text-sm font-medium text-white
                                       transition-all shadow-lg shadow-blue-900/30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Crie seu primeiro projeto
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              href={`/projects/${project.id}/status`}
              key={project.id}
              id={`select-project-${project.id}`}
              className="group text-left p-6 rounded-xl border border-white/10 bg-white/5
                                       hover:bg-white/10 hover:border-blue-400/30
                                       transition-all duration-200 ease-out
                                       focus:outline-none focus:ring-2 focus:ring-blue-400/50 block"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20
                                                border border-blue-400/20 flex items-center justify-center shrink-0
                                                group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-colors"
                >
                  <span className="text-xs font-bold text-blue-300">
                    {project.epicId.split('-')[0]?.slice(0, 3)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-blue-300/40 font-mono mt-0.5">
                    {project.epicId}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-blue-300/40">
                <span>Squad: {project.squadName}</span>
                <span>•</span>
                <span>Team: {project.teamSize}</span>
              </div>
              <div className="mt-1.5 text-xs text-blue-300/30">
                Started: {formatDate(project.beginDate)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
