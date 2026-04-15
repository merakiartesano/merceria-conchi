import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import forge from "npm:node-forge@1.3.1";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Email Helper ─────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") ?? "mail.merakiartesano.es",
    port: 465,
    secure: true,
    auth: {
      user: Deno.env.get("SMTP_USER") ?? "",
      pass: Deno.env.get("SMTP_PASS") ?? "",
    },
    tls: { rejectUnauthorized: false },
  });
  try {
    await transporter.sendMail({
      from: `"Meraki ArteSano" <${Deno.env.get("SMTP_USER")}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("❌ Error enviando email:", err);
  }
}

// ─── Redsys Signature Helpers ──────────────────────────────────────────────────

function deriveKey3DES(secretKeyB64: string, orderId: string): string {
  const keyBytes = forge.util.decode64(secretKeyB64);
  const padLen = (8 - (orderId.length % 8)) % 8;
  const orderPadded = orderId.padEnd(orderId.length + padLen, "\0");

  const cipher = forge.cipher.createCipher("3DES-CBC", forge.util.createBuffer(keyBytes));
  cipher.start({ iv: forge.util.createBuffer("\0\0\0\0\0\0\0\0") });
  
  // @ts-ignore
  cipher.mode.pad = function() { return true; };
  // @ts-ignore
  cipher.mode.unpad = function() { return true; };

  cipher.update(forge.util.createBuffer(orderPadded));
  cipher.finish();

  return cipher.output.getBytes();
}

function generateRedsysSignatureREST(secretKey: string, merchantParametersB64: string, orderId: string): string {
  const derivedKeyStr = deriveKey3DES(secretKey, orderId);
  const hmac = forge.hmac.create();
  hmac.start("sha256", derivedKeyStr);
  hmac.update(merchantParametersB64);
  return forge.util.encode64(hmac.digest().getBytes());
}

// ─── Main Logic ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const secretKey = Deno.env.get("REDSYS_SECRET_KEY") ?? "";
  const merchantCode = Deno.env.get("REDSYS_MERCHANT_CODE") ?? "";
  const terminal = Deno.env.get("REDSYS_TERMINAL") ?? "1";
  const env = Deno.env.get("REDSYS_ENV") ?? "test"; // 'test' o 'prod'
  const endpoint = env === "prod" 
    ? "https://sis.redsys.es/sis/rest/trataPeticionREST" 
    : "https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST";

  try {
    // 1. Obtener precio de la academia
    const { data: settings } = await supabaseAdmin.from("academy_settings").select("subscription_price").eq("id", 1).single();
    const price = parseFloat(settings?.subscription_price || "50.0");
    const amountCents = Math.round(price * 100).toString();

    // 2. Buscar suscripciones activas expiradas
    const now = new Date().toISOString();
    const { data: expiredSubs, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("current_period_end", now)
      .not("redsys_identifier", "is", null);

    if (subsError) throw subsError;

    // Obtener perfiles para los usuarios encontrados
    const userIds = expiredSubs?.map(s => s.user_id) || [];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);

    // Mapear perfiles a las suscripciones
    const subsWithProfiles = expiredSubs?.map(sub => ({
      ...sub,
      profiles: profiles?.find(p => p.id === sub.user_id) || null
    })) || [];

    // Ajustar nombres para la lógica existente
    subsWithProfiles.forEach(s => {
      if (s.profiles) {
        // @ts-ignore
        s.profiles.full_name = `${s.profiles.first_name || ""} ${s.profiles.last_name || ""}`.trim();
      }
    });

    console.log(`🔍 Encontradas ${subsWithProfiles.length} suscripciones para renovar.`);

    const results = [];

    for (const sub of subsWithProfiles) {
      // Evitar órdenes duplicadas en el mismo día si algo falla
      const orderId = `RENEW${String(Date.now()).substring(5)}${sub.id.substring(0, 4)}`.substring(0, 12);

      const params = {
        DS_MERCHANT_AMOUNT: amountCents,
        DS_MERCHANT_ORDER: orderId,
        DS_MERCHANT_MERCHANTCODE: merchantCode,
        DS_MERCHANT_TERMINAL: terminal,
        DS_MERCHANT_CURRENCY: "978",
        DS_MERCHANT_TRANSACTIONTYPE: "0", // Autorización estándar
        DS_MERCHANT_IDENTIFIER: sub.redsys_identifier,
        DS_MERCHANT_DIRECTPAYMENT: "true",
        DS_MERCHANT_COF_INI: "N", // Operación sucesiva (no inicial)
        DS_MERCHANT_COF_TYPE: "R", // Tipo Recurrente
        DS_MERCHANT_EXCEP_SCA: "MIT" // CLAVE: Merchant Initiated Transaction (obligatorio para cobros automáticos REST)
      };

      const paramsB64 = btoa(JSON.stringify(params));
      const signature = generateRedsysSignatureREST(secretKey, paramsB64, orderId);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Ds_SignatureVersion: "HMAC_SHA256_V1",
            Ds_MerchantParameters: paramsB64,
            Ds_Signature: signature
          })
        });

        const resData = await response.json();
        
        // Decodificar respuesta de Redsys
        const resParamsB64 = resData.Ds_MerchantParameters;
        const resParams = JSON.parse(atob(resParamsB64.replace(/-/g, "+").replace(/_/g, "/")));
        const responseCode = parseInt(resParams.Ds_Response || "9999", 10);
        const isSuccess = responseCode >= 0 && responseCode <= 99;

        if (isSuccess) {
          console.log(`✅ Cobro exitoso para sub ${sub.id}. Pedido: ${orderId}`);
          
          // Ampliar al día 20 del mes siguiente para cobro unificado (UTC)
          const refNow = new Date();
          const nextPeriod = new Date(Date.UTC(refNow.getUTCFullYear(), refNow.getUTCMonth() + 1, 20, 23, 59, 59, 999));

          await supabaseAdmin.from("subscriptions").update({
            current_period_end: nextPeriod.toISOString(),
            last_payment_date: now,
            last_payment_status: 'success'
          }).eq("id", sub.id);

          // Crear pedido en la tabla orders para que Conchi lo vea
          await supabaseAdmin.from("orders").insert({
            user_id: sub.user_id,
            status: 'Pagado',
            total_amount: price,
            customer_email: sub.profiles?.email,
            customer_name: sub.profiles?.full_name,
            redsys_order_id: orderId,
            is_academy_renewal: true
          });

          results.push(`✅ ${sub.user_id}: Success`);
        } else {
          console.error(`❌ Cobro fallido para sub ${sub.id}. Código: ${responseCode}`);
          
          await supabaseAdmin.from("subscriptions").update({
            status: 'past_due',
            last_payment_status: 'failed',
            last_payment_error: `Error Redsys: ${responseCode}`
          }).eq("id", sub.id);

          // Email de aviso al alumno
          if (sub.profiles?.email) {
            await sendEmail(
              sub.profiles.email,
              "⚠️ Problema con tu suscripción a Meraki ArteSano",
              `<p>Hola,</p><p>No hemos podido procesar el cobro mensual de tu suscripción a la Academia. 
               Por favor, accede a <a href="https://merakiartesano.es/academia">tu cuenta</a> para actualizar tu método de pago y seguir disfrutando de las clases.</p>`
            );
          }

          results.push(`❌ ${sub.user_id}: Failed (${responseCode})`);
        }
      } catch (err) {
        console.error(`Error procesando sub ${sub.id}:`, err);
        results.push(`❌ ${sub.user_id}: Error`);
      }
    }

    return new Response(JSON.stringify({ processed: expiredSubs.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("Critical Error recurring payments:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
