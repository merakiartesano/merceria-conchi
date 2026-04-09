import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, userEmail, shippingAddress, price = 32 } = await req.json()

    if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const origin = req.headers.get('origin') ?? 'https://merakiartesano.es'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userId,
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Club Meraki ArteSano - Cuota Mensual',
              description: 'Acceso a la academia y kit sorpresa mensual',
            },
            unit_amount: Math.round(price * 100),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Store shipping data in metadata so webhook can pick it up
      metadata: {
        shipping_name: shippingAddress.name,
        shipping_phone: shippingAddress.phone,
        shipping_line1: shippingAddress.line1,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_postal_code: shippingAddress.postal_code,
        shipping_country: shippingAddress.country,
      },
      success_url: `${origin}/pedido-confirmado?type=subscription`,
      cancel_url: `${origin}/clases`,
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      },
    )
  } catch (error: any) {
    console.error('Error creating subscription session:', error)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
