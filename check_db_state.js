import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './supabase/.env.local' });
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We stored SUPABASE_SERVICE_ROLE_KEY in supabase/.env.local earlier, let's make sure it's loaded
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("Checking DB with Admin Key");
  
  // 1. Check if the user exists
  const targetUserId = 'cd7e42b9-03e1-45cf-89e8-2dcef8f212d0';
  const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(targetUserId);
  if (userErr) {
    console.log("Error finding user:", userErr.message);
  } else {
    console.log("User found:", user?.email);
  }

  // 2. Check all subscriptions bypassing RLS
  const { data: subs, error: subsErr } = await supabase
    .from('subscriptions')
    .select('*');
    
  if (subsErr) {
    console.error("Error fetching subscriptions:", subsErr);
  } else {
    console.log(`Found ${subs.length} total subscriptions.`);
    console.log(subs);
  }
}

checkDatabase();
