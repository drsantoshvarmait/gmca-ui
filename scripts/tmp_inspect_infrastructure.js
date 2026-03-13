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

const client = new Client(config);

async function inspectSchema() {
    try {
        await client.connect();

        console.log("--- Checking for Org Units/Infrastructure Tables ---");
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('departments', 'organisation_units', 'wards', 'operating_theatres', 'inventory', 'assets', 'equipment')");
        console.log(JSON.stringify(tables.rows, null, 2));

        // Let's also check departments columns to see if it doubles as infrastructure
        console.log("\n--- Checking Departments Columns ---");
        const depCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments'");
        console.log(JSON.stringify(depCols.rows, null, 2));

    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await client.end();
    }
}

inspectSchema();
