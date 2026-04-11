import { type Service } from '@/data/services';

// ─── API-backed service store (SQLite via Next.js API routes) ───

/**
 * Get all services.
 */
export async function getServices(): Promise<Service[]> {
    try {
        const res = await fetch('/api/services', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch services');
        return await res.json();
    } catch (error) {
        console.error('getServices error:', error);
        return [];
    }
}

/**
 * Get services filtered by category.
 */
export async function getServicesByCategory(category: string): Promise<Service[]> {
    try {
        const res = await fetch(`/api/services?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch services by category');
        return await res.json();
    } catch (error) {
        console.error('getServicesByCategory error:', error);
        return [];
    }
}

/**
 * Add a new service.
 */
export async function addService(service: Omit<Service, 'id'>): Promise<Service | null> {
    try {
        const res = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service),
        });
        if (!res.ok) throw new Error('Failed to add service');
        return await res.json();
    } catch (error) {
        console.error('addService error:', error);
        return null;
    }
}

/**
 * Update an existing service.
 */
export async function updateService(id: number, updates: Partial<Omit<Service, 'id'>>): Promise<boolean> {
    try {
        const res = await fetch('/api/services', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (!res.ok) throw new Error('Failed to update service');
        return true;
    } catch (error) {
        console.error('updateService error:', error);
        return false;
    }
}

/**
 * Delete a service.
 */
export async function deleteService(id: number): Promise<boolean> {
    try {
        const res = await fetch('/api/services', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error('Failed to delete service');
        return true;
    } catch (error) {
        console.error('deleteService error:', error);
        return false;
    }
}

/**
 * Seed the database with default services (only if table is empty).
 */
export async function seedServices(): Promise<boolean> {
    try {
        const res = await fetch('/api/services/seed', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to seed services');
        return true;
    } catch (error) {
        console.error('seedServices error:', error);
        return false;
    }
}

/**
 * Reset services — delete all and re-seed with defaults.
 */
export async function resetServices(): Promise<boolean> {
    try {
        const res = await fetch('/api/services/reset', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to reset services');
        return true;
    } catch (error) {
        console.error('resetServices error:', error);
        return false;
    }
}
