'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRate?: (rating: number) => void;
    size?: number;
    interactive?: boolean;
}

export function StarRating({ rating, onRate, size = 20, interactive = false }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const displayRating = hoverRating || rating;

    return (
        <div
            className="star-rating"
            onMouseLeave={() => interactive && setHoverRating(0)}
        >
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    className={`star-rating-btn ${interactive ? 'star-rating-interactive' : ''}`}
                    onClick={() => interactive && onRate?.(star)}
                    onMouseEnter={() => interactive && setHoverRating(star)}
                    disabled={!interactive}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                    <Star
                        size={size}
                        className={`star-rating-icon ${star <= displayRating ? 'star-filled' : 'star-empty'}`}
                    />
                </button>
            ))}
        </div>
    );
}
