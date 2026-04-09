import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function fn() {
  const {data, error} = await supabase.from('subscriptions').insert({user_id: '123e4567-e89b-12d3-a456-426614174000', status: 'active', current_period_end: new Date().toISOString(), redsys_order_id: 'test' });
  console.log('ERROR:', error);
  process.exit(0);
}
fn();
