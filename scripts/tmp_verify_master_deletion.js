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
        console.log('--- Checking master_organisation_units RLS ---');
        const res = await client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'master_organisation_units'");
        console.log(res.rows[0]);
        
        console.log('\n--- Checking current contents ---');
        const resData = await client.query("SELECT * FROM master_organisation_units");
        console.table(resData.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
