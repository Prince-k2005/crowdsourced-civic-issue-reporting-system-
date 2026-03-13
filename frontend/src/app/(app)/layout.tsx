'use client';

import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 hero-mesh opacity-30" />
            <Navbar />
            <main className="relative z-10">{children}</main>
            <BottomNav />
        </div>
    );
}
