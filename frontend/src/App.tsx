import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { SubmitReport } from './pages/SubmitReport';
import { LiveMap } from './pages/LiveMap';
import { MyReports } from './pages/MyReports';
import { AdminDashboard } from './pages/AdminDashboard';
import { Leaderboard } from './pages/Leaderboard';

function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="min-h-screen pb-20">{children}</div>
            <BottomNav />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Citizen Routes with Bottom Nav */}
                <Route path="/" element={<AppLayout><SubmitReport /></AppLayout>} />
                <Route path="/map" element={<AppLayout><LiveMap /></AppLayout>} />
                <Route path="/reports" element={<AppLayout><MyReports /></AppLayout>} />
                <Route path="/leaderboard" element={<AppLayout><Leaderboard /></AppLayout>} />

                {/* Admin Route (No Bottom Nav) */}
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
