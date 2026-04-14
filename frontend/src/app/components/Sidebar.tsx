'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  X,
  Search,
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  GitBranch,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard, ownerOnly: false },
  {
    href: '/projects',
    label: 'Projetos',
    icon: FolderKanban,
    ownerOnly: false,
  },
  { href: '/team', label: 'Equipe', icon: Users, ownerOnly: true },
  { href: '/reports', label: 'Relatórios', icon: BarChart3, ownerOnly: false },
  {
    href: '/timeline',
    label: 'Linha do Tempo',
    icon: GitBranch,
    ownerOnly: false,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isOwner } = useAuth();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  // ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus first nav link when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstLinkRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const visibleItems = mainNavItems.filter(
    (item) => !item.ownerOnly || isOwner,
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-full sm:w-[280px] z-50
          bg-slate-900 border-r border-white/10
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menu de navegação"
        role="navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs text-white">
              PD
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              Project Dashboard
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-300/50 hover:text-blue-200 hover:bg-white/5 transition-all"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg
                bg-white/5 border border-white/10
                text-white placeholder-white/30
                focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40
                transition-all"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {visibleItems.map((item, index) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    ref={index === 0 ? firstLinkRef : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${
                        active
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                          : 'text-blue-300/60 hover:text-blue-200 hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider + Settings */}
        <div className="px-3 pb-4 border-t border-white/10 pt-2">
          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${
                isActive('/settings')
                  ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                  : 'text-blue-300/60 hover:text-blue-200 hover:bg-white/5 border border-transparent'
              }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Configurações
          </Link>
        </div>
      </aside>
    </>
  );
}
