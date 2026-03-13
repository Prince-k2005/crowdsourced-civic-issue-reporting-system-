'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Filter, Search, ChevronUp, ChevronDown, MessageCircle, Clock } from 'lucide-react';
import { reportsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { CATEGORIES, STATUS_CONFIG, URGENCY_CONFIG, cn, timeAgo } from '@/lib/utils';

interface Report {
    id: string; title: string; description: string; category: string; status: string;
    urgency: string; upvote_count: number; downvote_count: number; comment_count: number;
    created_at: string; image_urls: string[]; address: string;
}

export default function MyReportsPage() {
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params: any = { page, per_page: 10 };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = user ? await reportsAPI.myReports(params) : await reportsAPI.list(params);
            setReports(res.data.reports);
            setTotal(res.data.total);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, [page, statusFilter, user]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchReports(); };

    return (
        <div className="page-container">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-1">{user ? 'My Reports' : 'All Reports'}</h1>
                <p className="text-gray-500 mb-6">{total} total reports</p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search reports..." className="input-field pl-10" />
                    </form>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input-field w-auto">
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>

                {/* Report cards */}
                <div className="space-y-3">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))
                    ) : reports.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg mb-4">No reports found</p>
                            <Link href="/submit" className="btn-primary">Submit Your First Report</Link>
                        </div>
                    ) : reports.map((r, i) => {
                        const cat = CATEGORIES.find(c => c.value === r.category);
                        const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                        const urg = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.medium;
                        return (
                            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Link href={`/reports/${r.id}`} className="card p-5 block hover:shadow-lg transition-all group">
                                    <div className="flex items-start gap-4">
                                        {r.image_urls?.[0] ? (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL}${r.image_urls[0]}`} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{cat?.icon}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={cn('badge', status.bg, status.color)}>{status.label}</span>
                                                <span className={cn('badge', urg.bg, urg.color)}>{urg.label}</span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-civic-600 transition-colors">
                                                {r.title || r.description.slice(0, 60)}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{r.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><ChevronUp size={14} />{r.upvote_count}</span>
                                                <span className="flex items-center gap-1"><MessageCircle size={14} />{r.comment_count}</span>
                                                <span className="flex items-center gap-1"><Clock size={14} />{timeAgo(r.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {total > 10 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">Previous</button>
                        <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 10)}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 10)} className="btn-ghost">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
