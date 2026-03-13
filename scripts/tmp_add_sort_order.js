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

        // Add sort_order column to units table
        await client.query(`
            ALTER TABLE organisation_type_units 
            ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        `);
        console.log('Added sort_order column to organisation_type_units');

        // Back-fill existing rows with sequential order per org type
        await client.query(`
            UPDATE organisation_type_units u
            SET sort_order = sub.rn
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY organisation_type_id ORDER BY created_at) AS rn
                FROM organisation_type_units
            ) sub
            WHERE u.id = sub.id;
        `);
        console.log('Back-filled sort_order for existing units');

        const res = await client.query('SELECT unit_name, sort_order FROM organisation_type_units ORDER BY organisation_type_id, sort_order LIMIT 20');
        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
