// Edge Function: redsys-create-payment
// HMAC_SHA256_V1 según especificación Redsys:
//   Ds_MerchantParameters  → JSON codificado en Base64 ESTÁNDAR (con padding =, +, /)
//   Ds_Signature           → HMAC-SHA256 sobre el Base64 anterior, codificado en Base64Url (sin padding)

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

  // El pedido debe ser múltiplo de 8 bytes, rellenado con \0 a la derecha
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
 * La entrada es el valor de Ds_MerchantParameters tal como se envía (Base64 estándar).
 * La salida es Base64Url sin padding.
 */
function generateRedsysSignature(
  secretKeyB64: string,
  orderId: string,
  merchantParametersBase64: string  // Base64 ESTÁNDAR — el mismo valor que irá en el formulario
): string {
  const derivedKey = deriveKey3DES(secretKeyB64, orderId);

  const hmac = forge.hmac.create();
  hmac.start("sha256", derivedKey);
  hmac.update(merchantParametersBase64);
  const sigBytes = hmac.digest().getBytes();

  // Firma en Base64 ESTÁNDAR (el navegador lo codificará automáticamente en el submit del form)
  return forge.util.encode64(sigBytes);
}

/**
 * Codifica un string en Base64 ESTÁNDAR, compatible con Unicode.
 * Ds_MerchantParameters DEBE ir en Base64 estándar (con =, +, /).
 */
function encodeBase64Standard(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString); // Base64 estándar — conserva =, +, /
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, description } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId requerido" }), {
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
    const redsysUrl    = Deno.env.get("REDSYS_URL")?.trim() ?? "https://sis-t.redsys.es:25443/sis/realizarPago";
    const siteUrl      = Deno.env.get("SITE_URL")?.trim() ?? "https://merceria-conchi.vercel.app";
    const supabaseUrl  = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseSrv  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!merchantCode || !secretKey) {
      return new Response(JSON.stringify({ error: "Variables Redsys no configuradas" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Número de pedido: 12 dígitos (máximo permitido por Redsys), basado en timestamp
    const redsysOrderId = Date.now().toString().slice(-12);
    const amountCents   = Math.round(amountNum * 100).toString();
    const notificationUrl = `${supabaseUrl}/functions/v1/redsys-notification`;

    // Persistir el redsys_order_id en el pedido para trazabilidad
    if (supabaseSrv) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseSrv);
      await supabaseAdmin
        .from("orders")
        .update({ redsys_order_id: redsysOrderId })
        .eq("id", orderId);
    }

    const merchantParams = {
      DS_MERCHANT_AMOUNT:             amountCents,
      DS_MERCHANT_ORDER:              redsysOrderId,
      DS_MERCHANT_MERCHANTCODE:       merchantCode,
      DS_MERCHANT_CURRENCY:           "978",
      DS_MERCHANT_TRANSACTIONTYPE:    "0",
      DS_MERCHANT_TERMINAL:           terminal,
      DS_MERCHANT_MERCHANTURL:        notificationUrl,
      DS_MERCHANT_URLOK:              `${siteUrl}/pago-ok?order=${orderId}`,
      DS_MERCHANT_URLKO:              `${siteUrl}/pago-ko?order=${orderId}`,
      DS_MERCHANT_PRODUCTDESCRIPTION: (description ?? "Pedido Meraki ArteSano").substring(0, 125),
    };

    const paramsJson = JSON.stringify(merchantParams);

    // ✅ CRÍTICO: Ds_MerchantParameters debe ser Base64 ESTÁNDAR (con =, +, /)
    const paramsB64Standard = encodeBase64Standard(paramsJson);

    // ✅ La firma se calcula sobre el Base64 estándar y se devuelve en Base64Url
    const signature = generateRedsysSignature(secretKey, redsysOrderId, paramsB64Standard);

    console.log("redsys-create-payment OK:", { redsysOrderId, amountCents, terminal, paramsB64Standard: paramsB64Standard.substring(0, 30) + "..." });

    return new Response(
      JSON.stringify({
        redsysUrl,
        Ds_SignatureVersion:    "HMAC_SHA256_V1",
        Ds_MerchantParameters: paramsB64Standard,  // Base64 estándar
        Ds_Signature:          signature,           // Base64Url sin padding
        _debug: { redsysOrderId, amountCents, terminal }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in redsys-create-payment:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
