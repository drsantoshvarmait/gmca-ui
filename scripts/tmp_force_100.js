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

async function forceIntake() {
    const client = new Client(config);
    try {
        await client.connect();

        // GMC Ambernath ID from last check: 51b52722-065d-4d41-8c9e-531bcf66e93f
        const orgId = '51b52722-065d-4d41-8c9e-531bcf66e93f';

        console.log(`Forcing intake to 100 on ${orgId}`);

        // Update the config table
        await client.query(`
        INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
        VALUES ($1, 'MBBS', 100)
        ON CONFLICT (organisation_id, course_name) DO UPDATE 
        SET current_intake = 100;
    `, [orgId]);

        console.log("Verified: GMC Ambernath is now correctly set to 100 MBBS seats.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

forceIntake();
