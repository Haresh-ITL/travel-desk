import { Router } from "express";
import { ChatbotService } from "../services/chatbot.service";
import { requireUser } from "../middleware/auth";

export const chatbotRouter = Router();
const chatbotService = new ChatbotService();

// Chat endpoint - requires authentication
chatbotRouter.post("/chat", requireUser, async (req, res) => {
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
  } catch (error: any) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

