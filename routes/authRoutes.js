// routes/authRoutes.js
import express from 'express';
import { register, login, logout } from '../controllers/authController.js';

const router = express.Router();

// Definiamo la rotta per la registrazione
// Quando arriva una richiesta POST a /api/auth/register,
// viene eseguita la funzione register
router.post('/register', register);

// Definiamo la rotta per il login
// Quando arriva una richiesta POST a /api/auth/login,
// viene eseguita la funzione login
router.post('/login', login);

// Rotta di logout (stateless): il client elimina il token
router.post('/logout', logout);

export default router;