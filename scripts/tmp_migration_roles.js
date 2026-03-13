import pkg from 'pg';
const { Client } = pkg;

const sql = `
ALTER TABLE public.sop_step 
ADD COLUMN IF NOT EXISTS designation_id uuid REFERENCES public.designations(designation_id);
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
        console.log("Migration: Added designation_id to sop_step.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
