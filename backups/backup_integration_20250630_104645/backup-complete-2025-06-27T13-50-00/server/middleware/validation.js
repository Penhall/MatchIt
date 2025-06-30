// server/middleware/validation.js
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Required fields missing",
        missing: missing
      });
    }
    next();
  };
};

export const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  if (!name) errors.push("Name is required");

  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid data", details: errors });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  next();
};
