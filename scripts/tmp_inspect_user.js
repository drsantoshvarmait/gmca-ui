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

async function inspect() {
    const client = new Client(config);
    try {
        await client.connect();

        const userEmail = 'drsantoshvarmait@gmail.com';
        console.log(`Checking user: ${userEmail}`);

        const userRes = await client.query("SELECT user_id FROM public.users WHERE email = $1", [userEmail]);
        if (userRes.rows.length === 0) {
            console.log("User NOT FOUND in public.users");
            return;
        }
        const userId = userRes.rows[0].user_id;
        console.log(`User ID: ${userId}`);

        const rolesRes = await client.query(`
            SELECT uor.*, o.organisation_name 
            FROM public.user_org_roles uor 
            JOIN public.organisations o ON uor.organisation_id = o.organisation_id 
            WHERE uor.user_id = $1
        `, [userId]);

        console.log("User Roles & Organizations:");
        console.log(rolesRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

inspect();
