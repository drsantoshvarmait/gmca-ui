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

        const r1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'department_templates'");
        console.log("department_templates:", r1.rows);

        const r2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organisation_types'");
        console.log("organisation_types:", r2.rows);

        const r3 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_units'");
        console.log("master_units:", r3.rows);

        const r4 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roles'");
        console.log("roles:", r4.rows);

        const r5 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'designations'");
        console.log("designations:", r5.rows);

    } catch (e) { console.error(e) }
    finally { await client.end() }
}
run();
