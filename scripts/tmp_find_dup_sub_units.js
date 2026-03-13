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

        // Check for duplicate sub-units first
        const dups = await client.query(`
            SELECT parent_unit_id, sub_unit_name, COUNT(*) as cnt
            FROM organisation_unit_sub_units
            GROUP BY parent_unit_id, sub_unit_name
            HAVING COUNT(*) > 1
        `);
        console.table(dups.rows);
        console.log(`Found ${dups.rows.length} duplicate(s)`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
