
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("--- TEST SMTP LOCAL Meraki ArteSano ---");
  
  const smtpHost = "mail.merakiartesano.es";
  const smtpUser = "hola@merakiartesano.es";
  const smtpPass = "vIn-Y5Y-a-6P"; // Sacada de los secrets que vi antes
  const to = "raulyecla88@gmail.com";

  console.log(`Conectando a ${smtpHost} puerto 465...`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test Local" <${smtpUser}>`,
      to: to,
      subject: "Test de Conexión SMTP",
      text: "Si lees esto, la conexión SMTP desde tu PC funciona correctamente."
    });
    console.log("✅ ÉXITO: Email enviado correctamente.");
    console.log("ID del mensaje:", info.messageId);
  } catch (err) {
    console.error("❌ FALLO en puerto 465:", err.message);
    
    console.log("\nIntentando fallback en puerto 587 (STARTTLS)...");
    const fallback = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });

    try {
      const info2 = await fallback.sendMail({
        from: `"Test Local" <${smtpUser}>`,
        to: to,
        subject: "Test de Conexión SMTP (Puerto 587)",
        text: "Si lees esto, la conexión por el puerto 587 funciona."
      });
      console.log("✅ ÉXITO en puerto 587.");
    } catch (err2) {
      console.error("❌ FALLO TOTAL en ambos puertos:", err2.message);
    }
  }
}

testEmail();
