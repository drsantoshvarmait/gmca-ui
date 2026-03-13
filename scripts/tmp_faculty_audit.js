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

async function auditData() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Get GMCA ID
        const orgRes = await client.query("SELECT organisation_id FROM public.organisations WHERE organisation_code = 'GMCA' LIMIT 1");
        const orgId = orgRes.rows[0].organisation_id;

        // 2. Count actual faculty by designation
        // We'll look at the 'employee_postings' and 'posts' tables to find active faculty in GMCA
        const facultyRes = await client.query(`
        SELECT d.designation_name, COUNT(ep.employee_id) as actual_count
        FROM public.employee_postings ep
        JOIN public.posts p ON ep.post_id = p.post_id
        JOIN public.designations d ON p.designation_id = d.designation_id
        WHERE ep.organisation_id = $1 AND ep.status = 'ACTIVE'
        GROUP BY d.designation_name
    `, [orgId]);

        console.log("--- Current Faculty Counts in GMCA ---");
        console.log(JSON.stringify(facultyRes.rows, null, 2));

        // 3. Get the MSR Norms for 100 seats
        const normsRes = await client.query(`
        SELECT requirement_logic 
        FROM public.governance_regulations 
        WHERE course_name = 'MBBS' AND annual_intake = 100 AND category = 'HUMAN_RESOURCE'
    `);

        console.log("\n--- NMC MSR Norms (100 Seats) ---");
        console.log(JSON.stringify(normsRes.rows[0]?.requirement_logic, null, 2));

    } catch (err) {
        console.error("Audit failed:", err.message);
    } finally {
        await client.end();
    }
}

auditData();
