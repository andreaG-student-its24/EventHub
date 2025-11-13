// controllers/authController.js

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Funzione per generare un token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Funzione di registrazione utente
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Controlla se l'utente esiste già
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato' });
    }

    // Genera token di verifica email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Crea un nuovo utente (l'hashing della password avviene nel model grazie al pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 ore
    });

    // Se l'utente è stato creato correttamente...
    if (user) {
      // Invia email di verifica
      try {
        const verificationUrl = `${req.protocol}://${req.get('host')}/pages/auth/verify-email.html?token=${verificationToken}`;

        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '🎉 Benvenuto su EventHub - Verifica la tua email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">Benvenuto su EventHub, ${user.name}! 🎉</h2>
              <p>Grazie per esserti registrato. Per completare la registrazione e accedere a tutte le funzionalità, verifica il tuo indirizzo email.</p>
              
              <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Clicca sul pulsante qui sotto per verificare la tua email:</strong></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verifica Email
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px;">Oppure copia e incolla questo link nel tuo browser:</p>
              <p style="color: #667eea; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #718096; font-size: 12px;">
                ⚠️ Questo link è valido per 24 ore.<br>
                Se non hai richiesto questa registrazione, ignora questa email.
              </p>
              
              <p style="color: #a0aec0; font-size: 11px; margin-top: 20px;">
                EventHub - La tua piattaforma per gestire eventi<br>
                © 2024 EventHub. Tutti i diritti riservati.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Errore invio email:', emailError);
        // Continua comunque con la registrazione
      }

      // Genera un token JWT (ma l'utente non può fare login finché non verifica)
      const token = generateToken(user._id, user.role);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: token,
        message: 'Registrazione completata! Controlla la tua email per verificare l\'account.'
      });
    } else {
      res.status(400).json({ message: 'Dati utente non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione di login utente
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cerca l'utente nel database
    const user = await User.findOne({ email });

    // Se l'utente esiste e la password è corretta...
    // bcrypt.compare confronta la password in chiaro con quella hashata nel DB
    if (user && (await bcrypt.compare(password, user.password))) {
      // Verifica se l'utente è bloccato
      if (user.isBlocked) {
        return res.status(403).json({ 
          message: 'Il tuo account è stato bloccato.',
          reason: user.blockedReason 
        });
      }

      // Verifica se l'email è stata confermata
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          message: 'Devi verificare la tua email prima di accedere. Controlla la tua casella di posta.',
          emailNotVerified: true
        });
      }

      // ...genera un token e invialo.
      const token = generateToken(user._id, user.role);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token, // <-- TOKEN INVIATO!
      });
    } else {
      res.status(401).json({ message: 'Email o password non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione per ottenere il profilo dell'utente autenticato
export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione di logout
export const logout = (req, res) => {
  res.json({ message: 'Logout effettuato. Elimina il token JWT dal client.' });
};

// Funzione per richiedere il reset della password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Nessun utente trovato con questa email' });
    }

    // Genera token casuale
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash del token e salva nel database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minuti

    await user.save();

    // URL per il reset (frontend)
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    // Configurazione email (usando Gmail come esempio)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const message = `
Ciao ${user.name},

Hai richiesto il reset della password per il tuo account EventHub.

Clicca sul link seguente per reimpostare la tua password:
${resetUrl}

⚠️ Questo link scadrà tra 10 minuti.

Se non hai richiesto il reset della password, ignora questa email.
Il tuo account rimane al sicuro.

---
EventHub Team
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset Password - EventHub',
        text: message,
      });

      res.json({ message: 'Email di reset inviata' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: 'Errore nell\'invio dell\'email' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione per resettare la password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Hash del token ricevuto per confrontarlo con quello nel DB
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Trova utente con token valido e non scaduto
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token non valido o scaduto' });
    }

    // Imposta la nuova password (verrà hashata dal pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Genera nuovo token JWT
    const jwtToken = generateToken(user._id, user.role);

    res.json({
      message: 'Password aggiornata con successo',
      token: jwtToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione per verificare l'email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash del token ricevuto
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Trova utente con token valido e non scaduto
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token non valido o scaduto' });
    }

    // Verifica l'email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({
      message: 'Email verificata con successo! Ora puoi effettuare il login.',
      success: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Funzione per reinviare email di verifica
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email già verificata' });
    }

    // Genera nuovo token di verifica
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
    await user.save();

    // Invia email di verifica
    const verificationUrl = `${req.protocol}://${req.get('host')}/pages/auth/verify-email.html?token=${verificationToken}`;

    const transporter = nodemailer.createTransporter({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🎉 EventHub - Verifica la tua email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Verifica la tua email</h2>
          <p>Ciao ${user.name},</p>
          <p>Clicca sul pulsante qui sotto per verificare il tuo indirizzo email:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verifica Email
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px;">Oppure copia e incolla questo link:</p>
          <p style="color: #667eea; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
          
          <p style="color: #718096; font-size: 12px;">
            ⚠️ Questo link è valido per 24 ore.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Email di verifica inviata. Controlla la tua casella di posta.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};