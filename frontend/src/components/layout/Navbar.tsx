'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { notificationsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [unread, setUnread] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            notificationsAPI.list({ unread_only: true }).then(res => {
                setUnread(res.data.unread_count || 0);
            }).catch(() => { });
        }
    }, [user, pathname]);

    const navLinks = user ? [
        { href: '/submit', label: 'Report Issue' },
        { href: '/map', label: 'Live Map' },
        { href: '/reports', label: 'My Reports' },
        { href: '/leaderboard', label: 'Leaderboard' },
        ...(user.role === 'admin' || user.role === 'moderator' ? [{ href: '/admin', label: 'Admin' }] : []),
    ] : [];

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 gradient-civic rounded-xl flex items-center justify-center text-white font-bold text-lg">R2</div>
                    <span className="font-display font-bold text-xl text-gray-900">Report2Resolve</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                pathname === link.href ? 'bg-civic-50 text-civic-700' : 'text-gray-600 hover:bg-gray-100'
                            )}>
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <Bell size={20} className="text-gray-600" />
                                {unread > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </Link>
                            <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="w-8 h-8 rounded-full gradient-civic flex items-center justify-center text-white text-sm font-bold">
                                    {(user.full_name || user.email)[0].toUpperCase()}
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                    {user.full_name || user.email.split('@')[0]}
                                </span>
                            </Link>
                            <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="btn-ghost text-sm">Log in</Link>
                            <Link href="/signup" className="btn-primary text-sm !py-2 !px-4">Sign up</Link>
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                            className={cn(
                                'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                pathname === link.href ? 'bg-civic-50 text-civic-700' : 'text-gray-600 hover:bg-gray-100'
                            )}>
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
