import { Router } from "express";
import { transactions } from "./transactions.js";
export const api = Router();
api.use(transactions);