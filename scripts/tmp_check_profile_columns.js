import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkProfileColumns() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const { rows } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public'");
        console.log("Columns in profiles:", rows.map(r => r.column_name));

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
checkProfileColumns();
