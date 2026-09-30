import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "../db.js";
import { hashSecret, randomKey } from "../security.js";

export const merchants=Router();

const schema=z.object({
  name:z.string().min(2).max(120),
  email:z.string().email()
});

merchants.post("/merchants",async(req,res)=>{
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"invalid_request",details:parsed.error.flatten()});

  const {name,email}=parsed.data;
  const {data:merchant,error}=await db.from("merchants").insert({name,email}).select("id,name,email,status,created_at").single();
  if(error)return res.status(409).json({error:"merchant_creation_failed"});

  const publicKey=randomKey("empub_test_");
  const secretKey=randomKey("emsec_test_");

  const {error:keyError}=await db.from("api_keys").insert({
    merchant_id:merchant.id,
    key_prefix:publicKey.slice(0,16),
    key_hash:hashSecret(secretKey),
    mode:"test"
  });

  if(keyError){
    await db.from("merchants").delete().eq("id",merchant.id);
    return res.status(500).json({error:"api_key_creation_failed"});
  }

  return res.status(201).json({
    status:"success",
    data:{
      merchant,
      public_key:publicKey,
      secret_key:secretKey,
      warning:"Store the secret key securely. It is returned only during creation."
    }
  });
});