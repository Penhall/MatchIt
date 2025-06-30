// server/routes/chat.js
import express from "express";
import { ChatService } from "../services/chatService.js";

const router = express.Router();
const chatService = new ChatService();

router.get("/:matchId/messages", async (req, res) => {
  try {
    const { matchId } = req.params;
    const messages = await chatService.getMatchMessages(matchId, {
      userId: req.user.userId
    });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:matchId/messages", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { message } = req.body;
    
    const sentMessage = await chatService.sendMessage({
      matchId,
      senderId: req.user.userId,
      message
    });
    
    res.status(201).json(sentMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
