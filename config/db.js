// File: config/db.js

import mongoose from "mongoose";

// Definiamo una funzione asincrona per connetterci al database.
// L'uso di async/await ci permette di gestire la connessione (che è un'operazione asincrona)

const connectDB = async () => {
  try {
    // Tentiamo la connessione al database usando la stringa di connessione
    // che abbiamo memorizzato nel file .env.
    // `process.env.MONGODB_URI` è come Node.js legge le variabili d'ambiente.
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Se la connessione ha successo, stampiamo un messaggio in console
    // mostrando l'host a cui siamo connessi.
    console.log(`MongoDB Connesso: ${conn.connection.host}`);
  } catch (error) {
    // Se la connessione fallisce, stampiamo l'errore in console.
    console.error(`Errore di connessione al DB: ${error.message}`);

    // Terminiamo il processo dell'applicazione con un codice di errore.
    // È importante farlo perché se il DB non è connesso, l'app non può funzionare correttamente.
    process.exit(1);
  }
};

// Esportiamo la funzione `connectDB` per poterla utilizzare in altri file,
// in particolare nel nostro file principale `server.js`.
module.exports = connectDB;