// controllers/authController.js

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

    // Crea un nuovo utente (l'hashing della password avviene nel model grazie al pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Se l'utente è stato creato correttamente...
    if (user) {
      // ...genera un token e invialo come risposta.
      const token = generateToken(user._id, user.role);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token, // <-- TOKEN INVIATO!
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