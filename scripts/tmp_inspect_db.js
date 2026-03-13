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
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", JSON.stringify(tables.rows.map(r => r.table_name)));

        const designationsCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'designation' OR table_name = 'designations'");
        console.log("Designation columns:", JSON.stringify(designationsCols.rows));
    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await client.end();
    }
}

inspect();
