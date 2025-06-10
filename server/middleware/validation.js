// server/middleware/validation.js - Validation middleware
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], req.body);
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Required fields missing',
        missing: missing,
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  };
};

const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  else if (!validateEmail(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');
  else if (!validatePassword(password)) errors.push('Password must be at least 6 characters');

  if (!name) errors.push('Name is required');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters');

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid registration data',
      details: errors,
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid login data',
      details: errors,
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

export { 
  validateRequired, 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePassword
};
