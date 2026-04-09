import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function fn() {
  const {data, error} = await supabase.from('subscriptions').select('*').limit(1);
  console.log(data, error);
  process.exit(0);
}
fn();
