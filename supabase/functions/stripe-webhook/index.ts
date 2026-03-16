import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Stripe from "https://esm.sh/stripe@14.14.0"
import nodemailer from "npm:nodemailer@6.9.9"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  // This is needed to use the Fetch API rather than Node's http client
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Helper: send email via SMTP (nodemailer - works with AloOnline/Plesk)
async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') ?? 'mail.merakiartesano.es',
    port: 465,
    secure: true, // port 465 = SSL directo
    auth: {
      user: Deno.env.get('SMTP_USER') ?? '',
      pass: Deno.env.get('SMTP_PASS') ?? '',
    },
    tls: { rejectUnauthorized: false }, // acepta certificados de hosting compartido
  })
  try {
    await transporter.sendMail({
      from: `"Meraki ArteSano" <${Deno.env.get('SMTP_USER')}>`,
      to,
      subject,
      html,
    })
    console.log(`✅ Email enviado a: ${to}`)
  } catch (emailErr) {
    console.error('❌ Error enviando email:', emailErr)
  }
}


// HTML template for subscription welcome email
function buildSubscriptionWelcomeEmail(email: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenida a la Academia</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f9a8d4,#6ee7b7);padding:40px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">¡Bienvenida a la Academia! 🧵</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Ya eres parte de la comunidad Meraki ArteSano</p>
        </td></tr>
        <tr><td style="padding:32px 32px 0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 24px;">
            Tu suscripción está activa. Accede al portal para ver el enlace Zoom de la próxima clase y los materiales del proyecto de esta semana.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://merakiartesano.es/academia" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff;text-decoration:none;padding:16px 36px;border-radius:30px;font-size:17px;font-weight:700;display:inline-block;box-shadow:0 4px 14px rgba(245,158,11,0.35);">Ir a mi Academia →</a>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;border-left:4px solid #6ee7b7;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:14px;color:#475569;font-weight:600;">¿Qué hacer ahora?</p>
            <ol style="margin:0;padding-left:20px;color:#64748b;font-size:14px;line-height:2;">
              <li>Accede al portal con tu correo y contraseña</li>
              <li>Consulta el título y el enlace Zoom de la próxima clase</li>
              <li>Prepara los materiales que indicará Conchi</li>
              <li>¡Conecta a la clase y disfruta!</li>
            </ol>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">Meraki ArteSano · <a href="https://merakiartesano.es" style="color:#94a3b8;">merakiartesano.es</a></p>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">Puedes gestionar o cancelar tu suscripción desde el portal en cualquier momento.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// HTML template for order confirmation
function buildOrderConfirmationEmail(order: any): string {
  const itemsHtml = (order.order_items ?? []).map((item: any) =>
    `<tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">${item.quantity}x ${item.name}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#64748b;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('')

  const subtotal = (order.order_items ?? []).reduce((sum: number, i: any) => sum + i.price * i.quantity, 0)
  const shipping = Math.max(0, Number(order.total_amount) - subtotal)
  const addr = order.shipping_address ?? {}

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmación de pedido</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#b2dfdb,#80cbc4);padding:40px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">¡Gracias por tu compra!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Tu pedido ha sido confirmado y está siendo preparado</p>
        </td></tr>
        <tr><td style="padding:28px 32px 0;">
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;border-left:4px solid #b2dfdb;">
            <p style="margin:0;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a;font-family:monospace;">#${String(order.id).substring(0,8).toUpperCase()}</p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Artículos comprados</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            ${itemsHtml}
            <tr style="background:#f8fafc;"><td style="padding:10px 12px;font-size:14px;color:#64748b;">Subtotal artículos</td><td style="padding:10px 12px;text-align:right;color:#64748b;">€${subtotal.toFixed(2)}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:10px 12px;font-size:14px;color:#64748b;">Gastos de envío</td><td style="padding:10px 12px;text-align:right;color:#64748b;">€${shipping.toFixed(2)}</td></tr>
            <tr><td style="padding:14px 12px;font-size:16px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;">Total pagado</td><td style="padding:14px 12px;font-size:16px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;text-align:right;">€${Number(order.total_amount).toFixed(2)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Datos de entrega</h3>
          <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;font-size:14px;color:#334155;line-height:1.7;">
            <strong style="color:#0f172a;">${order.customer_name}</strong><br>
            ${addr.line1 ?? ''}<br>${addr.postal_code ?? ''} ${addr.city ?? ''}<br>
            <strong>${addr.state ?? addr.country ?? ''}</strong>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <div style="background:#fffbeb;border-radius:10px;padding:20px;text-align:center;border:1px solid #fde68a;">
            <p style="margin:0;font-size:14px;color:#92400e;">📦 <strong>Tiempo estimado de entrega:</strong> 2-5 días hábiles.</p>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">¿Tienes alguna pregunta? <a href="mailto:hola@merakiartesano.es" style="color:#b2dfdb;font-weight:600;">hola@merakiartesano.es</a></p>
          <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">Meraki ArteSano · El arte de crear con tus propias manos</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  try {
    if (!signature) {
      return new Response('Missing Stripe Signature', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message)
      return new Response(err.message, { status: 400 })
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'payment') {
        // --- PEDIDO FÍSICO PAGADO ---
        const orderId = session.client_reference_id
        if (orderId) {
          const { error } = await supabaseAdmin
            .from('orders')
            .update({ status: 'Pagado' })
            .eq('id', orderId)
            
          if (error) {
            console.error("Error updating order to Pagado:", error)
          } else {
            // Fetch order details and send confirmation email
            const { data: order } = await supabaseAdmin
              .from('orders')
              .select(`*, order_items(id, name, price, quantity)`)
              .eq('id', orderId)
              .single()

            if (order?.customer_email) {
              const emailHtml = buildOrderConfirmationEmail(order)
              await sendEmail(
                order.customer_email,
                `✅ Confirmación de tu pedido #${String(order.id).substring(0,8).toUpperCase()} — Meraki ArteSano`,
                emailHtml
              )
            }
          }
        } else {
          console.error("No client_reference_id (orderId) found for this physical payment.")
        }
      } else if (session.mode === 'subscription') {
        // --- 2) ACADEMY SUBSCRIPTION PAID ---
        let userId = session.client_reference_id

        // If Stripe dropped the client_reference_id, find the user by email
        if (!userId && session.customer_details?.email) {
          const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers()
          if (!authErr && users) {
            const user = users.find(u => u.email === session.customer_details?.email)
            if (user) {
              userId = user.id
            }
          }
        }

        if (userId) {
          // Extract shipping details from metadata if present
          const shippingDetails = session.metadata ? {
            name: session.metadata.shipping_name,
            phone: session.metadata.shipping_phone,
            line1: session.metadata.shipping_line1,
            city: session.metadata.shipping_city,
            state: session.metadata.shipping_state,
            postal_code: session.metadata.shipping_postal_code,
            country: session.metadata.shipping_country,
          } : null

          // First check if a subscription exists for this user
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()

          if (existingSub) {
            // Update existing
            const { error } = await supabaseAdmin
              .from('subscriptions')
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                status: 'active',
                shipping_details: shippingDetails
              })
              .eq('id', existingSub.id)
            if (error) console.error("Error updating subscription:", error)
          } else {
            // Insert new
            const { error } = await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                status: 'active',
                shipping_details: shippingDetails
              })
            
            if (error) {
              console.error("Error inserting subscription:", error);
            } else {
              // Send welcome email for NEW subscriptions
              const customerEmail = session.customer_details?.email
              if (customerEmail) {
                await sendEmail(
                  customerEmail,
                  '🧵 ¡Bienvenida a la Academia Meraki ArteSano!',
                  buildSubscriptionWelcomeEmail(customerEmail)
                )
              }
            }
          }
        } else {
          console.error('Webhook failed to find associated user for email:', session.customer_details?.email);
        }
      }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status
        })
        .eq('stripe_customer_id', customerId)

      if (error) throw error
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Error handling webhook:', err)
    return new Response(err.message, { status: 500 })
  }
})
