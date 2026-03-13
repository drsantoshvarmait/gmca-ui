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

        // Delete the older duplicate (keep latest created_at)
        await client.query(`
            DELETE FROM organisation_unit_sub_units
            WHERE id IN (
                SELECT id FROM (
                    SELECT id,
                        ROW_NUMBER() OVER (
                            PARTITION BY parent_unit_id, sub_unit_name
                            ORDER BY created_at DESC
                        ) AS rn
                    FROM organisation_unit_sub_units
                ) ranked
                WHERE rn > 1
            )
        `);
        console.log('Removed duplicate sub-units (kept newest)');

        // Now add the unique constraint
        await client.query(`
            ALTER TABLE organisation_unit_sub_units
            ADD CONSTRAINT uq_sub_unit_name_per_unit
            UNIQUE (parent_unit_id, sub_unit_name);
        `);
        console.log('✅ Unique constraint added: organisation_unit_sub_units(parent_unit_id, sub_unit_name)');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
