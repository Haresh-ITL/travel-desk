"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(env_1.env.stripeSecretKey, {
    apiVersion: "2023-10-16"
});
router.post("/create-intent", auth_1.requireUser, async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: env_1.env.stripeCurrency,
            automatic_payment_methods: { enabled: true }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.paymentRouter = router;
