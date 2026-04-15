import { NextResponse } from 'next/server';
import { getAllServices, getHelpRequestStats, getReviewStats, getAllHelpRequests, getAllReviews } from '@/lib/db';
import { CATEGORIES } from '@/data/services';

// GET /api/admin/stats
export async function GET() {
    try {
        const services = getAllServices();
        const helpStats = getHelpRequestStats();
        const reviewStats = getReviewStats();
        const recentRequests = getAllHelpRequests().slice(0, 10);
        const recentReviews = getAllReviews().slice(0, 10);

        // Category breakdown
        const categoryBreakdown = CATEGORIES.map(cat => ({
            key: cat.key,
            label: cat.label,
            icon: cat.icon,
            color: cat.color,
            count: services.filter(s => s.category === cat.key).length,
        }));

        return NextResponse.json({
            totalServices: services.length,
            totalReviews: reviewStats.total,
            avgRating: reviewStats.avgRating,
            helpRequests: helpStats,
            categoryBreakdown,
            recentRequests,
            recentReviews,
        });
    } catch (error) {
        console.error('GET /api/admin/stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
