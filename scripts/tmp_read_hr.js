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

        // Check what's left
        const left = await client.query("SELECT * FROM public.governance_regulations WHERE category = 'HUMAN_RESOURCE' AND annual_intake = 100");
        console.log(JSON.stringify(left.rows, null, 2));
    } catch (e) { console.error(e) }
    finally { await client.end() }
}
run();
