'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
    {
        href: '/',
        label: 'Dashboard',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        href: '/projects',
        label: 'Projects',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
];

export default function Navbar() {
    const pathname = usePathname();

    function isActive(href: string) {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    }

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

                {/* Nav links */}
                <nav className="flex items-center gap-1">
                    {navLinks.map((link) => {
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
                                {link.icon}
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
