

/**
 * Google Maps navigation URL (free — no API key needed)
 */
export function getNavigationUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
    // +919876543210 → +91 98765 43210
    if (phone.startsWith('+91') && phone.length === 13) {
        return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
}
