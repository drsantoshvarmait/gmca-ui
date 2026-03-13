import pkg from 'pg';
const { Client } = pkg;
const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const subjects = [
    'Anatomy', 'Physiology', 'Biochemistry',
    'Pharmacology', 'Pathology', 'Microbiology', 'Forensic Medicine', 'PSM',
    'General Medicine', 'Pediatrics', 'Dermatology', 'Psychiatry',
    'General Surgery', 'Orthopedics', 'Otorhinolaryngology', 'Ophthalmology',
    'Obstetrics & Gynaecology', 'Anesthesiology', 'Radiodiagnosis', 'Dentistry', 'Emergency Medicine'
];

const medicalDesignations = [
    'Professor', 'Associate Professor', 'Assistant Professor', 'Senior Resident', 'Junior Resident'
];

const nonTeachingDesignations = [
    'Non-Teaching - Librarian',
    'Non-Teaching - Documentalist',
    'Non-Teaching - Store Keeper',
    'Non-Teaching - Steno Typist',
    'Non-Teaching - Computer Operator',
    'Non-Teaching - Lab Technician'
];

async function run() {
    const client = new Client(config);
    try {
        await client.connect();

        let valuesString = [];

        // 1. Generate Teaching Combinations
        for (const subject of subjects) {
            for (const desig of medicalDesignations) {
                const title = `${subject} - ${desig}`;
                const code = `NMC_${subject.substring(0, 3).toUpperCase()}_${desig.substring(0, 3).toUpperCase()}`.replace(/\s/g, '');
                valuesString.push(`('${code}', '${title}', 'TEACHING_FACULTY', true, true)`);
            }
        }

        // 2. Add Non-Teaching Roles
        for (const role of nonTeachingDesignations) {
            const code = `NMC_${role.substring(0, 10).toUpperCase()}`.replace(/[\s\-]/g, '');
            valuesString.push(`('${code}', '${role}', 'NON_TEACHING', false, false)`);
        }

        const query = `
            INSERT INTO public.designations (designation_code, designation_name, designation_group, is_teaching, is_active)
            VALUES ${valuesString.join(',\n')}
            ON CONFLICT DO NOTHING;
        `;

        await client.query(query);
        console.log("Successfully seeded Global NMC Designations.");

    } catch (e) { console.error(e) }
    finally { await client.end() }
}
run();
