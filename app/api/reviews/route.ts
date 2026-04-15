import { NextRequest, NextResponse } from 'next/server';
import { createReview, getReviewsByService, deleteReview } from '@/lib/db';

// GET /api/reviews?serviceId=123
export async function GET(request: NextRequest) {
    try {
        const serviceId = request.nextUrl.searchParams.get('serviceId');
        if (!serviceId) {
            return NextResponse.json({ error: 'Missing serviceId parameter' }, { status: 400 });
        }
        const reviews = getReviewsByService(parseInt(serviceId));
        return NextResponse.json(reviews);
    } catch (error) {
        console.error('GET /api/reviews error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST /api/reviews — create or update a review
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { service_id, device_id, rating, comment } = body;

        if (!service_id || !device_id || !rating) {
            return NextResponse.json({ error: 'Missing required fields: service_id, device_id, rating' }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        const review = createReview({ service_id, device_id, rating, comment: comment || null });
        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error('POST /api/reviews error:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}

// DELETE /api/reviews — delete a review (admin)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
        }

        const success = deleteReview(id);
        if (success) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    } catch (error) {
        console.error('DELETE /api/reviews error:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
