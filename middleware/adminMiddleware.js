// Middleware per verificare che l'utente sia un admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.' 
    });
  }
};
