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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px]',
                                active ? 'text-civic-600' : 'text-gray-400 hover:text-gray-600'
                            )}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                            <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{label}</span>
                            {active && <div className="w-1 h-1 rounded-full bg-civic-600 mt-0.5" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
