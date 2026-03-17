'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Loader2, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { reportsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { CATEGORIES, cn } from '@/lib/utils';

const STEPS = ['Category', 'Photo', 'Location', 'Details', 'Review'];

export default function SubmitReportPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        category: '',
        title: '',
        description: '',
        urgency: 'medium',
        latitude: 0,
        longitude: 0,
        address: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(f);
        }
    };

    const getLocation = () => {
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                toast.success('Location captured!');
                setLocLoading(false);
            },
            () => { toast.error('Enable location access'); setLocLoading(false); },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async () => {
        if (!user) { router.push('/login'); return; }
        if (!form.category || !form.description || !form.latitude) {
            toast.error('Please complete all required fields');
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('category', form.category);
            fd.append('description', form.description);
            fd.append('latitude', String(form.latitude));
            fd.append('longitude', String(form.longitude));
            if (form.title) fd.append('title', form.title);
            if (form.address) fd.append('address', form.address);
            fd.append('urgency', form.urgency);
            if (file) fd.append('image', file);

            await reportsAPI.create(fd);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            toast.success('Report submitted! +10 points 🎉');
            setTimeout(() => router.push('/reports'), 1500);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return !!form.category;
        if (step === 2) return form.latitude !== 0;
        if (step === 3) return form.description.length >= 10;
        return true;
    };

    return (
        <div className="page-container">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                i < step ? 'bg-emerald-500 text-white' :
                                    i === step ? 'bg-civic-600 text-white shadow-lg shadow-civic-600/30' :
                                        'bg-gray-200 text-gray-500'
                            )}>
                                {i < step ? <CheckCircle2 size={16} /> : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={cn('w-6 sm:w-12 h-0.5 mx-1', i < step ? 'bg-emerald-500' : 'bg-gray-200')} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        {/* Step 0: Category */}
                        {step === 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">What type of issue?</h2>
                                <p className="text-gray-500 mb-6">Select the category that best matches</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                            className={cn(
                                                'card p-4 text-left transition-all border-2',
                                                form.category === cat.value ? 'border-civic-500 bg-civic-50 shadow-lg' : 'border-transparent hover:border-gray-200'
                                            )}>
                                            <span className="text-2xl">{cat.icon}</span>
                                            <div className="text-sm font-semibold mt-2">{cat.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Photo */}
                        {step === 1 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Add photo evidence</h2>
                                <p className="text-gray-500 mb-6">A photo helps verify and prioritize the issue</p>
                                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                                {preview ? (
                                    <div className="relative rounded-2xl overflow-hidden">
                                        <div className="w-full flex justify-center bg-gray-100 rounded-2xl overflow-hidden">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="max-w-full h-auto max-h-[400px] object-contain"
                                            />
                                            </div>
                                        <button onClick={() => { setFile(null); setPreview(''); }}
                                            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => fileRef.current?.click()}
                                        className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-civic-400 hover:text-civic-500 transition-colors">
                                        <Camera size={48} />
                                        <span className="font-medium">Tap to take a photo</span>
                                        <span className="text-xs">or upload from gallery</span>
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 text-center mt-3">Optional — you can skip this step</p>
                            </div>
                        )}

                        {/* Step 2: Location */}
                        {step === 2 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Where is the issue?</h2>
                                <p className="text-gray-500 mb-6">We need your location to route the report correctly</p>
                                <button onClick={getLocation} disabled={locLoading}
                                    className={cn(
                                        'w-full p-6 rounded-2xl border-2 flex items-center gap-4 transition-all',
                                        form.latitude ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-civic-400'
                                    )}>
                                    {locLoading ? <Loader2 className="animate-spin text-civic-600" size={32} /> :
                                        <MapPin size={32} className={form.latitude ? 'text-emerald-600' : 'text-gray-400'} />}
                                    <div className="text-left">
                                        {form.latitude ? (
                                            <>
                                                <div className="font-semibold text-emerald-700">Location captured ✓</div>
                                                <div className="text-sm text-gray-500">{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="font-semibold text-gray-700">Get GPS Location</div>
                                                <div className="text-sm text-gray-400">Tap to capture your current location</div>
                                            </>
                                        )}
                                    </div>
                                </button>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address / Landmark (optional)</label>
                                    <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        placeholder="e.g. Near Central Park, MG Road" className="input-field" />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Details */}
                        {step === 3 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Describe the issue</h2>
                                <p className="text-gray-500 mb-6">Provide details to help resolve the issue faster</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (optional)</label>
                                        <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                            placeholder="e.g. Large pothole on MG Road" className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            rows={4} placeholder="Describe the issue in detail..." className="input-field resize-none" />
                                        <p className="text-xs text-gray-400 mt-1">{form.description.length}/500 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { v: 'low', l: 'Low', c: 'border-green-300 bg-green-50 text-green-700' },
                                                { v: 'medium', l: 'Medium', c: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
                                                { v: 'high', l: 'High', c: 'border-orange-300 bg-orange-50 text-orange-700' },
                                                { v: 'critical', l: 'Critical', c: 'border-red-300 bg-red-50 text-red-700' },
                                            ].map(u => (
                                                <button key={u.v} onClick={() => setForm(f => ({ ...f, urgency: u.v }))}
                                                    className={cn('py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                                                        form.urgency === u.v ? u.c : 'border-gray-200 text-gray-500')}>
                                                    {u.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {step === 4 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Review your report</h2>
                                <p className="text-gray-500 mb-6">Make sure everything looks good</p>
                                <div className="card p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{CATEGORIES.find(c => c.value === form.category)?.icon}</span>
                                        <div>
                                            <div className="font-semibold">{CATEGORIES.find(c => c.value === form.category)?.label}</div>
                                            <div className="text-sm text-gray-500 capitalize">{form.urgency} urgency</div>
                                        </div>
                                    </div>
                                    {form.title && <p className="font-semibold text-lg">{form.title}</p>}
                                    <p className="text-gray-600">{form.description}</p>
                                    {form.address && <p className="text-sm text-gray-500">📍 {form.address}</p>}
                                    <p className="text-xs text-gray-400">Location: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
                                    {preview && (
                                    <div className="w-full flex justify-center bg-gray-100 rounded-xl overflow-hidden">
                                        <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-w-full h-auto max-h-[300px] object-contain"
                                        />
                                    </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8">
                    <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                        className="btn-ghost disabled:opacity-0">
                        Back
                    </button>
                    {step < 4 ? (
                        <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                            className="btn-primary flex items-center gap-2">
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading}
                            className="btn-primary flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit Report 🚀'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
