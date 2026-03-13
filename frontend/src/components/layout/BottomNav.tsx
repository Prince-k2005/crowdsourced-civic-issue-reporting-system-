'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Map, List, Trophy, User, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuthStore();

    if (!user) return null;

    const isAdmin = user.role === 'admin' || user.role === 'moderator';
    const navItems = [
        { href: '/submit', label: 'Report', icon: PlusCircle },
        { href: '/map', label: 'Map', icon: Map },
        { href: '/reports', label: 'Activity', icon: List },
        ...(isAdmin
            ? [{ href: '/admin', label: 'Admin', icon: Shield }]
            : [{ href: '/leaderboard', label: 'Heroes', icon: Trophy }]
        ),
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-2xl border-t border-civic-100 z-50 safe-area-bottom shadow-[0_-8px_30px_rgba(2,6,23,0.08)]">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-300 min-w-[56px]',
                                active ? 'text-civic-700 bg-civic-50 -translate-y-0.5' : 'text-gray-400 hover:text-gray-600'
                            )}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={cn(active && 'drop-shadow-sm')} />
                            <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{label}</span>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-civic-600 mt-0.5 animate-pulse" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
