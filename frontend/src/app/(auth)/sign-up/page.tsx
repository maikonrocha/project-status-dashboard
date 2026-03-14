'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpAction } from './actions';

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signUpAction({ name, email, password, companyName });
            if ('error' in result) {
                setError(result.error);
                return;
            }
            router.push(`/verify?email=${encodeURIComponent(email)}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mb-4 shadow-lg shadow-blue-900/40">
                    <span className="text-white font-bold text-xl">PD</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                    Create Your Account
                </h1>
                <p className="text-blue-300/50 text-sm mt-2">Set up your company and start tracking projects</p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-blue-200/70 mb-1.5">Your Name</label>
                    <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-blue-200/70 mb-1.5">Email</label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                        placeholder="you@company.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-blue-200/70 mb-1.5">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                        placeholder="Min. 6 characters"
                    />
                </div>

                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-blue-200/70 mb-1.5">Company Name</label>
                    <input
                        id="companyName"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                        placeholder="Acme Corp"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    id="sign-up-btn"
                    className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400
                               rounded-lg font-semibold text-white shadow-lg shadow-blue-900/30
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating account…
                        </span>
                    ) : 'Create Account'}
                </button>

                <p className="text-center text-sm text-blue-300/50">
                    Already have an account?{' '}
                    <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
