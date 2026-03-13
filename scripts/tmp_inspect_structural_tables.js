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
        const tables = ['organisation_types', 'unit_templates', 'master_units'];
        for (const t of tables) {
            console.log(`\n--- ${t.toUpperCase()} ---`);
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}' AND table_schema = 'public'`);
            res.rows.forEach(r => console.log(r.column_name));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
