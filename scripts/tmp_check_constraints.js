import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkConstraints() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Column Constraints for item_categories ---");
        const { rows: catCols } = await client.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'item_categories'");
        console.log(catCols);

        console.log("\n--- Column Constraints for items ---");
        const { rows: itemCols } = await client.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'items'");
        console.log(itemCols);

        console.log("\n--- My User Context ---");
        const { data: user } = await client.query("SELECT * FROM public.user_tenants LIMIT 1");
        console.log(user);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
checkConstraints();
