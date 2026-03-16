import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubs() {
  const { data, error } = await supabase.from('subscriptions').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Subscriptions:', data);
  }
}

checkSubs();
