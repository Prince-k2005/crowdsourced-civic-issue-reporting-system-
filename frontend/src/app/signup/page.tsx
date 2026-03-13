'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@civicflow.local';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo123456';

export default function SignupPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '', full_name: '' });
    const [loading, setLoading] = useState(false);

    const handlePasswordSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: { full_name: form.full_name } },
            });
            if (error) throw error;

            if (data.session) {
                const profile = await authAPI.getMe();
                setAuth(data.session.access_token, profile.data);
                toast.success('Account created! Welcome to CivicFlow 🎉');
                router.push('/submit');
            } else {
                toast.success('Check your email to confirm your account!');
                router.push('/login');
            }
        } catch (err: any) {
            toast.error(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
                <div className="max-w-md text-white">
                    <div className="w-14 h-14 gradient-civic rounded-2xl flex items-center justify-center text-2xl font-bold mb-8 border-2 border-white/30">C</div>
                    <h1 className="text-4xl font-display font-bold mb-4">Join CivicFlow</h1>
                    <p className="text-white/70 text-lg">Start reporting issues and earn rewards for making your community better.</p>
                    <div className="mt-8 space-y-3">
                        {['🕳️ Report potholes & road damage', '🗑️ Flag garbage overflow', '💡 Report broken streetlights', '🏆 Earn points & badges'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/80">{item}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 gradient-civic rounded-xl flex items-center justify-center text-white font-bold">C</div>
                            <span className="font-display font-bold text-xl">CivicFlow</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create account</h2>
                    <p className="text-gray-500 mb-6">Create an account with email and password</p>

                    <div className="rounded-xl border border-civic-100 bg-civic-50/50 p-4 mb-6">
                        <p className="text-sm font-semibold text-civic-900">Demo login credentials</p>
                        <p className="text-xs text-civic-700 mt-1">{DEMO_EMAIL} / {DEMO_PASSWORD}</p>
                    </div>

                    <form onSubmit={handlePasswordSignup} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                                placeholder="John Doe" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="you@example.com" required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Min 6 characters" required className="input-field" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> Create Account</>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account? <Link href="/login" className="text-civic-600 font-semibold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
