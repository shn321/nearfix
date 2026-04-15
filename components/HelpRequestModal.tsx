'use client';

import { useState } from 'react';
import { X, Send, Loader2, CheckCircle2, MapPin, Phone } from 'lucide-react';

interface HelpRequestModalProps {
    category: string;
    categoryLabel: string;
    latitude: number;
    longitude: number;
    onClose: () => void;
}

export function HelpRequestModal({ category, categoryLabel, latitude, longitude, onClose }: HelpRequestModalProps) {
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/help-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    phone: phone.trim(),
                    description: description.trim() || null,
                    latitude,
                    longitude,
                }),
            });

            if (res.ok) {
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

    return (
        <div className="nf-modal-overlay" onClick={onClose}>
            <div className="nf-modal nf-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <button className="nf-modal-close" onClick={onClose} aria-label="Close">
                    <X size={18} />
                </button>

                {submitted ? (
                    /* ── Success State ── */
                    <div style={{ padding: '20px 0' }}>
                        <div className="nf-modal-icon" style={{ color: '#16A34A', background: '#DCFCE7' }}>
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="nf-modal-title" style={{ color: '#16A34A' }}>Request Submitted!</h3>
                        <p className="nf-modal-body">
                            Your help request for <strong>{categoryLabel}</strong> has been submitted.
                            You can track your request at <strong>/help</strong> using your phone number.
                        </p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={onClose} className="nf-btn nf-btn-primary" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form State ── */
                    <>
                        <div className="nf-modal-icon" style={{ color: '#FF5C00', background: 'rgba(255, 92, 0, 0.1)' }}>
                            <Send size={32} />
                        </div>
                        <h3 className="nf-modal-title" style={{ color: '#333' }}>Request Help</h3>
                        <p className="nf-modal-body" style={{ marginBottom: 16 }}>
                            Need a <strong>{categoryLabel.toLowerCase()}</strong> to come to your location? Submit a request below.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 16, fontSize: '0.78rem', color: '#888' }}>
                            <MapPin size={12} />
                            <span>Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                        </div>

                        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>
                                    <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    Your Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    required
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E5E5',
                                        fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>
                                    What happened? (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g., Flat tyre on NH-66 near Murdeshwar"
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E5E5',
                                        fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                                    }}
                                />
                            </div>

                            {error && (
                                <p style={{ color: '#DC2626', fontSize: '0.82rem', fontWeight: 500, marginBottom: 12, textAlign: 'center' }}>
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !phone.trim()}
                                className="nf-btn nf-btn-primary"
                                style={{ width: '100%', padding: '14px', fontSize: '0.95rem', opacity: submitting || !phone.trim() ? 0.6 : 1 }}
                            >
                                {submitting ? <Loader2 size={18} className="nf-spin" /> : <Send size={18} />}
                                {submitting ? 'Submitting...' : 'Submit Help Request'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
