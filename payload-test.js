const forge = require("node-forge");

const secretKeyB64 = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const merchantCode = "263100000";
const terminal = "31";
const orderId = "202404081010";
const amount = "195";

const merchantParams = {
  DS_MERCHANT_AMOUNT: amount,
  DS_MERCHANT_ORDER: orderId,
  DS_MERCHANT_MERCHANTCODE: merchantCode,
  DS_MERCHANT_CURRENCY: "978",
  DS_MERCHANT_TRANSACTIONTYPE: "0",
  DS_MERCHANT_TERMINAL: terminal,
  DS_MERCHANT_MERCHANTURL: "https://foo.com/notification",
  DS_MERCHANT_URLOK: "https://foo.com/ok",
  DS_MERCHANT_URLKO: "https://foo.com/ko",
  DS_MERCHANT_PRODUCTDESCRIPTION: "Pedido",
};

const paramsJson = JSON.stringify(merchantParams);
const paramsB64 = Buffer.from(paramsJson).toString("base64");

const keyBytes = forge.util.decode64(secretKeyB64);
const padLen = (8 - (orderId.length % 8)) % 8;
const orderPadded = orderId.padEnd(orderId.length + padLen, "\0");

const cipher = forge.cipher.createCipher("3DES-CBC", forge.util.createBuffer(keyBytes));
cipher.start({ iv: forge.util.createBuffer("\0\0\0\0\0\0\0\0") });
cipher.mode.pad = function(blockSize, buffer) { return true; };
cipher.mode.unpad = function(blockSize, buffer) { return true; };
cipher.update(forge.util.createBuffer(orderPadded));
cipher.finish();

const derivedKey = cipher.output.getBytes();

const hmac = forge.hmac.create();
hmac.start("sha256", derivedKey);
hmac.update(paramsB64);
const sigBytes = hmac.digest().getBytes();

const signature = forge.util.encode64(sigBytes)
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("paramsJson:", paramsJson);
console.log("paramsB64:", paramsB64);
console.log("signature:", signature);
