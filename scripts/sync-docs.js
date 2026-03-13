import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncDocs() {
    console.log('📖 Starting Documentation Sync...');

    const docsPath = path.resolve(process.cwd(), 'DOCUMENTATION.md');
    if (!fs.existsSync(docsPath)) {
        console.error('DOCUMENTATION.md not found in root directory');
        return;
    }

    const content = fs.readFileSync(docsPath, 'utf8');

    // We split the documentation into logical sections for the database
    // In a real implementation, we could parse headers.
    // For now, we'll sync the whole thing as a primary record.

    const { data, error } = await supabase
        .from('meta_docs')
        .upsert({
            doc_title: 'Project Technical Documentation',
            doc_category: 'TECHNICAL_REFERENCE',
            doc_content: content,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'doc_title'
        });

    if (error) {
        console.error('Error syncing docs:', error);
    } else {
        console.log('✅ Documentation synced to meta_docs table successfully.');
    }
}

syncDocs();
