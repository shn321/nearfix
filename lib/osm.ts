import { Service, ServiceCategory } from '@/data/services';

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

function formatOSMAddress(tags: any): string {
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
    // Generates a stable faux-rating between 3.8 and 4.9 based on the OSM ID
    const hash = (id * 2654435761) % Math.pow(2, 32);
    const normalized = hash / Math.pow(2, 32);
    return 3.8 + (normalized * 1.1);
}

const OVERPASS_SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter'
];

export async function fetchOSMServices(
    category: ServiceCategory,
    lat: number,
    lng: number,
    radiusKm: number
): Promise<Service[]> {
    try {
        const radiusMeters = radiusKm * 1000;
        const tags = OSM_TAGS[category];
        if (!tags) return [];

        // Expand each tag into node, way, and relation queries
        const queryBody = tags.map(tag =>
            `node${tag}(around:${radiusMeters},${lat},${lng});` +
            `way${tag}(around:${radiusMeters},${lat},${lng});` +
            `relation${tag}(around:${radiusMeters},${lat},${lng});`
        ).join("");
        const query = `[out:json][timeout:25];(${queryBody});out center;`;

        const MAX_RETRIES = 4;
        const FETCH_TIMEOUT_MS = 15000;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const serverUrl = OVERPASS_SERVERS[attempt % OVERPASS_SERVERS.length];

            try {
                console.log(`[OSM] Fetching from ${serverUrl} (Attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

                // Use POST with URL-encoded data
                const response = await fetch(serverUrl, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
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

                if (!data.elements || !Array.isArray(data.elements)) return [];

                return data.elements
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
                            category: category,
                            address,
                            phone,
                            latitude: elementLat,
                            longitude: elementLon,
                            rating: Number(generateStableRating(el.id).toFixed(1)),
                        };
                    });
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                const isTimeout = msg.includes("abort") || msg.includes("timeout");
                console.warn(`[OSM] Attempt ${attempt + 1} failed for ${serverUrl}: ${msg}${isTimeout ? " (timeout)" : ""}`);

                if (attempt === MAX_RETRIES) {
                    console.error("[OSM] All retry attempts failed.");
                    return [];
                }

                // Exponential backoff: 1s, 2s, 4s, 8s
                const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return [];
    } catch (globalError) {
        console.error("[OSM] Global error in fetchOSMServices:", globalError);
        return [];
    }
}

