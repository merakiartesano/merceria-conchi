import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import nodemailer from "npm:nodemailer@6.9.9"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') ?? 'mail.merakiartesano.es',
    port: 465,
    secure: true,
    auth: {
      user: Deno.env.get('SMTP_USER') ?? '',
      pass: Deno.env.get('SMTP_PASS') ?? '',
    },
    tls: { rejectUnauthorized: false },
  })
  await transporter.sendMail({
    from: `"Meraki ArteSano" <${Deno.env.get('SMTP_USER')}>`,
    to,
    subject,
    html,
  })
}

function buildCartReminderEmail(order: any): string {
  const itemsHtml = (order.order_items ?? []).map((item: any) =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">${item.quantity}x ${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('')

  const subtotal = (order.order_items ?? []).reduce((sum: number, i: any) => sum + i.price * i.quantity, 0)

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tienes artículos en tu carrito</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#ff9900,#ffb347);padding:36px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🧶</div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">¡Olvidaste algo!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Tienes artículos esperándote en tu carrito</p>
        </td></tr>

        <!-- Personal greeting -->
        <tr><td style="padding:28px 32px 0;">
          <p style="font-size:16px;color:#334155;line-height:1.6;margin:0;">
            Hola <strong>${order.customer_name}</strong>,<br><br>
            Parece que dejaste incompleta tu compra en <strong>Meraki ArteSano</strong>. ¡No pasa nada! Tus artículos siguen disponibles y nos encantaría que los llevaras a casa.
          </p>
        </td></tr>

        <!-- Items reminder -->
        <tr><td style="padding:20px 32px 0;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Lo que tenías en el carrito</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            ${itemsHtml}
            <tr style="background:#f8fafc;">
              <td style="padding:12px;font-weight:700;color:#0f172a;">Subtotal</td>
              <td style="padding:12px;font-weight:700;color:#0f172a;text-align:right;">€${subtotal.toFixed(2)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA Button -->
        <tr><td style="padding:28px 32px;text-align:center;">
          <a href="https://merakiartesano.es/tienda" style="display:inline-block;background:#ff9900;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:50px;text-decoration:none;box-shadow:0 4px 14px rgba(255,153,0,0.4);">
            Completar mi compra →
          </a>
          <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">Si ya no te interesa, no tienes que hacer nada.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">¿Tienes alguna duda? Escríbenos a <a href="mailto:hola@merakiartesano.es" style="color:#b2dfdb;font-weight:600;">hola@merakiartesano.es</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">Meraki ArteSano · El arte de crear con tus propias manos</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find orders that have been 'Pendiente' for more than 2 hours and less than 24 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: pendingOrders, error } = await supabaseAdmin
      .from('orders')
      .select(`*, order_items(id, name, price, quantity)`)
      .eq('status', 'Pendiente')
      .lt('created_at', twoHoursAgo)       // older than 2 hours
      .gt('created_at', twentyFourHoursAgo) // but not older than 24 hours (to avoid spam)
      .is('reminder_sent_at', null)         // haven't already sent a reminder

    if (error) throw error

    const results: string[] = []
    for (const order of (pendingOrders ?? [])) {
      if (!order.customer_email) continue

      try {
        const html = buildCartReminderEmail(order)
        await sendEmail(
          order.customer_email,
          '🧶 ¡Tienes artículos esperándote! — Meraki ArteSano',
          html
        )

        // Mark reminder as sent so we don't spam
        await supabaseAdmin
          .from('orders')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', order.id)

        results.push(`✅ Reminder sent to ${order.customer_email}`)
        console.log(`✅ Cart reminder sent to: ${order.customer_email}`)
      } catch (emailErr) {
        results.push(`❌ Failed for ${order.customer_email}: ${emailErr.message}`)
        console.error(`Error sending reminder to ${order.customer_email}:`, emailErr)
      }
    }

    return new Response(
      JSON.stringify({ processed: pendingOrders?.length ?? 0, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    console.error('Cart reminder error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
