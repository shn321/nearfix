'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { SOSPanel } from './SOSPanel';

/**
 * Floating SOS button — visible on every page.
 * Opens the full-screen emergency panel when tapped.
 */
export function SOSButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="sos-fab"
                aria-label="Emergency SOS"
                id="sos-button"
            >
                <span className="sos-fab-pulse" />
                <span className="sos-fab-pulse sos-fab-pulse-2" />
                <ShieldAlert size={24} />
                <span className="sos-fab-label">SOS</span>
            </button>

            {isOpen && <SOSPanel onClose={() => setIsOpen(false)} />}
        </>
    );
}
