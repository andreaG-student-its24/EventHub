// controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Per ora, usiamo un array per simulare un database di utenti
const users = [];

// Funzione per registrare un nuovo utente
exports.register = async (req, res) => {
  try {
    // 1. Prendiamo email e password dal corpo della richiesta
    const { email, password } = req.body;

    // 2. Controlliamo se l'utente esiste già
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).send('Utente già registrato.');
    }

    // 3. Crittografiamo la password prima di salvarla
    const hashedPassword = await bcrypt.hash(password, 10); // 10 è il "costo" dell'hashing

    // 4. Creiamo il nuovo utente
    const newUser = {
      id: users.length + 1, // ID semplice per ora
      email: email,
      password: hashedPassword
    };

    // 5. Salviamo l'utente nel nostro "database"
    users.push(newUser);
    console.log('Utenti registrati:', users); // Log per debug

    // 6. Creiamo il token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      'LA_TUA_CHIAVE_SEGRETA_SUPER_SEGRETA', // Sostituisci con una chiave sicura!
      { expiresIn: '1h' } // Il token scadrà tra 1 ora
    );

    // 7. Inviamo il token come risposta
    res.status(201).json({ token });

  } catch (error) {
    res.status(500).send('Errore del server durante la registrazione.');
  }
};