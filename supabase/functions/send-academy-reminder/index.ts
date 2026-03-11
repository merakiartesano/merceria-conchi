import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import nodemailer from "npm:nodemailer@6.9.9"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Client for auth check
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })
    
    // Admin client to bypass RLS to read all profiles
    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey)

    // 2. Authenticate the admin user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Fetch Academy Settings (Live Title and Link)
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('academy_settings')
      .select('live_title, live_link')
      .eq('id', 1)
      .single()

    if (settingsError || !settings?.live_link || !settings?.live_title) {
      return new Response(JSON.stringify({ error: 'Configuración de clase no encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Fetch all active subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    if (subsError || !subscriptions?.length) {
      return new Response(JSON.stringify({ message: 'No hay suscriptoras activas' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userIds = subscriptions.map((s: any) => s.user_id)

    // 5. Fetch profiles associated with active subscriptions
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name')
      .in('id', userIds)

    if (profilesError || !profiles?.length) {
      return new Response(JSON.stringify({ error: 'Error obteniendo perfiles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Setup Email Transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') ?? 'merakiartesano.es',
      port: 465,
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER') ?? '',
        pass: Deno.env.get('SMTP_PASS') ?? '',
      },
      tls: { rejectUnauthorized: false },
    })

    // 7. Send Emails
    const emailPromises = profiles.map(async (profile: any) => {
      if (!profile.email) return

      const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recordatorio de Clase</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f59e0b,#fbbf24);padding:40px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">¡Recordatorio de Clase! 🧵</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.95);font-size:16px;">Academia Meraki ArteSano</p>
        </td></tr>
        <tr><td style="padding:32px 32px 0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 20px;">Hola ${profile.first_name || ''},</p>
          <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 24px;">¡Te recordamos que tenemos nuestra próxima clase en directo preparada! Aquí tienes los detalles:</p>
          
          <div style="background:#f8fafc;border-radius:10px;padding:24px;border-left:4px solid #f59e0b;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Proyecto Actual</p>
            <p style="margin:0 0 24px;font-size:18px;color:#0f172a;font-weight:700;">${settings.live_title}</p>
            
            <a href="${settings.live_link}" style="background:#10b981;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;box-shadow:0 4px 14px rgba(16,185,129,0.3);">🟢 Entrar a la Clase (Zoom)</a>
          </div>
          
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">Si no puedes asistir al directo, no te preocupes. Recuerda que subiremos la clase grabada al portal en las próximas horas.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:14px;color:#64748b;">Meraki ArteSano · <a href="https://merakiartesano.es" style="color:#b2dfdb;font-weight:600;text-decoration:none;">merakiartesano.es</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      return transporter.sendMail({
        from: `"Meraki ArteSano" <${Deno.env.get('SMTP_USER')}>`,
        to: profile.email,
        subject: `🧵 Próxima Clase: ${settings.live_title}`,
        html: html,
      }).catch(err => {
        console.error(`Error sending email to ${profile.email}:`, err)
      })
    })

    await Promise.allSettled(emailPromises)

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Recordatorios enviados a ${profiles.length} alumnas` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
