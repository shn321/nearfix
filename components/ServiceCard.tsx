'use client';

import { useState } from 'react';
import { Phone, Navigation, Star, MapPin, Clock, Send } from 'lucide-react';
import { formatDistance } from '@/lib/location';
import { formatPhone, getNavigationUrl } from '@/lib/utils';
import { HelpRequestModal } from './HelpRequestModal';
import { ReviewSection } from './ReviewSection';

interface ServiceCardProps {
    id: number;
    name: string;
    category: string;
    categoryLabel: string;
    address: string;
    phone: string;
    rating: number;
    distance: number;
    latitude: number;
    longitude: number;
    userLat?: number;
    userLng?: number;
}

export function ServiceCard({
    id,
    name,
    category,
    categoryLabel,
    address,
    phone,
    rating,
    distance,
    latitude,
    longitude,
    userLat,
    userLng,
}: ServiceCardProps) {
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showReviews, setShowReviews] = useState(false);

    // Estimate driving time (~30 km/h average for smaller roads)
    const estimatedMinutes = Math.round((distance / 30) * 60);
    const timeLabel = estimatedMinutes < 1 ? '< 1 min' : estimatedMinutes < 60 ? `~${estimatedMinutes} min` : `~${Math.round(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

    const handleNavigate = () => {
        const navUrl = getNavigationUrl(latitude, longitude);
        window.open(navUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <div className="svc-list-card">
                {/* Name & Distance */}
                <div className="svc-list-card-top">
                    <h3 className="svc-list-card-name">{name}</h3>
                    <div className="svc-list-card-dist">
                        <span className="svc-list-card-dist-value">
                            {formatDistance(distance)}
                        </span>
                        <span className="svc-list-card-time">
                            <Clock size={9} />
                            {timeLabel}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="svc-list-card-details">
                    <div className="svc-list-card-detail">
                        <MapPin size={14} className="svc-list-card-detail-icon" />
                        <span>{address}</span>
                    </div>
                    <div className="svc-list-card-detail">
                        <Phone size={14} className="svc-list-card-detail-icon" />
                        <span className="svc-list-card-phone">{formatPhone(phone)}</span>
                    </div>
                    <div className="svc-list-card-detail">
                        <Star size={14} className="svc-list-card-star" />
                        <span className="svc-list-card-rating">{rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="svc-list-card-actions">
                    <a href={`tel:${phone}`} className="svc-list-card-btn svc-list-card-btn-call">
                        <Phone size={15} />
                        Call
                    </a>
                    <button onClick={handleNavigate} className="svc-list-card-btn svc-list-card-btn-nav">
                        <Navigation size={15} />
                        Navigate
                    </button>
                </div>

                {/* Secondary Actions */}
                <div className="svc-list-card-secondary">
                    {userLat && userLng && (
                        <button
                            onClick={() => setShowHelpModal(true)}
                            className="svc-list-card-help-btn"
                        >
                            <Send size={13} />
                            Request Help
                        </button>
                    )}
                    <button
                        onClick={() => setShowReviews(!showReviews)}
                        className="svc-list-card-review-toggle"
                    >
                        💬 {showReviews ? 'Hide' : 'Show'} Reviews
                    </button>
                </div>

                {/* Review Section (collapsible) */}
                {showReviews && (
                    <ReviewSection serviceId={id} serviceName={name} />
                )}
            </div>

            {/* Help Request Modal */}
            {showHelpModal && userLat && userLng && (
                <HelpRequestModal
                    category={category}
                    categoryLabel={categoryLabel}
                    latitude={userLat}
                    longitude={userLng}
                    onClose={() => setShowHelpModal(false)}
                />
            )}
        </>
    );
}
