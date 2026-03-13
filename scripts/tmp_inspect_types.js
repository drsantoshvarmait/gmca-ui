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

        console.log("--- Organisation Table ---");
        const orgCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organisations'");
        console.log(JSON.stringify(orgCols.rows, null, 2));

        console.log("\n--- Organisation Type Table ---");
        const typeCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organisation_types'");
        console.log(JSON.stringify(typeCols.rows, null, 2));

        console.log("\n--- Workflow Table ---");
        const flowCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sop_workflow'");
        console.log(JSON.stringify(flowCols.rows, null, 2));

    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await client.end();
    }
}

inspectSchema();
