import { NextResponse } from 'next/server';
import { seedServicesDb } from '@/lib/db';

// POST /api/services/seed — seed default data (only if table is empty)
export async function POST() {
    try {
        const success = seedServicesDb();
        return NextResponse.json({ success });
    } catch (error) {
        console.error('POST /api/services/seed error:', error);
        return NextResponse.json({ error: 'Failed to seed services' }, { status: 500 });
    }
}
