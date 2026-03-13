import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkMapping() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const tenantId = 'f86cde40-620b-401a-b06e-05f2c34635ca'; // GMCA Trust
        console.log(`--- Checking CoA for Tenant: ${tenantId} ---`);
        const { rows: coaRows } = await client.query(`SELECT account_id, full_account_code, account_name, object_head FROM public.fin_coa WHERE tenant_id = '${tenantId}'`);
        console.log("CoA Entries:", coaRows);

        console.log("\n--- Checking Sub-Objectives ---");
        const { rows: subRows } = await client.query(`SELECT subobjective_id, object_head_code, subobjective_name_en FROM public.object_heads_subobjective LIMIT 10`);
        console.log("Sub-Objectives Sample:", subRows);

        // Verify if every sub-objective's object_head_code exists in CoA
        const uniqueObjectHeadsInCoA = [...new Set(coaRows.map(r => String(r.object_head).trim()))];
        console.log("\nUnique Object Heads in CoA:", uniqueObjectHeadsInCoA);

    } catch (err) {
        console.error("MAPPING CHECK ERROR:", err.message);
    } finally {
        await client.end();
    }
}
checkMapping();
