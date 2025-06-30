// server/routes/products.js
import express from "express";
import { ProductService } from "../services/productService.js";

const router = express.Router();
const productService = new ProductService();

router.get("/", async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const products = await productService.getProducts({ category, limit });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recommended", async (req, res) => {
  try {
    const products = await productService.getRecommendedProducts(req.user?.userId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
