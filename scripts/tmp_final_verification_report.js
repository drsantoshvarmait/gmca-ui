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
        
        console.log('--- TABLES CHECK ---');
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('organisation_types', 'organisation_type_units', 'master_organisation_units', 'tenants')");
        console.log('Expected Tables Found:', tablesRes.rows.map(r => r.table_name));

        console.log('\n--- ORGANISATION TYPES ---');
        const typesRes = await client.query("SELECT organisation_type_id, organisation_type_name, organisation_type_code FROM organisation_types LIMIT 5");
        console.table(typesRes.rows);

        console.log('\n--- MASTER ORGANISATION UNITS ---');
        const masterUnitsRes = await client.query("SELECT unit_name FROM master_organisation_units LIMIT 10");
        console.table(masterUnitsRes.rows);

        console.log('\n--- JUNCTION (TEMPLATE) UNITS ---');
        const junctionRes = await client.query(`
            SELECT t.organisation_type_name, u.unit_name, u.sequence 
            FROM organisation_type_units u 
            JOIN organisation_types t ON u.organisation_type_id = t.organisation_type_id 
            ORDER BY t.organisation_type_name, u.sequence
        `);
        console.table(junctionRes.rows);

    } catch (err) {
        console.error('Verification failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
