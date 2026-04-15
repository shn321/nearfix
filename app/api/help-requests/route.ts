import { NextRequest, NextResponse } from 'next/server';
import { createHelpRequest, getAllHelpRequests, getHelpRequestsByPhone, updateHelpRequestStatus } from '@/lib/db';

// GET /api/help-requests?phone=+919876543210
export async function GET(request: NextRequest) {
    try {
        const phone = request.nextUrl.searchParams.get('phone');
        if (phone) {
            const requests = getHelpRequestsByPhone(phone);
            return NextResponse.json(requests);
        }
        // Return all (for admin)
        const requests = getAllHelpRequests();
        return NextResponse.json(requests);
    } catch (error) {
        console.error('GET /api/help-requests error:', error);
        return NextResponse.json({ error: 'Failed to fetch help requests' }, { status: 500 });
    }
}

// POST /api/help-requests — create a new help request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { category, phone, description, latitude, longitude } = body;

        if (!category || !phone || !latitude || !longitude) {
            return NextResponse.json({ error: 'Missing required fields: category, phone, latitude, longitude' }, { status: 400 });
        }

        const helpRequest = createHelpRequest({ category, phone, description: description || null, latitude, longitude });
        return NextResponse.json(helpRequest, { status: 201 });
    } catch (error) {
        console.error('POST /api/help-requests error:', error);
        return NextResponse.json({ error: 'Failed to create help request' }, { status: 500 });
    }
}

// PUT /api/help-requests — update status (admin)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
        }

        const validStatuses = ['pending', 'assigned', 'resolved'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const success = updateHelpRequestStatus(id, status);
        if (success) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Help request not found' }, { status: 404 });
    } catch (error) {
        console.error('PUT /api/help-requests error:', error);
        return NextResponse.json({ error: 'Failed to update help request' }, { status: 500 });
    }
}
