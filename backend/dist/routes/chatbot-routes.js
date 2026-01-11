"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotRouter = void 0;
const express_1 = require("express");
const chatbot_service_1 = require("../services/chatbot.service");
const auth_1 = require("../middleware/auth");
exports.chatbotRouter = (0, express_1.Router)();
const chatbotService = new chatbot_service_1.ChatbotService();
// Chat endpoint - requires authentication
exports.chatbotRouter.post("/chat", auth_1.requireUser, async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message is required" });
        }
        const response = await chatbotService.getResponse(message, conversationHistory);
        res.json({
            response,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({ error: "Failed to process chat message" });
    }
});
