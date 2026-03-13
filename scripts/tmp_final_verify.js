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

async function verify() {
    const client = new Client(config);
    try {
        await client.connect();
        
        console.log('--- Schema Verification ---');
        const tables = ['items', 'vendors', 'vendor_bills'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND column_name = 'organisation_id'
            `);
            console.log(`${table}: ${res.rows.length > 0 ? '✅ organisation_id exists' : '❌ organisation_id MISSING'}`);
            
            const resOld = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND column_name = 'organisation_id_uuid'
            `);
            console.log(`${table}: ${resOld.rows.length === 0 ? '✅ organisation_id_uuid removed' : '❌ organisation_id_uuid STILL PRESENT'}`);
        }

        console.log('\n--- Data & Dashboard Simulation ---');
        // Get Ambernath Org
        const orgRes = await client.query("SELECT organisation_id, organisation_name FROM organisations WHERE organisation_name ILIKE '%Ambernath%' LIMIT 1");
        if (orgRes.rows.length > 0) {
            const org = orgRes.rows[0];
            console.log(`Testing for Org: ${org.organisation_name} (${org.organisation_id})`);
            
            // Check Units (Dashboard Step 63)
            const unitsRes = await client.query("SELECT COUNT(*) FROM organisation_units WHERE organisation_id = $1", [org.organisation_id]);
            console.log(`Units found: ${unitsRes.rows[0].count}`);

            // Check Assets (Dashboard Step 62)
            const assetsRes = await client.query("SELECT COUNT(*) FROM org_assets WHERE organisation_id = $1", [org.organisation_id]);
            console.log(`Assets found: ${assetsRes.rows[0].count}`);

            // Check Compliance View (New Logic)
            const viewRes = await client.query("SELECT COUNT(*) FROM vw_organisation_compliance_report");
            console.log(`Compliance Report View rows: ${viewRes.rows[0].count}`);
        } else {
            console.log('❌ GMC Ambernath not found in organisations table.');
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    } finally {
        await client.end();
    }
}

verify();
