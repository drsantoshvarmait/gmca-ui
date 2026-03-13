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
        await client.query("UPDATE organisation_unit_sub_units SET is_shared = true WHERE sub_unit_name IN ('Histology Lab', 'Histopathology Lab')");
        console.log('Marked labs as shared');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
