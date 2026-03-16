'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
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
        <div className="min-h-screen flex bg-slate-50">
            {/* Left: dark gradient panel for high contrast with white text */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden"
            >
                {/* Optional decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                <div className="max-w-md text-white relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 border border-white/20 shadow-lg">
                        R2
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        Welcome back to <br/>
                        <span className="text-blue-300">Report2Resolve</span>
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        Track, escalate, and resolve civic issues with transparency. Log in to continue making a difference.
                    </p>
                </div>
            </motion.div>

            {/* Right: form panel */}
            <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 flex items-center justify-center p-6 bg-slate-50"
            >
                {/* Replaced 'card' with standard Tailwind shadow/border utilities */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">R2</div>
                            <span className="font-bold text-2xl text-slate-900">Report2Resolve</span>
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h2>
                        <p className="text-slate-500">Use your email and password to continue</p>
                    </div>

                    {/* Styled Demo Account Box */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-5 mb-8">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">Demo account</p>
                                <p className="text-xs font-mono text-blue-700 bg-blue-100/50 px-2 py-1 rounded inline-block">
                                    {DEMO_EMAIL}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail(DEMO_EMAIL);
                                    setPassword(DEMO_PASSWORD);
                                }}
                                className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                            >
                                Use Demo
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" 
                                required 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPw ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white pr-12" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> Sign In</>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-8">
                        Don&apos;t have an account? <Link href="/signup" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">Sign up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}