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

async function checkSchema(table) {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'", [table]);
        console.log(`Columns in ${table}:`, res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

async function run() {
    await checkSchema('employees');
    await checkSchema('organisations');
    await checkSchema('sop_step');
}

run();
