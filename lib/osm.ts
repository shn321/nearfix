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

/** Delay helper */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Track which server to use next (round-robin across requests) */
let serverIndex = 0;

/**
 * Fetch a single Overpass query with retry + server rotation.
 * Returns raw elements array or empty array on failure.
 */
async function fetchOverpassQuery(query: string): Promise<any[]> {
    const MAX_RETRIES = 3;
    const FETCH_TIMEOUT_MS = 12000;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const server = OVERPASS_SERVERS[serverIndex % OVERPASS_SERVERS.length];
        serverIndex++;

        try {
            console.log(`[OSM] Fetching from ${server} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            const response = await fetch(server, {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
                console.warn(`[OSM] Rate limited (429) on ${server}, waiting before retry...`);
                await delay(2000);
                continue;
            }

            if (response.status === 504) {
                console.warn(`[OSM] Gateway timeout (504) on ${server}, trying next server...`);
                await delay(1000);
                continue;
            }

            if (!response.ok) {
                throw new Error(`Overpass API responded with status: ${response.status}`);
            }

            const text = await response.text();

            // Guard against HTML error pages
            if (text.trimStart().startsWith('<')) {
                throw new Error('Overpass returned HTML error instead of JSON');
            }

            const data = JSON.parse(text);
            return data.elements || [];

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`[OSM] Attempt ${attempt + 1} failed: ${msg}`);

            if (attempt < MAX_RETRIES) {
                // Backoff: 1s, 2s, 3s
                await delay(1000 * (attempt + 1));
            }
        }
    }

    return [];
}

export async function fetchOSMServices(
    category: ServiceCategory,
    lat: number,
    lng: number,
    radiusKm: number
): Promise<Service[]> {
    try {
        // Cap radius at 5km to prevent heavy queries
        const radiusMeters = Math.min(radiusKm * 1000, 5000);
        const tags = OSM_TAGS[category];
        if (!tags) return [];

        console.log(`[OSM] Category: ${category}, Radius: ${radiusMeters}m, Tags: ${tags.length}`);

        // Split into separate queries per tag to keep each query lightweight
        const allElements: any[] = [];
        const seenIds = new Set<number>();

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            // Only query node and way (skip relation — rarely useful for POIs)
            const query = `[out:json][timeout:15];(\n` +
                `node${tag}(around:${radiusMeters},${lat},${lng});\n` +
                `way${tag}(around:${radiusMeters},${lat},${lng});\n` +
                `);out center;`;

            console.log(`[OSM] Query ${i + 1}/${tags.length}: ${tag}`);

            const elements = await fetchOverpassQuery(query);

            // Deduplicate by element ID
            for (const el of elements) {
                if (!seenIds.has(el.id)) {
                    seenIds.add(el.id);
                    allElements.push(el);
                }
            }

            // Add 1 second delay between tag queries to avoid rate limiting
            if (i < tags.length - 1) {
                await delay(1000);
            }
        }

        console.log(`[OSM] Total unique elements: ${allElements.length}`);

        return allElements
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
    } catch (globalError) {
        console.error("[OSM] Global error in fetchOSMServices:", globalError);
        return [];
    }
}
