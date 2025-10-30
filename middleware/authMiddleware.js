import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware di autenticazione
export const protect = async (req, res, next) => {
  let token;

  // Il token deve essere nell'header Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Estrae il token
      token = req.headers.authorization.split(' ')[1];
      // Verifica e decodifica il token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Recupera l'utente dal DB e lo aggiunge alla request
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token non valido' });
    }
  } else {
    return res.status(401).json({ message: 'Non autorizzato, token mancante' });
  }
};
