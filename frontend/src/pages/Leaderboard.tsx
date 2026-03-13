import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Leaderboard() {
    const [data, setData] = useState<{ users: any[], stats: any } | null>(null);

    useEffect(() => {
        axios.get(`${API_URL}/leaderboard`).then(res => setData(res.data));
    }, []);

    if (!data) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 p-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white mb-6 shadow-lg">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-100" /> City Heroes
                </h1>
                <p className="opacity-90">Top citizens making a difference</p>
            </div>

            {/* Top 3 List */}
            <div className="space-y-4 mb-8">
                {data.users.map((user, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                    index === 1 ? 'bg-slate-100 text-slate-600' :
                                        'bg-orange-100 text-orange-600'
                                }`}>
                                #{user.rank}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{user.name}</h3>
                                <div className="text-xs text-slate-500">Citizen Level 4</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-blue-600">{user.points}</div>
                            <div className="text-xs text-slate-400">POINTS</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Impact Stats */}
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Star className="text-blue-500" /> Community Impact
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.stats).map(([category, count]) => (
                    <div key={category} className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-slate-800">{String(count)}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">{category} Fixed</div>
                    </div>
                ))}
                {Object.keys(data.stats).length === 0 && (
                    <div className="col-span-2 text-center text-slate-400 py-4 bg-white rounded-lg">
                        No reports resolved yet. Be the first!
                    </div>
                )}
            </div>
        </div>
    );
}
