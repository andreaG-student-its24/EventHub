// Importo la libreria Express
import express from 'express';
import mongoose from 'mongoose';
// Importa e usa le rotte di autenticazione
// Tutte le rotte in authRoutes inizieranno con /api/auth
import authRoutes from '../routes/authRoutes';

// Creo un'stanza dell'applicazione Express
const app = express();

//Middleware per leggere JSON nel corpo della richiesta
app.use(express.json()); 

// Definiamo la porta su cui il server ascolterà
// Usiamo la porta 3000 
const PORT = 3000;

// Rotta di prova
//(http://localhost:3000/),
// il server risponderà con un messaggio di benvenuto.
app.get('/', (req, res) => {
  res.send('Benvenuto su EventHub API!');
});

// 5. Avviamo il server e lo mettiamo in ascolto sulla porta definita
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});