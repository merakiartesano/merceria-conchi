import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncSubscriptions() {
  const customerIds = ['cus_U9x40fdZ2KgZXK', 'cus_U7z7oju21O8pqO'];

  for (const customerId of customerIds) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const currentPeriodEndISO = new Date(sub.current_period_end * 1000).toISOString();
        
        console.log(`Syncing customer ${customerId}: Ends ${currentPeriodEndISO}`);
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ current_period_end: currentPeriodEndISO })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error(`Failed to update DB for ${customerId}:`, error);
        } else {
          console.log(`Success DB update for ${customerId}`);
        }
      } else {
        console.log(`No active subscriptions found for ${customerId}`);
      }
    } catch (e) {
      console.error(`Error processing ${customerId}:`, e.message);
    }
  }
}

syncSubscriptions();
