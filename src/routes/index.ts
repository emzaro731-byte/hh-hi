import { Router } from "express";
import { merchants } from "./merchants.js";
import { transactions } from "./transactions.js";

export const api=Router();
api.use(merchants);
api.use(transactions);