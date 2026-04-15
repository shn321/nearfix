'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, User } from 'lucide-react';
import { StarRating } from './StarRating';

interface Review {
    id: number;
    service_id: number;
    device_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

/** Get or create a persistent device ID for anonymous reviews */
function getDeviceId(): string {
    const key = 'nearfix_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
    }
    return id;
}

export function ReviewSection({ serviceId, serviceName }: { serviceId: number; serviceName: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch(`/api/reviews?serviceId=${serviceId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    device_id: getDeviceId(),
                    rating: newRating,
                    comment: newComment.trim() || null,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                setNewRating(0);
                setNewComment('');
                setShowForm(false);
                await fetchReviews();
                setTimeout(() => setSubmitted(false), 3000);
            }
        } catch {
            // Silently fail
        } finally {
            setSubmitting(false);
        }
    };

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="review-section">
            {/* Header */}
            <div className="review-header">
                <div className="review-header-left">
                    <MessageSquare size={18} />
                    <h3 className="review-title">Reviews</h3>
                    {reviews.length > 0 && (
                        <span className="review-count">{reviews.length}</span>
                    )}
                </div>
                {reviews.length > 0 && (
                    <div className="review-avg">
                        <StarRating rating={Math.round(avgRating)} size={14} />
                        <span className="review-avg-value">{avgRating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Success Message */}
            {submitted && (
                <div className="review-success nf-slide-up">
                    ✅ Review submitted successfully!
                </div>
            )}

            {/* Write Review Button / Form */}
            {!showForm ? (
                <button onClick={() => setShowForm(true)} className="review-write-btn">
                    <Send size={14} />
                    Write a Review
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="review-form nf-slide-up">
                    <p className="review-form-label">Rate {serviceName}</p>
                    <StarRating rating={newRating} onRate={setNewRating} size={28} interactive />
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Share your experience (optional)"
                        rows={3}
                        className="review-form-textarea"
                    />
                    <div className="review-form-actions">
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); }}
                            className="review-form-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || newRating === 0}
                            className="review-form-submit"
                        >
                            {submitting ? <Loader2 size={14} className="nf-spin" /> : <Send size={14} />}
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="review-loading">
                    <Loader2 size={18} className="nf-spin" />
                    <span>Loading reviews...</span>
                </div>
            ) : reviews.length === 0 ? (
                <div className="review-empty">
                    <p>No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <div className="review-list">
                    {reviews.map(review => (
                        <div key={review.id} className="review-item">
                            <div className="review-item-header">
                                <div className="review-item-avatar">
                                    <User size={14} />
                                </div>
                                <div className="review-item-meta">
                                    <span className="review-item-user">Anonymous User</span>
                                    <span className="review-item-date">{formatDate(review.created_at)}</span>
                                </div>
                                <div className="review-item-rating">
                                    <StarRating rating={review.rating} size={12} />
                                </div>
                            </div>
                            {review.comment && (
                                <p className="review-item-comment">{review.comment}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
