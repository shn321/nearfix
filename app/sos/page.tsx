'use client';

import { SOSPanel } from '@/components/SOSPanel';
import { useRouter } from 'next/navigation';

/**
 * Dedicated SOS page — accessible via /sos URL.
 * Opens the SOS panel full-screen. Closing navigates back home.
 */
export default function SOSPage() {
    const router = useRouter();

    return (
        <SOSPanel onClose={() => router.push('/')} />
    );
}
