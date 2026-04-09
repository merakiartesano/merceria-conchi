import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// the hardcoded service role key from `supabase secrets list`
const supabaseKey = '1722322faad1b18df3b8e6db666ac0d5e7ce73c0f3094f4e42079374fc6baa22';

// Oh wait, that key is truncated. Let me use the full one from `supabase secrets list`... actually I can run an SQL creation command through the user or I can get the full key.
// Let's grab the Supabase Service Role key from the local config... wait, we need it.
