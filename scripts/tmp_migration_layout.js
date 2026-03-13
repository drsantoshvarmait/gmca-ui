import pkg from 'pg';
const { Client } = pkg;

const sql = `
ALTER TABLE public.sop_step 
ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 250,
ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 100;
`;

const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        await client.query(sql);
        console.log("Coordinate columns added to sop_step.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
