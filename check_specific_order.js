const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parse of .env.local to get VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const envText = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.log("Could not find Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
  const redsysOrderId = '775659679432';
  console.log(`Checking order ${redsysOrderId}...`);
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, redsys_order_id, created_at')
    .eq('redsys_order_id', redsysOrderId);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Order Data:", JSON.stringify(data, null, 2));
  }
}

checkOrder();
