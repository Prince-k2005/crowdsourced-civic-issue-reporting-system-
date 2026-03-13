'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@civicflow.local';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo123456';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            const profile = await authAPI.getMe();
            setAuth(data.session!.access_token, profile.data);
            toast.success('Welcome back!');
            router.push('/submit');
        } catch (err: any) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: gradient panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
                <div className="max-w-md text-white">
                    <div className="w-14 h-14 gradient-civic rounded-2xl flex items-center justify-center text-2xl font-bold mb-8 border-2 border-white/30">C</div>
                    <h1 className="text-4xl font-display font-bold mb-4">Welcome back to CivicFlow</h1>
                    <p className="text-white/70 text-lg">Continue making your city better, one report at a time.</p>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 gradient-civic rounded-xl flex items-center justify-center text-white font-bold">C</div>
                            <span className="font-display font-bold text-xl">CivicFlow</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h2>
                    <p className="text-gray-500 mb-6">Use your email and password to continue</p>

                    <div className="rounded-xl border border-civic-100 bg-civic-50/50 p-4 mb-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-civic-900">Demo account</p>
                                <p className="text-xs text-civic-700">{DEMO_EMAIL} / {DEMO_PASSWORD}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail(DEMO_EMAIL);
                                    setPassword(DEMO_PASSWORD);
                                }}
                                className="btn-ghost !py-1.5 !px-3 text-xs"
                            >
                                Use Demo
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" required className="input-field pr-12" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> Sign In</>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Don&apos;t have an account? <Link href="/signup" className="text-civic-600 font-semibold hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
