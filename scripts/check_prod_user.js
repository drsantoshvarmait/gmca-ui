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

async function checkUser() {
    console.log("Connecting to production DB to check user...");
    const client = new Client(config);
    try {
        await client.connect();
        
        // Check if user exists in auth.users
        const res = await client.query("SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'drsantoshvarmait@gmail.com'");
        if (res.rows.length > 0) {
            console.log("User found in auth.users:", res.rows[0]);
        } else {
            console.log("User NOT found in auth.users.");
        }

        // Also check profiles
        const res2 = await client.query("SELECT * FROM public.profiles WHERE email = 'drsantoshvarmait@gmail.com'");
        if (res2.rows.length > 0) {
            console.log("Profile found in public.profiles.");
        } else {
            console.log("Profile NOT found in public.profiles.");
        }

    } catch (err) {
        console.error("DB Error:", err.message);
    } finally {
        await client.end();
    }
}

checkUser();
