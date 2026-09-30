import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { health } from "./routes/health.js";
import { api } from "./routes/index.js";
import { checkout } from "./routes/checkout.js";
import { dashboardUi } from "./routes/dashboard-ui.js";

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.get("/",(_req,res)=>res.json({name:"EmzaroPay API",version:config.apiVersion,status:"online",mode:"sandbox"}));
app.use("/health",health);
app.use("/api/v1",api);
app.use("/checkout",checkout);
app.use("/dashboard",dashboardUi);
app.use((err:any,_req:any,res:any,_next:any)=>{console.error(err);res.status(500).json({error:"internal_server_error"});});
app.listen(config.port,()=>console.log("EmzaroPay API listening on port "+config.port));