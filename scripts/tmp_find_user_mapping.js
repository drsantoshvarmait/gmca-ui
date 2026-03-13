import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function findUserMapping() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const userEmail = 'drsantoshvarmait@gmail.com';
        console.log(`--- Searching for user: ${userEmail} ---`);
        
        const { rows: profiles } = await client.query(`SELECT * FROM public.profiles WHERE email = '${userEmail}'`);
        console.log("Profile data:", profiles);

        if (profiles.length > 0) {
            const userId = profiles[0].id;
            console.log(`\nUser ID: ${userId}`);
            
            // Search in other potential tables
            const tablesToSearch = ['user_organisations', 'user_tenants', 'user_roles'];
            for (const table of tablesToSearch) {
                try {
                    const { rows } = await client.query(`SELECT * FROM public.${table} WHERE user_id = '${userId}'`);
                    if (rows.length > 0) {
                        console.log(`\nFound mapping in public.${table}:`, rows);
                    }
                } catch (e) {
                    // Table might not exist
                }
            }
        }

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
findUserMapping();
