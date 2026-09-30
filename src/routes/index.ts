import { Router } from "express";
import { merchants } from "./merchants.js";
import { transactions } from "./transactions.js";
import { sandbox } from "./sandbox.js";

export const api=Router();
api.use(merchants);
api.use(transactions);
api.use(sandbox);