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

        // Clear out duplicates - keep the most recently updated one per course/intake/category
        await client.query(`
        -- Delete all duplicates keeping the newest one
        DELETE FROM public.governance_regulations
        WHERE regulation_id IN (
            SELECT regulation_id
            FROM (
                SELECT regulation_id,
                 ROW_NUMBER() OVER (partition BY course_name, annual_intake, category ORDER BY created_at DESC) as rnum
                 FROM public.governance_regulations
            ) t
            WHERE t.rnum > 1
        );
    `);

        // Check what's left
        const left = await client.query("SELECT * FROM public.governance_regulations WHERE annual_intake = 100");
        console.log("Remaining for 100:", left.rows.map(r => r.category).join(', '));
    } catch (e) { console.error(e) }
    finally { await client.end() }
}
run();
