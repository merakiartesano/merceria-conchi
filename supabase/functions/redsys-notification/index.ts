// Edge Function: redsys-notification
// v32: Soporte para activaciones automáticas de academia y emails de bienvenida

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import nodemailer from "npm:nodemailer@6.9.9";
import forge from "npm:node-forge@1.3.1";

async function sendEmail(to: string, subject: string, html: string, supabase: any, orderId?: string) {
  const smtpUser = Deno.env.get("SMTP_USER") ?? "";
  const smtpPass = Deno.env.get("SMTP_PASS") ?? "";
  const host = "s2.aloonlinedns.com"; 

  const transporter = nodemailer.createTransport({
    host: host,
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { 
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined 
    },
    connectionTimeout: 15000,
  });

  try {
    await transporter.sendMail({
      from: '"Meraki ArteSano" <' + smtpUser + ">",
      to,
      subject,
      html,
    });
    if (orderId) {
      await supabase.from("orders").update({ 
        debug_info: { email_status: "success", timestamp: new Date().toISOString() } 
      }).eq("id", orderId);
    }
  } catch (err: any) {
    console.error("Error enviando email:", err);
  }
}

// ─── Plantilla de Bienvenida a la Academia ───
function buildAcademyWelcomeEmail(email: string): string {
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head>" +
    "<body style='margin:0;padding:0;background-color:#faf8f5;font-family:Helvetica,Arial,sans-serif;'>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#faf8f5;padding:40px 20px;'>" +
    "<tr><td align='center'>" +
    "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);'>" +
    "<tr><td style='background:linear-gradient(135deg,#b2dfdb,#80cbc4);padding:40px 32px;text-align:center;'>" +
    "<h1 style='margin:0;color:#ffffff;font-size:28px;'>¡Bienvenida al Club Meraki ArteSano!</h1>" +
    "<p style='margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;'>Tu suscripción ya está activa</p>" +
    "</td></tr>" +
    "<tr><td style='padding:32px;text-align:center;'>" +
    "<p style='font-size:18px;color:#1e293b;line-height:1.6;'>Estamos encantados de tenerte con nosotros en la academia.</p>" +
    "<p style='font-size:16px;color:#64748b;line-height:1.6;'>Ya tienes acceso ilimitado a todos los cursos, directos y materiales exclusivos del Club.</p>" +
    "<div style='margin-top:30px;'>" +
    "<a href='https://merakiartesano.es/academia' style='background-color:#80cbc4;color:white;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;'>Entrar a la Academia</a>" +
    "</div>" +
    "</td></tr>" +
    "<tr><td style='background-color:#f8fafc;padding:30px 32px;text-align:center;border-top:1px solid #f1f5f9;'>" +
    "<p style='margin:0;font-size:14px;color:#94a3b8;'>¿Tienes problemas para acceder? Escríbenos a hola@merakiartesano.es</p>" +
    "</td></tr>" +
    "</table></td></tr></table></body></html>";
}

// ─── Otros Email Builders (Shop) ───
function buildOrderConfirmationEmail(order: any): string {
  const itemsHtml = (order.order_items ?? [])
    .map((item: any) => 
      "<tr>" +
      "<td style='padding:12px; border-bottom:1px solid #f1f5f9;'>" + item.quantity + "x " + item.name + "</td>" +
      "<td style='padding:12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#64748b;'>€" + (item.price * item.quantity).toFixed(2) + "</td>" +
      "</tr>"
    ).join("");

  const subtotal = (order.order_items ?? []).reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const total = Number(order.total_amount).toFixed(2);
  const orderIdShort = String(order.id).substring(0, 8).toUpperCase();

  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head>" +
    "<body style='margin:0;padding:0;background-color:#faf8f5;font-family:Helvetica,Arial,sans-serif;'>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#faf8f5;padding:40px 20px;'>" +
    "<tr><td align='center'>" +
    "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);'>" +
    "<tr><td style='background:linear-gradient(135deg,#b2dfdb,#80cbc4);padding:40px 32px;text-align:center;'>" +
    "<h1 style='margin:0;color:#ffffff;font-size:28px;'>¡Pedido Confirmado!</h1>" +
    "<p style='margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;'>Gracias por confiar en Meraki ArteSano</p>" +
    "</td></tr>" +
    "<tr><td style='padding:32px;'>" +
    "<div style='background-color:#f8fafc;border-radius:12px;padding:20px;margin-bottom:30px;border-left:4px solid #b2dfdb;'>" +
    "<p style='margin:0;font-size:12px;color:#64748b;text-transform:uppercase;'>Número de pedido</p>" +
    "<p style='margin:5px 0 0;font-size:18px;font-weight:bold;color:#1e293b;'>#" + orderIdShort + "</p>" +
    "</div>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #f1f5f9;border-radius:8px;'>" + itemsHtml + 
    "<tr style='background-color:#f8fafc;'><td style='padding:12px;color:#64748b;'>Subtotal</td><td style='padding:12px;text-align:right;color:#64748b;'>€" + subtotal.toFixed(2) + "</td></tr>" +
    "<tr><td style='padding:15px;font-weight:bold;font-size:18px;'>TOTAL PAGADO</td><td style='padding:15px;text-align:right;font-weight:bold;font-size:18px;color:#0f172a;'>€" + total + "</td></tr>" +
    "</table>" +
    "</td></tr>" +
    "</table></td></tr></table></body></html>";
}

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

function verifyRedsysSignature(secretKey: string, paramsB64: string, receivedSignature: string): boolean {
  try {
    let b64 = paramsB64.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const params = JSON.parse(atob(b64));
    const orderId = (params.Ds_Order ?? params.DS_MERCHANT_ORDER ?? "");
    const derivedKeyStr = deriveKey3DES(secretKey, orderId);
    const hmac = forge.hmac.create();
    hmac.start("sha256", derivedKeyStr);
    hmac.update(paramsB64);
    const sigBytes = hmac.digest().getBytes();
    const computedSafe = forge.util.encode64(sigBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const receivedSafe = receivedSignature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return computedSafe === receivedSafe;
  } catch (err) { return false; }
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const secretKey = Deno.env.get("REDSYS_SECRET_KEY") ?? "";
    const contentType = req.headers.get("content-type") ?? "";
    let Ds_MerchantParameters = "";
    let Ds_Signature = "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      Ds_MerchantParameters = formData.get("Ds_MerchantParameters") as string ?? "";
      Ds_Signature = formData.get("Ds_Signature") as string ?? "";
    } else {
      const body = await req.json();
      Ds_MerchantParameters = body.Ds_MerchantParameters ?? "";
      Ds_Signature = body.Ds_Signature ?? "";
    }

    if (!Ds_MerchantParameters) return new Response("KO", { status: 400 });
    let b64 = Ds_MerchantParameters.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const params = JSON.parse(atob(b64));
    
    if (secretKey && !verifyRedsysSignature(secretKey, Ds_MerchantParameters, Ds_Signature)) return new Response("KO", { status: 400 });

    const responseCode = parseInt(params.Ds_Response ?? "9999", 10);
    const isSuccess = responseCode >= 0 && responseCode <= 99;
    const redsysOrderId = params.Ds_Order ?? "";
    
    // Extraer identificador de tarjeta (Token) para pagos recurrentes
    const redsysIdentifier = params.Ds_Merchant_Identifier || params.ds_merchant_identifier || params.DS_MERCHANT_IDENTIFIER;
    
    // Extraer metadatos con mayor robustez
    let merchantData: any = {};
    const rawMerchantData = params.Ds_MerchantData || params.ds_merchantdata || params.DS_MERCHANTDATA;

    if (rawMerchantData) {
      try {
        const decodedMD = typeof rawMerchantData === 'string' && rawMerchantData.startsWith('%') 
          ? decodeURIComponent(rawMerchantData) 
          : rawMerchantData;
        merchantData = typeof decodedMD === 'string' ? JSON.parse(decodedMD) : decodedMD;
      } catch (e) {
        console.error("Error parsing MerchantData:", e);
      }
    }

    console.log("Redsys Notification - Order:", redsysOrderId, "Token:", redsysIdentifier, "Data:", JSON.stringify(merchantData));

    if (!isSuccess) return new Response("OK", { status: 200 });

    // ─── CASO A: SUSCRIPCIÓN ACADEMIA ───
    if (merchantData.type === "academy_subscription" && merchantData.userId) {
      // Cálculo unificado al día 20 del mes siguiente
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      expirationDate.setDate(20);
      expirationDate.setHours(23, 59, 59, 999); // Final del día

      // Upsert suscripción
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: merchantData.userId,
        status: "active",
        current_period_end: expirationDate.toISOString(),
        redsys_order_id: redsysOrderId,
        redsys_identifier: redsysIdentifier, // ¡FUNDAMENTAL!
        last_payment_date: new Date().toISOString(),
        last_payment_status: "success"
      }, { onConflict: "user_id" });

      if (merchantData.email) {
        await sendEmail(merchantData.email, "¡Bienvenida al Club Meraki ArteSano! 🎨", buildAcademyWelcomeEmail(merchantData.email), supabaseAdmin);
      }
    } 
    // ─── CASO B: PEDIDO TIENDA ───
    else {
      const { data: orders } = await supabaseAdmin.from("orders").select("*, order_items(id, name, price, quantity)").eq("redsys_order_id", redsysOrderId);
      if (orders && orders.length > 0) {
        const order = orders[0];
        await supabaseAdmin.from("orders").update({ status: "Pagado", redsys_response_code: String(responseCode) }).eq("id", order.id);
        if (order.customer_email) {
          await sendEmail(order.customer_email, "✅ Tu pedido #" + String(order.id).substring(0, 8).toUpperCase() + " en Meraki ArteSano", buildOrderConfirmationEmail(order), supabaseAdmin, order.id);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) { 
    console.error("Notification processing error:", err);
    return new Response("KO", { status: 500 }); 
  }
});
