const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Configurar e instalar
  console.log("Instalando redsys-easy temporalmente en package-test...");
  fs.mkdirSync('test-redsys-easy', { recursive: true });
  execSync('npm init -y', { cwd: './test-redsys-easy', stdio: 'ignore' });
  execSync('npm install redsys-easy@5.3.2', { cwd: './test-redsys-easy', stdio: 'ignore' });

  // Usar el paquete redsys-easy
  const redsysEasy = require('./test-redsys-easy/node_modules/redsys-easy');
  const { createRedsysAPI } = redsysEasy;

  // Credenciales demo
  const secretKey = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
  const { createRequest } = createRedsysAPI({ 
    secretKey,
    urls: {
      notification: 'https://btkqgeusoffqxtkhgxoy.supabase.co/functions/v1/redsys-notification',
      approved: 'https://merceria-conchi.vercel.app/pago-ok',
      declined: 'https://merceria-conchi.vercel.app/pago-ko',
    }
  });

  const orderId = Date.now().toString().slice(-12);
  
  const req = createRequest({
    DS_MERCHANT_AMOUNT: '690',
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_MERCHANTCODE: '999008881',
    DS_MERCHANT_CURRENCY: '978',
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: '1',
    DS_MERCHANT_MERCHANTURL: 'https://btkqgeusoffqxtkhgxoy.supabase.co/functions/v1/redsys-notification',
    DS_MERCHANT_URLOK: 'https://merceria-conchi.vercel.app/pago-ok',
    DS_MERCHANT_URLKO: 'https://merceria-conchi.vercel.app/pago-ko',
    DS_MERCHANT_PRODUCTDESCRIPTION: 'Test pago sandbox'
  });

  const b64 = Buffer.from(req.params.Ds_MerchantParameters, 'base64').toString('utf8');

  console.log("=== REDSYS-EASY GENERADO ===");
  console.log("Decoded JSON:", b64);
  console.log("Ds_MerchantParameters:", req.params.Ds_MerchantParameters);
  console.log("Ds_Signature:", req.params.Ds_Signature);

} catch (e) {
  console.error("Error:", e);
}
