import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findTestSubs() {
    const { data: subs, error } = await supabase
        .from('subscriptions')
        .select(`
            id, 
            status, 
            current_period_end, 
            redsys_order_id, 
            redsys_identifier,
            user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error:', error);
        return;
    }

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', subs.map(s => s.user_id));

    const enriched = subs.map(s => ({
        ...s,
        profile: profiles?.find(p => p.id === s.user_id)
    }));

    console.dir(enriched, { depth: null });
}

findTestSubs();
