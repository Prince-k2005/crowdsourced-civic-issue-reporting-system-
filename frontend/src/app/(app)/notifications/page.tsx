'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<{ notifications: any[]; unread_count: number }>({ notifications: [], unread_count: 0 });

    const fetchNotifs = () => {
        notificationsAPI.list().then(r => setData(r.data)).catch(() => { });
    };

    useEffect(() => { fetchNotifs(); }, []);

    const markRead = async (id: string) => {
        await notificationsAPI.markRead(id);
        fetchNotifs();
    };

    const markAll = async () => {
        await notificationsAPI.markAllRead();
        toast.success('All marked as read');
        fetchNotifs();
    };

    return (
        <div className="page-container">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-gray-500">{data.unread_count} unread</p>
                    </div>
                    {data.unread_count > 0 && (
                        <button onClick={markAll} className="btn-ghost text-sm flex items-center gap-1">
                            <CheckCheck size={16} /> Mark all read
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    {data.notifications.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Bell size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No notifications yet</p>
                        </div>
                    ) : data.notifications.map(n => (
                        <div key={n.id}
                            className={cn('card p-4 flex items-start gap-3 cursor-pointer transition-all',
                                !n.is_read && 'bg-civic-50 border-civic-200')}>
                            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                n.type === 'status_change' ? 'bg-blue-100' : n.type === 'badge_earned' ? 'bg-amber-100' : 'bg-gray-100')}>
                                <span className="text-lg">{n.type === 'status_change' ? '📋' : n.type === 'badge_earned' ? '🏆' : '🔔'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn('text-sm', !n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700')}>{n.title}</p>
                                {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                                    {n.report_id && <Link href={`/reports/${n.report_id}`} className="text-xs text-civic-600 hover:underline">View report</Link>}
                                </div>
                            </div>
                            {!n.is_read && (
                                <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
