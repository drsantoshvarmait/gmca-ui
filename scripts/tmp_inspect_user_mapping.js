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
        
        console.log('--- USER_ORG_ROLES COLUMNS ---');
        const resCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_org_roles'");
        resCols.rows.forEach(r => console.log(r.column_name));
        
        console.log('\n--- PROFILES COLUMNS AGAIN ---');
        const resProf = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
        resProf.rows.forEach(r => console.log(r.column_name));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
