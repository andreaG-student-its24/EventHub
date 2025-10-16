// controllers/authController.js

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';         

// Funzione per generare un token JWT
const generateToken = (id, role) => {
  // jwt.sign() crea il token.
  // Il primo argomento è il "payload", ovvero i dati che vogliamo inserire nel token.
  // In questo caso, l'ID e il ruolo dell'utente sono sufficienti.
  // Il secondo argomento è il nostro segreto.
  // Il terzo argomento sono le opzioni, come la data di scadenza.
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Il token scadrà tra 30 giorni
  });
};

// Funzione per registrare un nuovo utente
export const register = async (req, res, next) => { //next è per la gestione errori
    try {
        // 1. Prendiamo i dati dal corpo della richiesta (incluso username)
        const { username, email, password } = req.body;


        // 2. Crittografiamo la password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Creiamo il nuovo utente usando il Modello
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
        });

        // 4. Salviamo l'utente nel VERO database
        await newUser.save();

        // 5. Inviamo una risposta di successo
        res.status(201).send("Utente creato con successo!");

    } catch (error) {
        // gestione degli errori più robusta
        next(error); 
    }
};