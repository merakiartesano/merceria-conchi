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
    host: "s2.aloonlinedns.com",
    port: 465,
    secure: true,
    auth: {
      user: Deno.env.get("SMTP_USER") ?? "",
      pass: Deno.env.get("SMTP_PASS") ?? "",
    },
    tls: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
    connectionTimeout: 15000,
  });
  try {
    await transporter.sendMail({
      from: `"Meraki ArteSano" <${Deno.env.get("SMTP_USER")}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️ Email de cancelación enviado a ${to}`);
  } catch (err) {
    console.error("❌ Error enviando email de cancelación:", err);
  }
}

function buildCancellationEmail(firstName: string, expiryDate: string): string {
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head>" +
    "<body style='margin:0;padding:0;background-color:#faf8f5;font-family:Helvetica,Arial,sans-serif;'>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#faf8f5;padding:40px 20px;'>" +
    "<tr><td align='center'>" +
    "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);'>" +
    "<tr><td style='background:linear-gradient(135deg,#f1f5f9,#cbd5e1);padding:40px 32px;text-align:center;'>" +
    "<h1 style='margin:0;color:#1e293b;font-size:28px;'>Suscripción Cancelada</h1>" +
    "<p style='margin:10px 0 0;color:#64748b;font-size:16px;'>Club Creativo Meraki ArteSano</p>" +
    "</td></tr>" +
    "<tr><td style='padding:32px;text-align:center;'>" +
    "<p style='font-size:18px;color:#1e293b;line-height:1.6;'>Hola, <strong>" + firstName + "</strong> 👋</p>" +
    "<p style='font-size:16px;color:#64748b;line-height:1.6;'>Confirmamos que hemos procesado tu solicitud de baja del Club Meraki ArteSano.</p>" +
    "<div style='background-color:#fef2f2;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #ef4444;text-align:left;'>" +
    "<p style='margin:0;font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;'>Información de acceso</p>" +
    "<p style='margin:10px 0 0;font-size:16px;color:#1e293b;'>Tu acceso seguirá activo y podrás disfrutar de todos los contenidos hasta el día:</p>" +
    "<p style='margin:8px 0 0;font-size:20px;font-weight:bold;color:#1e293b;'>" + expiryDate + "</p>" +
    "<p style='margin:12px 0 0;font-size:14px;color:#64748b;'>A partir de esa fecha, no se realizarán más cobros en tu tarjeta.</p>" +
    "</div>" +
    "<p style='font-size:16px;color:#64748b;line-height:1.6;'>Esperamos volver a verte pronto compartiendo momentos creativos con nosotros. ¡Gracias por habernos acompañado!</p>" +
    "</td></tr>" +
    "<tr><td style='background-color:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #f1f5f9;'>" +
    "<p style='margin:0;font-size:14px;color:#94a3b8;'>Si cambias de opinión, puedes volver a suscribirte en cualquier momento desde <a href='https://merakiartesano.es/academia' style='color:#80cbc4;'>tu perfil</a>.</p>" +
    "</td></tr>" +
    "</table></td></tr></table></body></html>";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const secretKey = Deno.env.get("REDSYS_SECRET_KEY") ?? "";
  const merchantCode = Deno.env.get("REDSYS_MERCHANT_CODE") ?? "";
  const terminal = Deno.env.get("REDSYS_TERMINAL") ?? "1";
  const env = Deno.env.get("REDSYS_ENV") ?? "test";
  const endpoint = env === "prod" 
    ? "https://sis.redsys.es/sis/rest/trataPeticionREST" 
    : "https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST";

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error("userId is required");

    console.log(`🚀 Iniciando proceso de cancelación para usuario: ${userId}`);

    // 1. Obtener la suscripción activa
    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("❌ Error consultando suscripción:", subError);
      throw subError;
    }
    
    if (!sub) {
      console.warn(`⚠️ No se encontró suscripción activa para el usuario ${userId}`);
      return new Response(JSON.stringify({ message: "No active subscription found" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 404 
      });
    }

    console.log(`✅ Suscripción encontrada: ${sub.id}. Redsys ID: ${sub.redsys_order_id}`);

    // 2. Obtener datos del perfil (nombre y email) por separado para evitar errores de JOIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("first_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn("⚠️ No se pudo obtener el perfil del usuario:", profileError);
    }
    
    const userEmail = profile?.email || sub.shipping_details?.email; // Fallback al email de envío si existe
    const firstName = profile?.first_name || "alumna";

    let redsysResponse = null;

    // 3. Intentar baja en el banco si hay identificador
    if (sub.redsys_identifier) {
      console.log(`🏦 Intentando baja bancaria (Borrado Tarjeta) para: ${sub.redsys_identifier}`);
      const orderId = `DEL${String(Date.now()).substring(7)}${sub.id.substring(0, 3)}`.substring(0, 12);
      
      const params = {
        DS_MERCHANT_AMOUNT: "0",
        DS_MERCHANT_ORDER: orderId,
        DS_MERCHANT_MERCHANTCODE: merchantCode,
        DS_MERCHANT_TERMINAL: terminal,
        DS_MERCHANT_CURRENCY: "978",
        DS_MERCHANT_TRANSACTIONTYPE: "S",
        DS_MERCHANT_IDENTIFIER: sub.redsys_identifier
      };

      const paramsB64 = btoa(JSON.stringify(params));
      const signature = generateRedsysSignatureREST(secretKey, paramsB64, orderId);

      try {
        console.log(`📡 Llamando a Redsys REST (${endpoint})...`);
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
        console.log("📥 Respuesta cruda de Redsys:", JSON.stringify(resData));

        if (resData.Ds_MerchantParameters) {
          const resParams = JSON.parse(atob(resData.Ds_MerchantParameters.replace(/-/g, "+").replace(/_/g, "/")));
          const responseCode = parseInt(resParams.Ds_Response || "9999", 10);
          const isBankSuccess = responseCode >= 0 && responseCode <= 99;
          
          redsysResponse = { isBankSuccess, dsResponse: resParams.Ds_Response };
          console.log(`🏦 Respuesta Redsys procesada: ${resParams.Ds_Response} (Success: ${isBankSuccess})`);

          if (!isBankSuccess && resParams.Ds_Response !== '0042') {
             console.warn(`🛑 El banco denegó la baja automática: SIS${resParams.Ds_Response}`);
             return new Response(JSON.stringify({ 
                success: false, 
                error: `Error Banco: SIS${resParams.Ds_Response}`,
                canForce: true,
                message: "El banco ha denegado la baja automática." 
             }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
          }
        }
      } catch (err) {
        console.error("❌ Error de comunicación con Redsys:", err);
      }
    }

    // 4. Cambiar estado a 'cancelled' en la DB
    console.log("💾 Actualizando estado de suscripción a 'cancelled' en DB...");
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ 
        status: 'cancelled',
        redsys_cancellation_date: new Date().toISOString()
      })
      .eq("id", sub.id);

    if (updateError) {
      console.error("❌ Error actualizando DB:", updateError);
      throw updateError;
    }

    // 5. Enviar Correo Electrónico
    if (userEmail) {
      console.log(`📧 Preparando envío de email a: ${userEmail}`);
      const expiryDateObj = new Date(sub.current_period_end);
      const formattedDate = `${expiryDateObj.getDate().toString().padStart(2, '0')}/${(expiryDateObj.getMonth() + 1).toString().padStart(2, '0')}/${expiryDateObj.getFullYear()}`;
      
      await sendEmail(
        userEmail,
        "Confirmación de baja - Club Meraki ArteSano",
        buildCancellationEmail(firstName, formattedDate)
      );
    } else {
      console.warn("⚠️ No se pudo enviar el email porque no se encontró dirección de correo.");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Suscripción cancelada y email enviado correctamente",
      redsysResponse
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("💥 Error crítico en la función:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
