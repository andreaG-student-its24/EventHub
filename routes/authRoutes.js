// routes/authRoutes.js
import express from 'express';
import { register, login, logout, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Definiamo la rotta per la registrazione
// Quando arriva una richiesta POST a /api/auth/register,
// viene eseguita la funzione register
router.post('/register', register);

// Definiamo la rotta per il login
// Quando arriva una richiesta POST a /api/auth/login,
// viene eseguita la funzione login
router.post('/login', login);

// Rotta protetta: restituisce i dati dell'utente autenticato
router.get('/profile', protect, getProfile);

// Rotta di logout (stateless): il client elimina il token
router.post('/logout', logout);

export default router;