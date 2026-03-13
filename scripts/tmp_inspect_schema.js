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

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        const tables = ['items', 'vendors', 'vendor_bills', 'organisation_unit_resource_actuals'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}' 
                AND table_schema = 'public'
            `);
            console.log(`\nColumns for ${table}:`);
            console.table(res.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
