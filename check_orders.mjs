import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('orders')
        .select(`
            id, 
            is_academy_renewal,
            order_items!inner(
                product_id,
                price
            )
        `)
        .eq('customer_email', 'raulyecla88@gmail.com')
        .limit(20);
    console.dir(data, { depth: null });
}
check();
