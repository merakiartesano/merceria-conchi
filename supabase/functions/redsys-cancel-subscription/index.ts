// Edge Function: redsys-cancel-subscription
// Cancela una suscripción gestionada por Redsys (Inactivación de Referencia) vía API REST DIRECTA
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import forge from "npm:node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Deriva la clave de firma usando 3DES-CBC sobre el número de pedido.
 */
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

/**
 * Genera la firma HMAC_SHA256_V1 de Redsys para REST.
 */
function generateRedsysSignatureREST(
  secretKeyB64: string,
  orderId: string,
  merchantParametersBase64Standard: string
): string {
  const derivedKey = deriveKey3DES(secretKeyB64, orderId);
  const hmac = forge.hmac.create();
  hmac.start("sha256", derivedKey);
  hmac.update(merchantParametersBase64Standard);
  const sigBytes = hmac.digest().getBytes();
  
  return forge.util.encode64(sigBytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toURLSafe(base64: string): string {
    return base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: corsHeaders });
    }

    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError || !sub || !sub.redsys_identifier) {
      return new Response(JSON.stringify({ error: "Suscripción no encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantCode  = Deno.env.get("REDSYS_MERCHANT_CODE")?.trim() ?? "";
    const terminal      = Deno.env.get("REDSYS_TERMINAL")?.trim() ?? "1"; // Valor RAW del env
    const secretKey     = Deno.env.get("REDSYS_SECRET_KEY")?.trim() ?? "";

    if (!merchantCode || !secretKey) {
      return new Response(JSON.stringify({ error: "Configuración incompleta" }), { status: 500, headers: corsHeaders });
    }

    const redsysRestUrl = "https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST"; 
    const originalOrderId = sub.redsys_order_id;

    if (!originalOrderId) {
        throw new Error("No hay un ID de pedido original para cancelar");
    }

    const merchantParams = {
      DS_MERCHANT_AMOUNT:             "0", 
      DS_MERCHANT_ORDER:              originalOrderId,
      DS_MERCHANT_MERCHANTCODE:       merchantCode,
      DS_MERCHANT_CURRENCY:           "978",
      DS_MERCHANT_TRANSACTIONTYPE:    "A", // Anulación
      DS_MERCHANT_TERMINAL:           terminal,
      DS_MERCHANT_IDENTIFIER:         sub.redsys_identifier
    };

    const paramsJson = JSON.stringify(merchantParams);
    const encoder = new TextEncoder();
    const paramsB64Std = btoa(String.fromCodePoint(...encoder.encode(paramsJson)));
    const signatureURLSafe = generateRedsysSignatureREST(secretKey, originalOrderId, paramsB64Std);
    const paramsURLSafe = toURLSafe(paramsB64Std);

    console.log(`Intentando baja REST: ${originalOrderId} (Terminal: ${terminal})`);

    const response = await fetch(redsysRestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Ds_MerchantParameters: paramsURLSafe,
        Ds_SignatureVersion: "HMAC_SHA256_V1",
        Ds_Signature: signatureURLSafe
      })
    });

    const result = await response.json();
    let dsResponseCode = "";
    if (result.Ds_MerchantParameters) {
        const decoded = JSON.parse(atob(result.Ds_MerchantParameters.replace(/-/g, "+").replace(/_/g, "/")));
        dsResponseCode = decoded.Ds_Response;
    }

    const isSuccess = dsResponseCode !== "" && parseInt(dsResponseCode) >= 0 && parseInt(dsResponseCode) <= 99;

    if (isSuccess) {
      await supabaseAdmin.from("subscriptions").update({ status: "cancelled" }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true, message: "Cancelado con éxito" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
        return new Response(JSON.stringify({ 
            success: false, 
            error: `Error Banco: ${result.errorCode || dsResponseCode || "Firma incorrecta"}`,
            canForce: true // <--- Indicamos al frontend que puede forzar la baja
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
