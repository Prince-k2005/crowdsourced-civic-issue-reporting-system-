'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Shield, Trophy, ArrowRight, Camera, Zap, BarChart3, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { useEffect, useState } from 'react';
import { leaderboardAPI } from '@/lib/api';

const features = [
    { icon: Camera, title: 'Photo Evidence', desc: 'Snap a photo to report issues with GPS-tagged location', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, title: 'Live City Map', desc: 'See all reported issues on an interactive real-time map', color: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Instant Routing', desc: 'Reports auto-route to the right department instantly', color: 'from-orange-500 to-amber-500' },
    { icon: Trophy, title: 'Earn Rewards', desc: 'Gain points and badges for every contribution you make', color: 'from-purple-500 to-pink-500' },
    { icon: Shield, title: 'Track Progress', desc: 'Follow your report from submission to resolution', color: 'from-rose-500 to-red-500' },
    { icon: BarChart3, title: 'City Analytics', desc: 'Data-driven insights for city officials to prioritize', color: 'from-indigo-500 to-blue-500' },
];

export default function LandingPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ total_reports: 0, total_resolved: 0, total_users: 0 });

    useEffect(() => {
        leaderboardAPI.stats().then(res => setStats(res.data)).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-indigo-600 via-cyan-600 to-blue-700 text-white">
                    <div className="absolute inset-0 bg-slate-950/5" />
                    <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative z-10">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold text-white mb-6">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                Making cities better, one report at a time
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6 text-shadow-hero">
                                Report2Resolve<br />
                                <span className="brand-sheen">From Citizen Reports to Real Resolution</span>
                            </h1>
                            <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl text-shadow-soft">
                                Crowdsource civic issue reporting with proof, routing, and transparent updates.
                                Turn every report into accountable action.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {user ? (
                                    <Link href="/submit" className="bg-white text-civic-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2">
                                        Report an Issue <ArrowRight size={20} />
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/signup" className="bg-white text-civic-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2">
                                            Get Started <ArrowRight size={20} />
                                        </Link>
                                        <Link href="/map" className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all hover:-translate-y-1 border border-white/35">
                                            View Live Map
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                        <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl float-soft" />
                        <div className="absolute bottom-20 right-40 w-96 h-96 bg-cyan-300 rounded-full blur-3xl float-soft" style={{ animationDelay: '0.8s' }} />
                    </div>
                </div>
            </section>

            {/* Live Stats */}
            <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {[
                        { value: stats.total_reports, label: 'Issues Reported', icon: '📋' },
                        { value: stats.total_resolved, label: 'Issues Resolved', icon: '✅' },
                        { value: stats.total_users, label: 'Active Citizens', icon: '👥' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.3 }}
                            className="card-glass p-4 md:p-6 text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl md:text-4xl font-bold text-gray-900">{s.value}</div>
                            <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">How Report2Resolve Works</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">A powerful platform connecting citizens with city officials for faster issue resolution</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="card p-6 group hover:border-civic-200">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <f.icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 pb-20">
                <div className="gradient-civic rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-10 w-60 h-60 bg-cyan-300 rounded-full blur-3xl" />
                    </div>
                    <div className="relative z-10">
                        <Users className="mx-auto mb-4" size={48} />
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to improve your city?</h2>
                        <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto text-shadow-soft">Join thousands of citizens making a real difference in their communities.</p>
                        <Link href={user ? '/submit' : '/signup'}
                            className="inline-flex items-center gap-2 bg-white text-civic-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl">
                            {user ? 'Report Now' : 'Sign Up Free'} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>&copy; 2026 Report2Resolve. Built for better cities.</p>
                </div>
            </footer>
        </div>
    );
}
