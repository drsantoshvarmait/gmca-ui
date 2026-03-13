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
        
        console.log('--- RLS SETTINGS FOR TENANTS ---');
        const resRLS = await client.query(`
            SELECT relname, relrowsecurity 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'public' AND c.relname = 'tenants'
        `);
        console.log(resRLS.rows);

        console.log('\n--- POLICIES FOR TENANTS ---');
        const resPol = await client.query(`
            SELECT * FROM pg_policies WHERE tablename = 'tenants'
        `);
        console.log(resPol.rows);
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
