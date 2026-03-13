import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function findOtherHeads() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("--- Searching for Major/Minor head tables ---");
        const { rows } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%head%'");
        console.log("Matching tables:", rows.map(r => r.table_name));

    } catch (err) {
        console.error("SEARCH ERROR:", err.message);
    } finally {
        await client.end();
    }
}
findOtherHeads();
