import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function updateTestUser() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const meddTenantId = '58f443c8-4bd5-46be-9471-3de6abeca27e';
        const userEmail = 'drsantoshvarmait@gmail.com';
        
        await client.query(`UPDATE public.profiles SET tenant_id = '${meddTenantId}' WHERE email = '${userEmail}'`);
        console.log(`✅ User ${userEmail} migrated to MEDD`);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
updateTestUser();
