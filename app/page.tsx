'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '@/data/services';
import { ModuleCard } from '@/components/ModuleCard';
import { Loader2, MapPin, AlertCircle, RefreshCw, TriangleAlert, LocateFixed, CheckCircle2, Settings, ShieldAlert, WifiOff, Clock, X, Info } from 'lucide-react';
import { useLocation, type LocationErrorCode } from '@/lib/location';

// Region Boundaries
const MIN_LAT = 13.9000;
const MAX_LAT = 14.3500;
const MIN_LNG = 74.4000;
const MAX_LNG = 74.6000;

function isWithinServiceArea(lat: number, lng: number): boolean {
    return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}

/* ─── Error Modal ─── */

function getErrorConfig(code: LocationErrorCode, message: string | null) {
    switch (code) {
        case 'permission_denied':
            return {
                icon: <ShieldAlert size={36} />,
                title: 'Location Permission Required',
                body: message || 'Please allow location permission',
                color: '#DC2626',
                bgColor: '#FEF2F2',
                borderColor: '#FECACA',
                showSettings: true,
                settingsInstructions: 'Go to Browser Settings → Privacy → Location → Enable',
            };
        case 'position_unavailable':
            return {
                icon: <WifiOff size={36} />,
                title: 'Device Location is Off',
                body: message || 'Please enable device location',
                color: '#D97706',
                bgColor: '#FFFBEB',
                borderColor: '#FDE68A',
                showSettings: true,
                settingsInstructions: 'Go to your device Settings → Location → Turn On',
            };
        case 'timeout':
            return {
                icon: <Clock size={36} />,
                title: 'Location Detection Failed',
                body: message || 'Unable to detect location, try again',
                color: '#7C3AED',
                bgColor: '#F5F3FF',
                borderColor: '#DDD6FE',
                showSettings: false,
                settingsInstructions: '',
            };
        default:
            return {
                icon: <AlertCircle size={36} />,
                title: 'Location Error',
                body: message || 'Unable to detect location',
                color: '#DC2626',
                bgColor: '#FEF2F2',
                borderColor: '#FECACA',
                showSettings: false,
                settingsInstructions: '',
            };
    }
}

function LocationErrorModal({
    errorCode,
    errorMessage,
    onRetry,
    onDismiss,
}: {
    errorCode: LocationErrorCode;
    errorMessage: string | null;
    onRetry: () => void;
    onDismiss: () => void;
}) {
    const [showInstructions, setShowInstructions] = useState(false);
    const config = getErrorConfig(errorCode, errorMessage);

    const handleOpenSettings = () => {
        // Attempt to open device settings (Android intent URI)
        // This works on Android Chrome; elsewhere it falls back to showing instructions
        try {
            const isAndroid = /android/i.test(navigator.userAgent);
            if (isAndroid) {
                window.location.href = 'intent://settings/location#Intent;scheme=android.settings;end';
                return;
            }
        } catch {
            // Ignore — fallback below
        }
        // Fallback: show browser instructions
        setShowInstructions(true);
    };

    return (
        <div className="nf-modal-overlay" onClick={onDismiss}>
            <div className="nf-modal nf-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="nf-modal-close" onClick={onDismiss} aria-label="Close">
                    <X size={18} />
                </button>

                {/* Icon */}
                <div
                    className="nf-modal-icon"
                    style={{ color: config.color, background: `${config.color}1A` }}
                >
                    {config.icon}
                </div>

                {/* Title */}
                <h3 className="nf-modal-title" style={{ color: config.color }}>
                    {config.title}
                </h3>

                {/* Message */}
                <p className="nf-modal-body">{config.body}</p>

                {/* Instructions (shown after Open Settings click on unsupported platforms) */}
                {showInstructions && (
                    <div className="nf-modal-instructions nf-slide-up">
                        <Info size={16} />
                        <p>{config.settingsInstructions}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="nf-modal-actions">
                    {config.showSettings && !showInstructions && (
                        <button
                            onClick={handleOpenSettings}
                            className="nf-btn nf-modal-btn-settings"
                            style={{
                                borderColor: config.color,
                                color: config.color,
                            }}
                        >
                            <Settings size={16} />
                            Open Settings
                        </button>
                    )}
                    <button onClick={onRetry} className="nf-btn nf-btn-primary nf-modal-btn-retry">
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */

export default function HomePage() {
    const { phase, location, error: locationError, errorCode, loadingMessage, startDetection } = useLocation();
    const [showErrorModal, setShowErrorModal] = useState(false);

    const [city, setCity] = useState<string | null>(null);
    const cityCache = useRef<{ lat: number; lng: number; city: string } | null>(null);

    // Show modal whenever an error occurs
    useEffect(() => {
        if (phase === 'error') {
            setShowErrorModal(true);
        }
    }, [phase]);

    // Reverse-geocode once we have an accurate location
    useEffect(() => {
        if (!location) return;
        if (!isWithinServiceArea(location.lat, location.lng)) return;

        const cached = cityCache.current;
        if (cached && Math.abs(cached.lat - location.lat) < 0.005 && Math.abs(cached.lng - location.lng) < 0.005) {
            setCity(cached.city);
            return;
        }

        (async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=10&accept-language=en`
                );
                if (res.ok) {
                    const data = await res.json();
                    const name =
                        data.address?.village ||
                        data.address?.town ||
                        data.address?.city ||
                        data.address?.county ||
                        'Your Area';
                    cityCache.current = { lat: location.lat, lng: location.lng, city: name };
                    setCity(name);
                }
            } catch {
                setCity(cityCache.current?.city || 'Your Area');
            }
        })();
    }, [location]);

    const isWithinBounds = location ? isWithinServiceArea(location.lat, location.lng) : null;
    const locationReady = phase === 'done' && location && isWithinBounds;

    const handleRetry = () => {
        setShowErrorModal(false);
        startDetection(true);
    };

    return (
        <div className="nf-page">
            {/* ─── Error Modal Popup ─── */}
            {showErrorModal && phase === 'error' && (
                <LocationErrorModal
                    errorCode={errorCode}
                    errorMessage={locationError}
                    onRetry={handleRetry}
                    onDismiss={() => setShowErrorModal(false)}
                />
            )}

            {/* ─── Hero Section ─── */}
            <div className="nf-hero nf-fade-in">
                <div className="nf-hero-icon">
                    <MapPin size={32} strokeWidth={2.5} />
                </div>
                <h1 className="nf-title">
                    Near<span className="nf-accent">Fix</span>
                </h1>
                <p className="nf-subtitle">
                    Find nearby services instantly
                </p>
                <p className="nf-region-tag">
                    <MapPin size={12} />
                    Honnavar — Bhatkal region
                </p>
            </div>

            {/* ─── Landing State / Error fallback: Enable Location Button ─── */}
            {(phase === 'idle' || (phase === 'error' && !showErrorModal)) && (
                <div className="nf-card nf-location-card nf-slide-up">
                    <div className="nf-location-icon-ring">
                        <LocateFixed size={36} className="nf-pulse-icon" />
                    </div>
                    <p className="nf-card-label">
                        {phase === 'error'
                            ? 'Location detection failed. Please try again.'
                            : 'Enable location to find nearby services'}
                    </p>
                    <button
                        onClick={() => startDetection(true)}
                        className="nf-btn nf-btn-primary"
                        id="enable-location-btn"
                    >
                        <MapPin size={18} />
                        {phase === 'error' ? 'Try Again' : 'Enable Location'}
                    </button>
                    <p className="nf-hint">
                        We use GPS to show services closest to you
                    </p>
                </div>
            )}

            {/* ─── Detecting State ─── */}
            {phase === 'detecting' && (
                <div className="nf-card nf-location-card nf-slide-up">
                    <div className="nf-detecting-ring">
                        <div className="nf-ring-pulse" />
                        <div className="nf-ring-pulse nf-ring-pulse-2" />
                        <Loader2 size={32} className="nf-spin" />
                    </div>
                    <p className="nf-card-label nf-detecting-text">
                        {loadingMessage}
                    </p>
                    <div className="nf-detecting-dots">
                        <span /><span /><span />
                    </div>
                </div>
            )}

            {/* ─── Out of Bounds ─── */}
            {phase === 'done' && isWithinBounds === false && (
                <div className="nf-card nf-warning-card nf-slide-up">
                    <TriangleAlert size={28} className="nf-warning-icon" />
                    <h3 className="nf-warning-title">Out of Service Area</h3>
                    <p className="nf-warning-text">
                        NearFix is currently available only in the<br />
                        <strong>Honnavar to Bhatkal</strong> region.
                    </p>
                    <p className="nf-coords-small">
                        Your location: {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                    </p>
                    <button
                        onClick={() => startDetection(true)}
                        className="nf-btn nf-btn-outline-warning"
                    >
                        <RefreshCw size={14} />
                        Check Again
                    </button>
                </div>
            )}

            {/* ─── Location Detected ─── */}
            {locationReady && (
                <div className="nf-card nf-success-card nf-slide-up">
                    <div className="nf-success-header">
                        <CheckCircle2 size={22} className="nf-success-icon" />
                        <span>Location detected</span>
                    </div>
                    <div className="nf-location-details">
                        <a
                            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nf-area-name"
                        >
                            📍 {city || 'Your Area'}
                        </a>
                        <div className="nf-coords-grid">
                            <div className="nf-coord-item">
                                <span className="nf-coord-label">Latitude</span>
                                <span className="nf-coord-value">{location.lat.toFixed(6)}</span>
                            </div>
                            <div className="nf-coord-item">
                                <span className="nf-coord-label">Longitude</span>
                                <span className="nf-coord-value">{location.lng.toFixed(6)}</span>
                            </div>
                            <div className="nf-coord-item nf-coord-full">
                                <span className="nf-coord-label">Accuracy</span>
                                <span className="nf-coord-value">{Math.round(location.accuracy)} meters</span>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nf-verify-link"
                        >
                            Verify on Google Maps →
                        </a>
                        <button
                            onClick={() => startDetection(true)}
                            className="nf-btn nf-btn-outline-refresh"
                            id="refresh-location-btn"
                        >
                            <RefreshCw size={14} />
                            Refresh Location
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Service Categories ─── */}
            {locationReady && (
                <div className="nf-categories nf-slide-up-delay">
                    <h2 className="nf-categories-title">
                        <span className="nf-title-bar" />
                        What do you need?
                    </h2>
                    <div className="nf-categories-grid">
                        {CATEGORIES.map((cat) => (
                            <ModuleCard
                                key={cat.key}
                                categoryKey={cat.key}
                                label={cat.label}
                                icon={cat.icon}
                                color={cat.color}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Footer ─── */}
            <footer className="nf-footer">
                <p>Services available within Honnavar – Bhatkal region</p>
            </footer>
        </div>
    );
}
