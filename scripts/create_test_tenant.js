import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Creating GMC Ambernath tenant manually...");
        
        const res = await client.query(`
            INSERT INTO public.tenants (tenant_name, tenant_code, tenant_type, settings)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, ['GMC Ambernath', 'GMCA', 'GOVERNMENT', JSON.stringify({ brand_color: '#0284c7' })]);
        
        console.log("✅ Tenant created:", res.rows[0]);

        // Also add the admin user to the user_org_roles for this tenant if we can
        // But first we need an organisation.
        
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
