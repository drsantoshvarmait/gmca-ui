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

async function checkUserOrg() {
    const client = new Client(config);
    try {
        await client.connect();

        console.log("--- User -> Org Check ---");
        const res = await client.query(`
        SELECT u.user_id, u.email, o.organisation_name, o.organisation_id
        FROM public.users u
        LEFT JOIN public.user_org_roles uor ON u.user_id = uor.user_id
        LEFT JOIN public.organisations o ON uor.organisation_id = o.organisation_id
        WHERE u.email = 'drsantoshvarmait@gmail.com'
    `);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUserOrg();
