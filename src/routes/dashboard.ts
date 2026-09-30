import { Router } from "express";
import { db } from "../db.js";
import { authenticateMerchant } from "../security.js";

export const dashboard=Router();

dashboard.get("/dashboard/transactions",authenticateMerchant,async(req:any,res)=>{
  const limit=Math.min(Math.max(Number(req.query.limit??25),1),100);
  const {data,error}=await db.from("transactions")
    .select("reference,amount,currency,customer_email,status,mode,created_at,paid_at")
    .eq("merchant_id",req.merchant.merchant_id)
    .order("created_at",{ascending:false}).limit(limit);

  if(error)return res.status(500).json({error:"dashboard_query_failed"});
  return res.json({status:"success",data:data??[]});
});

dashboard.get("/dashboard/summary",authenticateMerchant,async(req:any,res)=>{
  const {data,error}=await db.from("transactions")
    .select("amount,status").eq("merchant_id",req.merchant.merchant_id);

  if(error)return res.status(500).json({error:"dashboard_summary_failed"});

  const rows=data??[];
  const summary={
    transactions:rows.length,
    pending:rows.filter((x:any)=>x.status==="pending").length,
    paid:rows.filter((x:any)=>x.status==="paid").length,
    failed:rows.filter((x:any)=>x.status==="failed").length,
    refunded:rows.filter((x:any)=>x.status==="refunded").length,
    paid_amount:rows.filter((x:any)=>x.status==="paid").reduce((n:any,x:any)=>n+Number(x.amount),0)
  };

  return res.json({status:"success",data:summary});
});