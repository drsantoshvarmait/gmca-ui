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

        // Unique: no two units with same name under the same org type
        await client.query(`
            ALTER TABLE organisation_type_units
            ADD CONSTRAINT uq_unit_name_per_org_type
            UNIQUE (organisation_type_id, unit_name);
        `).then(() => console.log('✅ Unique constraint added: organisation_type_units(org_type_id, unit_name)'))
          .catch(e => console.log('ℹ️  Constraint already exists or error:', e.message));

        // Unique: no two sub-units with same name under the same parent unit
        await client.query(`
            ALTER TABLE organisation_unit_sub_units
            ADD CONSTRAINT uq_sub_unit_name_per_unit
            UNIQUE (parent_unit_id, sub_unit_name);
        `).then(() => console.log('✅ Unique constraint added: organisation_unit_sub_units(parent_unit_id, sub_unit_name)'))
          .catch(e => console.log('ℹ️  Constraint already exists or error:', e.message));

        console.log('Done');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
