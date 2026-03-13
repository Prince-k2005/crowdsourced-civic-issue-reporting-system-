import { useState, useRef, FormEvent } from 'react'
import axios from 'axios'
import { Camera, MapPin, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ReportResponse {
    id: string
    status: string
    ai_confidence: number
    assigned_department: string
    urgency: string
    message: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function SubmitReport() {
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('pothole')
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ReportResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLocationClick = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    })
                },
                (err) => {
                    setError('Could not get location: ' + err.message)
                }
            )
        } else {
            setError('Geolocation not supported')
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!location || !file) {
            setError('Please provide both location and an image.')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append('description', description)
        formData.append('category', category)
        formData.append('latitude', location.lat.toString())
        formData.append('longitude', location.lon.toString())
        formData.append('image', file)

        try {
            const response = await axios.post<ReportResponse>(`${API_URL}/reports`, formData)
            setResult(response.data)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setDescription('')
            setFile(null)
            setLocation(null)
        } catch (err: any) {
            if (err.response) {
                setError(err.response.data.detail || 'Submission failed')
            } else {
                setError('Network error. Ensure backend is running.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-50 flex flex-col items-center p-4">
            <header className="w-full max-w-md bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-800">CivicFlow</h1>
                <div className="text-sm text-gray-500">Citizen App</div>
            </header>

            <div className="w-full max-w-md space-y-4">
                {result && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-green-600" size={24} />
                            <h2 className="text-lg font-semibold text-green-800">Report Submitted!</h2>
                        </div>
                        <p className="text-sm text-green-700">{result.message}</p>
                        <div className="mt-2 text-xs text-green-600 space-y-1">
                            <div><span className="font-medium">ID:</span> {result.id}</div>
                            <div><span className="font-medium">Department:</span> {result.assigned_department}</div>
                            <div><span className="font-medium">Urgency:</span> {result.urgency}</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div className="text-red-700 text-sm">{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="pothole">Pothole / Road Damage</option>
                            <option value="sanitation">Garbage / Sanitation</option>
                            <option value="lighting">Street Light Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleLocationClick}
                                className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-md border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
                                type="button"
                            >
                                <MapPin size={18} />
                                {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Get GPS Location'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence</label>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
                        >
                            {file ? (
                                <div className="text-sm text-gray-800 font-medium">{file.name}</div>
                            ) : (
                                <>
                                    <Camera size={32} />
                                    <span className="text-xs mt-1">Tap to take photo</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue..."
                            className="w-full p-2 border rounded-md h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    )
}
