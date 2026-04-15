'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA support.
 * Renders nothing — just runs the registration on mount.
 */
export function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Silent fail — PWA registration is non-critical
            });
        }
    }, []);

    return null;
}
