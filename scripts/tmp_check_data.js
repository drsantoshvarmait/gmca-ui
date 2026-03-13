import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkData() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const { rows } = await client.query("SELECT sector_name, count(*) FROM finance.coa_templates GROUP BY sector_name");
        console.log("TEMPLATES DATA:", rows);

        const { rows: coa } = await client.query("SELECT count(*) FROM finance.chart_of_accounts");
        console.log("CHART OF ACCOUNTS COUNT:", coa[0].count);
    } catch (err) {
        console.error("CHECK ERROR:", err.message);
    } finally {
        await client.end();
    }
}
checkData();
