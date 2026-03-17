'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, MessageCircle, MapPin, Clock, Send, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsAPI, adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { CATEGORIES, STATUS_CONFIG, URGENCY_CONFIG, cn, timeAgo, formatDate } from '@/lib/utils';

export default function ReportDetailPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
    const { user } = useAuthStore();
    const [report, setReport] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [adminStatus, setAdminStatus] = useState('');
    const [adminDepartment, setAdminDepartment] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [adminUpdating, setAdminUpdating] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

    const fetchReport = async () => {
        try {
            const res = await reportsAPI.get(id);
            setReport(res.data);
            setAdminStatus(res.data.status);
            setAdminDepartment(res.data.assigned_department_id?.toString() || '');
            const cmts = await reportsAPI.getComments(id);
            setComments(cmts.data);
        } catch { toast.error('Failed to load report'); } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [id]);

    const handleVote = async (type: string) => {
        if (!user) { toast.error('Login to vote'); return; }
        setVoting(true);
        try {
            await reportsAPI.vote(id, type);
            await fetchReport();
        } catch { toast.error('Vote failed'); } finally { setVoting(false); }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await reportsAPI.addComment(id, newComment);
            setNewComment('');
            await fetchReport();
            toast.success('Comment added! +2 points');
        } catch { toast.error('Failed to post comment'); }
    };

    useEffect(() => {
        if (isAdmin) {
            adminAPI.listDepartments().then(r => setDepartments(r.data)).catch(() => { });
        }
    }, [isAdmin]);

    const handleAdminUpdate = async () => {
        setAdminUpdating(true);
        try {
            await adminAPI.updateStatus(id, {
                status: adminStatus,
                assigned_department_id: adminDepartment ? Number(adminDepartment) : undefined,
                comment: adminNote || undefined,
            });
            toast.success('Report updated');
            setAdminNote('');
            await fetchReport();
        } catch { toast.error('Failed to update report'); }
        finally { setAdminUpdating(false); }
    };

    if (loading) return <div className="page-container flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-civic-600 border-t-transparent rounded-full" /></div>;
    if (!report) return <div className="page-container text-center py-20 text-gray-400">Report not found</div>;

    const cat = CATEGORIES.find(c => c.value === report.category);
    const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
    const urg = URGENCY_CONFIG[report.urgency] || URGENCY_CONFIG.medium;

    return (
        <div className="page-container">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className={cn('badge', status.bg, status.color)}>{status.label}</span>
                        <span className={cn('badge', urg.bg, urg.color)}>{urg.label}</span>
                        {cat && <span className={cn('badge', cat.color)}>{cat.icon} {cat.label}</span>}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{report.title || report.description.slice(0, 80)}</h1>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-1"><Clock size={14} />{formatDate(report.created_at)}</span>
                        {report.reporter_name && <span>by {report.reporter_name}</span>}
                    </div>

                    {/* Image */}
                    <div className="w-full mb-6 flex justify-center">
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${report.image_urls[0]}`}
                        alt="Issue"
                        className="max-w-full h-auto max-h-[500px] object-contain rounded-2xl"
                    />
                    </div>

                    {/* Description */}
                    <div className="card p-6 mb-6">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                        {report.address && <p className="text-sm text-gray-500 mt-3 flex items-center gap-1"><MapPin size={14} />{report.address}</p>}
                    </div>

                    {/* Vote + Stats */}
                    <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleVote('up')} disabled={voting}
                                className={cn('p-2 rounded-lg transition-colors', report.user_vote === 'up' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100 text-gray-400')}>
                                <ChevronUp size={24} />
                            </button>
                            <span className="font-bold text-lg min-w-[32px] text-center">{report.upvote_count - report.downvote_count}</span>
                            <button onClick={() => handleVote('down')} disabled={voting}
                                className={cn('p-2 rounded-lg transition-colors', report.user_vote === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400')}>
                                <ChevronDown size={24} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                            <MessageCircle size={18} />
                            <span className="text-sm font-medium">{report.comment_count} comments</span>
                        </div>
                    </div>

                    {/* Resolution */}
                    {report.status === 'resolved' && report.resolution_comment && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
                            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                                <Shield size={18} />Resolution Note
                            </div>
                            <p className="text-emerald-800 text-sm">{report.resolution_comment}</p>
                            {report.resolved_at && <p className="text-xs text-emerald-600 mt-2">Resolved on {formatDate(report.resolved_at)}</p>}
                        </div>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="card p-6 mb-6 border-2 border-indigo-200 bg-indigo-50/30">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold mb-5">
                                <Shield size={18} />
                                Admin Actions
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Status</label>
                                    <select value={adminStatus} onChange={e => setAdminStatus(e.target.value)} className="input-field w-full">
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Assign to Department</label>
                                    <select value={adminDepartment} onChange={e => setAdminDepartment(e.target.value)} className="input-field w-full">
                                        <option value="">— Unassigned —</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                                    Official Note {adminStatus === 'resolved' ? '(shown as resolution comment)' : '(optional)'}
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={e => setAdminNote(e.target.value)}
                                    rows={2}
                                    placeholder="Add an official note or resolution comment..."
                                    className="input-field w-full resize-none"
                                />
                            </div>
                            <button onClick={handleAdminUpdate} disabled={adminUpdating} className="btn-primary">
                                {adminUpdating ? 'Updating...' : 'Update Report'}
                            </button>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="mt-8">
                        <h2 className="text-lg font-bold mb-4">Comments ({comments.length})</h2>

                        {user && (
                            <form onSubmit={handleComment} className="flex gap-3 mb-6">
                                <div className="w-9 h-9 rounded-full gradient-civic flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {(user.full_name || user.email)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..."
                                        className="input-field flex-1" />
                                    <button type="submit" className="btn-primary !px-4"><Send size={16} /></button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-4">
                            {comments.map(c => (
                                <div key={c.id} className={cn('flex gap-3', c.is_official && 'bg-blue-50 -mx-2 px-2 py-3 rounded-xl')}>
                                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                                        c.is_official ? 'bg-blue-600' : 'bg-gray-400')}>
                                        {(c.user_name || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{c.user_name || 'Anonymous'}</span>
                                            {c.is_official && <span className="badge bg-blue-100 text-blue-700 text-[10px]">Official</span>}
                                            <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No comments yet. Be the first!</p>}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
