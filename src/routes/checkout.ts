import { Router } from "express";
import { db } from "../db.js";
import { signWebhook } from "../webhooks.js";

export const checkout=Router();

checkout.get("/:reference",async(req,res)=>{
  const {data,error}=await db.from("transactions")
    .select("reference,amount,currency,customer_email,status,mode")
    .eq("reference",req.params.reference).maybeSingle();

  if(error||!data)return res.status(404).send("Payment not found");

  const action=data.status==="paid"
    ? "<p class='ok'>Payment completed.</p>"
    : "<form method='post' action='/checkout/"+data.reference+"/pay'><button>Pay in Sandbox</button></form>";

  res.type("html").send("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>EmzaroPay Checkout</title><style>body{font-family:system-ui;background:#07111f;color:#fff;display:grid;place-items:center;min-height:100vh}.card{width:min(420px,90%);background:#0e1c30;padding:28px;border-radius:18px}.amount{font-size:32px;font-weight:800;margin:18px 0}button{width:100%;padding:14px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-size:16px}.ok{color:#4ade80}small{color:#9fb0c5}</style></head><body><main class='card'><h1>EmzaroPay</h1><small>Secure sandbox checkout</small><div class='amount'>"+data.currency+" "+Number(data.amount).toLocaleString()+"</div><p>Reference: "+data.reference+"</p><p>Customer: "+data.customer_email+"</p>"+action+"</main></body></html>");
});

checkout.post("/:reference/pay",async(req,res)=>{
  const {data:tx,error}=await db.from("transactions").select("*").eq("reference",req.params.reference).maybeSingle();
  if(error||!tx)return res.status(404).send("Payment not found");
  if(tx.mode!=="test")return res.status(403).send("Live payments require an authorized payment provider");
  if(tx.status==="paid")return res.redirect("/checkout/"+tx.reference);

  const {data:updated,error:updateError}=await db.from("transactions")
    .update({status:"paid",paid_at:new Date().toISOString()})
    .eq("id",tx.id).eq("status","pending")
    .select("*").single();

  if(updateError||!updated)return res.status(500).send("Could not complete sandbox payment");

  const payload=JSON.stringify({
    event:"payment.success",
    data:{reference:updated.reference,amount:updated.amount,currency:updated.currency,status:updated.status}
  });

  await db.from("webhook_events").insert({
    merchant_id:updated.merchant_id,
    transaction_id:updated.id,
    event_type:"payment.success",
    payload:JSON.parse(payload)
  });

  console.log("Sandbox webhook signature:",signWebhook(payload,process.env.WEBHOOK_SECRET??"sandbox-secret"));
  res.redirect("/checkout/"+updated.reference);
});