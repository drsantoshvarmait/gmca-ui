import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const client = new Client(config);

async function inspect() {
    try {
        await client.connect();
        const tables = await client.query("SELECT table_name, table_schema FROM information_schema.tables WHERE table_name ILIKE '%designation%'");
        console.log("Matching tables:", JSON.stringify(tables.rows));
    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await client.end();
    }
}

inspect();
