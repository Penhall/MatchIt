// server/middleware/configure.js
import express from "express";
import { configureCors } from "../config/cors.js";

const configureMiddleware = (app) => {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(configureCors());
  console.log("✅ Middleware configured");
};

export default configureMiddleware;
