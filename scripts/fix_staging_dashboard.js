import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: 'Gaurav1*', 
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to Staging DB successfully!");

        // Check if profiles table exists
        const res = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');");
        const exists = res.rows[0].exists;
        console.log("public.profiles exists:", exists);

        if (!exists) {
            console.log("Creating public.profiles table...");
            await client.query(`
                CREATE TABLE IF NOT EXISTS public.profiles (
                    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
                    email TEXT,
                    full_name TEXT,
                    avatar_url TEXT,
                    preferred_language TEXT DEFAULT 'en',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
                CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
                CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
                CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
            `);
            console.log("✅ public.profiles created.");
        }

        // Check v_notifications
        const res2 = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'v_notifications');");
        const vExists = res2.rows[0].exists;
        console.log("public.v_notifications exists:", vExists);

        if (!vExists) {
            console.log("Attempting to create a basic v_notifications view if possible...");
            // Usually this requires core tables. If they are missing, this might fail.
            // But let's at least try to fix the 404s.
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
