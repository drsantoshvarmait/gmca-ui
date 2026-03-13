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
        const res = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_name IN ('items', 'vendors', 'vendor_bills')
            AND table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);
        res.rows.forEach(row => {
            console.log(`${row.table_name}.${row.column_name}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
