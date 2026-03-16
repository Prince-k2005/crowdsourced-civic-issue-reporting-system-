import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth (profile only — actual auth is via Supabase) ──
export const authAPI = {
    getMe: () => api.get('/api/auth/me'),
    updateMe: (data: any) => api.patch('/api/auth/me', data),
};

// ── Reports ──
export const reportsAPI = {
    list: (params?: any) => api.get('/api/reports', { params }),
    myReports: (params?: any) => api.get('/api/reports/my', { params }),
    get: (id: string) => api.get(`/api/reports/${id}`),
    create: (formData: FormData) =>
        api.post('/api/reports', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    delete: (id: string) => api.delete(`/api/reports/${id}`),
    vote: (id: string, vote_type: string) =>
        api.post(`/api/reports/${id}/vote`, { vote_type }),
    getComments: (id: string) => api.get(`/api/reports/${id}/comments`),
    addComment: (id: string, content: string) =>
        api.post(`/api/reports/${id}/comments`, { content }),
};

// ── Admin ──
export const adminAPI = {
    listReports: (params?: any) => api.get('/api/admin/reports', { params }),
    updateStatus: (id: string, data: any) =>
        api.patch(`/api/admin/reports/${id}/status`, data),
    getAnalytics: () => api.get('/api/admin/analytics'),
    listDepartments: () => api.get('/api/admin/departments'),
    createDepartment: (name: string, slug: string) =>
        api.post('/api/admin/departments', null, { params: { name, slug } }),
    aiPrioritize: () => api.post('/api/admin/ai/prioritize'),
};

// ── Leaderboard ──
export const leaderboardAPI = {
    get: (limit?: number) => api.get('/api/leaderboard', { params: { limit } }),
    stats: () => api.get('/api/leaderboard/stats'),
    badges: () => api.get('/api/leaderboard/badges'),
};

// ── Notifications ──
export const notificationsAPI = {
    list: (params?: any) => api.get('/api/notifications', { params }),
    markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
    markAllRead: () => api.patch('/api/notifications/read-all'),
};

export default api;
