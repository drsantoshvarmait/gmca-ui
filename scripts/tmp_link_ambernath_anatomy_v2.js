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
        const ambernathId = '51b52722-065d-4d41-8c9e-531bcf66e93f';
        const anatomyTemplateId = '4daf9fc1-ade9-48bf-b1d5-abfebca6ac09';
        
        console.log('Linking Ambernath department to Anatomy template...');
        await client.query(`
            UPDATE organisation_units 
            SET unit_template_id = $1 
            WHERE organisation_id = $2
        `, [anatomyTemplateId, ambernathId]);
        
        console.log('Updated. Checking view counts for Ambernath...');
        const res = await client.query("SELECT COUNT(*) FROM vw_organisation_compliance_report WHERE organisation_id = $1", [ambernathId]);
        console.log(`Ambernath Rows in view: ${res.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
