import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

async function setupRPCs() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Merge Organisation Types
        // We need to move references from source to target in:
        // - organisations
        // - org_type_designations
        // Then delete the source.
        console.log("Setting up merge_organisation_types RPC...");
        await client.query(`
            CREATE OR REPLACE FUNCTION merge_organisation_types(source_id UUID, target_id UUID)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                -- Update organisations
                UPDATE organisations SET organisation_type_id = target_id WHERE organisation_type_id = source_id;
                
                -- Update org_type_designations (Handle ON CONFLICT by doing nothing, then deleting duplicates)
                -- We basically insert everything from source to target, ON CONFLICT DO NOTHING, then delete source
                INSERT INTO org_type_designations (organisation_type_id, designation_id)
                SELECT target_id, designation_id FROM org_type_designations WHERE organisation_type_id = source_id
                ON CONFLICT (organisation_type_id, designation_id) DO NOTHING;
                
                DELETE FROM org_type_designations WHERE organisation_type_id = source_id;

                -- Finally, delete the source organisation_type
                DELETE FROM organisation_types WHERE organisation_type_id = source_id;
            END;
            $$;
        `);

        // 2. Merge Designations
        // We need to move references from source to target in:
        // - employees
        // - org_type_designations
        // Then delete the source.
        console.log("Setting up merge_designations RPC...");
        await client.query(`
            CREATE OR REPLACE FUNCTION merge_designations(source_id UUID, target_id UUID)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                -- Update employees (assuming they have designation_id)
                UPDATE employees SET designation_id = target_id WHERE designation_id = source_id;
                
                -- Update org_type_designations
                INSERT INTO org_type_designations (organisation_type_id, designation_id)
                SELECT organisation_type_id, target_id FROM org_type_designations WHERE designation_id = source_id
                ON CONFLICT (organisation_type_id, designation_id) DO NOTHING;
                
                DELETE FROM org_type_designations WHERE designation_id = source_id;

                -- Finally, delete the source designation
                DELETE FROM designations WHERE designation_id = source_id;
            END;
            $$;
        `);

        console.log("RPC setup complete!");

    } catch (err) {
        console.error("Error setting up RPCs:", err);
    } finally {
        await client.end();
    }
}

setupRPCs();
