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
        
        console.log("\n--- PUBLIC.TENANTS COLUMNS ---");
        const res1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants'");
        res1.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

        console.log("\n--- CORE.TENANTS COLUMNS ---");
        const res2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'tenants'");
        res2.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
