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
        
        console.log("\n--- PUBLIC SCHEMA TABLES ---");
        const resPublic = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        resPublic.rows.forEach(r => console.log(`- ${r.table_name}`));

        console.log("\n--- CORE SCHEMA TABLES ---");
        const resCore = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'core'");
        resCore.rows.forEach(r => console.log(`- ${r.table_name}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
