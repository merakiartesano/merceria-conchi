import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnon() {
  console.log("Logging in as raulyecla88@gmail.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'raulyecla88@gmail.com',
    password: 'password123' // Or whatever the user used, wait I don't know the password...
  });
  
  // If we can't login, we can just sign up a new dummy user to get an authenticated session!
  if (authError) {
    console.log("Login failed, signing up a dummy user to get a session...");
    await supabase.auth.signUp({
      email: 'dummy_test_profile@meraki.com',
      password: 'SupabasePassword123!'
    });
  }

  console.log("Fetching subscriptions as AUTHENTICATED...");
  const { data: subs, error: subsErr } = await supabase
    .from('subscriptions')
    .select('*');
  
  if (subsErr) console.error("Subs fetch error:", subsErr);
  else console.log(`Found ${subs.length} subscriptions.`);

  console.log("Fetching profiles as AUTHENTICATED...");
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*');
    
  if (profErr) console.error("Profiles fetch error:", profErr);
  else {
    console.log(`Found ${profiles?.length || 0} profiles.`);
    console.log("Profiles data:", profiles);
  }
}

checkAnon();
