import { NextRequest, NextResponse } from 'next/server';
import {
    getAllServices,
    getServicesByCategory,
    addServiceToDb,
    updateServiceInDb,
    deleteServiceFromDb,
} from '@/lib/db';

// GET /api/services?category=xxx
export async function GET(request: NextRequest) {
    try {
        const category = request.nextUrl.searchParams.get('category');
        const services = category ? getServicesByCategory(category) : getAllServices();
        return NextResponse.json(services);
    } catch (error) {
        console.error('GET /api/services error:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

// POST /api/services — create a new service
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const service = addServiceToDb(body);
        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error('POST /api/services error:', error);
        return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
    }
}

// PUT /api/services — update a service { id, ...updates }
export async function PUT(request: NextRequest) {
    try {
        const { id, ...updates } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
        }
        const success = updateServiceInDb(id, updates);
        if (!success) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT /api/services error:', error);
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}

// DELETE /api/services — delete a service { id }
export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
        }
        const success = deleteServiceFromDb(id);
        if (!success) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/services error:', error);
        return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
}
