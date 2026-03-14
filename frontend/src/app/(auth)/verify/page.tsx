'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyAction, resendCodeAction } from './actions';

function VerifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(600); // 10 minutes
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function handleInput(index: number, value: string) {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
            handleVerify(fullCode);
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent) {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pasted.length; i++) {
            newCode[i] = pasted[i];
        }
        setCode(newCode);

        if (pasted.length === 6) {
            handleVerify(pasted);
        } else {
            inputRefs.current[pasted.length]?.focus();
        }
    }

    async function handleVerify(fullCode: string) {
        setError('');
        setLoading(true);

        try {
            const result = await verifyAction({ email, code: fullCode });
            if ('error' in result) {
                setError(result.error);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                return;
            }
            setSuccess('Email verified! Redirecting…');
            setTimeout(() => router.push('/'), 1000);
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError('');
        setResendLoading(true);
        try {
            const result = await resendCodeAction({ email });
            if ('error' in result) {
                setError(result.error);
                return;
            }
            setCountdown(600);
            setSuccess('A new code has been sent.');
            setTimeout(() => setSuccess(''), 3000);
        } finally {
            setResendLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mb-4 shadow-lg shadow-blue-900/40">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                    Verify Your Email
                </h1>
                <p className="text-blue-300/50 text-sm mt-2">
                    We sent a 6-digit code to <span className="text-blue-300 font-medium">{email}</span>
                </p>
            </div>

            {/* Code Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-400/30 text-green-300 text-sm rounded-lg px-4 py-3">
                        {success}
                    </div>
                )}

                {/* 6-digit code inputs */}
                <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            id={`code-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInput(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            disabled={loading}
                            className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/15 rounded-lg text-white
                                       focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all
                                       disabled:opacity-50"
                        />
                    ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                    {countdown > 0 ? (
                        <p className="text-sm text-blue-300/40">
                            Code expires in{' '}
                            <span className={`font-mono font-medium ${countdown < 60 ? 'text-red-400' : 'text-blue-300'}`}>
                                {formatTime(countdown)}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-red-400 font-medium">Code expired</p>
                    )}
                </div>

                {/* Resend */}
                <div className="text-center">
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resendLoading ? 'Sending…' : 'Resend code'}
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 text-blue-300/60 text-sm">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying…
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto" />
            </div>
        }>
            <VerifyForm />
        </Suspense>
    );
}
