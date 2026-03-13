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
        
        // Ensure unique constraint on name for conflict handling
        await client.query("ALTER TABLE master_organisation_sub_units ADD CONSTRAINT uq_sub_unit_name UNIQUE (sub_unit_name)");

        const data = [
            { name: 'Histology Lab', area: 150 },
            { name: 'Histopathology Lab', area: 150 },
            { name: 'Lecture Hall', area: 250 },
            { name: 'Dissection Hall', area: 150 },
            { name: 'Seminar Room', area: 50 },
            { name: 'Demonstration Room', area: 75 }
        ];

        for (const item of data) {
            await client.query(
                "INSERT INTO master_organisation_sub_units (sub_unit_name, required_area) VALUES ($1, $2) ON CONFLICT (sub_unit_name) DO UPDATE SET required_area = $2",
                [item.name, item.area]
            );
        }
        console.log('Seeded Master Sub-Units');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
