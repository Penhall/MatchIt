// server/routes/recommendations.js
import express from "express";
import { RecommendationService } from "../services/recommendationService.js";

const router = express.Router();
const recommendationService = new RecommendationService();

router.get("/", async (req, res) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { targetUserId, action } = req.body;
    const result = await recommendationService.recordFeedback(
      req.user.userId, 
      targetUserId, 
      action
    );
    res.json(result);
  } catch (error) {
    console.error("Error recording feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
