import crypto from "node:crypto";

export function signWebhook(payload:string,secret:string){
  return crypto.createHmac("sha256",secret).update(payload).digest("hex");
}

export function webhookHeaders(payload:string,secret:string){
  return {
    "content-type":"application/json",
    "x-emzaropay-signature":"sha256="+signWebhook(payload,secret)
  };
}