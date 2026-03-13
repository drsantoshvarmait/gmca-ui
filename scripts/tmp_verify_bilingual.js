import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function verifyBilingual() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Verifying Bilingual CoA Data ---");
        const { rows } = await client.query("SELECT full_account_code, account_name, account_name_mr FROM public.fin_coa WHERE account_name_mr IS NOT NULL LIMIT 5");
        console.log("Bilingual Rows:", rows);

    } catch (err) {
        console.error("VERIFICATION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
verifyBilingual();
