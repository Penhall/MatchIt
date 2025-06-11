// server/routes/health.js
import express from "express";
import { pool } from "../config/database.js";
import { config } from "../config/environment.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv || "development"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

router.get("/info", (req, res) => {
  res.json({
    name: "MatchIt API",
    version: "1.0.0",
    environment: config.nodeEnv || "development"
  });
});

router.get("/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

export default router;
