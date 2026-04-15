import Database from 'better-sqlite3';
import path from 'path';
import { DEFAULT_SERVICES, type Service } from '@/data/services';

// ─── Database path ───
const DB_PATH = path.join(process.cwd(), 'nearfix.db');

// ─── Singleton connection ───
let _db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!_db) {
        _db = new Database(DB_PATH);
        _db.pragma('journal_mode = WAL');
        initializeSchema(_db);
    }
    return _db;
}

// ─── Schema initialization ───
function initializeSchema(db: Database.Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT,
            rating REAL DEFAULT 0.0,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS help_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            phone TEXT NOT NULL,
            description TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        );
    `);

    // Add default admin if not exists
    const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admin').get() as { count: number };
    if (adminCount.count === 0) {
        db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', 'admin123'); // Simple default
    }

    // Auto-seed if table is empty
    const svcCount = db.prepare('SELECT COUNT(*) AS count FROM services').get() as { count: number };
    if (svcCount.count === 0) {
        seedDefaults(db);
    }
}

// ─── Seed helper ───
function seedDefaults(db: Database.Database): void {
    const insert = db.prepare(`
        INSERT INTO services (id, name, category, address, phone, latitude, longitude, rating)
        VALUES (@id, @name, @category, @address, @phone, @latitude, @longitude, @rating)
    `);

    const insertMany = db.transaction((services: Service[]) => {
        for (const s of services) {
            insert.run(s);
        }
    });

    insertMany(DEFAULT_SERVICES);
}

// ═══════════════════ Public API ═══════════════════

export function getAllServices(): Service[] {
    const db = getDb();
    return db.prepare('SELECT * FROM services ORDER BY id ASC').all() as Service[];
}

export function getServicesByCategory(category: string): Service[] {
    const db = getDb();
    return db.prepare('SELECT * FROM services WHERE category = ? ORDER BY id ASC').all(category) as Service[];
}

export function addServiceToDb(service: Omit<Service, 'id'>): Service {
    const db = getDb();
    const result = db.prepare(`
        INSERT INTO services (name, category, address, phone, latitude, longitude, rating)
        VALUES (@name, @category, @address, @phone, @latitude, @longitude, @rating)
    `).run(service);

    return { ...service, id: result.lastInsertRowid as number } as Service;
}

export function updateServiceInDb(id: number, updates: Partial<Omit<Service, 'id'>>): boolean {
    const db = getDb();
    const fields = Object.keys(updates);
    if (fields.length === 0) return false;

    const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
    const result = db.prepare(`UPDATE services SET ${setClause} WHERE id = @id`).run({ ...updates, id });
    return result.changes > 0;
}

export function deleteServiceFromDb(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM services WHERE id = ?').run(id);
    return result.changes > 0;
}

export function seedServicesDb(): boolean {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) AS count FROM services').get() as { count: number };
    if (row.count > 0) return true; // Already seeded
    seedDefaults(db);
    return true;
}

export function resetServicesDb(): boolean {
    const db = getDb();
    db.prepare('DELETE FROM services').run();
    seedDefaults(db);
    return true;
}

// ═══════════════════ Help Requests ═══════════════════

export interface HelpRequest {
    id: number;
    category: string;
    phone: string;
    description: string | null;
    latitude: number;
    longitude: number;
    status: string;
    created_at: string;
    resolved_at: string | null;
}

export function createHelpRequest(data: Omit<HelpRequest, 'id' | 'status' | 'created_at' | 'resolved_at'>): HelpRequest {
    const db = getDb();
    const result = db.prepare(`
        INSERT INTO help_requests (category, phone, description, latitude, longitude)
        VALUES (@category, @phone, @description, @latitude, @longitude)
    `).run(data);
    return { ...data, id: result.lastInsertRowid as number, status: 'pending', created_at: new Date().toISOString(), resolved_at: null };
}

export function getAllHelpRequests(): HelpRequest[] {
    const db = getDb();
    return db.prepare('SELECT * FROM help_requests ORDER BY created_at DESC').all() as HelpRequest[];
}

export function getHelpRequestsByPhone(phone: string): HelpRequest[] {
    const db = getDb();
    return db.prepare('SELECT * FROM help_requests WHERE phone = ? ORDER BY created_at DESC').all(phone) as HelpRequest[];
}

export function updateHelpRequestStatus(id: number, status: string): boolean {
    const db = getDb();
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    const result = db.prepare('UPDATE help_requests SET status = ?, resolved_at = ? WHERE id = ?').run(status, resolvedAt, id);
    return result.changes > 0;
}

export function getHelpRequestStats() {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) AS count FROM help_requests').get() as { count: number }).count;
    const pending = (db.prepare("SELECT COUNT(*) AS count FROM help_requests WHERE status = 'pending'").get() as { count: number }).count;
    const resolved = (db.prepare("SELECT COUNT(*) AS count FROM help_requests WHERE status = 'resolved'").get() as { count: number }).count;
    return { total, pending, resolved };
}

// ═══════════════════ Reviews ═══════════════════

export interface Review {
    id: number;
    service_id: number;
    device_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export function createReview(data: Omit<Review, 'id' | 'created_at'>): Review {
    const db = getDb();
    // Check if this device already reviewed this service
    const existing = db.prepare('SELECT id FROM reviews WHERE service_id = ? AND device_id = ?').get(data.service_id, data.device_id) as { id: number } | undefined;
    if (existing) {
        // Update existing review
        db.prepare('UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.rating, data.comment, existing.id);
        return { ...data, id: existing.id, created_at: new Date().toISOString() };
    }
    const result = db.prepare(`
        INSERT INTO reviews (service_id, device_id, rating, comment)
        VALUES (@service_id, @device_id, @rating, @comment)
    `).run(data);
    return { ...data, id: result.lastInsertRowid as number, created_at: new Date().toISOString() };
}

export function getReviewsByService(serviceId: number): Review[] {
    const db = getDb();
    return db.prepare('SELECT * FROM reviews WHERE service_id = ? ORDER BY created_at DESC').all(serviceId) as Review[];
}

export function getAverageRating(serviceId: number): { avg: number; count: number } {
    const db = getDb();
    const row = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE service_id = ?').get(serviceId) as { avg: number | null; count: number };
    return { avg: row.avg ?? 0, count: row.count };
}

export function deleteReview(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return result.changes > 0;
}

export function getAllReviews(): Review[] {
    const db = getDb();
    return db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all() as Review[];
}

export function getReviewStats() {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) AS count FROM reviews').get() as { count: number }).count;
    const avgRating = (db.prepare('SELECT AVG(rating) AS avg FROM reviews').get() as { avg: number | null }).avg ?? 0;
    return { total, avgRating: Number(avgRating.toFixed(1)) };
}
