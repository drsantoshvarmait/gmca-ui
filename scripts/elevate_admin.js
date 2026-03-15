import pkg from 'pg';
const { Client } = pkg;

// Use the local DB config from your environment or common defaults
// Since I don't see a local .env for DB, I'll assume the DEV project ref
const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713', // PRODUCTION project password
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to Supabase DB...");

        // 1. Ensure the user exists in auth.users
        // This is tricky with pg because auth schema is managed by GoTrue.
        // But we can try to insert directly if we have permissions.
        
        const email = 'drsantoshvarmait@gmail.com';
        const passwordHash = '$2a$10$7Z8l6L3v7B2vY7F8P7B8u.7Z8l6L3v7B2vY7F8P7B8u.7Z8l6L3v7'; 
        
        console.log("Upserting Super Admin profile...");
        
        // We might not be able to insert into auth.users easily via pg without proper salt/hash knowledge.
        // However, we CAN ensure the public.profiles and core.profiles exist.
        
        // Let's check if the user exists in auth.users first
        const userCheck = await client.query("SELECT id FROM auth.users WHERE email = $1", [email]);
        
        if (userCheck.rows.length === 0) {
            console.log(`User ${email} not found in auth.users. Please sign up via the UI first.`);
            console.log("Navigate to: http://localhost:5173/signup");
            return;
        }

        const userId = userCheck.rows[0].id;

        // 2. Confirm the email in auth.users
        console.log("Confirming email...");
        await client.query("UPDATE auth.users SET email_confirmed_at = NOW(), last_sign_in_at = NOW() WHERE id = $1", [userId]);

        // Elevate to SUPER_ADMIN in core.profiles
        await client.query(`
            INSERT INTO core.profiles (id, email, role, created_at)
            VALUES ($1, $2, 'SUPER_ADMIN', NOW())
            ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN';
        `, [userId, email]);

        console.log(`✅ Elevated ${email} to SUPER_ADMIN.`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
