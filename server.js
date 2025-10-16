// Importo la libreria Express
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Carico le variabili d'ambiente dal file .env
dotenv.config();

//Esegui la connessione al DataBase
connectDB();

// Creo un'stanza dell'applicazione Express
const app = express();

//Middleware per leggere JSON nel corpo della richiesta
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Benvenuto su EventHub API!');
});

// Utilizzo delle rotte di autenticazione
// Tutte le rotte definite in authRoutes saranno precedute da '/api/auth'
// Esempio: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes); // Collega le rotte all'app

// Definiamo la porta su cui il server ascolterà
// Usa la porta dal file .env, oppure la 5000 come default
const PORT = process.env.PORT || 5000; // <-- CORREZIONE 3: Uso di process.env

// Avviamo il server e lo mettiamo in ascolto sulla porta definita
app.listen(PORT, () => {
  console.log(` Server in esecuzione sulla porta ${PORT}`);
});