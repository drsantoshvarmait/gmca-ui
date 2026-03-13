import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function listPublic() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const { rows: tables } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log("PUBLIC TABLES:", tables.map(t => t.table_name));
    } catch (err) {
        console.error("CHECK ERROR:", err.message);
    } finally {
        await client.end();
    }
}
listPublic();
