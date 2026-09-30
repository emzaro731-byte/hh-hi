import { Router } from "express";
import { db } from "../db.js";
export const checkout=Router();
checkout.get("/:reference",async(req,res)=>{
 const {data,error}=await db.from("transactions").select("reference,amount,currency,customer_email,status,mode").eq("reference",req.params.reference).maybeSingle();
 if(error||!data)return res.status(404).send("Payment not found");
 res.type("html").send("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>EmzaroPay Checkout</title><style>body{font-family:system-ui;background:#07111f;color:#fff;display:grid;place-items:center;min-height:100vh}.card{width:min(420px,90%);background:#0e1c30;padding:28px;border-radius:18px}.amount{font-size:32px;font-weight:800;margin:18px 0}button{width:100%;padding:14px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-size:16px}small{color:#9fb0c5}</style></head><body><main class=\"card\"><h1>EmzaroPay</h1><small>Secure sandbox checkout</small><div class=\"amount\">"+data.currency+" "+Number(data.amount).toLocaleString()+"</div><p>Reference: "+data.reference+"</p><p>Customer: "+data.customer_email+"</p><button disabled>Sandbox payment — provider connection required</button></main></body></html>");
});