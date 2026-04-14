'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { logoutAction } from '@/lib/actions/auth';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user, isOwner } = useAuth();

  async function handleLogout() {
    await logoutAction();
    router.push('/sign-in');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: burger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="p-1.5 rounded-lg text-blue-300/60 hover:text-blue-200 hover:bg-white/5 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg
                          flex items-center justify-center font-bold text-sm text-white
                          group-hover:from-blue-300 group-hover:to-indigo-400 transition-all"
            >
              PD
            </div>
            <span className="text-white font-semibold tracking-tight hidden sm:block">
              Project Dashboard
            </span>
            <span className="text-blue-400/40 text-xs font-mono hidden sm:block">
              v3
            </span>
          </Link>
        </div>

        {/* Right: user profile */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] leading-tight">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium
                    ${isOwner ? 'bg-amber-500/10 text-amber-300' : 'bg-blue-500/10 text-blue-300'}`}
                >
                  {user.role === 'OWNER' ? '👑 Proprietário' : 'Membro'}
                </span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              id="logout-btn"
              title="Sair"
              className="p-1.5 rounded-lg text-blue-300/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                  strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
