const params = {
  orderId: "test-1234",
  amount: 6.90,
  description: "Test"
};

fetch("https://btkqgeusoffqxtkhgxoy.supabase.co/functions/v1/redsys-create-payment", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0a3FnZXVzb2ZmcXh0a2hneG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDYwMDgsImV4cCI6MjA4ODAyMjAwOH0.4c3iAAnuYlGpuSU9WeeCFyPUE7gbrOMmmdf2yfMpwHc"
  },
  body: JSON.stringify(params)
})
.then(r => r.json())
.then(data => {
  console.log("\n=== RESPUESTA DE LA FUNCIÓN ===");
  console.log("redsysUrl:", data.redsysUrl);
  console.log("Ds_SignatureVersion:", data.Ds_SignatureVersion);
  console.log("_debug:", JSON.stringify(data._debug));
  
  const b64 = data.Ds_MerchantParameters;
  console.log("\n=== Ds_MerchantParameters ===");
  console.log("Valor:", b64);
  console.log("Longitud:", b64?.length);
  
  // Detectar si es Base64Url (tiene - o _) o Base64 estándar (tiene + y /)
  const hasUrlChars = b64?.includes('-') || b64?.includes('_');
  const hasPadding = b64?.endsWith('=');
  const hasStdChars = b64?.includes('+') || b64?.includes('/');
  console.log("\n=== Diagnóstico ===");
  console.log("❌ Contiene - o _ (Base64Url inválido para Redsys):", hasUrlChars);
  console.log("✅ Tiene padding = (Base64 estándar):", hasPadding);
  console.log("✅ Contiene + o / (Base64 estándar):", hasStdChars);
  
  // Intentar decodificar el Base64
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    console.log("\n=== JSON decodificado ===");
    const json = JSON.parse(decoded);
    console.log(JSON.stringify(json, null, 2));
    
    if (json.DS_MERCHANT_ORDER) {
      console.log("\n✅ Número de pedido OK:", json.DS_MERCHANT_ORDER);
    } else {
      console.log("\n❌ ERROR: No se encontró DS_MERCHANT_ORDER en el JSON!");
    }
    
    if (json.DS_MERCHANT_MERCHANTCODE) {
      console.log("✅ Código comercio OK:", json.DS_MERCHANT_MERCHANTCODE);
    }
    
    if (json.DS_MERCHANT_AMOUNT) {
      console.log("✅ Importe (céntimos) OK:", json.DS_MERCHANT_AMOUNT);
    }
  } catch(e) {
    console.log("\n❌ ERROR decodificando Base64:", e.message);
  }
})
.catch(e => console.error("Error en llamada:", e));
