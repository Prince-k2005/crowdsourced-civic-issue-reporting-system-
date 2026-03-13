import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function LiveMap() {
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/reports`).then(res => setReports(res.data));
    }, []);

    return (
        <div className="h-[calc(100vh-64px)] w-full">
            <div className="p-4 bg-white shadow-sm z-10 relative">
                <h1 className="text-xl font-bold text-gray-800">Community Map</h1>
                <p className="text-sm text-gray-500">Real-time issues near you</p>
            </div>

            <MapContainer center={[40.7128, -74.0060]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        position={[report.location.lat, report.location.lon]}
                    >
                        <Popup>
                            <div className="min-w-[150px]">
                                <h3 className="font-bold capitalize">{report.category}</h3>
                                <p className="text-sm my-1">{report.description}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {report.status}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
