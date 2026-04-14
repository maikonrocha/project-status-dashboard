'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteAction } from './actions';
import type { TeamMember } from '@/lib/api-client';

interface Props {
  initialMembers: TeamMember[];
  companyName: string;
}

export function TeamPageClient({ initialMembers, companyName }: Props) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const result = await inviteAction({ email: inviteEmail });
      if ('error' in result) {
        setInviteError(result.error);
      } else {
        setInviteSuccess(`Convite enviado para ${inviteEmail}`);
        setInviteEmail('');
        router.refresh();
        setTimeout(() => setInviteSuccess(''), 5000);
      }
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Gestão de Equipe</h1>
        <p className="text-blue-300/50 text-sm mt-1">
          Gerencie os membros da equipe da sua empresa ({companyName})
        </p>
      </div>

      {/* Invite Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Convidar Novo Membro
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colega@empresa.com"
            id="invite-email-input"
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
          />
          <button
            type="submit"
            disabled={inviteLoading}
            id="send-invite-btn"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400
                                   rounded-lg font-semibold text-white shadow-lg shadow-blue-900/30 text-sm
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                   flex items-center gap-2"
          >
            {inviteLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
            Enviar Convite
          </button>
        </form>

        {inviteSuccess && (
          <div className="mt-3 bg-green-500/10 border border-green-400/30 text-green-300 text-sm rounded-lg px-4 py-3">
            ✓ {inviteSuccess}
          </div>
        )}

        {inviteError && (
          <div className="mt-3 bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg px-4 py-3">
            {inviteError}
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-5 py-3 text-blue-300/60 font-medium">
                Membro
              </th>
              <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden md:table-cell">
                Função
              </th>
              <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden md:table-cell">
                Status
              </th>
              <th className="text-left px-5 py-3 text-blue-300/60 font-medium hidden lg:table-cell">
                Ingresso
              </th>
            </tr>
          </thead>
          <tbody>
            {initialMembers.map((member) => (
              <tr
                key={member.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30
                                                        border border-blue-400/20 flex items-center justify-center shrink-0"
                    >
                      <span className="text-xs font-bold text-blue-300">
                        {(member.name || member.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {member.name || (
                          <span className="text-white/40 italic">
                            Convite pendente
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-blue-300/40">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${
                                          member.role === 'OWNER'
                                            ? 'bg-amber-500/10 text-amber-300 border border-amber-400/20'
                                            : 'bg-blue-500/10 text-blue-300 border border-blue-400/20'
                                        }`}
                  >
                    {member.role === 'OWNER' ? '👑 Proprietário' : 'Membro'}
                  </span>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  {member.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-400/70 text-xs">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-blue-300/40 text-xs hidden lg:table-cell">
                  {new Date(member.createdAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {initialMembers.length === 0 && (
          <div className="text-center py-12 text-blue-300/40">
            Nenhum membro ainda. Convide seu primeiro colega acima.
          </div>
        )}
      </div>
    </main>
  );
}
