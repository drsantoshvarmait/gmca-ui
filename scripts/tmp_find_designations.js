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

async function findDesignations() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%designation%'");
        console.log(res.rows.map(t => t.table_name));

        // Also check for the base tables used in earlier scripts
        const meta = await client.query("SELECT * FROM public.meta_docs WHERE metadata ->> 'table_name' ILIKE '%designation%'");
        console.log("Meta docs matches:", JSON.stringify(meta.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

findDesignations();
