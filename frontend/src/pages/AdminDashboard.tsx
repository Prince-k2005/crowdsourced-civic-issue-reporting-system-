import { useEffect, useState } from 'react';
import axios from 'axios';
import { Map, BarChart3, Bell, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AdminDashboard() {
    const [reports, setReports] = useState<any[]>([]);

    const fetchReports = () => {
        axios.get(`${API_URL}/reports`).then(res => setReports(res.data));
    };

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 5000); // Live refresh every 5s
        return () => clearInterval(interval);
    }, []);
    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await axios.patch(`${API_URL}/reports/${id}/status`, {
                status: newStatus,
                comment: newStatus === 'Resolved' ? 'Issue fixed by Public Works.' : 'Report rejected.'
            });
            fetchReports(); // Refresh data
        } catch (e) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-800">Admin Command Center</h1>
                <div className="relative">
                    <Bell className="text-slate-600" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Pending Reports</h3>
                        <div className="text-4xl font-bold text-slate-900">
                            {reports.filter(r => r.status === 'Pending').length}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Urgent Issues</h3>
                        <div className="text-4xl font-bold text-red-600">
                            {reports.filter(r => r.urgency === 'High' && r.status === 'Pending').length}
                        </div>
                    </div>
                </div>

                {/* Action Table */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <BarChart3 size={20} /> Case Management
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="p-4 font-medium">Issue</th>
                                    <th className="p-4 font-medium">Department</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium capitalize">{report.category}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{report.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                                {report.assigned_department}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                report.status === 'Rejected' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            {report.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'Resolved')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Mark Resolved"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'Rejected')}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Reject Report"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {reports.length === 0 && (
                            <div className="p-8 text-center text-slate-400">No data available</div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
