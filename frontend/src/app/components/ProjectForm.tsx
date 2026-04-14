'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Project } from '@/lib/api-client';

interface ProjectFormProps {
  initial?: Partial<Project>;
  onSubmit: (data: Partial<Project>) => Promise<void>;
  submitLabel: string;
}

const defaultStatusConfig = {
  concluded: [
    'Concluído',
    'Concluded',
    'Done',
    'Pendente de publicação',
    'Pendente publicação',
    'Pending Publication',
    'Pending Publication PRD',
  ],
  inProgress: [
    'Em Andamento',
    'In Progress',
    'Pendente teste',
    'Pending Test',
    'TEST PENDING',
    'Em Teste',
    'TEST',
    'Acompanhamento',
    'Liberado para Homologação',
    'AGUARDANDO CODEREVIEW',
    'Aguardando MR',
  ],
};

export function ProjectForm({
  initial = {},
  onSubmit,
  submitLabel,
}: ProjectFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    epicId: initial.epicId ?? '',
    name: initial.name ?? '',
    squadName: initial.squadName ?? '',
    teamSize: initial.teamSize?.toString() ?? '5',
    beginDate: initial.beginDate ? initial.beginDate.slice(0, 10) : '',
    jiraBacklogFilterId: initial.jiraBacklogFilterId ?? '',
    jiraThroughputFilterId: initial.jiraThroughputFilterId ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        epicId: form.epicId,
        name: form.name,
        squadName: form.squadName,
        teamSize: parseInt(form.teamSize, 10),
        beginDate: new Date(form.beginDate).toISOString(),
        jiraBacklogFilterId: form.jiraBacklogFilterId,
        jiraThroughputFilterId: form.jiraThroughputFilterId,
        statusConfig: initial.statusConfig ?? defaultStatusConfig,
      });
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(e?.response?.data?.message ?? e?.message ?? 'Algo deu errado');
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    {
      name: 'name',
      label: 'Nome do Projeto',
      placeholder: 'Next.js (Marketing)',
      required: true,
      type: 'text',
    },
    {
      name: 'epicId',
      label: 'ID do Epic',
      placeholder: 'MKT-3068',
      required: true,
      type: 'text',
    },
    {
      name: 'squadName',
      label: 'Nome do Squad',
      placeholder: 'Squad Marketing',
      required: true,
      type: 'text',
    },
    {
      name: 'teamSize',
      label: 'Tamanho da Equipe',
      placeholder: '5',
      required: true,
      type: 'number',
    },
    {
      name: 'beginDate',
      label: 'Data de Início',
      placeholder: '',
      required: true,
      type: 'date',
    },
    {
      name: 'jiraBacklogFilterId',
      label: 'ID do Filtro de Backlog Jira',
      placeholder: '10001',
      required: true,
      type: 'text',
    },
    {
      name: 'jiraThroughputFilterId',
      label: 'ID do Filtro de Throughput Jira',
      placeholder: '10002',
      required: true,
      type: 'text',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="project-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.name === 'name' ? 'sm:col-span-2' : ''}
          >
            <label
              htmlFor={field.name}
              className="block text-xs font-medium text-blue-300/70 uppercase tracking-wider mb-1.5"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              value={form[field.name as keyof typeof form]}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white
                                       placeholder-blue-300/25 focus:outline-none focus:ring-2 focus:ring-blue-400/40
                                       focus:border-blue-400/40 transition-all
                                       [color-scheme:dark]"
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          id="submit-project-btn"
          disabled={submitting}
          className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-500/80 border border-blue-400/40
                               rounded-lg text-sm font-medium text-white transition-all duration-150
                               disabled:opacity-50 disabled:cursor-not-allowed
                               shadow-lg shadow-blue-900/30"
        >
          {submitting ? 'Salvando...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push('/projects')}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10
                               rounded-lg text-sm font-medium text-blue-300/70 hover:text-blue-200 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
