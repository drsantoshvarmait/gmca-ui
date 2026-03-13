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

async function fixAllAmbernaths() {
    const client = new Client(config);
    try {
        await client.connect();

        const orgsRes = await client.query("SELECT organisation_id FROM public.organisations WHERE organisation_name ILIKE '%Ambernath%'");
        const ids = orgsRes.rows.map(r => r.organisation_id);

        console.log(`Found ${ids.length} Ambernath organizations. Forcing 100 MBBS seats for all.`);

        for (const id of ids) {
            await client.query(`
            INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
            VALUES ($1, 'MBBS', 100)
            ON CONFLICT (organisation_id, course_name) DO UPDATE 
            SET current_intake = 100;
        `, [id]);
        }

        console.log("Success: All Ambernath orgs now configured for 100 MBBS seats.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

fixAllAmbernaths();
