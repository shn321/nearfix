'use client';

import { use, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Map as MapIcon, List, Navigation, MapPin, LocateFixed } from 'lucide-react';
import { useLocation, calculateDistance } from '@/lib/location';
import { getServicesByCategory } from '@/lib/serviceStore';
import { CATEGORIES, type Service } from '@/data/services';
import { ServiceCard } from '@/components/ServiceCard';

const DISTANCE_OPTIONS = [2, 5, 10, 20, 50];

/** Inline navigate button for the "Nearest Service" banner */
function BannerNavigateButton({
    name,
    address,
}: {
    name: string;
    address: string;
}) {
    const handleNavigate = () => {
        const query = encodeURIComponent(`${name} ${address}`);
        const navUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(navUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF5C00] text-white text-sm font-semibold hover:bg-[#e85400] active:scale-[0.97] transition-all shadow-sm"
        >
            <Navigation size={14} />
            🗺️ Navigate
        </button>
    );
}

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
    // startDetection() checks cache first — if valid, no GPS call is made.
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
        // Build a key for the current fetch parameters
        const locKey = location ? `${location.lat.toFixed(6)},${location.lng.toFixed(6)}` : 'none';
        const fetchKey = `${category}|${locKey}|${maxDistance}`;

        // Skip if we already fetched for these exact parameters
        if (fetchKey === lastFetchKeyRef.current) return;

        async function loadServices() {
            setServicesLoading(true);
            try {
                let finalData: Service[] = [];

                // If we have GPS location, fetch real data from OSM via server API
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

                // Fallback to local database if OSM fails or location is not provided
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

        // Wait for location to be resolved before fetching
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

    // Nearest service
    const nearestService = sortedServices.length > 0 ? sortedServices[0] : null;

    const isLoading = locationLoading || servicesLoading;

    if (!catConfig) {
        return (
            <div className="flex justify-center px-6 py-16">
                <div className="text-center">
                    <p className="text-4xl mb-3">❌</p>
                    <h2 className="font-bold text-gray-900 text-xl mb-2">Category Not Found</h2>
                    <Link href="/" className="text-[#FF5C00] font-medium hover:underline">← Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center px-6 py-6">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <Link
                        href="/"
                        className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={17} />
                    </Link>
                    <span className="text-2xl">{catConfig.icon}</span>
                    <h1 className="font-bold text-gray-900 text-xl">{catConfig.label}</h1>
                    {!isLoading && (
                        <span
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-full ml-1"
                            style={{ color: catConfig.color, backgroundColor: `${catConfig.color}15` }}
                        >
                            {sortedServices.length} found
                        </span>
                    )}
                </div>

                {/* Distance Filter + View Toggle */}
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Range:</span>
                        {DISTANCE_OPTIONS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setMaxDistance(d)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${maxDistance === d
                                    ? 'bg-[#FF5C00] text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {d} km
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#FF5C00] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            title="List view"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-2 transition-colors ${viewMode === 'map' ? 'bg-[#FF5C00] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            title="Map view"
                        >
                            <MapIcon size={16} />
                        </button>
                    </div>
                </div>

                {/* Nearest Service Banner */}
                {!isLoading && nearestService && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-[#FF5C00]/10 to-orange-50 border border-[#FF5C00]/20">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#FF5C00] font-semibold mb-0.5 uppercase tracking-wide">⚡ Nearest Service</p>
                                <h3 className="font-bold text-gray-900 text-base truncate">{nearestService.name}</h3>
                                <p className="text-sm text-gray-600 truncate">{nearestService.address}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    📍 {nearestService.dist < 1 ? `${Math.round(nearestService.dist * 1000)} meters` : `${nearestService.dist.toFixed(1)} km`} away
                                    &nbsp;·&nbsp; ⭐ {nearestService.rating.toFixed(1)}
                                </p>
                            </div>
                            <BannerNavigateButton
                                name={nearestService.name}
                                address={nearestService.address}
                            />
                            <a
                                href={`tel:${nearestService.phone}`}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 active:scale-[0.97] transition-all shadow-sm"
                            >
                                📞 Call
                            </a>
                            </div>
                        </div>
                )}

                {/* Enable Location Prompt */}
                {phase === 'idle' && !location && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FF5C00]/10 flex items-center justify-center">
                            <LocateFixed size={32} className="text-[#FF5C00]" />
                        </div>
                        <p className="text-gray-600 text-sm font-medium text-center">
                            Enable location to find nearby {catConfig.label.toLowerCase()}
                        </p>
                        <button
                            onClick={() => startDetection()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5C00] text-white font-semibold hover:bg-[#e85400] active:scale-[0.97] transition-all shadow-sm"
                        >
                            <MapPin size={18} />
                            Enable Location
                        </button>
                        <p className="text-gray-400 text-xs">We use GPS to show services closest to you</p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 size={24} className="animate-spin text-[#FF5C00]" />
                        <p className="text-gray-500 text-sm font-medium">
                            {locationLoading ? loadingMessage : 'Fetching nearby services...'}
                        </p>
                    </div>
                )}

                {/* No results */}
                {!isLoading && sortedServices.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">📍</p>
                        <h3 className="font-bold text-gray-900 mb-1">No services nearby</h3>
                        <p className="text-gray-500 text-sm">
                            No {catConfig.label.toLowerCase()} found within {maxDistance} km of your location.
                        </p>
                        <p className="text-gray-400 text-xs mt-2">Try increasing the range filter above.</p>
                    </div>
                )}

                {/* Map View */}
                {!isLoading && viewMode === 'map' && sortedServices.length > 0 && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        {/* OpenStreetMap with all service markers */}
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
                        {/* Service pins as links below the map */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2 font-medium">📍 Click to navigate:</p>
                            <div className="flex flex-wrap gap-2">
                                {sortedServices.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' ' + s.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-colors"
                                    >
                                        <Navigation size={10} />
                                        <span className="font-medium truncate max-w-[150px]">{s.name}</span>
                                        <span className="text-gray-400">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                name={service.name}
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
