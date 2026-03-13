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
        const res1 = await client.query("SELECT id FROM organisation_type_units WHERE id = '4daf9fc1-ade9-48bf-b1d5-abfebca6ac09'");
        const res2 = await client.query("SELECT organisation_unit_id FROM organisation_units WHERE organisation_unit_id = '4daf9fc1-ade9-48bf-b1d5-abfebca6ac09'");
        console.log('Found in type_units:', res1.rows.length);
        console.log('Found in units:', res2.rows.length);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
