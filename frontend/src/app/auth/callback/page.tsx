'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => {
            router.replace('/login');
        }, 800);

        return () => clearTimeout(t);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-sm px-6">
                <Loader2 size={48} className="animate-spin text-civic-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting...</h2>
                <p className="text-gray-500">Magic-link auth is disabled in this demo. Use email and password.</p>
            </div>
        </div>
    );
}
