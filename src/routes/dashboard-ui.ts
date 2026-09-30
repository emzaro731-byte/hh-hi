import { Router } from "express";
import { db } from "../db.js";

export const dashboardUi=Router();

dashboardUi.get("/",async(req,res)=>{
  const key=String(req.query.key??"");
  if(!key)return res.type("html").send("<!doctype html><html><body style='font-family:system-ui;padding:40px'><h1>EmzaroPay Dashboard</h1><p>Open this sandbox dashboard with your merchant API key.</p><form><input name='key' placeholder='Merchant API key' style='padding:12px;width:320px'><button style='padding:12px'>Open dashboard</button></form></body></html>");

  const crypto=await import("node:crypto");
  const hash=crypto.createHash("sha256").update(key).digest("hex");
  const {data:apiKey}=await db.from("api_keys").select("merchant_id,mode,revoked_at").eq("key_hash",hash).maybeSingle();
  if(!apiKey||apiKey.revoked_at)return res.status(401).send("Invalid API key");

  const {data:merchant}=await db.from("merchants").select("name,email,status").eq("id",apiKey.merchant_id).maybeSingle();
  const {data:transactions}=await db.from("transactions").select("reference,amount,currency,customer_email,status,mode,created_at,paid_at").eq("merchant_id",apiKey.merchant_id).order("created_at",{ascending:false}).limit(50);

  const rows=(transactions??[]).map((t:any)=>"<tr><td>"+t.reference+"</td><td>"+t.currency+" "+Number(t.amount).toLocaleString()+"</td><td>"+t.customer_email+"</td><td><b>"+t.status+"</b></td><td>"+new Date(t.created_at).toLocaleString()+"</td></tr>").join("");
  const paid=(transactions??[]).filter((t:any)=>t.status==="paid").reduce((n:any,t:any)=>n+Number(t.amount),0);

  res.type("html").send("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>EmzaroPay Dashboard</title><style>body{margin:0;font-family:system-ui;background:#07111f;color:#eef5ff}.wrap{max-width:1100px;margin:auto;padding:24px}.top{display:flex;justify-content:space-between;gap:20px;align-items:center}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:24px 0}.card{background:#0e1c30;border:1px solid #1c3150;border-radius:16px;padding:20px}.num{font-size:26px;font-weight:800;margin-top:8px}table{width:100%;border-collapse:collapse;background:#0e1c30;border-radius:16px;overflow:hidden}th,td{text-align:left;padding:13px;border-bottom:1px solid #1c3150;font-size:14px}th{color:#9fb0c5}.pill{padding:5px 9px;border-radius:999px;background:#142844}@media(max-width:700px){.grid{grid-template-columns:1fr}table{font-size:12px}.wrap{padding:14px}.top{display:block;}}</style></head><body><main class='wrap'><div class='top'><div><h1>EmzaroPay</h1><p>Merchant sandbox dashboard</p></div><div>"+(merchant?.name??"Merchant")+" · "+apiKey.mode+"</div></div><section class='grid'><div class='card'><small>Total transactions</small><div class='num'>"+(transactions?.length??0)+"</div></div><div class='card'><small>Paid transactions</small><div class='num'>"+(transactions??[]).filter((t:any)=>t.status==="paid").length+"</div></div><div class='card'><small>Paid amount</small><div class='num'>NGN "+paid.toLocaleString()+"</div></div></section><h2>Recent transactions</h2><table><thead><tr><th>Reference</th><th>Amount</th><th>Customer</th><th>Status</th><th>Created</th></tr></thead><tbody>"+(rows||"<tr><td colspan='5'>No transactions yet.</td></tr>")+"</tbody></table><p style='color:#9fb0c5;margin-top:24px'>Sandbox only. Live money movement requires an authorized payment provider.</p></main></body></html>");
});