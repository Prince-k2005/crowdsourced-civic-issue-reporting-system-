'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, FileText, Star, LogOut, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, setUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ full_name: '', phone: '' });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        setForm({ full_name: user.full_name || '', phone: '' });
    }, [user]);

    const handleSave = async () => {
        try {
            const res = await authAPI.updateMe(form);
            setUser(res.data);
            toast.success('Profile updated');
            setEditing(false);
        } catch { toast.error('Update failed'); }
    };

    if (!user) return null;

    const BADGE_LEVELS: Record<string, { icon: string; next: number }> = {
        newcomer: { icon: '🌱', next: 50 },
        'active citizen': { icon: '🏃', next: 200 },
        'community hero': { icon: '🦸', next: 500 },
        'city champion': { icon: '🏆', next: 1000 },
        legend: { icon: '⭐', next: 9999 },
    };
    const badge = BADGE_LEVELS[user.badge_level] || BADGE_LEVELS.newcomer;
    const progress = Math.min(100, (user.points / badge.next) * 100);

    return (
        <div className="page-container">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Profile header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="card p-6 text-center mb-6">
                    <div className="w-20 h-20 rounded-full gradient-civic mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
                        {(user.full_name || user.email)[0].toUpperCase()}
                    </div>

                    {editing ? (
                        <div className="space-y-3 max-w-sm mx-auto">
                            <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                                placeholder="Full Name" className="input-field text-center" />
                            <div className="flex gap-2 justify-center">
                                <button onClick={handleSave} className="btn-primary !py-2 flex items-center gap-1"><Save size={14} /> Save</button>
                                <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-1"><X size={14} /> Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold">{user.full_name || user.email.split('@')[0]}</h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <button onClick={() => setEditing(true)} className="text-xs text-civic-600 hover:underline mt-2 flex items-center gap-1 mx-auto">
                                <Edit size={12} /> Edit profile
                            </button>
                        </>
                    )}
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { icon: <Star size={20} className="text-amber-500" />, val: user.points, label: 'Points' },
                        { icon: <FileText size={20} className="text-civic-600" />, val: user.reports_count, label: 'Reports' },
                        { icon: <Award size={20} className="text-purple-500" />, val: badge.icon, label: user.badge_level },
                    ].map((s, i) => (
                        <div key={i} className="card p-4 text-center">
                            <div className="flex items-center justify-center mb-2">{s.icon}</div>
                            <div className="text-lg font-bold">{s.val}</div>
                            <div className="text-xs text-gray-500 capitalize">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Badge progress */}
                <div className="card p-5 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold capitalize">{badge.icon} {user.badge_level}</span>
                        <span className="text-xs text-gray-400">{user.points}/{badge.next} pts</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full gradient-civic rounded-full" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{Math.max(0, badge.next - user.points)} more points to next badge level</p>
                </div>

                {/* Role badge */}
                <div className="card p-5 mb-6 flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                        user.role === 'admin' ? 'bg-red-100' : user.role === 'moderator' ? 'bg-blue-100' : 'bg-green-100')}>
                        <span className="text-xl">{user.role === 'admin' ? '🛡️' : user.role === 'moderator' ? '⚡' : '🏠'}</span>
                    </div>
                    <div>
                        <div className="font-semibold capitalize">{user.role}</div>
                        <div className="text-xs text-gray-500">
                            {user.role === 'admin' ? 'Full admin access' : user.role === 'moderator' ? 'Can moderate reports' : 'Standard citizen account'}
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button onClick={() => { logout(); router.push('/'); }}
                    className="btn-danger w-full flex items-center justify-center gap-2">
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </div>
    );
}
