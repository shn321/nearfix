import { NextResponse } from 'next/server';
import { resetServicesDb } from '@/lib/db';

// POST /api/services/reset — delete all and re-seed with defaults
export async function POST() {
    try {
        const success = resetServicesDb();
        return NextResponse.json({ success });
    } catch (error) {
        console.error('POST /api/services/reset error:', error);
        return NextResponse.json({ error: 'Failed to reset services' }, { status: 500 });
    }
}
