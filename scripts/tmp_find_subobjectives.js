import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function findSubObjectives() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Searching for Relevant Sub-Objectives ---");
        const { rows } = await client.query("SELECT * FROM public.object_heads_subobjective WHERE subobjective_name_en ILIKE '%Medicine%' OR subobjective_name_en ILIKE '%Supplies%'");
        console.log(rows);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
findSubObjectives();
