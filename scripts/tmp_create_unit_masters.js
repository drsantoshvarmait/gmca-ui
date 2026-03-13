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

        // Create master_organisation_units table
        await client.query(`
            CREATE TABLE IF NOT EXISTS master_organisation_units (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                unit_name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Table master_organisation_units created / already exists');

        // Add unique constraint
        await client.query(`
            ALTER TABLE master_organisation_units
            ADD CONSTRAINT uq_master_unit_name UNIQUE (unit_name);
        `).catch(() => console.log('Unique constraint already exists'));

        // Seed common Medical College departments
        const departments = [
            'Anatomy Department',
            'Physiology Department',
            'Biochemistry Department',
            'Pathology Department',
            'Microbiology Department',
            'Pharmacology Department',
            'Forensic Medicine Department',
            'Community Medicine Department',
            'ENT Department',
            'Ophthalmology Department',
            'Radiology Department',
            'Dermatology Department',
            'General Surgery Department',
            'General Medicine Department',
            'Orthopaedics Department',
            'Paediatrics Department',
            'Obstetrics & Gynaecology Department',
            'Psychiatry Department',
            'Anaesthesia Department',
            'Dentistry Department',
            'Dean Office',
            'Administrative Office',
            'Library',
            'Central Research Lab',
        ];

        for (const name of departments) {
            await client.query(`
                INSERT INTO master_organisation_units (unit_name)
                VALUES ($1)
                ON CONFLICT (unit_name) DO NOTHING
            `, [name]);
        }
        console.log(`Seeded ${departments.length} Unit Masters`);

        // Verify
        const res = await client.query('SELECT unit_name FROM master_organisation_units ORDER BY unit_name');
        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
