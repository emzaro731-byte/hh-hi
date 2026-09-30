import { Router } from "express";
export const health=Router();
health.get("/",(_req,res)=>res.json({ok:true,service:"EmzaroPay API",version:"v1",mode:"sandbox"}));