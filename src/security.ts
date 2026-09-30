import crypto from "node:crypto";
import { db } from "./db.js";
export function hashSecret(value:string){return crypto.createHash("sha256").update(value).digest("hex");}
export function randomKey(prefix:string){return prefix+crypto.randomBytes(24).toString("hex");}
export async function authenticateMerchant(req:any,res:any,next:any){
 const key=req.header("x-api-key"); if(!key)return res.status(401).json({error:"missing_api_key"});
 const {data,error}=await db.from("api_keys").select("id,merchant_id,mode,revoked_at").eq("key_hash",hashSecret(key)).is("revoked_at",null).maybeSingle();
 if(error)return res.status(500).json({error:"authentication_failed"}); if(!data)return res.status(401).json({error:"invalid_api_key"});
 req.merchant=data; next();
}