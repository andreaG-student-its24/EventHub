// controllers/authController.js

import User from '../models/User.js';
import bcrypt from 'bcrypt';         

// Funzione per registrare un nuovo utente
export const register = async (req, res, next) => { // AGGIUNTO: 'next' per la gestione errori
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

        // TOLTO: La creazione del token JWT qui. È meglio gestirla nel login.
        // La registrazione crea l'utente, il login gli dà il "pass" per entrare.
        
        // 5. Inviamo una risposta di successo
        res.status(201).send("Utente creato con successo!");

    } catch (error) {
        // AGGIUNTO: Una gestione degli errori più robusta
        next(error); 
    }
};