'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Search, Loader2, MapPin, Clock, CheckCircle2, AlertCircle, CircleDot, Send } from 'lucide-react';

interface HelpRequest {
    id: number;
    category: string;
    phone: string;
    description: string | null;
    latitude: number;
    longitude: number;
    status: string;
    created_at: string;
    resolved_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', icon: <Clock size={14} /> },
    assigned: { label: 'Assigned', color: '#2563EB', bg: '#EFF6FF', icon: <CircleDot size={14} /> },
    resolved: { label: 'Resolved', color: '#16A34A', bg: '#F0FDF4', icon: <CheckCircle2 size={14} /> },
};

export default function HelpTrackingPage() {
    const [phone, setPhone] = useState('');
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(false);

        try {
            const res = await fetch(`/api/help-requests?phone=${encodeURIComponent(phone.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else {
                setError('Failed to fetch requests. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="help-page">
            {/* Header */}
            <div className="help-header nf-fade-in">
                <Link href="/" className="help-back-btn">
                    <ArrowLeft size={17} />
                </Link>
                <div>
                    <h1 className="help-title">Track Your Request</h1>
                    <p className="help-subtitle">Enter your phone number to see your help requests</p>
                </div>
            </div>

            {/* Submit New Request */}
            <Link href="/help/submit" className="nf-btn nf-btn-primary help-submit-link nf-fade-in">
                <Send size={16} />
                Submit a New Help Request
            </Link>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="help-search-form nf-slide-up">
                <div className="help-search-input-wrap">
                    <Phone size={18} className="help-search-icon" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="help-search-input"
                        required
                    />
                </div>
                <button type="submit" disabled={loading || !phone.trim()} className="nf-btn nf-btn-primary help-search-btn">
                    {loading ? <Loader2 size={18} className="nf-spin" /> : <Search size={18} />}
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="help-error nf-slide-up">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Results */}
            {searched && !error && (
                <div className="help-results nf-slide-up">
                    {requests.length === 0 ? (
                        <div className="help-empty">
                            <div className="help-empty-icon">📋</div>
                            <h3>No Requests Found</h3>
                            <p>No help requests found for this phone number.</p>
                        </div>
                    ) : (
                        <>
                            <p className="help-results-count">
                                {requests.length} request{requests.length > 1 ? 's' : ''} found
                            </p>
                            <div className="help-request-list">
                                {requests.map(req => {
                                    const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                                    return (
                                        <div key={req.id} className="help-request-card">
                                            <div className="help-request-top">
                                                <span
                                                    className="help-request-status"
                                                    style={{ color: statusCfg.color, background: statusCfg.bg }}
                                                >
                                                    {statusCfg.icon}
                                                    {statusCfg.label}
                                                </span>
                                                <span className="help-request-id">#{req.id}</span>
                                            </div>

                                            <div className="help-request-category">
                                                {req.category.charAt(0).toUpperCase() + req.category.slice(1)}
                                            </div>

                                            {req.description && (
                                                <p className="help-request-desc">{req.description}</p>
                                            )}

                                            <div className="help-request-meta">
                                                <span className="help-request-meta-item">
                                                    <MapPin size={12} />
                                                    {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                                                </span>
                                                <span className="help-request-meta-item">
                                                    <Clock size={12} />
                                                    {formatDate(req.created_at)}
                                                </span>
                                            </div>

                                            {req.resolved_at && (
                                                <p className="help-request-resolved">
                                                    ✅ Resolved on {formatDate(req.resolved_at)}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
