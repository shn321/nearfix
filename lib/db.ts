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
