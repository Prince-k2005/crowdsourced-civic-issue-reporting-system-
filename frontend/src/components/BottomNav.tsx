import { Map, PlusCircle, List, User, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path ? "text-blue-600" : "text-gray-500";

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-5 z-50">
            <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
                <PlusCircle size={24} />
                <span className="text-xs font-medium">Report</span>
            </Link>
            <Link to="/map" className={`flex flex-col items-center gap-1 ${isActive('/map')}`}>
                <Map size={24} />
                <span className="text-xs font-medium">Map</span>
            </Link>
            <Link to="/reports" className={`flex flex-col items-center gap-1 ${isActive('/reports')}`}>
                <List size={24} />
                <span className="text-xs font-medium">Activity</span>
            </Link>
            <Link to="/leaderboard" className={`flex flex-col items-center gap-1 ${isActive('/leaderboard')}`}>
                <Trophy size={24} />
                <span className="text-xs font-medium">Heroes</span>
            </Link>
            <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin')}`}>
                <User size={24} />
                <span className="text-xs font-medium">Admin</span>
            </Link>
        </nav>
    );
}
