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
        
        console.log('--- PROFILES TABLE INFO ---');
        const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'profiles'");
        console.log(res.rows);
        
        const resCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
        console.log(resCols.rows);
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
