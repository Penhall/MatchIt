// server/routes/matches.js
import express from "express";
import { MatchService } from "../services/matchService.js";

const router = express.Router();
const matchService = new MatchService();

router.get("/potential", async (req, res) => {
  try {
    const matches = await matchService.getPotentialMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const matches = await matchService.getUserMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const result = await matchService.createMatch(req.user.userId, targetUserId);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
