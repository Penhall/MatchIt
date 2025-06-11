// server/routes/auth.js
import express from "express";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { AuthService } from "../services/authService.js";

const router = express.Router();
const authService = new AuthService();

router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    const result = await authService.registerUser({
      email, password, name, displayName, city, gender, age
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.message.includes("already in use")) {
      return res.status(400).json({ 
        error: "Email already in use",
        code: "EMAIL_ALREADY_EXISTS"
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error",
      code: "REGISTRATION_ERROR"
    });
  }
});

router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    
    if (error.message.includes("Invalid credentials")) {
      return res.status(401).json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error",
      code: "LOGIN_ERROR"
    });
  }
});

export default router;
