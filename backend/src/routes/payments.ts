import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
