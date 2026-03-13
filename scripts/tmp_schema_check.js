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
        // Check profiles columns to see where organization goes
        const p1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
        console.log("Profiles Table:", p1.rows);

        // Check user_roles table
        const p2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_roles'");
        console.log("User Roles Table:", p2.rows);

    } catch (e) { console.error(e) }
    finally { await client.end() }
}
run();
