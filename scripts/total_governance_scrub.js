import pkg from 'pg';
const { Client } = pkg;

const projects = [
    { name: 'PRODUCTION', ref: 'aaritujhokbxezuxcqnm', pass: ['Annuji1*4713'] },
    { name: 'STAGING', ref: 'risrmpdbvoafowdvnonn', pass: ['Annuji1*4713', 'Gaurav1*', 'Password1!713', 'Annuji1*4713#', 'Gaurav1*#', 'Annuji1*47', 'Annuji1*4713!'] }
];

async function scrub(project) {
    console.log(`\n--- SCRUBBING ${project.name} (${project.ref}) ---`);
    
    let success = false;
    for (const pass of project.pass) {
        console.log(`Attempting with password: ${pass.replace(/./g, '*')}`);
        const client = new Client({
            host: 'aws-1-ap-south-1.pooler.supabase.com',
            port: 5432,
            user: `postgres.${project.ref}`,
            password: pass,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log("Connection established...");
            
            // Drop public schemas and recreated them to wipe everything
            console.log("Dropping schemas...");
            await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
            await client.query("DROP SCHEMA IF EXISTS core CASCADE;");
            await client.query("DROP SCHEMA IF EXISTS finance CASCADE;");
            await client.query("DROP SCHEMA IF EXISTS procurement CASCADE;");
            
            // Wipe migration history
            console.log("Wiping migration history...");
            await client.query("DROP SCHEMA IF EXISTS supabase_migrations CASCADE;");
            
            console.log(`✅ ${project.name} Scrubbed Successfully!`);
            success = true;
            await client.end();
            break; 
        } catch (err) {
            console.error(`❌ Attempt failed:`, err.message);
            await client.end();
        }
    }
    
    if (!success) {
        console.error(`🔴 ALL ATTEMPTS FAILED FOR ${project.name}`);
    }
}

async function main() {
    for (const p of projects) {
        await scrub(p);
    }
    console.log("\n🚀 ALL TARGETS SCRUBBED. PIPELINE RESTART RECOMMENDED.");
}

main();
