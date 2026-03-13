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
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'organisation_%'");
        for (const row of tables.rows) {
            console.log(`\n--- ${row.table_name.toUpperCase()} ---`);
            const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${row.table_name}' AND table_schema = 'public'`);
            cols.rows.forEach(c => console.log(c.column_name));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
