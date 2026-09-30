import { Router } from "express";
import { merchants } from "./merchants.js";
import { transactions } from "./transactions.js";
import { sandbox } from "./sandbox.js";
import { dashboard } from "./dashboard.js";
import { refunds } from "./refunds.js";
import { docs } from "./docs.js";

export const api=Router();
api.use(merchants);
api.use(transactions);
api.use(sandbox);
api.use(dashboard);
api.use(refunds);
api.use("/docs",docs);