// Edge Function: redsys-notification
// Recibe la notificación de pago de Redsys (IPN/URL_NOTIFICACION)
// Verifica la firma, actualiza el pedido a "Pagado" y envía email de confirmación al cliente

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import nodemailer from "npm:nodemailer@6.9.9";
import forge from "npm:node-forge@1.3.1";

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
    console.log(`✅ Email de confirmación enviado a: ${to}`);
  } catch (err) {
    console.error("❌ Error enviando email:", err);
  }
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildOrderConfirmationEmail(order: any): string {
  const itemsHtml = (order.order_items ?? [])
    .map(
      (item: any) =>
        `<tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">${item.quantity}x ${item.name}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#64748b;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const subtotal = (order.order_items ?? []).reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  );
  const shipping = Math.max(0, Number(order.total_amount) - subtotal);
  const addr = order.shipping_address ?? {};

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmación de pedido</title></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#b2dfdb,#80cbc4);padding:40px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">✅ ¡Gracias por tu compra!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Tu pedido ha sido confirmado y está siendo preparado</p>
        </td></tr>
        <tr><td style="padding:28px 32px 0;">
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;border-left:4px solid #b2dfdb;">
            <p style="margin:0;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a;font-family:monospace;">#${String(order.id).substring(0, 8).toUpperCase()}</p>
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
            📞 ${order.customer_phone ?? ""}<br>
            ${addr.line1 ?? ""}<br>${addr.postal_code ?? ""} ${addr.city ?? ""}<br>
            <strong>${addr.state ?? addr.country ?? ""}</strong>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <div style="background:#fffbeb;border-radius:10px;padding:20px;text-align:center;border:1px solid #fde68a;">
            <p style="margin:0;font-size:14px;color:#92400e;">📦 <strong>Tiempo estimado de entrega:</strong> 48-72 horas hábiles.</p>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">¿Tienes alguna pregunta? <a href="mailto:hola@merakiartesano.es" style="color:#b2dfdb;font-weight:600;">hola@merakiartesano.es</a></p>
          <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">Meraki ArteSano · El arte de crear con tus propias manos</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// HTML template para el email de bienvenida a la academia
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
        </td></tr>
        <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">Meraki ArteSano · <a href="https://merakiartesano.es" style="color:#94a3b8;">merakiartesano.es</a></p>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">Si deseas cancelar tu suscripción, contacta con nosotras por correo respondiendo a este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Redsys Signature Verification ───────────────────────────────────────────


function deriveKey3DES(secretKeyB64: string, orderId: string): string {
  const keyBytes = forge.util.decode64(secretKeyB64);
  const padLen = (8 - (orderId.length % 8)) % 8;
  const orderPadded = orderId.padEnd(orderId.length + padLen, "\0");

  const cipher = forge.cipher.createCipher("3DES-CBC", forge.util.createBuffer(keyBytes));
  cipher.start({ iv: forge.util.createBuffer("\0\0\0\0\0\0\0\0") });
  
  // Desactivar padding PKCS7 — Redsys quiere la salida sin padding
  // @ts-ignore
  cipher.mode.pad = function() { return true; };
  // @ts-ignore
  cipher.mode.unpad = function() { return true; };

  cipher.update(forge.util.createBuffer(orderPadded));
  cipher.finish();

  return cipher.output.getBytes();
}

/**
 * Validar la firma recibida en IPN
 */
function verifyRedsysSignature(
  secretKey: string,
  merchantParameters: string,
  receivedSignature: string
): boolean {
  try {
    let orderId = "";
    
    // Convertir el param string (normalmente base64url o base64 std)
    // Redsys a veces manda Base64 normal con + y / -> lo pasamos a standard decode.
    // En JS (atob), necesitamos reponer padding y cambiar - _ por + /.
    let b64 = merchantParameters.replace(/-/g, "+").replace(/_/g, "/");
    // Añadimos padding si falta
    while (b64.length % 4) b64 += "=";
    
    const paramsJson = atob(b64);
    const paramsDecoded = JSON.parse(paramsJson);
    orderId = (paramsDecoded.Ds_Order ?? paramsDecoded.DS_MERCHANT_ORDER ?? "");

    // 1. Derivar clave
    const derivedKeyStr = deriveKey3DES(secretKey, orderId);

    // 2. Compute HMAC SHA256
    const hmac = forge.hmac.create();
    hmac.start("sha256", derivedKeyStr);
    hmac.update(merchantParameters);
    const sigBytes = hmac.digest().getBytes();

    // 3. Normalizar AMBAS firmas a Base64Url (sin padding, sin + /) para comparar
    // Esto hace que la verificación sea robusta si Redsys manda Base64 estándar o URL-safe
    const computedSafe = forge.util.encode64(sigBytes)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const receivedSafe = receivedSignature
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    console.log("DEBUG Verify Signature:", {
      orderId,
      computedSafe,
      receivedSafe,
      match: computedSafe === receivedSafe
    });

    return computedSafe === receivedSafe;
  } catch (err) {
    console.error("Error verificando firma Redsys:", err);
    return false;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const secretKey = Deno.env.get("REDSYS_SECRET_KEY") ?? "";
    const contentType = req.headers.get("content-type") ?? "";

    let Ds_SignatureVersion = "";
    let Ds_MerchantParameters = "";
    let Ds_Signature = "";

    // Redsys envía application/x-www-form-urlencoded o JSON
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      Ds_SignatureVersion = formData.get("Ds_SignatureVersion") as string ?? "";
      Ds_MerchantParameters = formData.get("Ds_MerchantParameters") as string ?? "";
      Ds_Signature = formData.get("Ds_Signature") as string ?? "";
    } else {
      const body = await req.json();
      Ds_SignatureVersion = body.Ds_SignatureVersion ?? "";
      Ds_MerchantParameters = body.Ds_MerchantParameters ?? "";
      Ds_Signature = body.Ds_Signature ?? "";
    }

    if (!Ds_MerchantParameters) {
      console.error("No Ds_MerchantParameters recibido");
      return new Response("KO", { status: 400 });
    }

    // Decodificar parámetros
    let params: any = {};
    try {
      let b64 = Ds_MerchantParameters.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      params = JSON.parse(atob(b64));
    } catch {
      console.error("Error decodificando Ds_MerchantParameters");
      return new Response("KO", { status: 400 });
    }

    console.log("Redsys IPN recibido:", JSON.stringify(params));

    // Verificar firma (solo si tenemos la clave)
    if (secretKey) {
      const valid = verifyRedsysSignature(secretKey, Ds_MerchantParameters, Ds_Signature);
      if (!valid) {
        console.error("❌ Firma Redsys inválida");
        return new Response("KO", { status: 400 });
      }
    } else {
      console.warn("⚠️ REDSYS_SECRET_KEY no configurada — saltando verificación de firma");
    }

    // Obtener código de respuesta
    const responseCode = parseInt(params.Ds_Response ?? params.DS_MERCHANT_RESPONSE ?? "9999", 10);
    const redsysOrderId = params.Ds_Order ?? params.DS_MERCHANT_ORDER ?? "";
    const transactionType = params.Ds_TransactionType ?? params.DS_MERCHANT_TRANSACTIONTYPE ?? "";
    const isSuccess = responseCode >= 0 && responseCode <= 99;

    // --- FLUJO DE BAJA (ANULACIÓN DE REFERENCIA) ---
    if (transactionType === "B") {
       if (isSuccess) {
          console.log(`✅ Baja de referencia exitosa para pedido ${redsysOrderId}`);
          await supabaseAdmin.from("subscriptions").update({ 
            status: 'cancelled',
            redsys_cancellation_date: new Date().toISOString()
          }).eq("redsys_order_id", redsysOrderId);
       }
       return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // --- FLUJO DE ACADEMIA ---
    let merchantData: any = {};
    try {
      const mdRaw = params.Ds_MerchantData ?? params.DS_MERCHANT_MERCHANTDATA;
      if (mdRaw) merchantData = JSON.parse(decodeURIComponent(mdRaw));
    } catch {
      try { merchantData = JSON.parse(params.Ds_MerchantData ?? params.DS_MERCHANT_MERCHANTDATA); } catch {}
    }

    if (merchantData.type === "academy_subscription") {
       const { userId, email } = merchantData;
       if (isSuccess && userId) {
          console.log(`✅ Suscripción exitosa para usuario ${userId}`);
          const redsysIdentifier = params.Ds_Merchant_Identifier || params.Ds_Identifier || null;
          
          const { data: existingSub } = await supabaseAdmin.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
          
          // --- LÓGICA DE SINCRONIZACIÓN DÍA 1 & REGLA DEL 20 (Refined UTC) ---
          const now = new Date();
          const dayOfMonth = now.getUTCDate();
          let nextPeriod;

          if (dayOfMonth <= 20) {
              // Caso A: Se apunta del 1 al 20 -> Renueva el día 1 del próximo mes (M+1)
              nextPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
          } else {
              // Caso B: Se apunta del 21 al final -> Renueva el día 1 del mes subsiguiente (M+2)
              nextPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));
          }
          
          if (existingSub) {
             await supabaseAdmin.from("subscriptions").update({ 
               status: 'active', 
               current_period_end: nextPeriod.toISOString(),
               redsys_identifier: redsysIdentifier
             }).eq("id", existingSub.id);
          } else {
             await supabaseAdmin.from("subscriptions").insert({
                 user_id: userId,
                 status: 'active',
                 current_period_end: nextPeriod.toISOString(),
                 redsys_order_id: redsysOrderId,
                 redsys_identifier: redsysIdentifier
             });
             // Welcome email
             if (email) {
                await sendEmail(email, "🧵 ¡Bienvenida a la Academia Meraki ArteSano!", buildSubscriptionWelcomeEmail(email));
             }
          }
       } else if (!isSuccess && userId) {
           console.log(`❌ Pago membresía fallido para ${userId}`);
           await supabaseAdmin.from("subscriptions").update({ status: 'past_due' }).eq("user_id", userId);
       }
       return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // --- CONTINUAR CON FLUJO NORMAL DE PEDIDO TIENDA ---
    // Buscar el pedido en Supabase por el ID de Redsys
    const { data: orders, error: searchError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(id, name, price, quantity)")
      .eq("redsys_order_id", redsysOrderId);

    if (searchError || !orders || orders.length === 0) {
      console.error("Pedido no encontrado para Redsys Order:", redsysOrderId);
      return new Response("KO", { status: 404 });
    }

    const order = orders[0];

    if (isSuccess) {
      // ✅ PAGO EXITOSO
      console.log(`✅ Pago exitoso para pedido ${order.id}`);

      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ 
          status: "Pagado",
          redsys_response_code: String(responseCode)
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("Error actualizando pedido:", updateError);
      } else {
        // Enviar email de confirmación al cliente
        if (order.customer_email && order.status !== "Pagado") { // Evitar duplicados si reenvían IPN
          await sendEmail(
            order.customer_email,
            `✅ Confirmación de tu pedido #${String(order.id).substring(0, 8).toUpperCase()} — Meraki ArteSano`,
            buildOrderConfirmationEmail(order)
          );
        }
      }
    } else {
      // ❌ PAGO FALLIDO o DENEGADO
      console.log(`❌ Pago fallido para pedido ${order.id}. Código: ${responseCode}`);
      await supabaseAdmin
        .from("orders")
        .update({ 
          status: "Cancelado",
          redsys_response_code: String(responseCode)
        })
        .eq("id", order.id);
    }

    // Redsys espera una respuesta "OK" en texto plano
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("Error en redsys-notification:", err);
    return new Response("KO", { status: 500 });
  }
});
