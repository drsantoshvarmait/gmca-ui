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
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organisation_unit_resource_actuals'");
        console.log('Table Exists:', res.rows.length > 0);
        
        const resView = await client.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'vw_organisation_compliance_report'");
        console.log('View Exists:', resView.rows.length > 0);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
