const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mnbngmdjiszyowfvnzhk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTY0ODAsImV4cCI6MjA4MjU3MjQ4MH0.AIvvGxd_iQKpQDbmOBoe4yAmii1IpB92Pp7Scs8Lz7U';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSync() {
    console.log("Checking last updated characters...");
    const { data, error } = await supabase
        .from('characters')
        .select('name, updated_at, server_id')
        .order('updated_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Recent updates:", JSON.stringify(data, null, 2));
    }
}

checkSync();
