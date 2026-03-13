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

async function addFK() {
    const client = new Client(config);
    try {
        await client.connect();

        // Add the foreign key constraint to enable Supabase/PostgREST joins
        await client.query(`
        ALTER TABLE public.employees 
        ADD CONSTRAINT fk_employee_designation 
        FOREIGN KEY (designation_id) REFERENCES public.designations(designation_id);
    `);

        console.log("Success: Added foreign key constraint from employees to designations.");

    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

addFK();
