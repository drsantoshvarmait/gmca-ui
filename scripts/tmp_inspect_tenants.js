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
        const tenantCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants'");
        console.log("Tenants table columns:", JSON.stringify(tenantCols.rows, null, 2));
    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await client.end();
    }
}

inspect();
