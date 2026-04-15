'use client';

import { use, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Map as MapIcon, List, Navigation, MapPin, LocateFixed } from 'lucide-react';
import { useLocation, calculateDistance } from '@/lib/location';
import { getServicesByCategory } from '@/lib/serviceStore';
import { CATEGORIES, type Service } from '@/data/services';
import { ServiceCard } from '@/components/ServiceCard';

const DISTANCE_OPTIONS = [2, 5, 10, 20, 50];

interface ServiceWithDistance extends Service {
    dist: number;
}

export default function ServiceCategoryPage({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = use(params);
    const { location, loading: locationLoading, loadingMessage, startDetection, phase } = useLocation();
    const [services, setServices] = useState<Service[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [maxDistance, setMaxDistance] = useState(20);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const catConfig = CATEGORIES.find((c) => c.key === category);

    // On mount, load the cached location from localStorage (set on home page).
    useEffect(() => {
        if (phase === 'idle' && !location) {
            startDetection();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Track what we last fetched to avoid redundant requests
    const lastFetchKeyRef = useRef<string>('');

    // Load services ONCE after location is resolved (or when category/distance changes)
    useEffect(() => {
        const locKey = location ? `${location.lat.toFixed(6)},${location.lng.toFixed(6)}` : 'none';
        const fetchKey = `${category}|${locKey}|${maxDistance}`;

        if (fetchKey === lastFetchKeyRef.current) return;

        async function loadServices() {
            setServicesLoading(true);
            try {
                let finalData: Service[] = [];

                if (location) {
                    const apiUrl = `/api/services/nearby?category=${encodeURIComponent(category)}&lat=${location.lat}&lng=${location.lng}`;
                    const res = await fetch(apiUrl);
                    if (res.ok) {
                        const osmData = await res.json();
                        finalData = osmData;
                    } else {
                        console.warn(`[NearFix] OSM API returned status ${res.status}`);
                    }
                }

                if (finalData.length === 0) {
                    finalData = await getServicesByCategory(category);
                }

                setServices(finalData);
                lastFetchKeyRef.current = fetchKey;
            } catch (error) {
                console.error("Error loading services:", error);
                const fallbackData = await getServicesByCategory(category);
                setServices(fallbackData);
                lastFetchKeyRef.current = fetchKey;
            } finally {
                setServicesLoading(false);
            }
        }

        if (!locationLoading) {
            loadServices();
        }
    }, [category, location, locationLoading, maxDistance]);

    // Sort by distance from user
    const sortedServices: ServiceWithDistance[] = useMemo(() => {
        if (!location) {
            return services.map((s) => ({ ...s, dist: 0 }));
        }
        return [...services]
            .map((s) => ({
                ...s,
                dist: calculateDistance(location.lat, location.lng, s.latitude, s.longitude),
            }))
            .filter((s) => s.dist <= maxDistance)
            .sort((a, b) => a.dist - b.dist);
    }, [services, location, maxDistance]);

    const nearestService = sortedServices.length > 0 ? sortedServices[0] : null;
    const isLoading = locationLoading || servicesLoading;

    if (!catConfig) {
        return (
            <div className="cat-page-empty">
                <p className="cat-page-empty-icon">❌</p>
                <h2 className="cat-page-empty-title">Category Not Found</h2>
                <Link href="/" className="cat-page-empty-link">← Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="cat-page">
            <div className="cat-page-inner">
                {/* Header */}
                <div className="cat-page-header nf-fade-in">
                    <Link href="/" className="cat-page-back">
                        <ArrowLeft size={17} />
                    </Link>
                    <span className="cat-page-icon">{catConfig.icon}</span>
                    <h1 className="cat-page-title">{catConfig.label}</h1>
                    {!isLoading && (
                        <span
                            className="cat-page-count"
                            style={{ color: catConfig.color, backgroundColor: `${catConfig.color}15` }}
                        >
                            {sortedServices.length} found
                        </span>
                    )}
                </div>

                {/* Distance Filter + View Toggle */}
                <div className="cat-page-controls nf-fade-in">
                    <div className="cat-page-filters">
                        <span className="cat-page-filter-label">Range:</span>
                        {DISTANCE_OPTIONS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setMaxDistance(d)}
                                className={`cat-page-filter-btn ${maxDistance === d ? 'cat-page-filter-active' : ''}`}
                            >
                                {d} km
                            </button>
                        ))}
                    </div>
                    <div className="cat-page-view-toggle">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`cat-page-view-btn ${viewMode === 'list' ? 'cat-page-view-active' : ''}`}
                            title="List view"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`cat-page-view-btn ${viewMode === 'map' ? 'cat-page-view-active' : ''}`}
                            title="Map view"
                        >
                            <MapIcon size={16} />
                        </button>
                    </div>
                </div>

                {/* Nearest Service Banner */}
                {!isLoading && nearestService && (
                    <div className="cat-page-nearest nf-slide-up">
                        <div className="cat-page-nearest-content">
                            <div className="cat-page-nearest-info">
                                <p className="cat-page-nearest-tag">⚡ Nearest Service</p>
                                <h3 className="cat-page-nearest-name">{nearestService.name}</h3>
                                <p className="cat-page-nearest-address">{nearestService.address}</p>
                                <p className="cat-page-nearest-meta">
                                    📍 {nearestService.dist < 1 ? `${Math.round(nearestService.dist * 1000)} meters` : `${nearestService.dist.toFixed(1)} km`} away
                                    &nbsp;·&nbsp; ⭐ {nearestService.rating.toFixed(1)}
                                </p>
                            </div>
                            <div className="cat-page-nearest-actions">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearestService.name + ' ' + nearestService.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cat-page-nearest-btn cat-page-nearest-btn-nav"
                                >
                                    <Navigation size={14} />
                                    🗺️ Navigate
                                </a>
                                <a
                                    href={`tel:${nearestService.phone}`}
                                    className="cat-page-nearest-btn cat-page-nearest-btn-call"
                                >
                                    📞 Call
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enable Location Prompt */}
                {phase === 'idle' && !location && (
                    <div className="cat-page-prompt nf-slide-up">
                        <div className="cat-page-prompt-icon">
                            <LocateFixed size={32} />
                        </div>
                        <p className="cat-page-prompt-text">
                            Enable location to find nearby {catConfig.label.toLowerCase()}
                        </p>
                        <button onClick={() => startDetection()} className="nf-btn nf-btn-primary cat-page-prompt-btn">
                            <MapPin size={18} />
                            Enable Location
                        </button>
                        <p className="cat-page-prompt-hint">We use GPS to show services closest to you</p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="cat-page-loading">
                        <Loader2 size={24} className="nf-spin" style={{ color: '#FF5C00' }} />
                        <p className="cat-page-loading-text">
                            {locationLoading ? loadingMessage : 'Fetching nearby services...'}
                        </p>
                    </div>
                )}

                {/* No results */}
                {!isLoading && sortedServices.length === 0 && (
                    <div className="cat-page-empty-results">
                        <p className="cat-page-empty-results-icon">📍</p>
                        <h3 className="cat-page-empty-results-title">No services nearby</h3>
                        <p className="cat-page-empty-results-text">
                            No {catConfig.label.toLowerCase()} found within {maxDistance} km of your location.
                        </p>
                        <p className="cat-page-empty-results-hint">Try increasing the range filter above.</p>
                    </div>
                )}

                {/* Map View */}
                {!isLoading && viewMode === 'map' && sortedServices.length > 0 && (
                    <div className="cat-page-map nf-slide-up">
                        <iframe
                            title="Nearby Services Map"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={
                                location
                                    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.05
                                    },${location.lat - 0.03},${location.lng + 0.05},${location.lat + 0.03
                                    }&layer=mapnik&marker=${location.lat},${location.lng}`
                                    : ''
                            }
                        />
                        <div className="cat-page-map-pins">
                            <p className="cat-page-map-pins-label">📍 Click to navigate:</p>
                            <div className="cat-page-map-pins-list">
                                {sortedServices.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' ' + s.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="cat-page-map-pin"
                                    >
                                        <Navigation size={10} />
                                        <span className="cat-page-map-pin-name">{s.name}</span>
                                        <span className="cat-page-map-pin-dist">
                                            {s.dist < 1 ? `${Math.round(s.dist * 1000)}m` : `${s.dist.toFixed(1)}km`}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* List View */}
                {!isLoading && viewMode === 'list' && sortedServices.length > 0 && (
                    <div className="cat-page-list nf-slide-up">
                        {sortedServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                id={service.id}
                                name={service.name}
                                category={category}
                                categoryLabel={catConfig.label}
                                address={service.address}
                                phone={service.phone}
                                rating={service.rating}
                                distance={service.dist}
                                latitude={service.latitude}
                                longitude={service.longitude}
                                userLat={location?.lat}
                                userLng={location?.lng}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
