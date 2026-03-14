'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { logoutAction } from '@/lib/actions/auth';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isOwner } = useAuth();

    function isActive(href: string) {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    }

    async function handleLogout() {
        await logoutAction();
        router.push('/sign-in');
    }

    const navLinks = [
        { href: '/', label: 'Dashboard', always: true },
        { href: '/projects', label: 'Projects', always: true },
        { href: '/team', label: 'Team', always: false, ownerOnly: true },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg bg-slate-900/80">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg
                                    flex items-center justify-center font-bold text-sm text-white
                                    group-hover:from-blue-300 group-hover:to-indigo-400 transition-all">
                        PD
                    </div>
                    <span className="text-white font-semibold tracking-tight hidden sm:block">
                        Project Dashboard
                    </span>
                    <span className="text-blue-400/40 text-xs font-mono hidden sm:block">v3</span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Nav links */}
                    <nav className="flex items-center gap-1">
                        {navLinks
                            .filter((link) => link.always || (link.ownerOnly && isOwner))
                            .map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                                            ${active
                                                ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                                                : 'text-blue-300/60 hover:text-blue-200 hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                    </nav>

                    {/* User menu */}
                    {user && (
                        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-white/10">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                                <p className="text-[10px] leading-tight">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium
                                        ${user.role === 'OWNER'
                                            ? 'bg-amber-500/10 text-amber-300'
                                            : 'bg-blue-500/10 text-blue-300'
                                        }`}>
                                        {user.role === 'OWNER' ? '👑 Owner' : 'Member'}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                id="logout-btn"
                                title="Sign out"
                                className="p-1.5 rounded-lg text-blue-300/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
