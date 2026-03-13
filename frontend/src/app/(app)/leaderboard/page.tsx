'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { leaderboardAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const RANK_STYLES = [
    { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: 'text-white', ring: 'ring-yellow-400/30', medal: '🥇' },
    { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', text: 'text-white', ring: 'ring-gray-300/30', medal: '🥈' },
    { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-white', ring: 'ring-orange-400/30', medal: '🥉' },
];

export default function LeaderboardPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);

    useEffect(() => {
        leaderboardAPI.get(20).then(r => setUsers(r.data.users)).catch(() => { });
        leaderboardAPI.stats().then(r => setStats(r.data)).catch(() => { });
        leaderboardAPI.badges().then(r => setBadges(r.data)).catch(() => { });
    }, []);

    return (
        <div className="page-container">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold mb-2">Community Heroes</h1>
                    <p className="text-gray-500">Citizens making a real difference</p>
                </div>

                {/* Community stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {[
                            { icon: '📋', val: stats.total_reports, label: 'Reports' },
                            { icon: '✅', val: stats.total_resolved, label: 'Resolved' },
                            { icon: '👥', val: stats.total_users, label: 'Citizens' },
                            { icon: '📊', val: `${stats.resolution_rate}%`, label: 'Resolution Rate' },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                                className="card p-4 text-center">
                                <div className="text-xl mb-1">{s.icon}</div>
                                <div className="text-xl font-bold">{s.val}</div>
                                <div className="text-xs text-gray-500">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Top 3 Podium */}
                {users.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 mb-8">
                        {[users[1], users[0], users[2]].map((u, idx) => {
                            const rank = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                            const style = RANK_STYLES[rank];
                            const heights = ['h-28', 'h-36', 'h-24'];
                            return (
                                <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: rank * 0.15 }}
                                    className="flex flex-col items-center">
                                    <div className={cn('w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-2 ring-4', style.bg, style.text, style.ring)}>
                                        {u.name[0]}
                                    </div>
                                    <div className="text-xl mb-1">{style.medal}</div>
                                    <div className="text-sm font-bold truncate max-w-[80px]">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.points} pts</div>
                                    <div className={cn('w-24 rounded-t-xl mt-2 flex items-end justify-center pb-2', heights[idx], 'bg-gradient-to-t from-civic-100 to-civic-50 border border-civic-200')}>
                                        <span className="text-sm font-bold text-civic-700">#{u.rank}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Full rankings */}
                <div className="card overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Trophy size={18} className="text-civic-600" />
                        <h2 className="font-bold">Rankings</h2>
                    </div>
                    {users.map((u, i) => (
                        <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className={cn('flex items-center gap-4 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                                currentUser?.id === u.id && 'bg-civic-50')}>
                            <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                i < 3 ? RANK_STYLES[i].bg + ' ' + RANK_STYLES[i].text : 'bg-gray-100 text-gray-500')}>
                                {u.rank}
                            </span>
                            <div className="w-10 h-10 rounded-full gradient-civic flex items-center justify-center text-white font-bold">
                                {u.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{u.name}</div>
                                <div className="text-xs text-gray-400">{u.reports_count} reports • {u.badge_level}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-civic-700">{u.points}</div>
                                <div className="text-[10px] text-gray-400">points</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award size={20} /> Badges</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {badges.map(b => (
                                <div key={b.id} className="card p-4 text-center">
                                    <div className="text-3xl mb-2">{b.icon}</div>
                                    <div className="text-sm font-bold">{b.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{b.points_required} pts</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
