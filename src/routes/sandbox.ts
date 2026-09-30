import { Router } from "express";
import { db } from "../db.js";
import { authenticateMerchant } from "../security.js";

export const sandbox=Router();

sandbox.post("/sandbox/transactions/:reference/pay",authenticateMerchant,async(req:any,res)=>{
  const {data:tx,error}=await db.from("transactions").select("*")
    .eq("merchant_id",req.merchant.merchant_id).eq("reference",req.params.reference).maybeSingle();

  if(error)return res.status(500).json({error:"sandbox_lookup_failed"});
  if(!tx)return res.status(404).json({error:"transaction_not_found"});
  if(tx.mode!=="test")return res.status(403).json({error:"sandbox_only"});
  if(tx.status==="paid")return res.json({status:"success",data:{reference:tx.reference,status:tx.status}});

  const {data:updated,error:updateError}=await db.from("transactions")
    .update({status:"paid",paid_at:new Date().toISOString()})
    .eq("id",tx.id).eq("status","pending")
    .select("reference,amount,currency,status,paid_at").single();

  if(updateError||!updated)return res.status(500).json({error:"sandbox_payment_failed"});

  await db.from("webhook_events").insert({
    merchant_id:tx.merchant_id,
    transaction_id:tx.id,
    event_type:"payment.success",
    payload:{event:"payment.success",data:updated}
  });

  return res.json({status:"success",sandbox:true,data:updated});
});