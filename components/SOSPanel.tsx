'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Phone, Navigation, MapPin, Share2, Shield, Heart, Loader2, AlertTriangle } from 'lucide-react';
import { useLocation, calculateDistance } from '@/lib/location';
import { type Service } from '@/data/services';

/** Emergency numbers (India) */
const EMERGENCY_NUMBERS = [
    { label: 'Emergency', number: '112', icon: '🚨', desc: 'All emergencies' },
    { label: 'Ambulance', number: '108', icon: '🚑', desc: 'Medical emergency' },
    { label: 'Police', number: '100', icon: '🚔', desc: 'Police control room' },
    { label: 'Fire', number: '101', icon: '🚒', desc: 'Fire department' },
    { label: 'Women Helpline', number: '1091', icon: '👩', desc: '24/7 women helpline' },
];

interface NearestService {
    service: Service;
    distance: number;
}

export function SOSPanel({ onClose }: { onClose: () => void }) {
    const { location, phase, startDetection } = useLocation();
    const [nearestHospital, setNearestHospital] = useState<NearestService | null>(null);
    const [nearestPolice, setNearestPolice] = useState<NearestService | null>(null);
    const [loading, setLoading] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);

    // Start location detection on mount
    useEffect(() => {
        if (phase === 'idle') {
            startDetection();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch nearest hospital and police when location is ready
    const fetchNearest = useCallback(async () => {
        if (!location) return;
        setLoading(true);

        try {
            const [hospitalRes, policeRes] = await Promise.all([
                fetch(`/api/services/nearby?category=hospital&lat=${location.lat}&lng=${location.lng}`),
                fetch(`/api/services/nearby?category=police&lat=${location.lat}&lng=${location.lng}`),
            ]);

            if (hospitalRes.ok) {
                const hospitals: Service[] = await hospitalRes.json();
                if (hospitals.length > 0) {
                    const sorted = hospitals
                        .map(s => ({ service: s, distance: calculateDistance(location.lat, location.lng, s.latitude, s.longitude) }))
                        .sort((a, b) => a.distance - b.distance);
                    setNearestHospital(sorted[0]);
                }
            }

            if (policeRes.ok) {
                const police: Service[] = await policeRes.json();
                if (police.length > 0) {
                    const sorted = police
                        .map(s => ({ service: s, distance: calculateDistance(location.lat, location.lng, s.latitude, s.longitude) }))
                        .sort((a, b) => a.distance - b.distance);
                    setNearestPolice(sorted[0]);
                }
            }
        } catch {
            // Silently fail — emergency numbers are always available
        } finally {
            setLoading(false);
        }
    }, [location]);

    useEffect(() => {
        if (phase === 'done' && location) {
            fetchNearest();
        }
    }, [phase, location, fetchNearest]);

    const handleShareLocation = async () => {
        if (!location) return;

        const message = `🆘 EMERGENCY — I need help!\n\n📍 My Location:\nhttps://www.google.com/maps?q=${location.lat},${location.lng}\n\nCoordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n\nSent via NearFix SOS`;

        // Try Web Share API first (works on mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '🆘 NearFix SOS — Emergency Location',
                    text: message,
                });
                setShareStatus('Location shared!');
                setTimeout(() => setShareStatus(null), 3000);
                return;
            } catch {
                // User cancelled or unsupported
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(message);
            setShareStatus('Copied to clipboard!');
            setTimeout(() => setShareStatus(null), 3000);
        } catch {
            // Last resort: Open WhatsApp
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const formatDist = (km: number) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

    return (
        <div className="sos-overlay" onClick={onClose}>
            <div className="sos-panel nf-slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sos-header">
                    <div className="sos-header-icon">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h2 className="sos-title">Emergency SOS</h2>
                        <p className="sos-subtitle">Tap to call or navigate instantly</p>
                    </div>
                    <button onClick={onClose} className="sos-close" aria-label="Close SOS">
                        <X size={20} />
                    </button>
                </div>

                {/* Emergency Numbers */}
                <div className="sos-section">
                    <h3 className="sos-section-title">📞 Emergency Numbers</h3>
                    <div className="sos-numbers-grid">
                        {EMERGENCY_NUMBERS.map(item => (
                            <a
                                key={item.number}
                                href={`tel:${item.number}`}
                                className="sos-number-card"
                            >
                                <span className="sos-number-icon">{item.icon}</span>
                                <div className="sos-number-info">
                                    <span className="sos-number-label">{item.label}</span>
                                    <span className="sos-number-value">{item.number}</span>
                                </div>
                                <Phone size={16} className="sos-number-phone" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Nearest Services */}
                <div className="sos-section">
                    <h3 className="sos-section-title">📍 Nearest Emergency Services</h3>

                    {phase === 'detecting' && (
                        <div className="sos-detecting">
                            <Loader2 size={20} className="nf-spin" />
                            <span>Detecting your location...</span>
                        </div>
                    )}

                    {loading && phase === 'done' && (
                        <div className="sos-detecting">
                            <Loader2 size={20} className="nf-spin" />
                            <span>Finding nearest services...</span>
                        </div>
                    )}

                    {!loading && phase === 'done' && (
                        <div className="sos-services">
                            {/* Nearest Hospital */}
                            {nearestHospital ? (
                                <div className="sos-service-card sos-service-hospital">
                                    <div className="sos-service-header">
                                        <Heart size={18} className="sos-service-icon-hospital" />
                                        <div className="sos-service-info">
                                            <span className="sos-service-tag">Nearest Hospital</span>
                                            <span className="sos-service-name">{nearestHospital.service.name}</span>
                                            <span className="sos-service-dist">
                                                <MapPin size={12} /> {formatDist(nearestHospital.distance)} away
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sos-service-actions">
                                        <a href={`tel:${nearestHospital.service.phone}`} className="sos-action-btn sos-action-call">
                                            <Phone size={14} /> Call
                                        </a>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${nearestHospital.service.latitude},${nearestHospital.service.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="sos-action-btn sos-action-navigate"
                                        >
                                            <Navigation size={14} /> Navigate
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-no-service">
                                    <Heart size={16} /> No hospitals found nearby — call <strong>108</strong>
                                </div>
                            )}

                            {/* Nearest Police */}
                            {nearestPolice ? (
                                <div className="sos-service-card sos-service-police">
                                    <div className="sos-service-header">
                                        <Shield size={18} className="sos-service-icon-police" />
                                        <div className="sos-service-info">
                                            <span className="sos-service-tag">Nearest Police Station</span>
                                            <span className="sos-service-name">{nearestPolice.service.name}</span>
                                            <span className="sos-service-dist">
                                                <MapPin size={12} /> {formatDist(nearestPolice.distance)} away
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sos-service-actions">
                                        <a href={`tel:${nearestPolice.service.phone}`} className="sos-action-btn sos-action-call">
                                            <Phone size={14} /> Call
                                        </a>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${nearestPolice.service.latitude},${nearestPolice.service.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="sos-action-btn sos-action-navigate"
                                        >
                                            <Navigation size={14} /> Navigate
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-no-service">
                                    <Shield size={16} /> No police station found nearby — call <strong>100</strong>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'error' && (
                        <div className="sos-no-service">
                            <AlertTriangle size={16} /> Location unavailable — use emergency numbers above
                        </div>
                    )}
                </div>

                {/* Share Location */}
                {location && (
                    <div className="sos-section">
                        <button onClick={handleShareLocation} className="sos-share-btn">
                            <Share2 size={18} />
                            {shareStatus || 'Share My Location'}
                        </button>
                        <p className="sos-share-hint">
                            Send your GPS coordinates via WhatsApp, SMS, or clipboard
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
