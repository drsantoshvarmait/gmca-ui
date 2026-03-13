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
async function r() {
    const c = new Client(config);
    await c.connect();
    const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%designation%'");
    console.log(res.rows);
    await c.end();
}
r();
