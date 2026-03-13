import { create } from 'zustand';
import { supabase } from './supabase';

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    points: number;
    reports_count: number;
    badge_level: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    setAuth: (token: string, user: User) => void;
    setUser: (user: User) => void;
    logout: () => void;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: true,

    setAuth: (token, user) => {
        set({ token, user, isLoading: false });
    },

    setUser: (user) => {
        set({ user });
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ token: null, user: null, isLoading: false });
    },

    hydrate: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Fetch profile from our backend
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`,
                    { headers: { Authorization: `Bearer ${session.access_token}` } }
                );
                if (res.ok) {
                    const profile = await res.json();
                    set({ token: session.access_token, user: profile, isLoading: false });
                } else {
                    set({ token: session.access_token, user: null, isLoading: false });
                }
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }

        // Listen for auth state changes (token refresh, sign out, etc.)
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                set({ token: session.access_token });
            } else {
                set({ token: null, user: null });
            }
        });
    },
}));
