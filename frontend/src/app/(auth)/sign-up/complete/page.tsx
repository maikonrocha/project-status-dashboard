'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeSignUpAction } from './actions';

function CompleteSignUpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const [email] = useState(emailParam);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!emailParam) {
            setError('Invalid invitation link. Please ask your admin to re-invite you.');
        }
    }, [emailParam]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await completeSignUpAction({ email, name, password });
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
                    Complete Your Account
                </h1>
                <p className="text-blue-300/50 text-sm mt-2">You&apos;ve been invited! Set up your account to continue.</p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                    />
                </div>

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
                        placeholder="Jane Doe"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-blue-200/70 mb-1.5">Create Password</label>
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

                <button
                    type="submit"
                    disabled={loading || !emailParam}
                    id="complete-signup-btn"
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
                            Setting up…
                        </span>
                    ) : 'Complete Account'}
                </button>
            </form>
        </div>
    );
}

export default function CompleteSignUpPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto" />
            </div>
        }>
            <CompleteSignUpForm />
        </Suspense>
    );
}
