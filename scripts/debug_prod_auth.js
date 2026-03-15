// Native fetch used

const url = 'https://aaritujhokbxezuxcqnm.supabase.co/auth/v1/token?grant_type=password';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcml0dWpob2tieGV6dXhjcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg0MTUsImV4cCI6MjA4Nzk3NDQxNX0.vQuRvNYt1BfUAiBdvqJDvcx7i9aLZy06NWaMVC_Ps3w';

async function test() {
    console.log("Testing production Supabase config...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                email: 'drsantoshvarmait@gmail.com',
                password: 'Gaurav1*'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

test();
