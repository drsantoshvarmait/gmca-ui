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

async function linkUserToAmbernathV2() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Get the Ambernath Org ID (The one we configured)
        const orgRes = await client.query("SELECT organisation_id FROM public.organisations WHERE organisation_name ILIKE '%Ambernath%' LIMIT 1");
        if (orgRes.rows.length === 0) throw new Error("Ambernath org not found");
        const orgId = orgRes.rows[0].organisation_id;

        // 2. Get the User ID
        const userRes = await client.query("SELECT user_id FROM public.users WHERE email = 'drsantoshvarmait@gmail.com' LIMIT 1");
        if (userRes.rows.length === 0) throw new Error("User not found");
        const userId = userRes.rows[0].user_id;

        // 3. Link them in user_org_roles
        await client.query(`
        INSERT INTO public.user_org_roles (user_id, organisation_id, role)
        VALUES ($1, $2, 'ADMIN')
        ON CONFLICT (user_id, organisation_id) DO UPDATE SET role = 'ADMIN';
    `, [userId, orgId]);

        console.log(`User linked to Ambernath (Org ID: ${orgId}) with role 'ADMIN'`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

linkUserToAmbernathV2();
