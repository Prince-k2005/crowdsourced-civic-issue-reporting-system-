import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function MyReports() {
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        // In a real app, filter by user ID. Here we show all.
        axios.get(`${API_URL}/reports`).then(res => setReports(res.data));
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved': return <CheckCircle className="text-green-500" size={20} />;
            case 'Rejected': return <XCircle className="text-red-500" size={20} />;
            default: return <Clock className="text-yellow-500" size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h1>

            <div className="space-y-4">
                {reports.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">No reports yet.</p>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
                            {/* Thumbnail Placeholder */}
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-gray-500">
                                Photo
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-900 capitalize">{report.category}</h3>
                                    {getStatusIcon(report.status)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>

                                <div className="flex gap-2 mt-3">
                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                        {report.assigned_department}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {report.urgency} Priority
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
