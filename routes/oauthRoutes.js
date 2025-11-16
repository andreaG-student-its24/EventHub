import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Inizia il flusso di autenticazione Google OAuth
 *     tags: [Auth]
 *     description: Reindirizza l'utente alla pagina di login di Google
 *     responses:
 *       302:
 *         description: Redirect a Google OAuth
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback OAuth Google
 *     tags: [Auth]
 *     description: Gestisce il ritorno da Google dopo l'autenticazione
 *     responses:
 *       302:
 *         description: Redirect alla dashboard con token JWT
 *       401:
 *         description: Autenticazione fallita
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/pages/auth/login.html?error=oauth_failed',
    session: false 
  }),
  (req, res) => {
    try {
      // Genera JWT per l'utente autenticato
      const token = jwt.sign(
        { 
          id: req.user._id, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Redirect alla dashboard con il token come parametro URL
      // Il frontend lo salverà in localStorage
      res.redirect(`/pages/auth/oauth-success.html?token=${token}`);
    } catch (error) {
      console.error('Errore generazione token OAuth:', error);
      res.redirect('/pages/auth/login.html?error=token_generation_failed');
    }
  }
);

export default router;
