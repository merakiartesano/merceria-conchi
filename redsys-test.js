const forge = require('node-forge');
const crypto = require('crypto');

const secretKeyB64 = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const orderId = "000012345678";
const merchantParametersB64 = "eyJEU19NRVJDSEFOVF9BTU9VTlQiOiIxOTUiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjEyMzQ1Njc4In0=";

// 1. Forge Implementation
function forgeImpl() {
  const keyBytes = forge.util.decode64(secretKeyB64);
  const padLen = (8 - (orderId.length % 8)) % 8;
  const orderPadded = orderId + '\0'.repeat(padLen);
  
  const cipher = forge.cipher.createCipher("3DES-CBC", forge.util.createBuffer(keyBytes));
  cipher.start({ iv: forge.util.createBuffer("\0\0\0\0\0\0\0\0") });
  cipher.mode.pad = function() { return true; };
  cipher.mode.unpad = function() { return true; };
  cipher.update(forge.util.createBuffer(orderPadded));
  cipher.finish();
  
  const derivedKeyStr = cipher.output.getBytes();
  
  const hmac = forge.hmac.create();
  hmac.start("sha256", derivedKeyStr);
  hmac.update(merchantParametersB64);
  const sigBytes = hmac.digest().getBytes();
  
  return forge.util.encode64(sigBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 2. Node Crypto Implementation
function cryptoImpl() {
  const keyBuf = Buffer.from(secretKeyB64, 'base64');
  const padLen = (8 - (orderId.length % 8)) % 8;
  const orderPaddedBuf = Buffer.alloc(orderId.length + padLen, '\0');
  orderPaddedBuf.write(orderId, 0, 'utf8');

  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuf, iv);
  cipher.setAutoPadding(false);
  let derivedKeyBuf = cipher.update(orderPaddedBuf);
  derivedKeyBuf = Buffer.concat([derivedKeyBuf, cipher.final()]);

  const hmac = crypto.createHmac('sha256', derivedKeyBuf);
  hmac.update(merchantParametersB64);
  const sigBuf = hmac.digest();

  return sigBuf.toString('base64url');
}

try {
  console.log("Forge:  ", forgeImpl());
  console.log("Crypto: ", cryptoImpl());
  console.log("Match:  ", forgeImpl() === cryptoImpl());
} catch(e) {
  console.error("Error with Node Crypto (3DES likely disabled):", e.message);
}
