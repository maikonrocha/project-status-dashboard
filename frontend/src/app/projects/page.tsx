'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, type Project } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const res = await projectsApi.getAll();
            setProjects(res.data);
        } catch (e) {
            console.error('Failed to load projects:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        setDeletingId(id);
        try {
            await projectsApi.delete(id);
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (e) {
            console.error('Failed to delete project:', e);
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    }

    return (
        <main className="max-w-7xl mx-auto px-6 py-10">
            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-blue-300/50 text-sm mt-1">Manage your Jira-tracked projects</p>
                </div>
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
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-pulse text-blue-300/60">Loading projects...</div>
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-300/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-blue-300/40">No projects yet.</p>
                    <Link href="/projects/new"
                        className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors">
                        Create your first project →
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left px-5 py-3 text-blue-300/60 font-medium">Project</th>
                                <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden md:table-cell">Squad</th>
                                <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden lg:table-cell">Started</th>
                                <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden lg:table-cell">Team</th>
                                <th className="text-right px-5 py-3 text-blue-300/60 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20
                                                            border border-blue-400/20 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-blue-300">
                                                    {project.epicId.split('-')[0]?.slice(0, 3)}
                                                </span>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => router.push(`/projects/${project.id}/status`)}
                                                    className="font-semibold text-white hover:text-blue-200 transition-colors text-left"
                                                    id={`view-project-${project.id}`}
                                                >
                                                    {project.name}
                                                </button>
                                                <p className="text-xs text-blue-300/40 font-mono mt-0.5">{project.epicId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{project.squadName}</td>
                                    <td className="px-5 py-4 text-slate-400 hidden lg:table-cell">{formatDate(project.beginDate)}</td>
                                    <td className="px-5 py-4 text-slate-400 hidden lg:table-cell">{project.teamSize}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* View dashboard */}
                                            <button
                                                onClick={() => router.push(`/projects/${project.id}/status`)}
                                                title="View dashboard"
                                                className="p-1.5 rounded-lg text-blue-300/50 hover:text-blue-200 hover:bg-white/10 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </button>
                                            {/* Edit */}
                                            <Link
                                                href={`/projects/${project.id}/edit`}
                                                id={`edit-project-${project.id}`}
                                                title="Edit project"
                                                className="p-1.5 rounded-lg text-blue-300/50 hover:text-blue-200 hover:bg-white/10 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            {/* Delete */}
                                            {confirmDeleteId === project.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-red-400">Delete?</span>
                                                    <button
                                                        onClick={() => handleDelete(project.id)}
                                                        disabled={deletingId === project.id}
                                                        id={`confirm-delete-${project.id}`}
                                                        className="px-2 py-0.5 rounded bg-red-500/20 border border-red-400/30
                                                                   text-red-300 hover:bg-red-500/30 text-xs transition-all disabled:opacity-50"
                                                    >
                                                        {deletingId === project.id ? '...' : 'Yes'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10
                                                                   text-slate-400 hover:bg-white/10 text-xs transition-all"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(project.id)}
                                                    id={`delete-project-${project.id}`}
                                                    title="Delete project"
                                                    className="p-1.5 rounded-lg text-blue-300/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
