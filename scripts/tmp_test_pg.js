import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function test() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        console.log("Testing connection...");
        await client.connect();
        const res = await client.query("SELECT 1 as test");
        console.log("RESULT:", res.rows);
    } catch (err) {
        console.error("TEST ERROR:", err.message);
    } finally {
        await client.end();
    }
}
test();
