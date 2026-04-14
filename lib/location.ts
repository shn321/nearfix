import { useState, useEffect, useRef, useCallback } from 'react';

export interface UserLocation {
    lat: number;
    lng: number;
    accuracy: number;
}

/** Accuracy threshold in meters — location is "ready" only when below this */
const ACCURACY_THRESHOLD = 500;

/** Maximum retry attempts if accuracy stays poor */
const MAX_RETRIES = 3;

/** localStorage key for caching detected coordinates */
const LOCATION_STORAGE_KEY = 'nearfix_location';

/** Cache TTL in milliseconds (10 minutes) */
const CACHE_TTL = 10 * 60 * 1000;

type LocationPhase = 'idle' | 'detecting' | 'done' | 'error';

export type LocationErrorCode = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | null;

interface CachedLocation {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

/**
 * Try to load a cached location from localStorage.
 * Returns null if no cache exists or if the cache is expired.
 */
function loadCachedLocation(): UserLocation | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (!raw) return null;
        const cached: CachedLocation = JSON.parse(raw);
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            localStorage.removeItem(LOCATION_STORAGE_KEY);
            return null;
        }
        return { lat: cached.lat, lng: cached.lng, accuracy: cached.accuracy };
    } catch {
        return null;
    }
}

/**
 * Save location to localStorage with a timestamp.
 */
function saveCachedLocation(loc: UserLocation): void {
    if (typeof window === 'undefined') return;
    try {
        const cached: CachedLocation = {
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            timestamp: Date.now(),
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cached));
    } catch {
        // Ignore storage errors
    }
}

/**
 * High-accuracy location hook — detect once, store, reuse.
 *
 * Uses getCurrentPosition instead of watchPosition so coordinates
 * do NOT change continuously. Location is detected once and stored
 * in both React state and localStorage.
 *
 * Call `startDetection()` to begin or refresh — this is the ONLY way
 * to trigger a new GPS reading.
 *
 * Flow after startDetection():
 *  1. Call getCurrentPosition() with enableHighAccuracy: true.
 *  2. If accuracy meets threshold, accept immediately.
 *  3. If accuracy is poor, retry up to MAX_RETRIES times.
 *  4. After all retries, accept the best reading obtained.
 *  5. Store the final coordinates — no further GPS calls.
 */
export function useLocation() {
    const [phase, setPhase] = useState<LocationPhase>('idle');
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<LocationErrorCode>(null);
    const [loadingMessage, setLoadingMessage] = useState('Detecting your location...');

    const retryCountRef = useRef(0);
    const bestReadingRef = useRef<UserLocation | null>(null);
    const detectionActiveRef = useRef(false);

    /**
     * Accept a GPS reading as the final location.
     * Stores in state + localStorage, marks detection as done.
     */
    const acceptReading = useCallback((reading: UserLocation) => {
        detectionActiveRef.current = false;
        setLocation(reading);
        setPhase('done');
        setError(null);
        setErrorCode(null);
        saveCachedLocation(reading);
    }, []);

    /**
     * Perform a single getCurrentPosition attempt.
     * Retries up to MAX_RETRIES times for better accuracy.
     */
    const attemptGetPosition = useCallback(() => {
        if (!detectionActiveRef.current) return;

        const attempt = retryCountRef.current + 1;
        setLoadingMessage(
            attempt === 1
                ? 'Detecting your location...'
                : `Refining accuracy (attempt ${attempt}/${MAX_RETRIES})...`
        );

        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!detectionActiveRef.current) return;

                const reading: UserLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };

                // Track the best reading across attempts
                if (!bestReadingRef.current || reading.accuracy < bestReadingRef.current.accuracy) {
                    bestReadingRef.current = reading;
                }

                // If accuracy is good enough OR we've exhausted retries, accept
                if (reading.accuracy <= ACCURACY_THRESHOLD || retryCountRef.current >= MAX_RETRIES - 1) {
                    acceptReading(bestReadingRef.current!);
                } else {
                    // Try again for better accuracy
                    retryCountRef.current += 1;
                    attemptGetPosition();
                }
            },
            (err) => {
                if (!detectionActiveRef.current) return;

                // If we have a best reading from a previous attempt, use it
                if (bestReadingRef.current) {
                    acceptReading(bestReadingRef.current);
                    return;
                }

                let message = 'Unable to detect location.';
                let code: LocationErrorCode = null;
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        message = 'Please allow location permission';
                        code = 'permission_denied';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        message = 'Location is turned off. Please enable location from your device settings.';
                        code = 'position_unavailable';
                        break;
                    case err.TIMEOUT:
                        message = 'Unable to detect location, try again';
                        code = 'timeout';
                        break;
                }

                detectionActiveRef.current = false;
                setError(message);
                setErrorCode(code);
                setPhase('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, [acceptReading]);

    /**
     * Call this to begin GPS detection (or refresh).
     * @param skipCache — if true, ignore localStorage cache and force fresh GPS detection.
     *                    Use true for user-initiated button clicks (shows loading animation).
     *                    Use false/default for silent cache loading (e.g. category page mount).
     */
    const startDetection = useCallback((skipCache = false) => {
        // Check cache first — use it if valid (no GPS call needed)
        if (!skipCache) {
            const cached = loadCachedLocation();
            if (cached) {
                setLocation(cached);
                setPhase('done');
                setError(null);
                setErrorCode(null);
                return;
            }
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setErrorCode('unsupported');
            setPhase('error');
            return;
        }

        // Reset everything for a fresh detection
        retryCountRef.current = 0;
        bestReadingRef.current = null;
        detectionActiveRef.current = true;

        setPhase('detecting');
        setError(null);
        setErrorCode(null);
        setLoadingMessage('Detecting your location...');

        // Single getCurrentPosition call — triggers browser permission popup
        // then starts accuracy refinement attempts
        navigator.geolocation.getCurrentPosition(
            () => {
                // Permission granted — start accuracy refinement
                setLoadingMessage('Detecting your location...');
                attemptGetPosition();
            },
            (err) => {
                let message = 'Unable to detect location.';
                let code: LocationErrorCode = null;
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        message = 'Please allow location permission';
                        code = 'permission_denied';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        message = 'Location is turned off. Please enable location from your device settings.';
                        code = 'position_unavailable';
                        break;
                    case err.TIMEOUT:
                        message = 'Unable to detect location, try again';
                        code = 'timeout';
                        break;
                }
                detectionActiveRef.current = false;
                setError(message);
                setErrorCode(code);
                setPhase('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, [attemptGetPosition]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            detectionActiveRef.current = false;
        };
    }, []);

    const loading = phase === 'detecting';

    return { phase, location, error, errorCode, loading, loadingMessage, startDetection };
}

/**
 * Get user's current position as a one-shot promise.
 * Retries up to MAX_RETRIES times to obtain accuracy < ACCURACY_THRESHOLD.
 */
export function getCurrentPosition(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        let attempts = 0;
        let bestReading: UserLocation | null = null;

        function attempt() {
            attempts += 1;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const reading: UserLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    };

                    if (!bestReading || reading.accuracy < bestReading.accuracy) {
                        bestReading = reading;
                    }

                    if (reading.accuracy <= ACCURACY_THRESHOLD || attempts >= MAX_RETRIES) {
                        resolve(bestReading!);
                    } else {
                        setTimeout(attempt, 1000);
                    }
                },
                (err) => {
                    if (bestReading) {
                        resolve(bestReading);
                        return;
                    }

                    let message = 'Unable to detect location.';
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            message = 'Please enable location access to navigate.';
                            break;
                        case err.POSITION_UNAVAILABLE:
                            message = 'Location unavailable. Check GPS settings.';
                            break;
                        case err.TIMEOUT:
                            message = 'Location request timed out. Try again.';
                            break;
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            );
        }

        attempt();
    });
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}
