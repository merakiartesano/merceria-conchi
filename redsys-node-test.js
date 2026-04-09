/**
 * Test Redsys con Node crypto nativo (implementación de referencia).
 * Genera un HTML listo para enviar directamente al TPV de sandbox.
 */

const crypto = require('crypto');
const fs = require('fs');

// Credenciales sandbox PROPIAS
const ownCreds = {
  secretKeyB64: "sq7HjrUOBfKmC576ILgskD5srU870gJ7",
  merchantCode:  "263100000",
  terminal:      "31",
  label:         "CREDENCIALES PROPIAS (263100000 / T31)"
};

// Credenciales sandbox DEMO de Redsys (siempre funcionan en sandbox)
const demoCreds = {
  secretKeyB64: "sq7HjrUOBfKmC576ILgskD5srU870gJ7",
  merchantCode:  "999008881",
  terminal:      "1",
  label:         "CREDENCIALES DEMO REDSYS (999008881 / T1)"
};

const redsysUrl = "https://sis-t.redsys.es:25443/sis/realizarPago";

// Pedido de prueba — orden de 12 dígitos numéricos (válido para Redsys)
const orderId   = Date.now().toString().slice(-12);
const amount    = "690"; // 6,90 euros en céntimos

const params = {
  DS_MERCHANT_AMOUNT:             amount,
  DS_MERCHANT_ORDER:              orderId,
  DS_MERCHANT_MERCHANTCODE:       demoCreds.merchantCode,
  DS_MERCHANT_CURRENCY:           "978",
  DS_MERCHANT_TRANSACTIONTYPE:    "0",
  DS_MERCHANT_TERMINAL:           demoCreds.terminal,
  DS_MERCHANT_MERCHANTURL:        "https://btkqgeusoffqxtkhgxoy.supabase.co/functions/v1/redsys-notification",
  DS_MERCHANT_URLOK:              "https://merceria-conchi.vercel.app/pago-ok",
  DS_MERCHANT_URLKO:              "https://merceria-conchi.vercel.app/pago-ko",
  DS_MERCHANT_PRODUCTDESCRIPTION: "Test pago sandbox"
};

// 1. Codificar JSON en Base64 ESTÁNDAR
const paramsJson = JSON.stringify(params);
const paramsB64  = Buffer.from(paramsJson, 'utf8').toString('base64'); // Base64 estándar con padding

// 2. Derivar clave 3DES-CBC sobre el Order ID
const keyBytes  = Buffer.from(demoCreds.secretKeyB64, 'base64');
const padLen    = (8 - (orderId.length % 8)) % 8;
const orderPad  = orderId.padEnd(orderId.length + padLen, '\0');

const iv     = Buffer.alloc(8, 0);
const cipher = crypto.createCipheriv('des-ede3-cbc', keyBytes, iv);
cipher.setAutoPadding(false); // ← Sin PKCS7, igual que Redsys
const derivedKey = Buffer.concat([
  cipher.update(Buffer.from(orderPad, 'binary')),
  cipher.final()
]);

// 3. HMAC-SHA256 sobre los parámetros Base64
const hmac = crypto.createHmac('sha256', derivedKey);
hmac.update(paramsB64);
const sig = hmac.digest();

// 4. Firma en Base64 ESTÁNDAR
const signature = sig.toString('base64');

console.log("=== PARÁMETROS GENERADOS ===");
console.log("orderId:          ", orderId);
console.log("paramsB64 (corto):", paramsB64.substring(0, 60) + "...");
console.log("paramsB64 tiene =:", paramsB64.endsWith('='));
console.log("signature:        ", signature);
console.log("Decoded JSON:     ", paramsJson);

// 5. Generar HTML de prueba para envío manual
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Test Redsys - Sandbox</title>
<style>
  body { font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
  pre { background: #f4f4f4; padding: 15px; overflow: auto; font-size: 12px; }
  button { background: #e88c17; color: white; padding: 15px 30px; font-size: 16px; border: none; 
           border-radius: 8px; cursor: pointer; margin-top: 20px; }
  button:hover { background: #c97800; }
  .label { color: #666; font-size: 13px; }
  .value { font-weight: bold; word-break: break-all; }
</style>
</head>
<body>
  <h1>🔑 Test TPV Redsys Sandbox</h1>
  <p><strong>Comercio:</strong> ${demoCreds.merchantCode} | Terminal: ${demoCreds.terminal}</p>
  <p><strong>Pedido:</strong> ${orderId} | <strong>Importe:</strong> 6,90€</p>
  
  <h3>Parámetros que se envían:</h3>
  <p class="label">Ds_MerchantParameters (Base64):</p>
  <pre>${paramsB64}</pre>
  <p class="label">Ds_Signature (Base64Url):</p>
  <pre>${signature}</pre>
  <p class="label">JSON decodificado:</p>
  <pre>${JSON.stringify(JSON.parse(paramsJson), null, 2)}</pre>
  
  <form method="POST" action="${redsysUrl}">
    <input type="hidden" name="Ds_SignatureVersion"    value="HMAC_SHA256_V1">
    <input type="hidden" name="Ds_MerchantParameters" value="${paramsB64}">
    <input type="hidden" name="Ds_Signature"          value="${signature}">
    <button type="submit">🚀 Enviar al TPV Redsys (Sandbox)</button>
  </form>
  
  <p style="color:#888; font-size:12px; margin-top:20px;">
    Si Redsys muestra el formulario de tarjeta → la firma es CORRECTA.<br>
    Si muestra SIS0042 → hay un problema de configuración en Redsys.
  </p>
</body>
</html>`;

fs.writeFileSync('redsys-test.html', html);
console.log("\n✅ Archivo 'redsys-test.html' generado. Ábrelo en el navegador y pulsa el botón.");
