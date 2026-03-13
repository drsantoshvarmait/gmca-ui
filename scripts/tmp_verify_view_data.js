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
        const res = await client.query("SELECT * FROM vw_organisation_compliance_report WHERE organisation_id = $1", [ambernathId]);
        console.log(`Ambernath Rows in view: ${res.rows.length}`);
        if (res.rows.length > 0) {
            console.table(res.rows.slice(0, 5));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
