import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkReferences() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("--- Checking Foreign Key References for 'object_heads' ---");
        const query = `
            SELECT 
                tc.table_schema, 
                tc.table_name, 
                kcu.column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'object_heads';
        `;
        const { rows } = await client.query(query);
        console.log("References to object_heads:", rows);

        console.log("\n--- Checking Foreign Key References for 'object_heads_subobjective' ---");
        const { rows: rowsSub } = await client.query(query.replace("'object_heads'", "'object_heads_subobjective'"));
        console.log("References to object_heads_subobjective:", rowsSub);

    } catch (err) {
        console.error("CHECK ERROR:", err.message);
    } finally {
        await client.end();
    }
}
checkReferences();
