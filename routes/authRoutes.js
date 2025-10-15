// routes/authRoutes.js
import express from 'express';

const router = express.Router();
const authController = require('../controllers/authController');

// Definiamo la rotta per la registrazione
// Quando arriva una richiesta POST a /api/auth/register,
// viene eseguita la funzione authController.register
router.post('/register', authController.register);

module.exports = router;