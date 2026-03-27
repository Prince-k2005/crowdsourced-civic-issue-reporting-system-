'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Building2, Plus, Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { STATUS_CONFIG, URGENCY_CONFIG, CATEGORIES, cn, timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [analytics, setAnalytics] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [creatingDept, setCreatingDept] = useState(false);

    // AI Prioritization state
    const [aiExpanded, setAiExpanded] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiResults, setAiResults] = useState<any[] | null>(null);

    // Replace your current fetchReports function with this:
    const fetchReports = useCallback(async (p = page) => {
        const params: any = { page: p, per_page: 15 };
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (urgencyFilter) params.urgency = urgencyFilter;
        const res = await adminAPI.listReports(params);
        setReports(res.data.reports);
        setTotal(res.data.total);
    }, [page, statusFilter, categoryFilter, urgencyFilter]);

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'moderator') {
            router.push('/');
            return;
        }
        adminAPI.getAnalytics().then(r => setAnalytics(r.data)).catch(() => { });
        adminAPI.listDepartments().then(r => setDepartments(r.data)).catch(() => { });
    }, [user]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchReports(page).catch(() => {});
        }, 1000); // every 5 seconds

        return () => clearInterval(interval); // cleanup when component unmounts
    }, [fetchReports, page]);

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        setUpdating(reportId);
        // Optimistic update — reflect change immediately in the table
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        try {
            await adminAPI.updateStatus(reportId, { status: newStatus });
            toast.success(`Status → ${newStatus}`);
            await fetchReports();
            adminAPI.getAnalytics().then(r => setAnalytics(r.data)).catch(() => {});
        } catch {
            toast.error('Failed to update');
            await fetchReports(); // revert on error
        } finally {
            setUpdating(null);
        }
    };

    const handleAssignDept = async (reportId: string, currentStatus: string, deptId: string) => {
        setUpdating(reportId);
        // Optimistic update
        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, assigned_department_id: deptId ? Number(deptId) : null } : r
        ));
        try {
            await adminAPI.updateStatus(reportId, {
                status: currentStatus,
                assigned_department_id: deptId ? Number(deptId) : null,
            });
            toast.success('Department assigned');
            await fetchReports();
        } catch {
            toast.error('Failed to assign department');
            await fetchReports(); // revert on error
        } finally {
            setUpdating(null);
        }
    };

    const handleCreateDept = async () => {
        if (!newDeptName.trim()) return;
        setCreatingDept(true);
        try {
            const slug = newDeptName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await adminAPI.createDepartment(newDeptName.trim(), slug);
            toast.success('Department created');
            const res = await adminAPI.listDepartments();
            setDepartments(res.data);
            setNewDeptName('');
        } catch { toast.error('Failed to create department'); }
        finally { setCreatingDept(false); }
    };

    const handleAIPrioritize = async () => {
        setAiAnalyzing(true);
        if (!aiExpanded) setAiExpanded(true);
        try {
            const res = await adminAPI.aiPrioritize();
            setAiResults(res.data.ranked);
            if (res.data.ranked.length > 0) {
                toast.success(`Analyzed ${res.data.total_analyzed} reports with AI`);
            } else {
                toast('No pending reports to analyze', { icon: 'ℹ️' });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'AI analysis failed');
        } finally {
            setAiAnalyzing(false);
        }
    };

    return (
        <div className="page-container">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-2xl font-bold">Report2Resolve Control Center</h1>
                        <p className="text-gray-500">Manage incoming reports, assign departments, and drive resolution</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={20} className="text-civic-600" />
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">{user?.role}</span>
                    </div>
                </motion.div>

                {/* KPI Cards */}
                {analytics && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        {[
                            { label: 'Total Reports', value: analytics.total_reports, icon: '📋', color: 'from-blue-500 to-cyan-500' },
                            { label: 'Pending', value: analytics.by_status?.pending || 0, icon: '⏳', color: 'from-yellow-500 to-orange-500' },
                            { label: 'Resolved', value: analytics.by_status?.resolved || 0, icon: '✅', color: 'from-emerald-500 to-green-500' },
                            { label: 'Resolution Rate', value: `${analytics.resolution_rate}%`, icon: '📊', color: 'from-purple-500 to-pink-500' },
                        ].map((kpi, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -3, scale: 1.01 }}
                                className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl">{kpi.icon}</span>
                                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', kpi.color)}>
                                        <span className="text-white text-xs font-bold">{i + 1}</span>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Category breakdown */}
                {analytics?.by_category && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="card p-5 mb-8"
                    >
                        <h3 className="font-bold mb-4">Reports by Category</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(analytics.by_category).map(([cat, count]: any) => {
                                const c = CATEGORIES.find(x => x.value === cat);
                                return (
                                    <div key={cat} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                        <span className="text-xl">{c?.icon || '📋'}</span>
                                        <div>
                                            <div className="font-semibold text-sm">{c?.label || cat}</div>
                                            <div className="text-xs text-gray-500">{count} reports</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Department Management */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="card p-5 mb-8"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 size={18} className="text-civic-600" />
                        <h3 className="font-bold">Department Management</h3>
                        <span className="text-xs text-gray-400">— create departments then assign reports below</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {departments.length === 0 && (
                            <span className="text-sm text-gray-400 italic">No departments yet — create one</span>
                        )}
                        {departments.map(d => (
                            <span key={d.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 font-medium">
                                🏢 {d.name}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newDeptName}
                            onChange={e => setNewDeptName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateDept()}
                            placeholder="New department name (e.g. Roads & Infrastructure)..."
                            className="input-field flex-1 text-sm"
                        />
                        <button onClick={handleCreateDept} disabled={creatingDept || !newDeptName.trim()}
                            className="btn-primary flex items-center gap-1 text-sm !py-2">
                            <Plus size={16} />{creatingDept ? 'Creating...' : 'Add'}
                        </button>
                    </div>
                </motion.div>

                {/* AI Priority Triage */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.18 }}
                    className="card mb-8 overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-indigo-100/50"
                >
                    <div 
                        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors"
                        onClick={() => setAiExpanded(!aiExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">AI Priority Triage</h3>
                                <p className="text-xs text-gray-500">Auto-analyze pending reports to surface the most critical issues</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleAIPrioritize(); }}
                                disabled={aiAnalyzing}
                                className="btn-primary text-sm !py-2 flex items-center gap-2 shadow-indigo-500/20"
                            >
                                {aiAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {aiAnalyzing ? 'Analyzing...' : aiResults ? 'Re-analyze' : 'Run Analysis'}
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-lg transition-colors">
                                {aiExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {aiExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-indigo-100/50"
                            >
                                <div className="p-5 max-h-[500px] overflow-y-auto">
                                    {aiAnalyzing ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                            <p className="font-medium text-indigo-900">Grok is analyzing reports...</p>
                                            <p className="text-sm text-indigo-600/70 mt-1">Evaluating urgency, age, upvotes, and public safety impact</p>
                                        </div>
                                    ) : aiResults && aiResults.length > 0 ? (
                                        <div className="space-y-3">
                                            {aiResults.map((r, i) => {
                                                const urgency = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.medium;
                                                const scoreColor = 
                                                    r.priority_score >= 8 ? 'bg-red-100 text-red-700 border-red-200' : 
                                                    r.priority_score >= 5 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200';
                                                
                                                return (
                                                    <div key={r.id} className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center group hover:shadow-md transition-all">
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-bold ${scoreColor}`}>
                                                            <span className="text-xl leading-none">{r.priority_score}</span>
                                                            <span className="text-[9px] uppercase tracking-wider opacity-80">Score</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <a href={`/reports/${r.id}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                                                                    {r.title}
                                                                </a>
                                                                <span className={cn('text-[10px] uppercase font-bold px-2 py-0.5 rounded-full', urgency.bg, urgency.color)}>
                                                                    {urgency.label}
                                                                </span>
                                                                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
                                                                    {timeAgo(r.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-snug">
                                                                <span className="font-medium text-indigo-600/80 mr-1">AI Reason:</span>
                                                                {r.reason}
                                                            </p>
                                                            {r.suggested_department && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                                                                    🏢 Suggestion: {r.suggested_department}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-shrink-0 w-full md:w-auto">
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : aiResults ? (
                                        <div className="py-8 text-center text-gray-400">
                                            No pending reports found for prioritization.
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-gray-400">
                                            Click "Run Analysis" to prioritize reports.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Reports table */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="card overflow-hidden"
                >
                    <div className="px-5 py-3 border-b border-gray-100">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-bold">All Reports ({total})</h3>
                            <div className="flex flex-wrap gap-2">
                                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="input-field w-auto text-xs !py-1.5">
                                    <option value="">All Statuses</option>
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                                <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                                    className="input-field w-auto text-xs !py-1.5">
                                    <option value="">All Categories</option>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                                <select value={urgencyFilter} onChange={e => { setUrgencyFilter(e.target.value); setPage(1); }}
                                    className="input-field w-auto text-xs !py-1.5">
                                    <option value="">All Urgencies</option>
                                    {Object.entries(URGENCY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/95 backdrop-blur sticky top-0 z-10 text-left border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500">Issue</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Reporter</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Urgency</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Department</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Votes</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Time</th>
                                    <th className="px-4 py-3 font-medium text-gray-500">Change Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => {
                                    const cat = CATEGORIES.find(c => c.value === r.category);
                                    const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                                    const urg = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.medium;
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-civic-50/40 transition-colors duration-200">
                                            <td className="px-4 py-3">
                                                <a href={`/reports/${r.id}`} className="font-medium text-gray-900 hover:text-civic-600 line-clamp-1 max-w-[180px] block transition-colors">
                                                    {r.title || r.description.slice(0, 40)}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-xs max-w-[100px] truncate">
                                                {r.reporter_name || '—'}
                                            </td>
                                            <td className="px-4 py-3"><span className="whitespace-nowrap">{cat?.icon} {cat?.label || r.category}</span></td>
                                            <td className="px-4 py-3"><span className={cn('badge', urg.bg, urg.color)}>{urg.label}</span></td>
                                            <td className="px-4 py-3"><span className={cn('badge', status.bg, status.color)}>{status.label}</span></td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={r.assigned_department_id?.toString() || ''}
                                                    onChange={e => handleAssignDept(r.id, r.status, e.target.value)}
                                                    disabled={updating === r.id}
                                                    className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-civic-500/40 min-w-[120px] hover:border-civic-300 transition-colors">
                                                    <option value="">— Unassigned —</option>
                                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{r.upvote_count}↑ {r.downvote_count}↓</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(r.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}
                                                    disabled={updating === r.id}
                                                    className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-civic-500/40 hover:border-civic-300 transition-colors">
                                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {reports.length === 0 && (
                                    <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">No reports found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {total > 15 && (
                        <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs">Prev</button>
                            <span className="text-sm text-gray-500 px-3 py-1">Page {page}/{Math.ceil(total / 15)}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="btn-ghost text-xs">Next</button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
