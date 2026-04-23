// Edge Function: redsys-create-subscription
// HMAC_SHA256_V1 para Suscripciones (COF - Card on File)
// Redirige al alumno a la pasarela para el primer pago y registro de tarjeta.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import forge from "npm:node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Deriva la clave de firma usando 3DES-CBC sobre el número de pedido.
 * Redsys: IV = 8 bytes a 0x00, sin padding PKCS7 en la salida.
 */
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
 * Genera la firma HMAC_SHA256_V1 de Redsys.
 */
function generateRedsysSignature(
  secretKeyB64: string,
  orderId: string,
  merchantParametersBase64: string
): string {
  const derivedKey = deriveKey3DES(secretKeyB64, orderId);

  const hmac = forge.hmac.create();
  hmac.start("sha256", derivedKey);
  hmac.update(merchantParametersBase64);
  const sigBytes = hmac.digest().getBytes();

  return forge.util.encode64(sigBytes);
}

/**
 * Codifica un string en Base64 ESTÁNDAR, compatible con Unicode.
 */
function encodeBase64Standard(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, email } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return new Response(JSON.stringify({ error: "Importe debe ser mayor que 0" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantCode = Deno.env.get("REDSYS_MERCHANT_CODE")?.trim() ?? "";
    const terminal     = Deno.env.get("REDSYS_TERMINAL")?.trim() ?? "1";
    const secretKey    = Deno.env.get("REDSYS_SECRET_KEY")?.trim() ?? "";
    const redsysUrl    = Deno.env.get("REDSYS_URL")?.trim() ?? "https://sis.redsys.es/sis/realizarPago";
    const siteUrl      = Deno.env.get("SITE_URL")?.trim() ?? "https://merakiartesano.es";
    const supabaseUrl  = Deno.env.get("SUPABASE_URL") ?? "";
    
    if (!merchantCode || !secretKey) {
      return new Response(JSON.stringify({ error: "Variables Redsys no configuradas en producción" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Número de pedido para suscripción: 12 dígitos basados en timestamp
    const timestamp = Date.now().toString();
    const redsysOrderId = timestamp.slice(-12);
    const amountCents   = Math.round(amountNum * 100).toString();
    const notificationUrl = `${supabaseUrl}/functions/v1/redsys-notification`;

    // Pasamos info extra en MerchantData para que el webhook sepa procesar el alta
    const merchantData = JSON.stringify({
      userId: userId,
      email: email,
      type: "academy_subscription"
    });

    const merchantParams = {
      DS_MERCHANT_AMOUNT:             amountCents,
      DS_MERCHANT_ORDER:              redsysOrderId,
      DS_MERCHANT_MERCHANTCODE:       merchantCode,
      DS_MERCHANT_CURRENCY:           "978",
      DS_MERCHANT_TRANSACTIONTYPE:    "0",
      DS_MERCHANT_TERMINAL:           terminal,
      DS_MERCHANT_MERCHANTURL:        notificationUrl,
      // URLs de redirección (siteUrl corregido)
      DS_MERCHANT_URLOK:              `${siteUrl}/pedido-confirmado?type=subscription`,
      DS_MERCHANT_URLKO:              `${siteUrl}/clases`,
      DS_MERCHANT_PRODUCTDESCRIPTION: "Alta Club Creativo MERAKI (Suscripcion)",
      
      // ✅ Parámetros para suscripciones (COF)
      DS_MERCHANT_IDENTIFIER:         "REQUIRED",
      DS_MERCHANT_COF_INI:            "S",           // Operación inicial
      DS_MERCHANT_COF_TYPE:           "R",           // Tipo Recurrente
      DS_MERCHANT_MERCHANTDATA:       merchantData
    };

    const paramsJson = JSON.stringify(merchantParams);
    
    // ✅ Formato Base64 estándar
    const paramsB64Standard = encodeBase64Standard(paramsJson);
    const signature = generateRedsysSignature(secretKey, redsysOrderId, paramsB64Standard);

    console.log("redsys-create-subscription PROD OK:", { redsysOrderId, amountCents, siteUrl });

    return new Response(
      JSON.stringify({
        redsysUrl,
        Ds_SignatureVersion:    "HMAC_SHA256_V1",
        Ds_MerchantParameters: paramsB64Standard,
        Ds_Signature:          signature,
        _debug: { redsysOrderId, amountCents }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Critical Error in redsys-create-subscription:", err);
    return new Response(JSON.stringify({ error: "Error en el servidor de pagos del Club: " + err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
