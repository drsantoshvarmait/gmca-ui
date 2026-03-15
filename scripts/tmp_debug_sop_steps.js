import pkg from 'pg';
const { Client } = pkg;

const PROD_CONFIG = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function checkStepsSchema() {
    const client = new Client(PROD_CONFIG);
    try {
        await client.connect();
        
        console.log("--- COLUMNS IN public.sop_step ---");
        const resCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'sop_step'
        `);
        console.table(resCols.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkStepsSchema();
