export function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function timeAgo(date: string | Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
}

export const CATEGORIES = [
    { value: 'pothole', label: 'Pothole / Road Damage', icon: '🕳️', color: 'bg-red-100 text-red-700' },
    { value: 'sanitation', label: 'Garbage / Sanitation', icon: '🗑️', color: 'bg-green-100 text-green-700' },
    { value: 'lighting', label: 'Street Light Issue', icon: '💡', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'water', label: 'Water Supply', icon: '💧', color: 'bg-blue-100 text-blue-700' },
    { value: 'drainage', label: 'Drainage / Flood', icon: '🌊', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'public_works', label: 'Public Works', icon: '🏗️', color: 'bg-orange-100 text-orange-700' },
    { value: 'noise', label: 'Noise Complaint', icon: '🔊', color: 'bg-purple-100 text-purple-700' },
    { value: 'other', label: 'Other', icon: '📋', color: 'bg-gray-100 text-gray-700' },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    verified: { label: 'Verified', color: 'text-blue-700', bg: 'bg-blue-100' },
    in_progress: { label: 'In Progress', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
    duplicate: { label: 'Duplicate', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' },
    high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100' },
    medium: { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    low: { label: 'Low', color: 'text-green-700', bg: 'bg-green-100' },
};
