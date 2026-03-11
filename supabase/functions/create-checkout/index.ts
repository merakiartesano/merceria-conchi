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
    const { lineItems, orderId, shippingCost = 0, shippingName = 'Gastos de envío' } = await req.json()

    if (!lineItems || lineItems.length === 0) {
        return new Response(JSON.stringify({ error: "No items in cart" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Build Stripe line items from products
    const stripeLineItems = lineItems.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    // Add shipping as a separate visible line item (if applicable)
    if (shippingCost > 0) {
      stripeLineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingName,
            description: 'Entrega estimada en 2-5 días hábiles',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      })
    }

    const origin = req.headers.get('origin') ?? 'https://merakiartesano.es'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: orderId,
      line_items: stripeLineItems,
      mode: 'payment',
      // Go directly to the confirmation page — no more home page flash
      success_url: `${origin}/pedido-confirmado`,
      cancel_url: `${origin}/checkout`,
    })


    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
