import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: 'db.risrmpdbvoafowdvnonn.supabase.co',
    port: 6543,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: process.env.STAGING_SUPABASE_DB_PASSWORD || 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function applyMigrations() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to Staging Database.");

        // Create migrations table if not exists
        await client.query(`
            CREATE SCHEMA IF NOT EXISTS supabase_migrations;
            CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
                version TEXT PRIMARY KEY,
                inserted_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        const migrationsDir = path.join(__dirname, '../supabase/migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            const version = file.split('_')[0];
            
            // Check if already applied
            const res = await client.query('SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1', [version]);
            if (res.rows.length > 0) {
                console.log(`Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`Applying ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)', [version]);
                await client.query('COMMIT');
                console.log(`✅ Applied ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Failed to apply ${file}:`, err.message);
                process.exit(1);
            }
        }

        console.log("All migrations verified/applied successfully.");
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigrations();
