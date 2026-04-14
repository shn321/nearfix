import { NextRequest, NextResponse } from 'next/server';
import { type ServiceCategory } from '@/data/services';

const OSM_TAGS: Record<ServiceCategory, string[]> = {
    puncture: [
        '["shop"="tyres"]',
        '["shop"="car_repair"]'
    ],
    mechanic: [
        '["shop"="car_repair"]',
        '["shop"="motorcycle_repair"]'
    ],
    fuel: [
        '["amenity"="fuel"]'
    ],
    ev: [
        '["amenity"="charging_station"]'
    ],
    hospital: [
        '["amenity"="hospital"]',
        '["amenity"="clinic"]'
    ],
    police: [
        '["amenity"="police"]'
    ]
};

const OVERPASS_SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter'
];

function formatOSMAddress(tags: Record<string, string>): string {
    const parts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'],
        tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');
    if (tags['description']) return tags['description'];
    return 'Address available on map';
}

function generateStableRating(id: number): number {
    const hash = (id * 2654435761) % Math.pow(2, 32);
    const normalized = hash / Math.pow(2, 32);
    return 3.8 + (normalized * 1.1);
}

// GET /api/services/nearby?category=fuel&lat=14.28&lng=74.44
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const category = searchParams.get('category') as ServiceCategory;
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');

        if (!category || isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { error: 'Missing required params: category, lat, lng' },
                { status: 400 }
            );
        }

        const tags = OSM_TAGS[category];
        if (!tags) {
            return NextResponse.json(
                { error: `Unknown category: ${category}` },
                { status: 400 }
            );
        }

        // Fixed radius: 10000 meters (10 km)
        const radiusMeters = 10000;

        // Build the Overpass QL query with node, way, and relation for each tag
        const queryBody = tags.map(tag =>
            `node${tag}(around:${radiusMeters},${lat},${lng});` +
            `way${tag}(around:${radiusMeters},${lat},${lng});` +
            `relation${tag}(around:${radiusMeters},${lat},${lng});`
        ).join('');

        const query = `[out:json][timeout:25];\n(\n${queryBody}\n);\nout center;`;

        console.log(`[OSM API] Category: ${category}, Lat: ${lat}, Lng: ${lng}, Radius: ${radiusMeters}m`);
        console.log(`[OSM API] Query:\n${query}`);

        const MAX_RETRIES = 4;
        const FETCH_TIMEOUT_MS = 15000;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const serverUrl = OVERPASS_SERVERS[attempt % OVERPASS_SERVERS.length];

            try {
                console.log(`[OSM API] Fetching from ${serverUrl} (Attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

                const response = await fetch(serverUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `data=${encodeURIComponent(query)}`,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Overpass API responded with status: ${response.status}`);
                }

                const text = await response.text();

                // Guard against HTML error pages
                if (text.trimStart().startsWith('<')) {
                    throw new Error('Overpass returned HTML error instead of JSON');
                }

                const data = JSON.parse(text);

                console.log(`[OSM API] Response received — ${data.elements?.length || 0} elements found`);
                console.log(`[OSM API] Raw response:`, JSON.stringify(data).substring(0, 500));

                if (!data.elements || !Array.isArray(data.elements)) {
                    return NextResponse.json([]);
                }

                const services = data.elements
                    .filter((el: any) => (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
                    .map((el: any) => {
                        const elementLat = el.lat || el.center?.lat;
                        const elementLon = el.lon || el.center?.lon;

                        let name = el.tags?.name || el.tags?.['name:en'];
                        if (!name) {
                            const type = category.charAt(0).toUpperCase() + category.slice(1);
                            name = `Local ${type} Service`;
                        }

                        const address = formatOSMAddress(el.tags || {});
                        const phone = el.tags?.phone || el.tags?.['contact:phone'] || '+91 Not Provided';

                        return {
                            id: el.id,
                            name,
                            category,
                            address,
                            phone,
                            latitude: elementLat,
                            longitude: elementLon,
                            rating: Number(generateStableRating(el.id).toFixed(1)),
                        };
                    });

                console.log(`[OSM API] Returning ${services.length} services for category "${category}"`);
                return NextResponse.json(services);

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                const isTimeout = msg.includes('abort') || msg.includes('timeout');
                console.warn(`[OSM API] Attempt ${attempt + 1} failed for ${serverUrl}: ${msg}${isTimeout ? ' (timeout)' : ''}`);

                if (attempt === MAX_RETRIES) {
                    console.error('[OSM API] All retry attempts failed.');
                    return NextResponse.json([]);
                }

                // Exponential backoff: 1s, 2s, 4s, 8s
                const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return NextResponse.json([]);
    } catch (globalError) {
        console.error('[OSM API] Global error:', globalError);
        return NextResponse.json([]);
    }
}
