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
        console.log('Starting schema standardization...');

        const queries = [
            `ALTER TABLE public.items RENAME COLUMN organisation_id_uuid TO organisation_id;`,
            `ALTER TABLE public.vendors RENAME COLUMN organisation_id_uuid TO organisation_id;`,
            `ALTER TABLE public.vendor_bills RENAME COLUMN organisation_id_uuid TO organisation_id;`
        ];

        for (const q of queries) {
            try {
                await client.query(q);
                console.log(`Success: ${q}`);
            } catch (e) {
                console.warn(`Skipped/Failed: ${q} - ${e.message}`);
            }
        }

        console.log('Schema standardization complete.');
    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await client.end();
    }
}

run();
