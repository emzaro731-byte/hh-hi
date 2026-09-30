import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "../db.js";
import { config } from "../config.js";
import { authenticateMerchant } from "../security.js";

export const transactions=Router();

const createSchema=z.object({
  amount:z.number().positive(),
  currency:z.string().length(3).default("NGN"),
  email:z.string().email(),
  reference:z.string().min(6).max(100).optional(),
  metadata:z.record(z.string(),z.any()).optional()
});

transactions.post("/transactions",authenticateMerchant,async(req:any,res)=>{
  const parsed=createSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"invalid_request",details:parsed.error.flatten()});

  const body=parsed.data;
  const idempotencyKey=req.header("Idempotency-Key");

  if(idempotencyKey){
    const {data:previous,error:lookupError}=await db.from("transactions")
      .select("id,reference,amount,currency,customer_email,status,mode,created_at")
      .eq("merchant_id",req.merchant.merchant_id)
      .eq("idempotency_key",idempotencyKey)
      .maybeSingle();

    if(lookupError)return res.status(500).json({error:"idempotency_lookup_failed"});
    if(previous)return res.status(200).json({
      status:"success",
      idempotent:true,
      data:{...previous,checkout_url:config.appBaseUrl+"/checkout/"+previous.reference}
    });
  }

  const reference=body.reference??"EMPAY_"+crypto.randomBytes(10).toString("hex").toUpperCase();

  const {data:existing}=await db.from("transactions").select("id").eq("reference",reference).maybeSingle();
  if(existing)return res.status(409).json({error:"reference_exists"});

  const {data,error}=await db.from("transactions").insert({
    merchant_id:req.merchant.merchant_id,
    reference,
    amount:body.amount,
    currency:body.currency.toUpperCase(),
    customer_email:body.email,
    metadata:body.metadata??{},
    idempotency_key:idempotencyKey??null,
    status:"pending",
    mode:req.merchant.mode
  }).select("id,reference,amount,currency,customer_email,status,mode,created_at").single();

  if(error)return res.status(500).json({error:"transaction_create_failed"});
  return res.status(201).json({
    status:"success",
    data:{...data,checkout_url:config.appBaseUrl+"/checkout/"+data.reference}
  });
});

transactions.get("/transactions/:reference",authenticateMerchant,async(req:any,res)=>{
  const {data,error}=await db.from("transactions")
    .select("id,reference,amount,currency,customer_email,status,mode,metadata,created_at,paid_at")
    .eq("merchant_id",req.merchant.merchant_id)
    .eq("reference",req.params.reference)
    .maybeSingle();

  if(error)return res.status(500).json({error:"transaction_lookup_failed"});
  if(!data)return res.status(404).json({error:"transaction_not_found"});
  return res.json({status:"success",data});
});

transactions.post("/transactions/:reference/verify",authenticateMerchant,async(req:any,res)=>{
  const {data,error}=await db.from("transactions").select("*")
    .eq("merchant_id",req.merchant.merchant_id)
    .eq("reference",req.params.reference)
    .maybeSingle();

  if(error)return res.status(500).json({error:"verification_failed"});
  if(!data)return res.status(404).json({error:"transaction_not_found"});

  return res.json({
    status:"success",
    data:{
      reference:data.reference,
      amount:data.amount,
      currency:data.currency,
      status:data.status,
      verified:data.status==="paid"
    }
  });
});