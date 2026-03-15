import pkg from 'pg';
const { Client } = pkg;

const PROD_CONFIG = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function checkBlueprintMapping() {
    const client = new Client(PROD_CONFIG);
    try {
        await client.connect();
        
        console.log("--- SOP WORKFLOWS ---");
        const resWorkflows = await client.query(`SELECT workflow_id, workflow_name, scope, is_template FROM public.sop_workflow LIMIT 5`);
        console.table(resWorkflows.rows);

        console.log("\n--- SOP STEPS ---");
        const resSteps = await client.query(`SELECT sop_step_id, sop_id, step_description, designation_id FROM public.sop_step LIMIT 5`);
        console.table(resSteps.rows);

        console.log("\n--- TASKS ---");
        const resTasks = await client.query(`SELECT id, title, sop_step_id FROM task.tasks LIMIT 5`);
        console.table(resTasks.rows);

        console.log("\n--- DESIGNATIONS ---");
        const resDes = await client.query(`SELECT designation_id, designation_name FROM public.designations LIMIT 5`);
        console.table(resDes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkBlueprintMapping();
