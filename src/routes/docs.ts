import { Router } from "express";
export const docs=Router();

docs.get("/",(_req,res)=>res.json({
  name:"EmzaroPay API",
  version:"v1",
  mode:"sandbox",
  authentication:"Send the merchant secret key in the x-api-key header.",
  idempotency:"Send a unique Idempotency-Key header when creating a transaction.",
  endpoints:{
    create_transaction:"POST /api/v1/transactions",
    get_transaction:"GET /api/v1/transactions/:reference",
    verify_transaction:"POST /api/v1/transactions/:reference/verify",
    sandbox_pay:"POST /api/v1/sandbox/transactions/:reference/pay",
    refund:"POST /api/v1/transactions/:reference/refund",
    dashboard:"GET /api/v1/dashboard/transactions",
    summary:"GET /api/v1/dashboard/summary"
  },
  note:"Live money movement requires an authorized payment or banking provider."
}));