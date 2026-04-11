import { useState, useEffect, useRef, useCallback } from 'react';

export interface UserLocation {
    lat: number;
    lng: number;
    accuracy: number;
}

/** Accuracy threshold in meters — location is "ready" only when below this */
const ACCURACY_THRESHOLD = 500;

/** Maximum retry cycles if accuracy stays poor */
const MAX_RETRIES = 3;

/** How long to wait for an accurate fix per attempt before retrying (ms) */
const ATTEMPT_TIMEOUT = 10000;

type LocationPhase = 'idle' | 'detecting' | 'done' | 'error';

export type LocationErrorCode = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | null;

/**
 * High-accuracy location hook — manual trigger by default.
 *
 * Does NOT start detecting on mount unless autoStart=true.
 * Call `startDetection()` to begin — this triggers the browser
 * permission popup via navigator.geolocation.getCurrentPosition().
 *
 * Flow after startDetection():
 *  1. Call getCurrentPosition() to trigger the permission popup.
 *  2. Start watchPosition with enableHighAccuracy: true, maximumAge: 0.
 *  3. Accept the first reading whose accuracy < 50 m — mark as "done".
 *  4. If no reading meets the threshold within ATTEMPT_TIMEOUT, restart
 *     the watch (up to MAX_RETRIES total cycles).
 *  5. If all retries exhausted, accept the best reading obtained so far.
 *  6. After the initial lock, keep the watch running for live updates.
 */
export function useLocation(autoStart = false) {
    const [phase, setPhase] = useState<LocationPhase>(autoStart ? 'detecting' : 'idle');
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<LocationErrorCode>(null);
    const [loadingMessage, setLoadingMessage] = useState('Detecting your location...');

    const watchIdRef = useRef<number | null>(null);
    const retryCountRef = useRef(0);
    const bestReadingRef = useRef<UserLocation | null>(null);
    const accurateFixObtainedRef = useRef(false);
    const attemptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAttemptTimer = useCallback(() => {
        if (attemptTimerRef.current !== null) {
            clearTimeout(attemptTimerRef.current);
            attemptTimerRef.current = null;
        }
    }, []);

    const clearWatch = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const acceptReading = useCallback((reading: UserLocation) => {
        accurateFixObtainedRef.current = true;
        clearAttemptTimer();
        setLocation(reading);
        setPhase('done');
        setError(null);
    }, [clearAttemptTimer]);

    const startWatchCycle = useCallback(() => {
        clearWatch();
        clearAttemptTimer();

        const attempt = retryCountRef.current + 1;
        setLoadingMessage(
            attempt === 1
                ? 'Detecting your location...'
                : `Refining accuracy (attempt ${attempt}/${MAX_RETRIES})...`
        );

        attemptTimerRef.current = setTimeout(() => {
            if (accurateFixObtainedRef.current) return;

            retryCountRef.current += 1;

            if (retryCountRef.current < MAX_RETRIES) {
                startWatchCycle();
            } else {
                if (bestReadingRef.current) {
                    acceptReading(bestReadingRef.current);
                }
            }
        }, ATTEMPT_TIMEOUT);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const reading: UserLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };

                if (
                    !bestReadingRef.current ||
                    reading.accuracy < bestReadingRef.current.accuracy
                ) {
                    bestReadingRef.current = reading;
                }

                if (accurateFixObtainedRef.current) {
                    setLocation(reading);
                    return;
                }

                if (reading.accuracy <= ACCURACY_THRESHOLD) {
                    acceptReading(reading);
                }
            },
            (err) => {
                if (!accurateFixObtainedRef.current && !bestReadingRef.current) {
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
                    setError(message);
                    setErrorCode(code);
                    setPhase('error');
                    clearAttemptTimer();
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    }, [clearWatch, clearAttemptTimer, acceptReading]);

    /**
     * Call this to begin GPS detection.
     * This triggers the browser permission popup via getCurrentPosition(),
     * then starts watchPosition for high-accuracy tracking.
     */
    const startDetection = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setErrorCode('unsupported');
            setPhase('error');
            return;
        }

        // Reset everything for a fresh detection
        retryCountRef.current = 0;
        bestReadingRef.current = null;
        accurateFixObtainedRef.current = false;

        setPhase('detecting');
        setError(null);
        setErrorCode(null);
        setLocation(null);
        setLoadingMessage('Please enable location to continue');

        // getCurrentPosition triggers the browser permission popup immediately
        navigator.geolocation.getCurrentPosition(
            () => {
                // Permission granted — now start the accurate watch cycle
                setLoadingMessage('Detecting your location...');
                startWatchCycle();
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
                setError(message);
                setErrorCode(code);
                setPhase('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    }, [startWatchCycle]);

    // Auto-start on mount for category pages
    useEffect(() => {
        if (autoStart) {
            startDetection();
        }
        return () => {
            clearWatch();
            clearAttemptTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    timeout: 15000,
                    maximumAge: 0,
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
