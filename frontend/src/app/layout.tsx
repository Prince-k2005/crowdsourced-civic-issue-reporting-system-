'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const hydrate = useAuthStore((s) => s.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return (
        <html lang="en">
            <head>
                <title>CivicFlow — Report Civic Issues</title>
                <meta name="description" content="AI-driven civic issue reporting platform. Report potholes, garbage, broken lights and more." />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className="font-sans antialiased">
                {children}
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: { borderRadius: '12px', padding: '12px 20px', fontSize: '14px' },
                        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </body>
        </html>
    );
}
