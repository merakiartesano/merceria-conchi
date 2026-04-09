import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config({ path: './supabase/.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function checkWebhookDeliveries() {
  try {
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      limit: 1,
    });
    
    if (events.data.length > 0) {
      const evtId = events.data[0].id;
      // Stripe does not currently expose a simple "list webhook deliveries by event" in the standard SDK easily without raw request
      const endpoints = await stripe.webhookEndpoints.list({limit: 10});
      console.log("Registered Endpoints:");
      for (const ep of endpoints.data) {
        console.log(`- ID: ${ep.id} | URL: ${ep.url} | Status: ${ep.status}`);
      }
      
      // We can list webhook endpoint deliveries via events by retrieving the event
      const retrieved = await stripe.events.retrieve(evtId);
      console.log(`Event ${evtId} retrieve:`, retrieved.pending_webhooks);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkWebhookDeliveries();
