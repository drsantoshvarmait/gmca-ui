import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        
        console.log("\n--- SEARCHING FOR tenants TABLE ---");
        const res = await client.query(`
            SELECT table_schema, table_name, table_type 
            FROM information_schema.tables 
            WHERE table_name = 'tenants'
        `);
        res.rows.forEach(r => console.log(`- [${r.table_schema}] ${r.table_name} (${r.table_type})`));

        console.log("\n--- SEARCHING FOR organisations TABLE ---");
        const res2 = await client.query(`
            SELECT table_schema, table_name, table_type 
            FROM information_schema.tables 
            WHERE table_name = 'organisations'
        `);
        res2.rows.forEach(r => console.log(`- [${r.table_schema}] ${r.table_name} (${r.table_type})`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
