import { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import { requireUser } from "../middleware/auth";

const router = Router();

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2023-10-16"
} as any);

router.post("/create-intent", requireUser, async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: env.stripeCurrency,
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export const paymentRouter = router;
