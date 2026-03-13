'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Filter, Layers } from 'lucide-react';
import { reportsAPI } from '@/lib/api';
import { CATEGORIES, STATUS_CONFIG, cn } from '@/lib/utils';

// Lazy load Leaflet (SSR incompatible)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

export default function MapPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [catFilter, setCatFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Fix Leaflet default icon
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        }
    }, []);

    useEffect(() => {
        const params: any = { per_page: 100 };
        if (catFilter) params.category = catFilter;
        if (statusFilter) params.status = statusFilter;
        reportsAPI.list(params).then(res => setReports(res.data.reports)).catch(() => { });
    }, [catFilter, statusFilter]);

    if (!isClient) return <div className="page-container flex items-center justify-center"><p>Loading map...</p></div>;

    return (
        <div className="page-container">
            {/* Import leaflet CSS */}
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

            <div className="relative h-[calc(100vh-4rem)]">
                {/* Filters overlay */}
                <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="bg-white shadow-lg rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Filter size={16} /> Filters
                    </button>
                    {showFilters && (
                        <div className="bg-white shadow-xl rounded-xl p-4 space-y-3 min-w-[200px]">
                            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field text-sm">
                                <option value="">All Categories</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm">
                                <option value="">All Statuses</option>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <button onClick={() => { setCatFilter(''); setStatusFilter(''); }} className="text-xs text-civic-600 hover:underline">Clear filters</button>
                        </div>
                    )}
                </div>

                {/* Report count badge */}
                <div className="absolute top-4 right-4 z-[1000] bg-white shadow-lg rounded-xl px-4 py-2 text-sm font-medium">
                    <Layers size={14} className="inline mr-1" /> {reports.length} issues
                </div>

                <MapContainer center={[12.9716, 77.5946]} zoom={13}
                    style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {reports.map(r => (
                        <Marker key={r.id} position={[r.latitude, r.longitude]}>
                            <Popup>
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className={cn('badge text-[10px]', STATUS_CONFIG[r.status]?.bg, STATUS_CONFIG[r.status]?.color)}>
                                            {STATUS_CONFIG[r.status]?.label}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-sm">{r.title || r.description.slice(0, 50)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{r.category} • {r.urgency}</p>
                                    <a href={`/reports/${r.id}`} className="text-xs text-civic-600 font-medium mt-2 block hover:underline">View details →</a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
