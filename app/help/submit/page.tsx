'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Send, Phone, MapPin, Loader2, CheckCircle2,
    AlertTriangle, MessageSquare, Navigation
} from 'lucide-react';
import { useLocation } from '@/lib/location';
import { CATEGORIES } from '@/data/services';

export default function SubmitHelpPage() {
    const { location, phase, startDetection } = useLocation();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestId, setRequestId] = useState<number | null>(null);

    // Auto-detect location on mount
    useEffect(() => {
        if (phase === 'idle') {
            startDetection();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location) {
            setError('Location is required. Please enable GPS.');
            return;
        }
        if (!selectedCategory || !phone.trim()) {
            setError('Please fill all required fields.');
            return;
        }
        // Basic phone validation
        const cleanPhone = phone.replace(/\s/g, '');
        if (cleanPhone.length < 10) {
            setError('Please enter a valid phone number (at least 10 digits).');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/help-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: selectedCategory,
                    phone: cleanPhone,
                    description: description.trim() || null,
                    latitude: location.lat,
                    longitude: location.lng,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setRequestId(data.id);
                setSubmitted(true);
            } else {
                setError('Failed to submit request. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="submit-help-page">
                <div className="submit-help-success nf-fade-in">
                    <div className="submit-help-success-icon">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="submit-help-success-title">Help Request Sent!</h2>
                    <p className="submit-help-success-desc">
                        Your request #{requestId} has been submitted. Our team will assist you shortly.
                    </p>
                    <div className="submit-help-success-info">
                        <div className="submit-help-info-item">
                            <MapPin size={14} />
                            <span>GPS coordinates shared with responders</span>
                        </div>
                        <div className="submit-help-info-item">
                            <Phone size={14} />
                            <span>We&apos;ll reach you at {phone}</span>
                        </div>
                    </div>
                    <div className="submit-help-success-actions">
                        <Link href={`/help`} className="nf-btn nf-btn-primary">
                            <Navigation size={16} />
                            Track My Request
                        </Link>
                        <Link href="/" className="nf-btn nf-btn-outline-refresh">
                            <ArrowLeft size={16} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-help-page">
            {/* Header */}
            <div className="submit-help-header nf-fade-in">
                <Link href="/" className="submit-help-back">
                    <ArrowLeft size={17} />
                </Link>
                <div>
                    <h1 className="submit-help-title">Request Help</h1>
                    <p className="submit-help-subtitle">
                        Send a help request with your location
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="submit-help-form nf-slide-up">
                {/* Error */}
                {error && (
                    <div className="submit-help-error">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {/* Category Selection */}
                <div className="submit-help-field">
                    <label className="submit-help-label">
                        What do you need help with? *
                    </label>
                    <div className="submit-help-categories">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                className={`submit-help-cat-btn ${selectedCategory === cat.key ? 'submit-help-cat-active' : ''}`}
                                onClick={() => setSelectedCategory(cat.key)}
                                style={
                                    selectedCategory === cat.key
                                        ? { borderColor: cat.color, background: `${cat.color}12`, color: cat.color }
                                        : {}
                                }
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Phone */}
                <div className="submit-help-field">
                    <label className="submit-help-label">
                        <Phone size={14} />
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="submit-help-input"
                        required
                    />
                    <p className="submit-help-hint">Responders will contact you at this number</p>
                </div>

                {/* Description */}
                <div className="submit-help-field">
                    <label className="submit-help-label">
                        <MessageSquare size={14} />
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue briefly..."
                        rows={3}
                        className="submit-help-textarea"
                    />
                </div>

                {/* Location Status */}
                <div className="submit-help-field">
                    <label className="submit-help-label">
                        <MapPin size={14} />
                        Your Location
                    </label>
                    {phase === 'done' && location ? (
                        <div className="submit-help-location-ok">
                            <CheckCircle2 size={16} />
                            <span>GPS detected — {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                        </div>
                    ) : phase === 'detecting' ? (
                        <div className="submit-help-location-loading">
                            <Loader2 size={16} className="nf-spin" />
                            <span>Detecting location...</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => startDetection(true)}
                            className="submit-help-location-btn"
                        >
                            <MapPin size={16} />
                            Enable Location
                        </button>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !location || !selectedCategory || !phone.trim()}
                    className="nf-btn nf-btn-primary submit-help-submit"
                >
                    {submitting ? (
                        <Loader2 size={18} className="nf-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                    {submitting ? 'Sending...' : 'Send Help Request'}
                </button>
            </form>
        </div>
    );
}
