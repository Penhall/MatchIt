const adminMiddleware = (req, res, next) => {
  // Verificar se o usuário tem permissão de administrador
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
  next();
};

export default adminMiddleware;
